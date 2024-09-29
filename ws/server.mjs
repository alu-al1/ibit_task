import { isMainThread, parentPort, workerData } from "worker_threads";
import { WebSocketServer } from "ws";

import sqlite3 from "sqlite3";

import { VERBOSE, DEBUG } from "../common/common.mjs";
import { die, implementsIterator } from "../common/common.mjs";
import { tiNMinInMs } from "../common/common.mjs";
import { baJsonUtf8ToObj, objToBaJsonUtf8 } from "../common/common.mjs";

import DbSqliteQuery from "../storage/sqlite3/query.mjs";
import { ClientWsRecord } from "./client.mjs";

import { WS_ACTIONS } from "./vars.mjs";

import { newLogger, dummyLogger } from "../common/logger.mjs";

const dlog = DEBUG ? newLogger("debug::ws") : dummyLogger;
const ilog = newLogger("ws");

let db = null;
let wss = null;
const clients = new Map();

const do_die = (code) => {
  try {
    db && db.close();
  } catch (_) {}

  for (let cws of clients.values()) {
    try {
      cws.destroy(
        objToBaJsonUtf8({
          signal: "bye",
          message: "server shutdown",
        })
      );
    } catch (_) {}
  }

  try {
    wss && wss.close();
  } catch (_) {}

  die.call({ process }, code);
};
process.on("SIGTERM", () => do_die(0));

const sqlite3mbverb = VERBOSE ? sqlite3.verbose() : sqlite3;

const getAvailableAssetsInfo = async (dbq) =>
  dbq.selectAllAsync("select id, symbol as name from assets", [], dbq.db);

const calcValueFromMap = (asset) => (asset.get("bid") * asset.get("ask")) / 2;
const getAssetsLastHistory = async (dbq, assetId, sinceMs, limit = -1) => {
  let q =
    "select NULL assetName, ts time, asset_id assetId, (bid+ask) / 2 value from rates where asset_id = ?";
  if (sinceMs > -1) {
    q += " and ts > ?";
  }
  //TODO check that sinceMs will be ignored
  return dbq.selectAllAsync(q, [assetId, sinceMs], dbq.db);
};

if (!isMainThread) {
  const { assets, port, historyDepthMinutes = 0 } = workerData || {};

  const timeOffsetMs = tiNMinInMs(historyDepthMinutes);

  const wss = new WebSocketServer({ port });

  {
    const { address, family, port } = wss.address() || {};

    ilog.info(`WebSocket server is running on port: ${port})`);
    dlog.info(
      `WebSocket server full address info: ${JSON.stringify(
        wss.address() || {}
      )}`
    );
  }

  db = new sqlite3mbverb.Database(assets, sqlite3.OPEN_READONLY);
  const dbq = new DbSqliteQuery(db);

  //for client update we can read last value in the database
  //or simply get value allmost directly from the pumper

  // receives []RatesPkt*
  // for now only []RatesPktMap is supported

  parentPort.on("message", (data) => {
    //we are not ready yet or there is no clients
    if (!wss || clients.size == 0) return;

    //basically if this is not an array - skip it
    if (!implementsIterator(data) || !data.reduce) return;

    //TODO respect pktType
    const datahmap = data.reduce((acc, pkt) => {
      if (pkt.has("id")) {
        acc[pkt.get("id")] = pkt;
      }
      return acc;
    }, {});

    for (let cws of clients.values()) {
      if (!cws.asset) continue;

      const asset = datahmap[cws.asset.id];
      if (!asset) continue;

      //TODO wrap into handler function
      const action = WS_ACTIONS.ASSET_POINT;

      try {
        cws.ws.send(
          objToBaJsonUtf8({
            message: {
              assetName: cws.asset.name,
              assetId: cws.asset.id,
              time: asset.get("ts"),
              value: calcValueFromMap(asset),
            },
            action,
          })
        );
      } catch (err) {
        dlog.info(`error for client ${cws.id} on action ${action}: ${err}`);
        clients.delete(cws.id);
        cws.destroy();
      }
    }
  });

  wss.on("connection", (ws) => {
    const cws = new ClientWsRecord(ws);
    dlog.info(`New client connected: ${cws.id}`);
    clients.set(cws.id, cws);

    //TODO trycatch everything
    ws.on("message", async (message_) => {
      let message = null;

      //convert buffer to object
      //close connection and forget client if fails
      {
        try {
          message = baJsonUtf8ToObj(message_);
        } catch (_) {
          try {
            ws.send({ err: true, reason: "bad request" });
          } catch (_) {}

          cws.destroy();
          clients.delete(cws.id);
        } finally {
          !!cws.ws && cws.updateTs();
        }
      }

      let response = { err: true, reason: "unknown action" };
      //TODO actions contant map
      switch (message.action) {
        case WS_ACTIONS.LIST_ASSETS:
          //TODO trycatch
          const assets = await getAvailableAssetsInfo(dbq);
          // store assets state in time of first request
          // as this is the info the client operates according to
          cws.assets = assets;
          response = {
            ...message,
            ...{ message: { assets } },
          };
          break;
        case WS_ACTIONS.SUBSCRIBE:
          let asset_id = message?.message?.assetId;
          if (!asset_id) {
            response = { err: true, reason: "no assetId provided" };
            break;
          }

          //if client skipped assets listing
          //TODO handle errors
          if (!cws.assets) cws.assets = await getAvailableAssetsInfo(dbq);

          //TODO handle errors
          cws.asset = cws.assets.find((a) => a.id == asset_id);

          //we could use left join on assets where assets.id = rate.asset_id
          //but we can optimize it right away
          const points = await getAssetsLastHistory(
            dbq,
            cws.asset.id,
            Date.now() - timeOffsetMs
          );

          points.forEach((p) => {
            p.assetName = cws.asset.name;
          });

          response = {
            action: WS_ACTIONS.ASSET_HISTORY,
            message: { points },
          };
          break;

        default:
          dlog.info(`Client ${cws.id} unknown action:$P{message.action}`);
      }

      ws.send(objToBaJsonUtf8(response));
    });

    ws.on("close", () => {
      dlog.info(`Client disconnected: ${cws.id}`);
      clients.delete(cws.id);
      cws.destroy();
    });
  });
}

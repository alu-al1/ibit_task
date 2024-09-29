import { isMainThread, parentPort, workerData } from "worker_threads";

import { TypeMeAsCustomError } from "../../common/errors.mjs";
import { newLogger, dummyLogger } from "../../common/logger.mjs";

import { VERBOSE, DEBUG } from "../../common/common.mjs";

import {
  die,
  tryToGetClassName,
  implementsIterator,
} from "../../common/common.mjs";

import { RatesPktCompact, RatesPktMap } from "../../sources/ratesPkt.mjs";

import DbSqliteQuery from "./query.mjs";

import sqlite3 from "sqlite3";
const sqlite3mbverb = VERBOSE ? sqlite3.verbose() : sqlite3;

const dlog = DEBUG ? newLogger("debug::storeWorker") : dummyLogger;

let db = null;
const do_die = (code) => {
  try {
    db && db.close();
  } catch (_) {
  } finally {
    die.call({ process }, code);
  }
};

const pktDecode = (datum) => {
  let PckType = null;
  {
    if (datum instanceof ArrayBuffer) {
      PckType = RatesPktCompact;
    } else if (datum instanceof Map) {
      PckType = RatesPktMap;
    }
  }

  if (!PckType)
    throw TypeMeAsCustomError(
      `unsupported rate package type: ${tryToGetClassName(datum)}`
    );

  return PckType.prototype.decode.call(datum);
};

async function storeRates(dbq, data) {
  dlog.info(`[storeRates] ready to store? : ${!!dbq}`);

  //batch write
  await dbq.batchInsert(
    "INSERT into rates (asset_id, ts, bid, ask) VALUES (?,?,?,?)",
    Array.prototype.map.call(data, pktDecode)
  );

  dlog.info(`[storeRates] should be stored`);
}

async function main() {
  if (isMainThread)
    throw TypeMeAsCustomError("not supposed to be run directly");
  process.on("SIGTERM", () => do_die(0));

  //TODO switchcase signals
  const { assets } = workerData || {};
  if (!assets) throw TypeMeAsCustomError("no db provided to worker");

  dlog.info(`worker will operate with sqlite3 database at: ${assets}`)

  db = new sqlite3mbverb.Database(assets);
  const dbq = new DbSqliteQuery(db);

  parentPort.on("message", (data) => {
    if (!implementsIterator(data)) {
      throw new TypeMeAsCustomError("data container should implement iterator");
    }
    return storeRates(dbq, data);
  });
}

main();

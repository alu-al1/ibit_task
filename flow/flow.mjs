import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
// import { SHARE_ENV } from "worker_threads";
import { newLogger, dummyLogger } from "../common/logger.mjs";

import { RatesPktCompact, RatesPktMap } from "../sources/ratesPkt.mjs";

import { assetMapSwapped } from "../storage/sqlite3/defaults.mjs";
import { VERBOSE, DEBUG, implementsIterator } from "../common/common.mjs";

const dlog = DEBUG ? newLogger("debug::main") : dummyLogger;
const vlog = VERBOSE ? newLogger("main") : dummyLogger;
const ilog = newLogger("main");

import { SQLITE3_ASSETS_DB } from "../storage/sqlite3/vars.mjs";

import { EMCONT_URL } from "../sources/emcont/vars.mjs";
import { EMCONT_POLL_INTERVAL_MS } from "./vars.mjs";

import { WS_PORT, HISTORY_DEPTH_MINUTES } from "../ws/vars.mjs";
import { TypeMeAsCustomError } from "../common/errors.mjs";

export default async function main() {
  if (isMainThread) {
    {
      vlog.info("creating store worker");
      const dbw = new Worker("./storage/sqlite3/storeWorker.mjs", {
        workerData: {
          assets: SQLITE3_ASSETS_DB,
        },
        // env: SHARE_ENV,
        // resourceLimits
        // transferList
        // name //(for debugging)
      });

      vlog.info("creating data source worker");
      const emcont = new Worker("./sources/emcont/emcont.mjs", {
        workerData: {
          url: EMCONT_URL,
          retries: 3,
          targetIntervalMs: EMCONT_POLL_INTERVAL_MS,
        },
      });

      //wss will address the db.
      //we can use main thread as a bus:
      //pros:
      //  the ability to monitor, interfiere or modify requests
      //cons:
      //  additional coupling and latency
      //so for now wss will have its own db connection
      vlog.info("creating ws server worker");
      const wssw = new Worker("./ws/server.mjs", {
        workerData: {
          port: WS_PORT,
          historyDepthMinutes: HISTORY_DEPTH_MINUTES,
          assets: SQLITE3_ASSETS_DB,
          //assetsPerClient: 1,
          //db: "./assets/wss.db",
        },
      });

      emcont.on("message", (data) => {
        dlog.info("new rates from pumper");

        const ratesPkgs = [];
        {
          //TODO check data of an expected structure
          const rates = data.rates.Rates;
          const { ts } = data;

          if (!implementsIterator(rates))
            throw new TypeMeAsCustomError(
              "emcont passed data of unsupported format"
            );

          //filter to assets of interest
          {
            for (let data_ of rates) {
              if (data_ && data_.Symbol) {
                const id = assetMapSwapped.get(data_.Symbol);
                if (id) {
                  //TODO mb? implement passing random packet format
                  ratesPkgs.push(
                    new RatesPktMap().encode(
                      id,
                      ts,
                      data_.Bid || 0,
                      data_.Ask || 0
                    )
                  );
                }
              }
              if (ratesPkgs.length == assetMapSwapped.size) break;
            }
          }
        }

        if (ratesPkgs.length != 0) {
          dbw.postMessage(ratesPkgs);
          //possible optimisation: skip passing data if no clients
          wssw.postMessage(ratesPkgs);
        }
      });
    }
  }
}

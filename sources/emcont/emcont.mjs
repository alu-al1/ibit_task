import { isMainThread, parentPort, workerData } from "worker_threads";

import { TypeMeAsCustomError } from "../../common/errors.mjs";
import tryParsers from "./emcontParsers.mjs";

import { die, sleeP } from "../../common/common.mjs";
const do_die = die.bind({ process });
process.on("SIGTERM", () => do_die(0));

const getRatesAsArrBuf = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new TypeMeAsCustomError(`Response status: ${response.status}`);
  }
  return await response.arrayBuffer();
};

async function DummyLoop() {
  while (true) {
    await sleeP(1000 * 10);
  }
}
async function doLoop(url, maxRetries = 3, targetIntervalMs = 1000) {
  let attempts = 0;

  let rates = null;

  let timeb = 0,
    timea = 0;

  while (attempts < maxRetries) {
    //+iter ctx reset + date.now call
    try {
      timeb = Date.now();

      rates = tryParsers(await getRatesAsArrBuf(url));
      parentPort.postMessage({ rates, ts: Date.now() });

      timea = Date.now();

      await sleeP(
        Math.min(
          targetIntervalMs,
          Math.max(targetIntervalMs - (timea - timeb), 0)
        )
      );
      attempts = 0;
    } catch (err) {
      console.log(err);
      attempts++;
      //log
      if (attempts >= maxRetries) {
        //log
        // throw new Error(`Failed after ${maxRetries} attempts`);
        do_die(1);
      }
    } finally {
      rates = null;
      timeb = timea = 0;
    }
  }
}

async function tryLoopOrDie(url, maxRetries = 3, targetIntervalMs = 1000) {
  return doLoop(...arguments);
  return DummyLoop(...arguments);
}

async function main() {
  if (!isMainThread) {
    const { url, retries, targetIntervalMs } = workerData || {};
    await tryLoopOrDie(url, retries, targetIntervalMs);
  } else {
    throw TypeMeAsCustomError(
      "module is not designed to be run as a main thread, sry"
    );
  }
}

await main();

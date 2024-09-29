import { isMainThread } from "worker_threads";
import init from "./init.mjs";
import main from "./flow/flow.mjs";

if (isMainThread) {
  await init();
  await main();
}

import { newLogger, dummyLogger } from "./common/logger.mjs";
import { VERBOSE } from "./common/common.mjs";
import {init as initDb} from "./storage/sqlite3/init.mjs";

const log = VERBOSE ? newLogger("init") : dummyLogger;

export default async function init() {
  log.info("init start")
  await initDb(log)
  log.info("init completed")
}

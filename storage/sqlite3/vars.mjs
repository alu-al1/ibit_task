import { envAsString } from "../../common/env.mjs";
import { newLogger } from "../../common/logger.mjs";
import { toAbsPath } from "../../common/common.mjs";
import { TypeMeAsCustomError } from "../../common/errors.mjs";

const ilog = newLogger("sqlite::vars");

let { SQLITE3_ASSETS_DB: _SQLITE3_ASSETS_DB } = process.env;
_SQLITE3_ASSETS_DB = envAsString(_SQLITE3_ASSETS_DB);
if (!_SQLITE3_ASSETS_DB) {
  throw new TypeMeAsCustomError("no SQLITE3_ASSETS_DB provided in env vars");

  // memory will not do for us
  // unless this exact db connection will be given to services

  // _SQLITE3_ASSETS_DB = ":memory:";
  // ilog.info("SQLITE3_ASSETS_DB env is not set. using :memory: database");
} else {
  _SQLITE3_ASSETS_DB = toAbsPath(_SQLITE3_ASSETS_DB);
}

export const SQLITE3_ASSETS_DB = _SQLITE3_ASSETS_DB;

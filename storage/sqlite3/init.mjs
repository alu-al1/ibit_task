import { VERBOSE, DEBUG } from "../../common/common.mjs";
import { envAsString } from "../../common/env.mjs";
import { dummyLogger } from "../../common/logger.mjs";
import { assetMap, reprAssetMap } from "./defaults.mjs";
import DbSqliteQuery from "./query.mjs";

import { TypeMeAsCustomError } from "../../common/errors.mjs";

import sqlite3 from "sqlite3";

import { SQLITE3_ASSETS_DB } from "./vars.mjs";

// global.commdb = new sqlite3v.Database("./assets/wss.db");
// global.commdbq = new DbSqliteQuery(commdb);
// await ensureCommunicationalDbLayout(commdbq);

async function prepopulateAssetsEnumDb(dbq, assetMap) {
  await new Promise(async (res, rej) => {
    //TODO tmp: on conflict (id) do nothing for now
    const q = dbq.db.prepare(
      "INSERT INTO assets VALUES(?,?) ON CONFLICT(id) DO NOTHING;"
    );

    //TODO accumulate errors and if errors on unique constraints (id)
    //...TODO check if there is at least one record with that id in rates table
    //...TODO if not - we may safely assume that new row can be introduced without troubles

    for (let [id, symbol] of assetMap.entries()) {
      await new Promise((res1, rej1) =>
        q.run(id, symbol, (err) => (err ? rej1(err) : res1()))
      );
    }
    await new Promise((res1, rej1) =>
      q.finalize((err) => (err ? rej1(err) : res1()))
    );
    res();
  });
}

// on this dataset we may want to use noSQL flat structure
// to avoid asset symbol leftjoin on history requests
// but this is ok too as history requests are relatively rare
async function ensureOperationalDbLayout(dbq) {
  const assetsSchema = new Map();

  //table assets
  assetsSchema.set("id", "INTEGER PRIMARY KEY");
  assetsSchema.set("symbol", "TEXT NOT NULL");

  const ratesSchema = new Map();

  //table rates
  ratesSchema.set("asset_id", "INTEGER");
  ratesSchema.set("ts", "INTEGER");

  ratesSchema.set("bid", "REAL");
  ratesSchema.set("ask", "REAL");

  ratesSchema.set("FOREIGN KEY (asset_id)", "REFERENCES assets(id)");

  await dbq.createTable("assets", assetsSchema, !!"add if not exists");
  await dbq.createTable("rates", ratesSchema, !!"add if not exists");
}

async function ensureCommunicationalDbLayout(commdbq) {
  const usersSchema = new Map();

  usersSchema.set("id", "INTEGER PRIMARY KEY");
  usersSchema.set("asset_id", "INTEGER"); //fk to another db for airgap - they will meet at runtime
  usersSchema.set("rest", "TEXT");

  await commdbq.createTable("users", usersSchema, !!"add if not exists");
}

export async function init(logger = dummyLogger) {
  if (!SQLITE3_ASSETS_DB)
    throw new TypeMeAsCustomError("SQLITE3_ASSETS_DB is not set");

  const sql3 = DEBUG ? sqlite3.verbose() : sqlite3;
  const opdb = new sql3.Database(SQLITE3_ASSETS_DB);
  const opdbq = new DbSqliteQuery(opdb);

  await ensureOperationalDbLayout(opdbq);

  {
    logger.info(
      `ensuring the following assets symbols: ${reprAssetMap(assetMap)}`
    );
    await prepopulateAssetsEnumDb(opdbq, assetMap);
  }
}

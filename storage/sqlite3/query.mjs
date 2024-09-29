import sqlite3 from "sqlite3";

import {
  ArgumentError,
  NotImplementedError,
  TypeMeAsCustomError,
} from "../../common/errors.mjs";
import { DbError, DbAlreadyExists } from "../../common/errors.mjs";

//TODO interface that resides in common but should be implemented by a source
const tryIntoDbError = (err_) => {
  if (!err_) return err_;
  if (err_.message.indexOf("SQLITE_ERROR") > -1) {
    if (err_.message.indexOf("already exists") > -1) {
      return new DbAlreadyExists(err_);
    } else {
      return new DbError(err_);
    }
  }
};
//TODO pass logger here
class DbSqliteInnerQuery {
  constructor(db) {
    this.db = db;
  }

  async selectAllAsync(stmtStr, args = [], db = this.db) {
    //Here query validator can reside
    return new Promise((res, rej) => {
      db.all(stmtStr, args, (err, rows) => (err ? rej(err) : res(rows)));
    });
  }

  async selectOneAsync(stmtStr, args = [], db = this.db) {
    //Here query validator can reside
    return new Promise((res, rej) => {
      db.get(stmtStr, args, (err, row) => (err ? rej(err) : res(row)));
    });
  }

  async exec(stmtStr, args = [], db = this.db) {
    return new Promise((res, rej) => {
      db.all(stmtStr, args, (err, rows) => (err ? rej(err) : res(rows)));
    });
  }

  async countAsync(stmtStr, args, db = this.db) {
    //Here count query validator can reside
    //for now we expect stmtStr like 'select count(?)...'
    return this.selectOneAsync(stmtStr, args, db);
  }
}

export default class DbSqliteQuery {
  constructor(db) {
    this.db = db;
    this.query = new DbSqliteInnerQuery();
  }

  _coalesceDbFromArgs() {
    let db = arguments[arguments.length - 1];
    if (!(db instanceof sqlite3.Database)) {
      db = this.db || null;
    }
    return db;
  }

  //maintainer block
  async createTable(
    tablename,
    schemaMap,
    ifNotExists = false,
    errIfExists = true
  ) {

    let schema = "";
    {
      const schema_ = [];
      for (let [key, value] of schemaMap.entries()) {
        schema_.push(`${key} ${value}`);
      }
      schema = schema_.join(", ");
    }

    //TODO mb? if not exists
    const q = `CREATE TABLE ${
      ifNotExists ? "IF NOT EXISTS" : ""
    } ${tablename}(${schema});`;

    //console.log(q);

    return await this.query
      .exec(q, [], this._coalesceDbFromArgs(...arguments))
      .catch((err) => {
        err = tryIntoDbError(err);

        if (err instanceof DbAlreadyExists && !errIfExists) {
          return;
        }
        throw err;
      });

    throw NotImplementedError("createTable");
  }

  async tableExists(tablename) {
    if (!tablename) throw new ArgumentError("tablename cannot be empty");

    const q =
      "SELECT count(*) cnt FROM sqlite_master WHERE type='table' AND name=?";
    const res = await this.query.countAsync(
      q,
      [tablename],
      this._coalesceDbFromArgs(...arguments)
    );
    return !!(res && res.cnt);
  }

  // async selectOneAsync(){
  //   //("arguments",arguments)
  //   const args = [
  //     ...Array.prototype.slice.apply(arguments,[0,-1]),
  //     this._coalesceDbFromArgs(...arguments),
  //   ]
  //   //("!!",args)
  //   return this.query.selectOneAsync(...args)
  // }

  async selectOneAsync() {
    return this.query.selectOneAsync(...arguments);
  }

  async selectAllAsync() {
    return this.query.selectAllAsync(...arguments);
  }

  async insertOneAsync(stmtStr, values, db = this.db) {
    const [res] = await this.query.exec(
      stmtStr,
      values,
      this._coalesceDbFromArgs(...arguments)
    );
    //("insertOneAsync", res);
    return res;
  }

  async insertManyAsync() {
    const [res] = await this.query.exec(
      stmtStr,
      values,
      this._coalesceDbFromArgs(...arguments)
    );
    //("insertOneAsync", res);
    return res;
  }

  //TODO return something meaningful like number opf items written or even rows
  async batchInsert(stmt, data) {
    await new Promise(async (res, rej) => {
      const q = this.db.prepare(stmt);

      //TODO accumulate errors and if errors on unique constraints (id)
      //...TODO check if there is at least one record with that id in rates table
      //...TODO if not - we may safely assume that new row can be introduced without troubles

      for (let datum of data) {
        await new Promise((res1, rej1) =>
          q.run(...datum, (err) => (err ? rej1(err) : res1()))
        );
      }

      await new Promise((res1, rej1) =>
        q.finalize((err) => (err ? rej1(err) : res1()))
      );
      res();
    });
  }

  async upsertOneAsync() {}

  async upsertManyAsync() {}

  get raw() {
    return this.query;
  }
}

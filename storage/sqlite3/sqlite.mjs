import { NotImplementedError, TypeMeAsCustomError } from "../../common/errors.mjs";

import DbSqliteQuery from "./query.mjs";

const dlog = console.log


//TODO wrap sqlite flags
//TODO move DB_FLAGS to common and leave the implementation up to the db 
const _DB_FLAGS = {
  NONE: 0,
  R: 1 << 1,
  W: 1 << 2,
  DEL: 1 << 4,
  INIT: 1 << 8,
};
Object.freeze(_DB_FLAGS)
const DB_FLAGS_MAX = Math.max(...Object.values(_DB_FLAGS))
export const DB_FLAGS =_DB_FLAGS


class DBSqliteInitializer {
  constructor(fpath, recreate=false, verbose=false, useProvider=null){
    super()
    this.fpath = fpath
    this.recreate = recreate
    
    this.isInMemory = !this.fpath
    //used connection should not be closed
    this.isOwnProvider = !!useProvider 
    this.provider = useProvider

    this.query = null
  }
  init(useProvider=null){
    //TODO if no path - create in memory
    //...TODO later throw error if it is not specified - file or in memory verbosely
    this.isOwnProvider = !!useProvider 
    this.provider = useProvider

    this.query = new DbSqliteQuery()
  }

  destroy(){
    if (this.provider && this.isOwnProvider) {
      this.provider.destroy()
    }
  }

  _ensureProvider(){
    if (!this.provider) {
      this.provider = new DBSqliteConnector(this.isInMemory ? ":memory:" : this.fpath) 
      this.provider.init()
      this.isOwnProvider = true
    }
    return !!this.provider
  }

  //TODO move to generic?
  probeExists(){
    this._ensureProvider()
    //sqlite will always open connection even if file does not exist
    //all errors are intentionally propagated
    const conn = this.provider.open_connection()
    this.provider.close_connection(conn)
    return true
  }

  async probeValid(){
    this._ensureProvider()
    const conn = this.provider.open_connection()

    const err = null
    const res = await this.query.query.selectOneAsync("select 1 test;").catch(err_=>{err = err_})

    if (!err && (!(res instanceof Object)) || res[test] != 1) err = new TypeMeAsCustomError("data mismatch: expected ... but got ...")
    
    this.provider.close_connection(conn)

    return !err
  }

  checkSchema(tablename, schemaJson){
    if (!schemaJson){
      throw new TypeMeAsCustomError("no schema provided")
    }
    throw new NotImplementedError("isSameSchema is not implemented yet")

  }

  async getSchemaAsync(tablename){
    if (!tablename){
      throw new TypeMeAsCustomError("no table provided")
    }
    return this.maintainer.getSchemaAsync(...arguments)


  }
}



export class DBSqlite {
  constructor(fpath, connparams, flags=DB_FLAGS.NONE) {
    this.provider = null
    this.maintainer = null
    //TODO check it is valid
    this.fpath = fpath    

    if (flags != 0 && flags <= DB_FLAGS_MAX) {
      this._ensureProvider()
    }

    if (flags & DB_FLAGS.INIT){
            this.maintainer = new DBSqliteInitializer(this.fpath)
        }
  }

  init(){
    this.provider &&  this.provider.init()
    this.maintainer && this.maintainer.init(this.provider)
  }

  destroy(){
    this.maintainer && this.maintainer.destroy()  
    this.provider && this.provider.destroy()
  }

  _ensureProvider(){
    if (!this.provider) {
      this.provider = new DBSqliteConnector(this.fpath)
      dlog("provider ensured")
    }
    return !!this.provider
  }

  checkSchema(tablename, schemaJson){
    if (!this.maintainer){
      throw new TypeMeAsCustomError("controller was initialized wo maintainer flag")
    }
    return this.maintainer.checkSchema(...arguments)
  }

  getSchemaOf(tablename){
    return this.maintainer.getSchemaAsync(tablename)

  }
}

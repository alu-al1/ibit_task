import {envAsBool} from "./env.mjs"
import path from "path"

let { VERBOSE: _VERBOSE } = process.env;
export const VERBOSE = envAsBool(_VERBOSE);

let { DEBUG: _DEBUG } = process.env;
export const DEBUG = envAsBool(_DEBUG);

export function die(code = 0) {
  process.exit(code);
}

export async function sleeP(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
export const dlog = console.log;

export const implementsIterator = (o) =>
  o != null && typeof o[Symbol.iterator] === "function";

export const tryToGetClassName = (o) =>
  o && o.prototype ? o.prototype.name : typeof o;

const utf8util = new TextDecoder("utf-8");

export const uint8vToJsonStr = (uint8View) =>
  JSON.parse(utf8util.decode(uint8View));
export const baJsonUtf8ToObj = (bufarr) =>
  uint8vToJsonStr(new Uint8Array(bufarr));
export const objToBaJsonUtf8 = (o) => Buffer.from(JSON.stringify(o));


export const ti30minInMs = 1000 * 60 * 30;
export const ti5secInMs = 1000 * 5;
export const tiNMinInMs = (minutes=0) => 1000 * 60 * minutes

export const toAbsPath = f => f ? path.resolve(f) : ""
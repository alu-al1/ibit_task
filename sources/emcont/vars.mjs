import { envAsString } from "../../common/env.mjs";

let { EMCONT_URL: _EMCONT_URL } = process.env;
export const EMCONT_URL = envAsString(_EMCONT_URL);
import { envAsInt } from "../common/env.mjs";

const {EMCONT_POLL_INTERVAL_MS:_EMCONT_POLL_INTERVAL_MS} = process.env
export const EMCONT_POLL_INTERVAL_MS = envAsInt(_EMCONT_POLL_INTERVAL_MS,1000)
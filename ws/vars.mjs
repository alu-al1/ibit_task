import { envAsInt } from "../common/env.mjs";

const { WS_PORT: _WS_PORT } = process.env;
export const WS_PORT = envAsInt(_WS_PORT, 8080);

const { HISTORY_DEPTH_MINUTES: _HISTORY_DEPTH_MINUTES } = process.env;
export const HISTORY_DEPTH_MINUTES = envAsInt(_HISTORY_DEPTH_MINUTES, 30);

export const WS_ACTIONS = {
  LIST_ASSETS: "assets",
  SUBSCRIBE: "subscribe",
  ASSET_POINT: "point",
  ASSET_HISTORY: "asset_history",
};

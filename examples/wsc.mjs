import { WebSocket } from "ws";
import { baJsonUtf8ToObj, objToBaJsonUtf8 } from "../common/common.mjs";

import { WS_ACTIONS } from "../ws/vars.mjs";

const whatsOnMenu = { action: WS_ACTIONS.LIST_ASSETS, message: {} };
const subscribeForMore = (assetId) => {
  return {
    action: WS_ACTIONS.SUBSCRIBE,
    message: { assetId },
  };
};

const [_, __, port] = process.argv

const socket = new WebSocket(`ws://localhost:${port}`);

socket.addEventListener("open", () => {
  socket.send(objToBaJsonUtf8(whatsOnMenu));
});

let i = 0;
let assetid = 1;
socket.addEventListener("message", ({ data }) => {
  console.log(JSON.stringify(baJsonUtf8ToObj(data)));
  switch (i) {
    case 0:
      socket.send(objToBaJsonUtf8(subscribeForMore(assetid)));
      break;
    case 10:
      socket.send(objToBaJsonUtf8(subscribeForMore(assetid + 1)));
      break;
    case 20:
      socket.close();
      break;
  }
  i++;
});

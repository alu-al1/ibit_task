import { randomUUID } from "crypto";

export class ClientWsRecord {
    constructor(ws) {
      this.ws = ws;
      this.id = randomUUID(); //should be passed if we want to restore sessions (e.g. by jwt info)
      this.updateTs();
      this.asset = 0;
      //optimisation
      this.assets = null;
    }
  
    //possible optimisation: disconnect clients on terms (e.g. silent for too long)
  
    updateTs() {
      this.lastSeen = Date.now();
    }
  
    destroy(why) {
      try {
        this.ws && this.ws.send(objToBaJsonUtf8({ message: why || "Internal Server Error" }));
      } catch (_) {}
  
      try {
        //TODO mb check ws is already closed
        this.ws && this.ws.close();
      } catch (_) {}
  
      this.ws = null;
    }
  }
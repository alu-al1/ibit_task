
//id, ts, bid, ask
export class RatesPktCompact extends ArrayBuffer {
  constructor() {
    const bytez_ =
      Uint32Array.BYTES_PER_ELEMENT +
      BigInt64Array.BYTES_PER_ELEMENT +
      Float32Array.BYTES_PER_ELEMENT * 2;
    super(bytez_);
    this.bytez = bytez_;
  }

  encode(id, ts, bid, ask) {
    console.log(this);
    const dv = new DataView(this);
    let cur = 0;

    console.log(dv)

    dv.setUint32(cur, id);
    cur += Uint32Array.BYTES_PER_ELEMENT;

    //ts will not fit in one uint32
    //so either use uint32l and uint32h
    //or cast ts to BigUint64 and store it approptiately
    dv.setBigInt64(cur, BigInt(ts));
    cur += BigInt64Array.BYTES_PER_ELEMENT;

    dv.setFloat32(cur, bid);
    cur += Float32Array.BYTES_PER_ELEMENT;

    dv.setFloat32(cur, ask);
    cur += Float32Array.BYTES_PER_ELEMENT;

    console.log(dv);
    console.log(this);

    return this;
  }

  decode() {
    // do not pack new DataView(this) into class method 
    // as this function should be easily borrowable
    const dv = new DataView(this);
    const acc = new Array(4);
    let cur = 0;

    acc[0] = dv.getUint32(cur);
    cur += Uint32Array.BYTES_PER_ELEMENT;

    acc[1] = Number(dv.getBigInt64(cur))
    cur += BigInt64Array.BYTES_PER_ELEMENT;

    acc[2] = dv.getFloat32(cur);
    cur += Float32Array.BYTES_PER_ELEMENT;

    acc[3] = dv.getFloat32(cur);
    cur += Float32Array.BYTES_PER_ELEMENT;

    console.log(acc)
    return acc;
  }
}

export class RatesPktMap extends Map{
  constructor(){
    super()
  }

  encode(id, ts, bid, ask) {
    this.set("id",id)
    this.set("ts",ts)
    this.set("bid",bid)
    this.set("ask",ask)

    return this
  }

  decode(){
    return[
      this.get("id"),
      Number(this.get("ts")),
      this.get("bid"),
      this.get("ask"),
    ]
  }
}
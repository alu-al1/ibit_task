//Can be upgraded to reading from env or from file
export const assetMap = new Map();
assetMap.set(1, "EURUSD");
assetMap.set(2, "USDJPY");
assetMap.set(3, "GBPUSD");
assetMap.set(4, "AUDUSD");
assetMap.set(5, "USDCAD");

export const reprAssetMap = m => {
    let acc = null;
    try {
      acc = {};
      for (let [k, v] of m.entries()) acc[k] = v;
      return JSON.stringify(acc);
    } catch (_) {
      acc = "<REPR FAILED>";
    }
  
    return acc;
  };

//TODO validate that v are unique
export const assetMapSwapped = new Map();
for (let [k, v] of assetMap.entries()) {
  assetMapSwapped.set(v, k);
}

import { TypeMeAsCustomError } from "../../common/errors.mjs";
import { baJsonUtf8ToObj, uint8vToJsonStr } from "../../common/common.mjs";

const jsonParser = baJsonUtf8ToObj
const customParser = (arrbuf) => {
  //expected ascii only
  let uint8View = new Uint8Array(arrbuf);

  //narrow the buff to possible valid json start and end chars
  let start = 0,
    end = uint8View.length - 1;
  {
    while (start <= end) {
      if (uint8View[start] == 123 || uint8View[start] == 40)
        // '{' or '['
        break;
      start++;
    }
    if (start != 0) start++;

    while (end != start) {
      if (uint8View[end] == 125 || uint8View[end] == 93)
        // '}' or ']'
        break;
      end--;
    }
    if (end != uint8View.length - 1) end++;
  }

  return uint8vToJsonStr(uint8View.slice(start, end));
};

export default function tryParsers(arrbuf) {
  let lastErr = null,
    ok = 0;
  let res = null;
  for (let parser of [jsonParser, customParser]) {
    if (ok) break;
    try {
      res = parser(arrbuf);
    } catch (err) {
      lastErr = err;
      continue;
    }
    ok++;
  }
  if (!ok) throw new TypeMeAsCustomError(lastErr || "all parsers failed");
  return res;
}

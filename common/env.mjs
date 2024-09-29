const sanitizeEnvVal = (ev) => (ev && ev.trim ? ev.trim() : "");

export const envAsBool = (v = "", defaults = false) => {
  v = sanitizeEnvVal(v + "");
  if (!v) return defaults;

  return v && v.toLowerCase
    ? ["t", "true", "1"].indexOf(v.toLowerCase()) != -1
    : defaults;
};

export const envAsInt = (v = "", defaults = 0) => {
  v = sanitizeEnvVal(v + "");
  v = Number(v);
  return isNaN(v) ? defaults : Math.round(v);
};

export const envAsString = sanitizeEnvVal;

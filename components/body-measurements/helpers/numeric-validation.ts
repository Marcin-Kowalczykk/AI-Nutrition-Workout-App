const MAX_VALUE = 999.9;

export const parseNum = (v: string): number =>
  Number(String(v).replace(",", "."));

export const isValidNumeric = (v: string): boolean => {
  const num = parseNum(v);
  if (Number.isNaN(num) || num <= 0 || num > MAX_VALUE) return false;
  const parts = String(v).replace(",", ".").split(".");
  const decimals = parts[1]?.length ?? 0;
  return decimals <= 1;
};

export { MAX_VALUE };

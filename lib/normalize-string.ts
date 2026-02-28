const POLISH_TO_ASCII: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
  Ą: "a",
  Ć: "c",
  Ę: "e",
  Ł: "l",
  Ń: "n",
  Ó: "o",
  Ś: "s",
  Ź: "z",
  Ż: "z",
};

export const normalizeForComparison = (str: string): string => {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split("")
    .map((c) => POLISH_TO_ASCII[c] ?? c)
    .join("");
};

export const parseNumberInput = (raw: string): number | undefined => {
  if (raw === "") return undefined;
  const num = Number(raw);
  if (Number.isNaN(num)) return undefined;
  return num;
};

export const formatNumberFieldValue = (
  value: number | undefined
): string => {
  if (value !== undefined && value !== null) return String(value);
  return "";
};

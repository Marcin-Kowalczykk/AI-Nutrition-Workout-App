export const combineDateAndTime = (
  date: Date,
  timeStr?: string
): Date => {
  const d = new Date(date);
  if (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(":").map(Number);
    d.setHours(h, m, 0, 0);
  }
  return d;
};

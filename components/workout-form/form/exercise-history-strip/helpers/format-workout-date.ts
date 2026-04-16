import { format } from "date-fns";
import { pl } from "date-fns/locale";

export const formatWorkoutDate = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return format(date, "d MMM yyyy", { locale: pl });
};

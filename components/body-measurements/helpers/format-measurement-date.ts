import { format } from "date-fns";
import { pl } from "date-fns/locale";

export const formatMeasurementDate = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "d MMMM yyyy, HH:mm", { locale: pl });
};

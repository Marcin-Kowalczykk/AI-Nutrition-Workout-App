"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Edit, Trash2 } from "lucide-react";

//components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/shared/loader";

//types
import type { IDietDay } from "@/app/api/diet/types";

interface DietDayCardProps {
  day: IDietDay;
  onEdit: (day: IDietDay) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const DietDayCard = ({
  day,
  onEdit,
  onDelete,
  isDeleting,
}: DietDayCardProps) => {
  const formattedDate = format(
    new Date(day.date + "T00:00:00"),
    "d MMMM yyyy",
    { locale: pl }
  );

  return (
    <Card
      className={`w-full${
        isDeleting ? " opacity-50 pointer-events-none" : ""
      }`}
    >
      <CardContent className="p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="text-sm text-muted-foreground border-b-2 border-primary-element pb-2 w-fit">
              {formattedDate}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>
                <strong>Kcal:</strong> {Math.round(day.total_kcal)}
              </span>
              <span>
                <strong>Białko:</strong> {Math.round(day.total_protein_value)} g
              </span>
              <span>
                <strong>Węgle:</strong> {Math.round(day.total_carbs_value)} g
              </span>
              <span>
                <strong>Tłuszcze:</strong> {Math.round(day.total_fat_value)} g
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(day)}
              className="h-9 w-9 text-foreground"
              aria-label="Edit diet day"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(day.id)}
              className="h-9 w-9 text-destructive hover:text-destructive"
              aria-label="Delete diet day"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader size={16} />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

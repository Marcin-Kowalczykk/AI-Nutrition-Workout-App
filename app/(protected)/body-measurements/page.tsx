import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BodyMeasurementsPage() {
  return (
    <div className="w-full xl:w-1/2">
      <Card>
        <CardHeader>
          <CardTitle>Body measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This section is in progress. Soon you&apos;ll be able to log and
            track your body measurements here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function KcalCalculatorPage() {
  return (
    <div className="w-full xl:w-1/2">
      <Card>
        <CardHeader>
          <CardTitle>Kcal calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This section is in progress. Soon you&apos;ll be able to calculate
            and manage your daily calorie needs here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


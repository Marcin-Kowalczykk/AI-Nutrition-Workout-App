import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DietHistoryPage() {
  return (
    <div className="w-full xl:w-1/2">
      <Card>
        <CardHeader>
          <CardTitle>Diet history</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This section is in progress. Soon you&apos;ll be able to track and
            review your diet history here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


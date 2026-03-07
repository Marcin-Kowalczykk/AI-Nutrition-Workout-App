import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ComparisonsPage() {
  return (
    <div className="w-full xl:w-1/2">
      <Card>
        <CardHeader>
          <CardTitle>Comparisons</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This section is in progress. Soon you&apos;ll be able to compare your
            progress and stats here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

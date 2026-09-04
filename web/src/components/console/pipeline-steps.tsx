import { Card, CardContent } from "@/components/ui/card";
import { PIPELINE } from "@/lib/copy";

export function PipelineSteps() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {PIPELINE.map((item) => (
        <Card key={item.step} size="sm">
          <CardContent className="px-4">
            <p className="font-mono text-xs text-muted-foreground">{item.step}. {item.title}</p>
            <p className="mt-1 text-sm">{item.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

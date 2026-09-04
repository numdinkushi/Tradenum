import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PayloadViewer({ payload }: { payload: Record<string, unknown> | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>POST /v2/orders</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
          {payload ? JSON.stringify(payload, null, 2) : "Run a ticket to compile the Alpaca payload."}
        </pre>
      </CardContent>
    </Card>
  );
}

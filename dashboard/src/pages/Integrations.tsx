import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Integration {
  name: string;
  description: string;
  connectHref?: string;
  disconnectHref?: string;
  statusHref?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    name: "QuickBooks Online",
    description: "Accounting and financial data",
    connectHref: "/api/integrations/quickbooks/oauth/start",
    disconnectHref: "/api/integrations/quickbooks/disconnect",
    statusHref: "/api/integrations/quickbooks/status",
  },
  {
    name: "ADP",
    description: "Payroll and clock-in data",
  },
  {
    name: "Winmark",
    description: "Sales and store visit reports",
  },
  {
    name: "Five Stars",
    description: "Loyalty program",
  },
  {
    name: "Meta",
    description: "Facebook and Instagram advertising",
  },
  {
    name: "Resale AI",
    description: "Inventory intelligence and AI-powered buy insights",
  },
];

function IntegrationRow({ integration }: { integration: Integration }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ connected: boolean }>({
    queryKey: [integration.statusHref],
    queryFn: () => fetch(integration.statusHref!).then((r) => r.json()),
    enabled: !!integration.statusHref,
  });

  const connected = !!data?.connected;
  const hasApi = !!integration.connectHref;

  async function handleDisconnect() {
    if (!integration.disconnectHref) return;
    await fetch(integration.disconnectHref, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: [integration.statusHref] });
    queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{integration.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{integration.description}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {hasApi ? (
            <a href={integration.connectHref}>
              <Button variant="outline" size="sm" disabled={isLoading}>
                {connected ? "Reconnect" : "Connect"}
              </Button>
            </a>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          )}
          {connected && integration.disconnectHref && (
            <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={handleDisconnect}>
              Disconnect
            </Button>
          )}
          {hasApi && !isLoading && (
            <span className={connected ? "text-emerald-400 text-sm font-medium" : "text-rose-400 text-sm font-medium"}>
              {connected ? "Connected" : "Not connected"}
            </span>
          )}
          {!hasApi && (
            <span className="text-muted-foreground text-sm">Not connected</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Integrations() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-1 text-lg">Connect your external systems</p>
      </div>
      <div className="space-y-4">
        {INTEGRATIONS.map((integration) => (
          <IntegrationRow key={integration.name} integration={integration} />
        ))}
      </div>
    </div>
  );
}

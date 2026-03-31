import { Link } from "wouter";
import { ChevronLeft, Wrench, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TechTroubleshooting() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/store-info">
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Store Info
          </button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-semibold">Tech Troubleshooting</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted border border-border/50 rounded-xl">
          <Wrench className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Tech Troubleshooting</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Store technology guides and issue resolution</p>
        </div>
      </div>

      {/* Placeholder */}
      <Card className="border-dashed border-border/70">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="p-4 bg-muted/50 rounded-2xl">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Tech troubleshooting guides, device inventory, and issue tracking will be added here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

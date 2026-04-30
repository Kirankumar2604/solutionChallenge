import { Link } from "wouter";
import { ArrowRight, Activity, Gauge, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppEntryDashboardPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">FairLens Entry Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Launch the main AI Ethics Cockpit and jump straight into operational views.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">Home</Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost">About</Button>
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-4 w-4 text-primary" /> Cockpit Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Monitor approvals, fairness improvement, and recent alerts in one place.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" /> Bias Monitor
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Inspect parity metrics across protected groups and evaluate changes over time.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-primary" /> Explainability & Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Audit model factors and decisions for governance and compliance workflows.
            </CardContent>
          </Card>
        </section>

        <div className="mt-10 rounded-xl border bg-background p-6">
          <h2 className="text-xl font-semibold">Open Main Frame</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Continue to the full FairLens workspace with sidebar navigation, predictions, monitoring, and settings.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/app">
              <Button className="gap-2">
                Enter AI Ethics Cockpit <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/app/new-prediction">
              <Button variant="outline">New Prediction</Button>
            </Link>
            <Link href="/app/bias-monitor">
              <Button variant="outline">Bias Monitor</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

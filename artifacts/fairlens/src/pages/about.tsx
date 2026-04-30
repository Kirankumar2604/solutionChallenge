import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <ShieldCheck className="h-6 w-6 text-primary" />
            About FairLens
          </div>
          <Link href="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </header>

        <section className="mb-10 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Human-centered AI governance, operationalized.</h1>
          <p className="max-w-3xl text-muted-foreground">
            FairLens is designed for product, risk, and compliance teams that need transparent and accountable AI decisions. It combines predictive outputs with fairness checks and practical monitoring workflows.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Detect</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Surface demographic parity issues and monitor high-risk segments continuously.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mitigate</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Apply configurable mitigation strategies and compare before/after outcomes.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Explain</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Capture confidence, key factors, and traceable decisions for audits and reviews.
            </CardContent>
          </Card>
        </section>

        <div className="mt-10">
          <Link href="/app-dashboard">
            <Button size="lg">Go to Entry Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

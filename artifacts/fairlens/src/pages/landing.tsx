import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.18),transparent_35%),radial-gradient(circle_at_85%_15%,hsl(var(--chart-2)/0.2),transparent_30%),radial-gradient(circle_at_70%_80%,hsl(var(--chart-4)/0.18),transparent_35%)]">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <ShieldCheck className="h-6 w-6 text-primary" />
            FairLens
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link href="/app-dashboard">
              <Button size="sm">Open Entry Dashboard</Button>
            </Link>
          </nav>
        </header>

        <main className="grid gap-10 pt-14 md:grid-cols-[1.2fr_1fr] md:items-center">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Responsible AI in real time
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Build fairer loan decisions with explainable AI operations.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              FairLens helps teams monitor bias, apply mitigation, and audit model behavior through a practical cockpit for daily operations.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/app-dashboard">
                <Button size="lg" className="gap-2">
                  Start Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">Learn More</Button>
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border bg-background/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold">What you can do</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Track approval parity by gender and location.</li>
              <li>Review explainability logs for every prediction.</li>
              <li>Run synthetic batches to stress-test model fairness.</li>
              <li>Tune thresholds and fairness mode from one control center.</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}

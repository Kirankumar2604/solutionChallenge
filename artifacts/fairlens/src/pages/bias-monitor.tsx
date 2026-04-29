import { useState } from "react";
import { useGetFairnessMetrics, useGetGroupOutcomes } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info, ShieldCheck, ArrowRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type Attribute = "gender" | "location" | "education";

export default function BiasMonitor() {
  const [attribute, setAttribute] = useState<Attribute>("gender");

  const { data: metricsReport, isLoading: isMetricsLoading } = useGetFairnessMetrics({ attribute });
  const { data: outcomesReport, isLoading: isOutcomesLoading } = useGetGroupOutcomes({ attribute });

  const isLoading = isMetricsLoading || isOutcomesLoading;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Bias Monitor</h1>
          <p className="text-muted-foreground">Real-time evaluation of model fairness against protected attributes.</p>
        </div>
        <div className="bg-card border rounded-lg p-1">
          <ToggleGroup type="single" value={attribute} onValueChange={(val) => val && setAttribute(val as Attribute)}>
            <ToggleGroupItem value="gender" aria-label="Gender">Gender</ToggleGroupItem>
            <ToggleGroupItem value="location" aria-label="Location">Location</ToggleGroupItem>
            <ToggleGroupItem value="education" aria-label="Education">Education</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Loading metrics...</div>
      ) : metricsReport && outcomesReport ? (
        <>
          {metricsReport.biasDetectedAfter ? (
            <div className="bg-destructive/10 border-destructive border rounded-lg p-4 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Bias Detected (Severity: {metricsReport.severityAfter})</h3>
                <p className="text-sm text-destructive/90 mt-1">
                  The model is exhibiting unacceptable bias regarding {attribute} even after mitigation. 
                  Consider tuning the approval threshold or switching mitigation strategies in Settings.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-primary/10 border-primary/20 border rounded-lg p-4 flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-primary">Fairness Within Thresholds</h3>
                <p className="text-sm text-primary/90 mt-1">
                  Model decisions regarding {attribute} are currently within acceptable fairness bounds after mitigation.
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm text-primary/70 mb-1">Impact on accuracy</div>
                <div className="font-medium text-primary">{(metricsReport.accuracyChange * 100).toFixed(2)}%</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricsReport.metrics.map((metric) => (
              <Card key={metric.name} className={metric.status === "Biased" ? "border-destructive/50 shadow-sm shadow-destructive/10" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium leading-tight text-muted-foreground">{metric.name}</CardTitle>
                    <Badge variant={metric.status === "Fair" ? "default" : metric.status === "Acceptable" ? "secondary" : "destructive"}>
                      {metric.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="line-through text-muted-foreground font-medium">{metric.before.toFixed(3)}</div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className={`text-2xl font-bold ${metric.status === "Biased" ? "text-destructive" : ""}`}>
                      {metric.after.toFixed(3)}
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                    <span>Ideal: {metric.ideal.toFixed(2)}</span>
                    <span>Threshold: {metric.threshold.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Approval Rate by {attribute.charAt(0).toUpperCase() + attribute.slice(1)}</CardTitle>
                <CardDescription>Comparison of model decisions before and after mitigation.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={outcomesReport.groups} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="group" axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(val: number) => formatPercent(val)} />
                    <Legend />
                    <Bar dataKey="approvalRateBefore" name="Before Mitigation" fill="hsl(var(--muted-foreground) / 0.5)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="approvalRateAfter" name="After Mitigation" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mitigation Impact</CardTitle>
                <CardDescription>Summary of interventions for {attribute}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Fairness Improvement</div>
                  <div className="text-3xl font-bold text-primary">+{formatPercent(metricsReport.fairnessImprovement)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Decisions Changed</div>
                  <div className="text-3xl font-bold">{formatPercent(metricsReport.decisionsChanged)}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Percentage of raw model predictions that were reversed to satisfy parity constraints.
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex gap-2 items-center text-sm font-medium mb-2">
                    <Info className="w-4 h-4 text-primary" />
                    Insight
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {metricsReport.fairnessImprovement > 0.1 
                      ? "Mitigation is heavily altering decisions to achieve fairness. The underlying model may have learned significant biased patterns. Consider re-training with balanced data." 
                      : "Mitigation is applying light corrections. The underlying model is reasonably fair out-of-the-box."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

import { useGetDashboardSummary, useListPredictions, useListBiasAlerts } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: predictions, isLoading: isPredictionsLoading } = useListPredictions({ limit: 5 });
  const { data: alerts, isLoading: isAlertsLoading } = useListBiasAlerts({ limit: 5 });

  if (isSummaryLoading || isPredictionsLoading || isAlertsLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard data...</div>;
  }

  if (!summary) return null;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of system health, fairness metrics, and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalPredictions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPercent(summary.approvalRate)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bias Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{summary.biasDetectedCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Predictions requiring mitigation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fairness Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">+{formatPercent(summary.fairnessImprovement)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average parity gain</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Approval Rate by Gender</CardTitle>
            <CardDescription>Comparison before and after mitigation</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.approvalRateByGender} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="group" axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: number) => formatPercent(val)} />
                <Legend />
                <Bar dataKey="approvalRateBefore" name="Before" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approvalRateAfter" name="After" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Rate by Location</CardTitle>
            <CardDescription>Comparison before and after mitigation</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.approvalRateByLocation} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="group" axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: number) => formatPercent(val)} />
                <Legend />
                <Bar dataKey="approvalRateBefore" name="Before" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approvalRateAfter" name="After" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Decision</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Bias</TableHead>
                  <TableHead>Mitigated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions?.map((pred) => (
                  <TableRow key={pred.id}>
                    <TableCell>
                      <Badge variant={pred.finalDecision === "Approved" ? "default" : "secondary"}>
                        {pred.finalDecision}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPercent(pred.confidence)}</TableCell>
                    <TableCell>
                      {pred.biasDetected ? (
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-none">Detected</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>{pred.mitigationApplied ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts?.map((alert) => (
                <div key={alert.id} className="flex flex-col gap-1 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{alert.message}</span>
                    <Badge variant={alert.severity === "High" ? "destructive" : "secondary"}>{alert.severity}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {alert.attribute}: {alert.group} • {alert.metric} = {formatPercent(alert.value)} (Threshold: {formatPercent(alert.threshold)})
                  </span>
                </div>
              ))}
              {alerts?.length === 0 && (
                <div className="text-sm text-muted-foreground">No recent alerts.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

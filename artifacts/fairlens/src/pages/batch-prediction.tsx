import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRunBatchPrediction, getGetDashboardSummaryQueryKey, getListPredictionsQueryKey, getGetFairnessMetricsQueryKey, getGetGroupOutcomesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Database } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formSchema = z.object({
  scenario: z.enum(["LoanApprovals", "HiringDecisions", "HealthcareTriage"]),
  count: z.coerce.number().min(1).max(200),
});

type FormValues = z.infer<typeof formSchema>;

export default function BatchPrediction() {
  const queryClient = useQueryClient();
  const runBatch = useRunBatchPrediction();
  const [result, setResult] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenario: "LoanApprovals",
      count: 50,
    },
  });

  function onSubmit(data: FormValues) {
    runBatch.mutate(
      { data },
      {
        onSuccess: (res) => {
          setResult(res);
          // Invalidate multiple queries since batch affects everything
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPredictionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFairnessMetricsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetGroupOutcomesQueryKey() });
        },
      }
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Batch Prediction</h1>
        <p className="text-muted-foreground">Run synthetic applicants through the model to stress-test fairness metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Select scenario and batch size.</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="scenario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scenario</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select scenario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LoanApprovals">Loan Approvals</SelectItem>
                            <SelectItem value="HiringDecisions">Hiring Decisions</SelectItem>
                            <SelectItem value="HealthcareTriage">Healthcare Triage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sample Size (Max 200)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={runBatch.isPending} className="w-full">
                    {runBatch.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Batch...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Run Simulation
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        <div className="md:col-span-2">
          {result ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Processed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{result.totalProcessed}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Approved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{result.approvedCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Bias Detected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{result.biasDetectedCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Mitigated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{result.mitigationsApplied}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Group Breakdown</CardTitle>
                  <CardDescription>Approval rates before and after mitigation by group.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Before</TableHead>
                        <TableHead className="text-right">After</TableHead>
                        <TableHead className="text-right">Delta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.groupBreakdown.map((group: any) => {
                        const delta = group.approvalRateAfter - group.approvalRateBefore;
                        return (
                          <TableRow key={group.group}>
                            <TableCell className="font-medium">{group.group}</TableCell>
                            <TableCell className="text-right">{group.total}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatPercent(group.approvalRateBefore)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatPercent(group.approvalRateAfter)}</TableCell>
                            <TableCell className={`text-right ${delta > 0.01 ? "text-primary" : delta < -0.01 ? "text-destructive" : "text-muted-foreground"}`}>
                              {delta > 0 ? "+" : ""}{formatPercent(delta)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/10">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to Simulate</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Configure a batch run to populate the system with synthetic data. This will help you observe how mitigation strategies affect aggregate fairness metrics over time.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

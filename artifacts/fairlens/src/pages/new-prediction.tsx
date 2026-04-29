import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreatePrediction, getListPredictionsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPercent, formatCurrency } from "@/lib/format";
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  age: z.coerce.number().min(18).max(100),
  gender: z.enum(["Male", "Female", "Other"]),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
  education: z.enum(["High School", "Bachelors", "Masters", "PhD"]),
  location: z.enum(["Urban", "Suburban", "Rural"]),
  workExperience: z.coerce.number().min(0).max(60),
  income: z.coerce.number().min(0),
  loanAmount: z.coerce.number().min(0),
  creditHistory: z.enum(["Excellent", "Good", "Fair", "Poor"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewPrediction() {
  const queryClient = useQueryClient();
  const createPrediction = useCreatePrediction();
  const [result, setResult] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 30,
      gender: "Female",
      maritalStatus: "Single",
      education: "Bachelors",
      location: "Urban",
      workExperience: 5,
      income: 60000,
      loanAmount: 15000,
      creditHistory: "Good",
    },
  });

  function onSubmit(data: FormValues) {
    createPrediction.mutate(
      { data },
      {
        onSuccess: (res) => {
          setResult(res);
          queryClient.invalidateQueries({ queryKey: getListPredictionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
      }
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">New Prediction</h1>
        <p className="text-muted-foreground">Submit a new applicant for scoring and fairness evaluation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Applicant Details</CardTitle>
            <CardDescription>Enter the applicant's features to run through the model.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marital Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="High School">High School</SelectItem>
                            <SelectItem value="Bachelors">Bachelors</SelectItem>
                            <SelectItem value="Masters">Masters</SelectItem>
                            <SelectItem value="PhD">PhD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Urban">Urban</SelectItem>
                            <SelectItem value="Suburban">Suburban</SelectItem>
                            <SelectItem value="Rural">Rural</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years Experience</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Income</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="loanAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Amount</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="creditHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit History</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={createPrediction.isPending} className="w-full">
                  {createPrediction.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Run Prediction"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <div>
          {result ? (
            <Card className="h-full border-primary/20 shadow-md overflow-hidden flex flex-col">
              <div className={`h-2 w-full ${result.finalDecision === "Approved" ? "bg-primary" : "bg-destructive"}`} />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl">Evaluation Result</CardTitle>
                  <Badge variant={result.finalDecision === "Approved" ? "default" : "destructive"} className="text-lg px-3 py-1">
                    {result.finalDecision}
                  </Badge>
                </div>
                <CardDescription>Model: {result.modelName} • {result.processingTimeMs}ms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                {result.mitigationApplied ? (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Decision Adjusted for Fairness</h4>
                      <p className="text-sm text-primary/80">
                        The raw score of {formatPercent(result.rawScore)} was mitigated to {formatPercent(result.mitigatedScore)} to ensure parity for the applicant's demographic group.
                      </p>
                    </div>
                  </div>
                ) : result.biasDetected ? (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-destructive mb-1">Bias Detected</h4>
                      <p className="text-sm text-destructive/80">
                        Statistical bias was detected (Severity: {result.severity}), but mitigation was disabled or insufficient to change the outcome.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted rounded-lg p-4 flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Fairness Check Passed</h4>
                      <p className="text-sm text-muted-foreground">
                        No significant bias was detected for this demographic profile. Decision was unchanged.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-muted-foreground">Confidence Score</span>
                    <span className="font-bold">{formatPercent(result.confidence)}</span>
                  </div>
                  <Progress value={result.confidence * 100} className="h-3" />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Key Factors</h4>
                  <div className="space-y-2">
                    {result.factors.map((factor: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${factor.direction === "positive" ? "bg-primary" : "bg-destructive"}`} />
                        <span className="text-sm flex-1">{factor.label}</span>
                        <span className="text-xs text-muted-foreground">{formatPercent(factor.weight)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg text-sm italic border-l-4 border-muted-foreground/30">
                  "{result.explanation}"
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/20">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Prediction Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Fill out the applicant details and run the prediction to see the model's decision and fairness evaluation.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  fairnessMode: z.boolean(),
  approvalThreshold: z.number().min(0).max(1),
  demographicParityThreshold: z.number().min(0.5).max(1),
  disparateImpactThreshold: z.number().min(0.5).max(1),
  mitigationStrategy: z.enum(["ThresholdTuning", "Reweighting", "GroupCalibration"]),
  modelName: z.string().min(1),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fairnessMode: true,
      approvalThreshold: 0.5,
      demographicParityThreshold: 0.8,
      disparateImpactThreshold: 0.8,
      mitigationStrategy: "ThresholdTuning",
      modelName: "LoanModel_v1.3",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        fairnessMode: settings.fairnessMode,
        approvalThreshold: settings.approvalThreshold,
        demographicParityThreshold: settings.demographicParityThreshold,
        disparateImpactThreshold: settings.disparateImpactThreshold,
        mitigationStrategy: settings.mitigationStrategy as any,
        modelName: settings.modelName,
      });
    }
  }, [settings, form]);

  function onSubmit(data: SettingsValues) {
    updateSettings.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({
            title: "Settings saved",
            description: "System parameters have been updated.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update settings.",
          });
        }
      }
    );
  }

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure fairness constraints and mitigation strategies.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Engine State</CardTitle>
              <CardDescription>Master controls for the FairLens engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="fairnessMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Fairness Mode</FormLabel>
                      <FormDescription>
                        When enabled, bias checks and automatic mitigation are applied to every prediction.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Active Model</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>The underlying predictive model to wrap.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mitigation Configuration</CardTitle>
              <CardDescription>How the system resolves detected bias.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="mitigationStrategy"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Algorithm Strategy</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <RadioGroupItem value="ThresholdTuning" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium cursor-pointer">
                              Threshold Tuning
                            </FormLabel>
                            <FormDescription>
                              Adjusts the decision boundary individually for protected groups to achieve parity.
                            </FormDescription>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <RadioGroupItem value="Reweighting" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium cursor-pointer">
                              Reweighting
                            </FormLabel>
                            <FormDescription>
                              Applies weights to training data distribution internally to simulate a balanced set.
                            </FormDescription>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <RadioGroupItem value="GroupCalibration" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium cursor-pointer">
                              Group Calibration
                            </FormLabel>
                            <FormDescription>
                              Ensures predictions mean the same thing regardless of the protected attribute.
                            </FormDescription>
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-6 pt-4 border-t">
                <h4 className="text-sm font-semibold">Tolerances</h4>
                
                <FormField
                  control={form.control}
                  name="approvalThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel>Base Approval Threshold</FormLabel>
                        <span className="text-sm font-mono">{field.value.toFixed(2)}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormDescription>Raw probability required for approval before mitigation.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="demographicParityThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel>Demographic Parity Tolerance</FormLabel>
                        <span className="text-sm font-mono">{field.value.toFixed(2)}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0.5}
                          max={1}
                          step={0.01}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormDescription>Minimum acceptable ratio between lowest and highest approval rates.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t px-6 py-4">
              <Button type="submit" disabled={updateSettings.isPending} className="ml-auto">
                {updateSettings.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

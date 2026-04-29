import { useState, useEffect } from "react";
import { useListPredictions, useGetPrediction, getGetPredictionQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function Explainability() {
  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Read ID from URL query param if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (idParam) {
      setSelectedId(parseInt(idParam, 10));
    }
  }, []);

  const { data: predictions, isLoading: isListLoading } = useListPredictions({ limit: 50 });
  const { data: details, isLoading: isDetailLoading } = useGetPrediction(selectedId || 0, {
    query: {
      enabled: !!selectedId,
      queryKey: getGetPredictionQueryKey(selectedId || 0),
    }
  });

  // Auto-select first prediction if none selected and list loaded
  useEffect(() => {
    if (!selectedId && predictions && predictions.length > 0) {
      setSelectedId(predictions[0].id);
    }
  }, [predictions, selectedId]);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setLocation(`/explainability?id=${id}`);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col gap-1 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Explainability</h1>
        <p className="text-muted-foreground">Understand why the model made a specific decision and how factors contributed.</p>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Left column - List */}
        <Card className="flex flex-col overflow-hidden col-span-1 border-muted bg-muted/10">
          <CardHeader className="shrink-0 pb-3 border-b bg-card">
            <CardTitle className="text-lg font-medium">Recent Predictions</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            {isListLoading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
            ) : predictions?.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No predictions found.</div>
            ) : (
              <div className="flex flex-col divide-y">
                {predictions?.map((pred) => (
                  <button
                    key={pred.id}
                    onClick={() => handleSelect(pred.id)}
                    className={`p-4 text-left hover:bg-accent transition-colors flex flex-col gap-2 ${selectedId === pred.id ? 'bg-accent/80 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-medium text-sm">ID: {pred.id}</span>
                      <Badge variant={pred.finalDecision === "Approved" ? "default" : "secondary"} className="scale-90 origin-top-right">
                        {pred.finalDecision}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate w-full">
                      {pred.input.gender}, {pred.input.age} yrs • {pred.input.location}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right column - Detail */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full overflow-hidden">
          {selectedId && !details && isDetailLoading ? (
            <Card className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading details...</div>
            </Card>
          ) : details ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-6">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-1">Prediction #{details.id}</CardTitle>
                        <CardDescription>Processed on {formatDate(details.createdAt)}</CardDescription>
                      </div>
                      <Badge variant={details.finalDecision === "Approved" ? "default" : "destructive"} className="text-xl px-4 py-1.5">
                        {details.finalDecision}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-lg border">
                          <h4 className="text-sm font-semibold mb-3">Score Analysis</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1.5">
                                <span className="text-muted-foreground">Raw Model Score</span>
                                <span className="font-medium">{formatPercent(details.rawScore)}</span>
                              </div>
                              <Progress value={details.rawScore * 100} className="h-2 opacity-50" />
                            </div>

                            {details.mitigationApplied && (
                              <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                  <span className="font-medium text-primary">Mitigated Score</span>
                                  <span className="font-bold text-primary">{formatPercent(details.mitigatedScore)}</span>
                                </div>
                                <Progress value={details.mitigatedScore * 100} className="h-2 bg-primary/20" />
                                <div className="text-xs text-primary/80 mt-2 italic">
                                  Adjusted to ensure fairness for demographic parity.
                                </div>
                              </div>
                            )}

                            <Separator />
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1.5">
                                <span className="font-medium">Final Confidence</span>
                                <span className="font-bold">{formatPercent(details.confidence)}</span>
                              </div>
                              <Progress value={details.confidence * 100} className="h-2" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted p-4 rounded-lg italic text-sm text-foreground/80 leading-relaxed border-l-4 border-l-primary/50">
                          {details.explanation}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-3">Key Factors</h4>
                        <div className="space-y-3">
                          {details.factors.map((factor: any, idx: number) => (
                            <div key={idx} className="flex items-center text-sm">
                              <div className="w-32 truncate shrink-0 text-muted-foreground" title={factor.label}>{factor.label}</div>
                              <div className="flex-1 mx-3 h-4 bg-muted rounded-full overflow-hidden relative">
                                {factor.direction === "positive" ? (
                                  <div 
                                    className="absolute top-0 bottom-0 left-1/2 bg-primary" 
                                    style={{ width: `${(factor.weight * 100) / 2}%` }}
                                  />
                                ) : (
                                  <div 
                                    className="absolute top-0 bottom-0 right-1/2 bg-destructive" 
                                    style={{ width: `${(factor.weight * 100) / 2}%` }}
                                  />
                                )}
                                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-background z-10" />
                              </div>
                              <div className={`w-12 text-right font-medium ${factor.direction === 'positive' ? 'text-primary' : 'text-destructive'}`}>
                                {factor.direction === 'positive' ? '+' : '-'}{formatPercent(factor.weight)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-destructive"></div> Negative impact</div>
                          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary"></div> Positive impact</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Applicant Input Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Age</div>
                        <div className="font-medium">{details.input.age} years</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Gender</div>
                        <div className="font-medium">{details.input.gender}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Location</div>
                        <div className="font-medium">{details.input.location}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Education</div>
                        <div className="font-medium">{details.input.education}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Marital Status</div>
                        <div className="font-medium">{details.input.maritalStatus}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Experience</div>
                        <div className="font-medium">{details.input.workExperience} years</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Income</div>
                        <div className="font-medium">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(details.input.income)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Credit History</div>
                        <div className="font-medium">{details.input.creditHistory}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : (
            <Card className="flex-1 flex flex-col items-center justify-center text-center p-12 text-muted-foreground">
              <div className="w-12 h-12 bg-muted rounded-full mb-4"></div>
              Select a prediction from the list to view its explanation.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

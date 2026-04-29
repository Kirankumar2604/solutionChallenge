import { useState } from "react";
import { useListPredictions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatPercent, formatDate } from "@/lib/format";
import { Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Logs() {
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [biasOnly, setBiasOnly] = useState(false);

  const { data: predictions, isLoading } = useListPredictions({ 
    limit: 100,
    group: groupFilter === "all" ? undefined : groupFilter,
    biasOnly: biasOnly || undefined
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Search and filter historical predictions.</p>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Prediction History</CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  id="bias-toggle" 
                  checked={biasOnly} 
                  onCheckedChange={setBiasOnly} 
                />
                <Label htmlFor="bias-toggle" className="text-sm cursor-pointer whitespace-nowrap">
                  Bias Detected Only
                </Label>
              </div>
              <div className="w-px h-6 bg-border hidden sm:block"></div>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Demographics</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Urban">Urban</SelectItem>
                  <SelectItem value="Rural">Rural</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[80px] pl-6">ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Demographic</TableHead>
                <TableHead>Final Decision</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Bias Status</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : predictions && predictions.length > 0 ? (
                predictions.map((pred) => (
                  <TableRow key={pred.id} className="group">
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground">{pred.id}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(pred.createdAt)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {pred.input.gender}, {pred.input.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pred.finalDecision === "Approved" ? "default" : "secondary"}>
                        {pred.finalDecision}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPercent(pred.confidence)}</TableCell>
                    <TableCell>
                      {pred.biasDetected ? (
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-none">
                          {pred.severity} Bias
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Clear</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/explainability?id=${pred.id}`}>
                          View Details <ChevronRight className="ml-1 w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No predictions match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

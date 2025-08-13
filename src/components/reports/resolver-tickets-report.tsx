import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp } from "lucide-react";
import { format, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export function ResolverTicketsReport() {
  const [selectedResolver, setSelectedResolver] = useState<string>("");
  const [year, setYear] = useState<Date>(new Date());

  // Query to fetch active resolvers
  const { data: resolvers = [] } = useQuery({
    queryKey: ["resolvers-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resolvers")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Query to fetch ticket data for the selected resolver and year
  const { data: reportData = [], isLoading } = useQuery({
    queryKey: ["resolver-tickets-report", selectedResolver, year.getFullYear()],
    queryFn: async () => {
      if (!selectedResolver) return [];

      const startDate = startOfYear(year);
      const endDate = endOfYear(year);

      const { data, error } = await supabase
        .from("tickets")
        .select("assigned_at, status")
        .eq("assigned_to", selectedResolver)
        .not("assigned_at", "is", null)
        .gte("assigned_at", startDate.toISOString())
        .lte("assigned_at", endDate.toISOString());

      if (error) throw error;

      // Process data to group by month and status
      const monthlyData = Array.from({ length: 12 }, (_, index) => ({
        month: format(new Date(year.getFullYear(), index, 1), "MMM"),
        monthNumber: index + 1,
        open: 0,
        assigned: 0,
        in_progress: 0,
        closed: 0,
      }));

      data.forEach((ticket) => {
        const assignedMonth = new Date(ticket.assigned_at!).getMonth();
        const status = ticket.status;
        
        if (monthlyData[assignedMonth] && status in monthlyData[assignedMonth]) {
          (monthlyData[assignedMonth] as any)[status] += 1;
        }
      });

      return monthlyData;
    },
    enabled: !!selectedResolver,
  });

  const chartConfig = {
    open: {
      label: "Abierto",
      color: "#ef4444",
    },
    assigned: {
      label: "Asignado",
      color: "#3b82f6",
    },
    in_progress: {
      label: "En Progreso",
      color: "#eab308",
    },
    closed: {
      label: "Cerrado",
      color: "#22c55e",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Tickets por Estado por Mes - Por Resolutor</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Resolutor</label>
            <Select value={selectedResolver} onValueChange={setSelectedResolver}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar resolutor" />
              </SelectTrigger>
              <SelectContent>
                      {resolvers.map((resolver) => (
                        <SelectItem key={resolver.id} value={resolver.id}>
                          {resolver.name}
                        </SelectItem>
                      ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Año</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !year && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {year ? format(year, "yyyy") : "Seleccionar año"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={year}
                  onSelect={(date) => date && setYear(date)}
                  defaultMonth={year}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {selectedResolver ? (
          isLoading ? (
            <div className="text-center py-8">Cargando datos del reporte...</div>
          ) : (
            <div className="h-80">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="open"
                      stackId="a"
                      fill="var(--color-open)"
                      name="Abierto"
                    />
                    <Bar
                      dataKey="assigned"
                      stackId="a"
                      fill="var(--color-assigned)"
                      name="Asignado"
                    />
                    <Bar
                      dataKey="in_progress"
                      stackId="a"
                      fill="var(--color-in_progress)"
                      name="En Progreso"
                    />
                    <Bar
                      dataKey="closed"
                      stackId="a"
                      fill="var(--color-closed)"
                      name="Cerrado"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Selecciona un resolutor para ver el reporte
          </div>
        )}
      </CardContent>
    </Card>
  );
}
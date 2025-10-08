import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { Resolver } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp } from "lucide-react";
import { format, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ChartTooltip,
  ChartLegend,
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
      const data = await api.getResolvers();
      return data;
    },
  });

  // Query to fetch ticket data for the selected resolver and year
  const { data: reportData = [], isLoading } = useQuery({
    queryKey: ["resolver-tickets-report", selectedResolver, year.getFullYear()],
    queryFn: async () => {
      if (!selectedResolver) return [];
      
      const data = await api.getResolverTicketsReport(selectedResolver, year.getFullYear());
      return data;
    },
    enabled: !!selectedResolver,
  });



  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Tickets por Estado por Mes - Por Resolutor</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Reporte de tickets gestionados por resolutores (usuarios con rol "Resolutor")
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Resolutor</label>
            <Select value={selectedResolver} onValueChange={setSelectedResolver}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar resolutor (agente)" />
              </SelectTrigger>
              <SelectContent>
                      {resolvers.map((resolver) => (
                        <SelectItem key={resolver.id} value={resolver.id}>
                          {resolver.full_name}
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
            <div className="h-64">
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip />
                  <ChartLegend />
                  <Bar
                    dataKey="open"
                    stackId="a"
                    fill="#ef4444"
                    name="Abierto"
                  />
                  <Bar
                    dataKey="assigned"
                    stackId="a"
                    fill="#3b82f6"
                    name="Asignado"
                  />
                  <Bar
                    dataKey="in_progress"
                    stackId="a"
                    fill="#eab308"
                    name="En Progreso"
                  />
                  <Bar
                    dataKey="closed"
                    stackId="a"
                    fill="#22c55e"
                    name="Cerrado"
                  />
                </BarChart>
              </ResponsiveContainer>
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
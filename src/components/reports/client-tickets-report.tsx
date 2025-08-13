import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart3 } from "lucide-react";
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

export function ClientTicketsReport() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [year, setYear] = useState<Date>(new Date());

  // Query to fetch active clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Client[];
    },
  });

  // Query to fetch ticket data for the selected client and year
  const { data: reportData = [], isLoading } = useQuery({
    queryKey: ["client-tickets-report", selectedClient, year.getFullYear()],
    queryFn: async () => {
      if (!selectedClient) return [];

      const startDate = startOfYear(year);
      const endDate = endOfYear(year);

      const { data, error } = await supabase
        .from("tickets")
        .select("created_at, closed_at, status")
        .eq("client_id", selectedClient)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      // Process data to group by month
      const monthlyData = Array.from({ length: 12 }, (_, index) => ({
        month: format(new Date(year.getFullYear(), index, 1), "MMM"),
        monthNumber: index + 1,
        created: 0,
        closed: 0,
      }));

      data.forEach((ticket) => {
        const createdMonth = new Date(ticket.created_at).getMonth();
        monthlyData[createdMonth].created += 1;

        if (ticket.closed_at) {
          const closedDate = new Date(ticket.closed_at);
          if (closedDate.getFullYear() === year.getFullYear()) {
            const closedMonth = closedDate.getMonth();
            monthlyData[closedMonth].closed += 1;
          }
        }
      });

      return monthlyData;
    },
    enabled: !!selectedClient,
  });

  const chartConfig = {
    created: {
      label: "Tickets Creados",
      color: "#3b82f6",
    },
    closed: {
      label: "Tickets Cerrados",
      color: "#22c55e",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Tickets Creados/Cerrados por Mes - Por Cliente</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Cliente</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
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

        {selectedClient ? (
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
                      dataKey="created"
                      fill="var(--color-created)"
                      name="Tickets Creados"
                    />
                    <Bar
                      dataKey="closed"
                      fill="var(--color-closed)"
                      name="Tickets Cerrados"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Selecciona un cliente para ver el reporte
          </div>
        )}
      </CardContent>
    </Card>
  );
}
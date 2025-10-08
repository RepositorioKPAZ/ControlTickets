import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
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

export function ClientTicketsReport() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [year, setYear] = useState<Date>(new Date());

  // Query to fetch active clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-active"],
    queryFn: async () => {
      const data = await api.getClients();
      return data as Client[];
    },
  });

  // Query to fetch ticket data for the selected client and year
  const { data: reportData = [], isLoading } = useQuery({
    queryKey: ["client-tickets-report", selectedClient, year.getFullYear()],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const data = await api.getClientTicketsReport(selectedClient, year.getFullYear());
      return data;
    },
    enabled: !!selectedClient,
  });



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
            <div className="h-64">
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip />
                  <ChartLegend />
                  <Bar
                    dataKey="created"
                    fill="#3b82f6"
                    name="Tickets Creados"
                  />
                  <Bar
                    dataKey="closed"
                    fill="#22c55e"
                    name="Tickets Cerrados"
                  />
                </BarChart>
              </ResponsiveContainer>
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
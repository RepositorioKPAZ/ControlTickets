import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Download, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResolutionTimeData {
  month: string;
  monthNumber: number;
  totalResolutionTime: number;
  closedTickets: number;
}

interface ClientResolutionData {
  clientId: string;
  clientName: string;
  monthlyData: ResolutionTimeData[];
  totalYearTime: number;
  totalYearTickets: number;
  averageYearTime: number;
}

export function ClientResolutionTimeReport() {
  const [year, setYear] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Query to fetch active clients
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ["clients-active"],
    queryFn: async () => {
      const data = await api.getClients();
      return data;
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Query to fetch resolution time data for all clients
  const { data: reportData = [], isLoading, error: reportError } = useQuery({
    queryKey: ["client-resolution-time-report", year.getFullYear(), clients.length],
    queryFn: async () => {
      if (clients.length === 0) {
        return [];
      }
      
      const allData: ClientResolutionData[] = [];
      
      for (const client of clients) {
        try {
          const data = await api.getClientResolutionTimeReport(client.id, year.getFullYear());
          
          // Calculate totals for the year
          const totalYearTime = data.reduce((sum, month) => sum + (month.totalResolutionTime || 0), 0);
          const totalYearTickets = data.reduce((sum, month) => sum + (month.closedTickets || 0), 0);
          const averageYearTime = totalYearTickets > 0 ? totalYearTime / totalYearTickets : 0;
          
          allData.push({
            clientId: client.id,
            clientName: client.name,
            monthlyData: data,
            totalYearTime,
            totalYearTickets,
            averageYearTime
          });
        } catch (error) {
          console.error(`Error fetching data for client ${client.id}:`, error);
          
          // Add client with empty data to avoid breaking the UI
          allData.push({
            clientId: client.id,
            clientName: client.name,
            monthlyData: [],
            totalYearTime: 0,
            totalYearTickets: 0,
            averageYearTime: 0
          });
        }
      }
      
      return allData;
    },
    enabled: clients.length > 0,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const exportToExcel = async () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay datos para exportar con los filtros seleccionados",
        variant: "destructive",
      });
      return;
    }

    // Validate that we have valid data to export
    const hasValidData = reportData.some(client => 
      client.monthlyData.some(month => month.closedTickets > 0 && month.totalResolutionTime > 0)
    );

    if (!hasValidData) {
      toast({
        title: "No hay datos válidos",
        description: "No hay tickets cerrados con tiempo de resolución para exportar",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Prepare data for Excel
      const excelData: any[] = [];
      
      // Add header row
      excelData.push([
        "Cliente",
        "Mes",
        "Tickets Cerrados",
        "Tiempo Total (hrs)",
        "Tiempo Promedio (hrs)"
      ]);

      // Add data rows
      reportData.forEach((client) => {
        // Filter months with closed tickets and add data rows
        const validMonths = client.monthlyData.filter(month => month.closedTickets > 0 && month.totalResolutionTime > 0);
        
        validMonths.forEach((month) => {
          // Calculate average resolution time for this month
          const averageTime = month.closedTickets > 0 ? month.totalResolutionTime / month.closedTickets : 0;
          
          // Ensure numeric values are valid before using toFixed
          const totalTime = isNaN(month.totalResolutionTime) ? 0 : month.totalResolutionTime;
          const avgTime = isNaN(averageTime) ? 0 : averageTime;
          
          excelData.push([
            client.clientName,
            month.month,
            month.closedTickets,
            totalTime.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            avgTime.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ]);
        });
        
        // Add summary row for this client (only if there are closed tickets)
        if (client.totalYearTickets > 0) {
          // Ensure numeric values are valid before using toFixed
          const yearTotalTime = isNaN(client.totalYearTime) ? 0 : client.totalYearTime;
          const yearAvgTime = isNaN(client.averageYearTime) ? 0 : client.averageYearTime;
          
          excelData.push([
            `${client.clientName} - TOTAL AÑO`,
            "",
            client.totalYearTickets,
            yearTotalTime.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            yearAvgTime.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ]);
        }
        
        // Add empty row for separation
        excelData.push([]);
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Auto-adjust column widths
      const colWidths = [
        { wch: 30 }, // Cliente
        { wch: 15 }, // Mes
        { wch: 20 }, // Tickets Cerrados
        { wch: 25 }, // Tiempo Total
        { wch: 25 }, // Tiempo Promedio
      ];
      ws["!cols"] = colWidths;

      // Add sheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Tiempo Resolucion Clientes");

      // Generate filename
      const currentDate = format(new Date(), "yyyy-MM-dd");
      const fileName = `Reporte_Tiempo_Resolucion_Clientes_${year.getFullYear()}_${currentDate}.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Exportación exitosa",
        description: `Se ha exportado el reporte de tiempo de resolución por cliente`,
      });
    } catch (error) {
      console.error("Error al exportar:", error);
      
      let errorMessage = "Hubo un problema al exportar el archivo";
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Error de exportación",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getMonthNames = () => {
    return Array.from({ length: 12 }, (_, index) => 
      new Date(year.getFullYear(), index, 1).toLocaleString('es-ES', { month: 'short' })
    );
  };

  const monthNames = getMonthNames();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Reporte de Tiempo de Resolución por Cliente</span>
          </div>
          <Button
            onClick={exportToExcel}
            disabled={isExporting || reportData.length === 0}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? "Exportando..." : "Exportar a Excel"}</span>
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Análisis del tiempo de resolución de tickets por cliente y por mes
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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

        {clientsLoading ? (
          <div className="text-center py-8">Cargando clientes...</div>
        ) : clientsError ? (
          <div className="text-center py-8 text-red-600">
            Error al cargar clientes: {clientsError.message}
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">Cargando datos del reporte...</div>
        ) : reportError ? (
          <div className="text-center py-8 text-red-600">
            Error al cargar datos del reporte: {reportError.message}
          </div>
        ) : reportData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos disponibles para el año seleccionado
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Total Clientes</span>
                  </div>
                  <p className="text-2xl font-bold">{reportData.length}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">Tiempo Total Año</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {reportData.reduce((sum, client) => sum + client.totalYearTime, 0).toFixed(2)} hrs
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">Promedio General</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {(() => {
                      const totalTime = reportData.reduce((sum, client) => sum + client.totalYearTime, 0);
                      const totalTickets = reportData.reduce((sum, client) => sum + client.totalYearTickets, 0);
                      return totalTickets > 0 ? (totalTime / totalTickets).toFixed(2) : '0.00';
                    })()} hrs
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Cliente</TableHead>
                    {monthNames.map((month, index) => (
                      <TableHead key={index} className="text-center min-w-[100px]">
                        {month}
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-[120px]">Total Año</TableHead>
                    <TableHead className="text-center min-w-[120px]">Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((client) => (
                    <TableRow key={client.clientId}>
                      <TableCell className="font-medium">
                        {client.clientName}
                      </TableCell>
                      {monthNames.map((_, monthIndex) => {
                        const monthData = client.monthlyData.find(
                          month => month.monthNumber === monthIndex + 1
                        );
                        
                        if (!monthData || monthData.closedTickets === 0) {
                          return <TableCell key={monthIndex} className="text-center text-muted-foreground">-</TableCell>;
                        }
                        
                        return (
                          <TableCell key={monthIndex} className="text-center">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {monthData.totalResolutionTime.toFixed(2)} hrs
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ({monthData.closedTickets} tickets)
                              </div>
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-medium">
                        <div className="space-y-1">
                          <div className="text-sm">
                            {client.totalYearTime.toFixed(2)} hrs
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ({client.totalYearTickets} tickets)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {client.averageYearTime.toFixed(2)} hrs
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

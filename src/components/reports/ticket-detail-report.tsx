import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Download } from "lucide-react";
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

interface TicketDetail {
  id: string;
  ticket_number: string;
  created_at: string;
  closed_at: string | null;
  resolution_time_hours: number | null;
  resolution_notes: string | null;
  requesting_user: string | null;
  client_name: string | null;
}

export function TicketDetailReport() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState<string>("closed");
  const [selectedResolver, setSelectedResolver] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

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
      return data;
    },
  });

  // Query to fetch ticket detail data
  const { data: ticketDetails = [], isLoading } = useQuery({
    queryKey: ["ticket-detail-report", startDate, endDate, statusFilter, selectedResolver, selectedClient],
    queryFn: async () => {
      let query = supabase
        .from("tickets")
        .select(`
          id,
          ticket_number,
          created_at,
          closed_at,
          resolution_time_hours,
          resolution_notes,
          requesting_user,
          clients:client_id (
            name
          ),
          resolvers:assigned_to (
            name
          )
        `)
        .order("created_at", { ascending: false });

      // Apply date filters
      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("created_at", endDate.toISOString());
      }

      // Apply status filter
      if (statusFilter === "closed") {
        query = query.not("closed_at", "is", null);
      }

      // Apply resolver filter
      if (selectedResolver && selectedResolver !== "all") {
        query = query.eq("assigned_to", selectedResolver);
      }

      // Apply client filter
      if (selectedClient && selectedClient !== "all") {
        query = query.eq("client_id", selectedClient);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      return data.map((ticket: any) => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        created_at: ticket.created_at,
        closed_at: ticket.closed_at,
        resolution_time_hours: ticket.resolution_time_hours,
        resolution_notes: ticket.resolution_notes,
        requesting_user: ticket.requesting_user,
        client_name: ticket.clients?.name || null,
      })) as TicketDetail[];
    },
  });

  const exportToExcel = async () => {
    if (ticketDetails.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay tickets para exportar con los filtros seleccionados",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Formatear datos para Excel
      const excelData = ticketDetails.map((ticket) => ({
        "Número de Ticket": ticket.ticket_number,
        "Fecha de Creación": ticket.created_at 
          ? format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")
          : "No especificado",
        "Usuario Solicitante": ticket.requesting_user || "No especificado",
        "Cliente": ticket.client_name || "Sin cliente",
        "Fecha de Cierre": ticket.closed_at 
          ? format(new Date(ticket.closed_at), "dd/MM/yyyy HH:mm")
          : "No cerrado",
        "Tiempo de Resolución (hrs)": ticket.resolution_time_hours || "No registrado",
        "Nota de Resolución": ticket.resolution_notes || "N/A",
      }));

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-ajustar ancho de columnas
      const colWidths = [
        { wch: 15 }, // Número de Ticket
        { wch: 20 }, // Fecha de Creación
        { wch: 20 }, // Usuario Solicitante
        { wch: 20 }, // Cliente
        { wch: 20 }, // Fecha de Cierre
        { wch: 25 }, // Tiempo de Resolución
        { wch: 40 }, // Nota de Resolución
      ];
      ws["!cols"] = colWidths;

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Reporte Detallado");

      // Generar nombre de archivo con fecha actual
      const currentDate = format(new Date(), "yyyy-MM-dd");
      const fileName = `Reporte_Detallado_Tickets_${currentDate}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Exportación exitosa",
        description: `Se ha exportado el reporte con ${ticketDetails.length} tickets`,
      });
    } catch (error) {
      console.error("Error al exportar:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al exportar el archivo",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Reporte Detallado de Tickets</span>
          </div>
          <Button
            onClick={exportToExcel}
            disabled={isExporting || ticketDetails.length === 0}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? "Exportando..." : "Exportar a Excel"}</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Fecha Desde</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Fecha Hasta</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Estado</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tickets</SelectItem>
                <SelectItem value="closed">Solo tickets cerrados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Cliente</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Resolutor</label>
            <Select value={selectedResolver} onValueChange={setSelectedResolver}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los resolutores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los resolutores</SelectItem>
                {resolvers.map((resolver) => (
                  <SelectItem key={resolver.id} value={resolver.id}>
                    {resolver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Cargando datos del reporte...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Ticket</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Usuario Solicitante</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha de Cierre</TableHead>
                  <TableHead>Tiempo de Resolución (hrs)</TableHead>
                  <TableHead>Nota de Resolución</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron tickets con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  ticketDetails.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        {ticket.ticket_number}
                      </TableCell>
                      <TableCell>
                        {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {ticket.requesting_user || "No especificado"}
                      </TableCell>
                      <TableCell>
                        {ticket.client_name || "Sin cliente"}
                      </TableCell>
                      <TableCell>
                        {ticket.closed_at 
                          ? format(new Date(ticket.closed_at), "dd/MM/yyyy HH:mm")
                          : "No cerrado"
                        }
                      </TableCell>
                      <TableCell>
                        {ticket.resolution_time_hours 
                          ? `${ticket.resolution_time_hours} hrs`
                          : "No registrado"
                        }
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {ticket.resolution_notes || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
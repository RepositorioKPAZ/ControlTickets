import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  title: string;
  description: string | null;
  status: string;
  priority: string;
  request_type: string;
  created_at: string;
  closed_at: string | null;
  resolution_time_hours: number | null;
  resolution_notes: string | null;
  requesting_user: string | null;
  client_name: string | null;
  assigned_resolver_name: string | null;
}

export function TicketDetailReport() {
  // Obtener el primer día del mes en curso
  const getFirstDayOfCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  // Obtener el último día del mes en curso
  const getLastDayOfCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  };

  const [startDate, setStartDate] = useState<Date>(getFirstDayOfCurrentMonth());
  const [endDate, setEndDate] = useState<Date>(getLastDayOfCurrentMonth());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedResolver, setSelectedResolver] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Query to fetch active resolvers
  const { data: resolvers = [] } = useQuery({
    queryKey: ["resolvers-active"],
    queryFn: async () => {
      const data = await api.getResolvers();
      return data;
    },
  });

  // Query to fetch active clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-active"],
    queryFn: async () => {
      const data = await api.getClients();
      return data;
    },
  });

  // Query to fetch ticket detail data
  const { data: ticketDetails = [], isLoading } = useQuery({
    queryKey: ["ticket-detail-report", startDate, endDate, statusFilter, selectedResolver, selectedClient],
    queryFn: async () => {
      const filters = {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        statusFilter: statusFilter,
        selectedResolver: selectedResolver,
        selectedClient: selectedClient,
      };
      
      const data = await api.getTicketDetailReport(filters);
      
      return (data as any[]).map((ticket: any) => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        created_at: ticket.created_at,
        closed_at: ticket.closed_at,
        resolution_time_hours: ticket.resolution_time_hours,
        resolution_notes: ticket.resolution_notes,
        requesting_user: ticket.usu_solicitante || 'N/A', // Use usu_solicitante if available, show N/A if null
        client_name: ticket.client_name || null,
        assigned_resolver_name: ticket.assigned_resolver_name || null,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        request_type: ticket.request_type,
      })) as TicketDetail[];
    },
    enabled: true, // Always enabled since we have default dates
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
        "Título": ticket.title,
        "Descripción": ticket.description || "Sin descripción",
        "Estado": ticket.status === 'closed' ? 'Cerrado' :
                 ticket.status === 'in_progress' ? 'En Progreso' :
                 ticket.status === 'assigned' ? 'Asignado' : 'Abierto',
        "Prioridad": ticket.priority === 'urgent' ? 'Urgente' :
                    ticket.priority === 'high' ? 'Alta' :
                    ticket.priority === 'medium' ? 'Media' : 'Baja',
        "Fecha de Creación": ticket.created_at 
          ? format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")
          : "No especificado",
        "Usuario Solicitante": ticket.requesting_user || "No especificado",
        "Cliente": ticket.client_name || "Sin cliente",
        "Resolutor Asignado": ticket.assigned_resolver_name || "No asignado",
        "Fecha de Cierre": ticket.closed_at 
          ? format(new Date(ticket.closed_at), "dd/MM/yyyy HH:mm")
          : "No cerrado",
        "Tiempo de Resolución (hrs)": ticket.resolution_time_hours 
          ? ticket.resolution_time_hours.toString().replace('.', ',')
          : "No registrado",
        "Nota de Resolución": ticket.resolution_notes || "N/A",
      }));

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-ajustar ancho de columnas
      const colWidths = [
        { wch: 15 }, // Número de Ticket
        { wch: 30 }, // Título
        { wch: 40 }, // Descripción
        { wch: 12 }, // Estado
        { wch: 12 }, // Prioridad
        { wch: 20 }, // Fecha de Creación
        { wch: 20 }, // Usuario Solicitante
        { wch: 20 }, // Cliente
        { wch: 20 }, // Resolutor Asignado
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


  const exportToPDF = async () => {
    setIsExporting(true);

    try {
      // Crear un nuevo documento PDF
      const pdf = new jsPDF('l', 'mm', 'a4'); // Orientación landscape para más espacio
      
      // Función auxiliar para dividir texto usando jsPDF nativo
      const splitTextToLines = (text: string, maxWidth: number): string[] => {
        if (!text) return [''];
        try {
          // Usar la función nativa de jsPDF para dividir texto
          return pdf.splitTextToSize(String(text || ''), maxWidth);
        } catch (error) {
          console.error('Error in jsPDF splitTextToSize:', error);
          return [String(text || '')];
        }
      };

      // Función para dibujar líneas horizontales entre filas
      const drawHorizontalLines = (startX: number, startY: number, endX: number, endY: number) => {
        pdf.setDrawColor(200, 200, 200); // Color gris claro para las líneas
        pdf.setLineWidth(0.1); // Líneas muy finas
        
        // Solo dibujar líneas horizontales
        pdf.line(startX, startY, endX, startY); // Línea superior
        pdf.line(startX, endY, endX, endY); // Línea inferior
      };
      
      // Configurar fuentes y colores
      pdf.setFont('helvetica');
      pdf.setFontSize(16);
      
      // Título del reporte
      pdf.setFillColor(26, 56, 102); // Color teal como en la imagen
      pdf.rect(0, 0, 297, 15, 'F'); // Fondo teal para el título
      pdf.setTextColor(255, 255, 255); // Texto blanco
      pdf.text('Reporte Detallado de Tickets', 20, 10);
      
      // Información del reporte
      pdf.setTextColor(0, 0, 0); // Texto negro
      pdf.setFontSize(10);
      
      const startDateStr = format(startDate, "dd/MM/yyyy");
      const endDateStr = format(endDate, "dd/MM/yyyy");
      const currentDate = format(new Date(), "dd/MM/yyyy HH:mm");
      
      pdf.text(`Período: ${startDateStr} - ${endDateStr}`, 20, 25);
      
      // Verificar si hay datos para mostrar
      if (!ticketDetails || ticketDetails.length === 0) {
        // Mostrar mensaje de no hay datos
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100); // Color gris
        pdf.text('No hay registros para el período seleccionado', 20, 50);
        
        // Información adicional sobre el filtro
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Filtros aplicados:`, 20, 70);
        
        let filterY = 85;
        if (selectedClient && selectedClient !== 'all') {
          const clientName = clients.find(c => c.id === selectedClient)?.name || 'Cliente desconocido';
          pdf.text(`• Cliente: ${clientName}`, 30, filterY);
          filterY += 10;
        }
        
        if (selectedResolver && selectedResolver !== 'all') {
          const resolverName = resolvers.find(r => r.id === selectedResolver)?.full_name || 'Resolver desconocido';
          pdf.text(`• Resolver: ${resolverName}`, 30, filterY);
          filterY += 10;
        }
        
        if (statusFilter && statusFilter !== 'all') {
          pdf.text(`• Estado: ${statusFilter}`, 30, filterY);
          filterY += 10;
        }
        
        pdf.text(`• Período: ${startDateStr} - ${endDateStr}`, 30, filterY);
        
        // Guardar el PDF
        pdf.save(`reporte-detallado-sin-datos-${startDateStr}-${endDateStr}.pdf`);
        
        toast({
          title: "PDF generado",
          description: "Se ha generado el reporte PDF (sin datos para el período seleccionado)",
        });
        
        setIsExporting(false);
        return;
      }
      
      // Agrupar tickets por cliente
      const ticketsByClient = ticketDetails.reduce((acc: { [key: string]: any[] }, ticket) => {
        const clientName = String(ticket.client_name || 'Sin cliente');
        if (!acc[clientName]) {
          acc[clientName] = [];
        }
        acc[clientName].push(ticket);
        return acc;
      }, {});
      
      // Configurar tabla con anchos optimizados
      const pageWidth = 297; // Ancho de página A4 en landscape
      const margin = 20;
      const tableWidth = pageWidth - (2 * margin);
      
      // Encabezados de la tabla - orden exacto como en la imagen
      const headers = [
        ['Número', 'Ticket'], 'Título', 'Descripción', 'Estado', 'Prioridad', 
        ['Fecha', 'Creación'], 'Solicitante',
        ['Fecha', 'Cierre'], 'Tiempo', 'Servicio'
      ];
      
      // Anchos optimizados - más conservadores para evitar desbordamiento
      const colWidths = [20, 40, 50, 15, 15, 15, 20, 18, 15, 45];
      const lineHeight = 4; // Altura de línea reducida
      let currentY = 45;
      
      // Dibujar encabezados con fondo teal
      pdf.setFillColor(26, 56, 102); // Color teal como en la imagen
      pdf.rect(margin, currentY - 5, tableWidth, 12, 'F'); // Altura aumentada para 2 líneas
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255); // Texto blanco en encabezados
      let xPosition = margin;
      
      headers.forEach((header, index) => {
        if (Array.isArray(header)) {
          // Encabezado de 2 líneas
          pdf.text(header[0], xPosition + 2, currentY - 1);
          pdf.text(header[1], xPosition + 2, currentY + 2);
        } else {
          // Encabezado de 1 línea
          pdf.text(header, xPosition + 2, currentY);
        }
        xPosition += colWidths[index];
      });
      
      // Dibujar líneas horizontales en el encabezado
      drawHorizontalLines(margin, currentY - 5, margin + tableWidth, currentY + 7);
      
      currentY += 12; // Espacio aumentado para acomodar 2 líneas
      
      // Procesar cada cliente
      const clientNames = Object.keys(ticketsByClient);
      let totalResolutionTime = 0;
      
      clientNames.forEach((clientName, clientIndex) => {
        const clientTickets = ticketsByClient[clientName];
        
        // Si no es el primer cliente, agregar nueva página
        if (clientIndex > 0) {
          pdf.addPage();
          currentY = 20;
          
          // Redibujar encabezados en nueva página
          pdf.setFillColor(26, 56, 102); // Color azul oscuro
          pdf.rect(margin, currentY - 5, tableWidth, 12, 'F'); // Altura aumentada para 2 líneas
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          let xPosition = margin;
          headers.forEach((header, colIndex) => {
            if (Array.isArray(header)) {
              // Encabezado de 2 líneas
              pdf.text(header[0], xPosition + 2, currentY - 1);
              pdf.text(header[1], xPosition + 2, currentY + 2);
            } else {
              // Encabezado de 1 línea
              pdf.text(header, xPosition + 2, currentY);
            }
            xPosition += colWidths[colIndex];
          });
          
          // Dibujar líneas horizontales en el encabezado de nueva página
          drawHorizontalLines(margin, currentY - 5, margin + tableWidth, currentY + 7);
          
          currentY += 12; // Espacio aumentado para acomodar 2 líneas
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
        }
        
        // Mostrar nombre del cliente
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Cliente: ${clientName}`, margin, currentY);
        currentY += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        
        // Procesar tickets del cliente
        clientTickets.forEach((ticket, index) => {
        // Verificar si necesitamos una nueva página
        if (currentY > 170) { // Altura máxima antes de nueva página
          pdf.addPage();
          currentY = 20;
          
          // Redibujar encabezados en nueva página
          pdf.setFillColor(26, 56, 102); // Color azul oscuro
          pdf.rect(margin, currentY - 5, tableWidth, 12, 'F'); // Altura aumentada para 2 líneas
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          xPosition = margin;
          headers.forEach((header, colIndex) => {
            if (Array.isArray(header)) {
              // Encabezado de 2 líneas
              pdf.text(header[0], xPosition + 2, currentY - 1);
              pdf.text(header[1], xPosition + 2, currentY + 2);
            } else {
              // Encabezado de 1 línea
              pdf.text(header, xPosition + 2, currentY);
            }
            xPosition += colWidths[colIndex];
          });
          
          // Dibujar líneas horizontales en el encabezado de nueva página
          drawHorizontalLines(margin, currentY - 5, margin + tableWidth, currentY + 7);
          
          currentY += 12; // Espacio aumentado para acomodar 2 líneas
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
        }
        
        // Datos del ticket - con validación de datos
        const rowData = [
          String(ticket.ticket_number || ''),
          String(ticket.title || ''),
          String(ticket.description || 'Sin descripción'),
          ticket.status === 'closed' ? 'Cerrado' :
          ticket.status === 'in_progress' ? 'En Progreso' :
          ticket.status === 'assigned' ? 'Asignado' : 'Abierto',
          ticket.priority === 'urgent' ? 'Urgente' :
          ticket.priority === 'high' ? 'Alta' :
          ticket.priority === 'medium' ? 'Media' : 'Baja',
          ticket.created_at ? format(new Date(ticket.created_at), "dd/MM/yyyy") : 'No especificado',
          String(ticket.requesting_user || 'No especificado'),
          ticket.closed_at ? format(new Date(ticket.closed_at), "dd/MM/yyyy") : 'No cerrado',
          ticket.resolution_time_hours ? Number(ticket.resolution_time_hours).toFixed(2).replace('.', ',') : 'No registrado',
          String(ticket.resolution_notes || 'N/A')
        ];
        
        // Calcular la altura máxima necesaria para esta fila
        let maxLines = 1;
        try {
          rowData.forEach((data, colIndex) => {
            const lines = splitTextToLines(String(data), colWidths[colIndex]);
            maxLines = Math.max(maxLines, lines.length);
          });
          // Limitar a máximo 4 líneas para evitar filas demasiado altas
          maxLines = Math.min(maxLines, 20);
        } catch (error) {
          console.error('Error calculating max lines:', error);
          maxLines = 1;
        }
        
        // Dibujar fondo de fila
        if (index % 2 === 0) {
          pdf.setFillColor(248, 250, 252); // Color gris muy claro
          pdf.rect(margin, currentY - 5, tableWidth, (maxLines * lineHeight) + 5, 'F');
        }
        
        // Dibujar líneas horizontales para esta fila
        drawHorizontalLines(margin, currentY - 5, margin + tableWidth, currentY + (maxLines * lineHeight));
        
        // No dibujar líneas horizontales internas entre líneas de texto
        
        // Dibujar contenido de la fila
        try {
          for (let lineIndex = 0; lineIndex < maxLines; lineIndex++) {
            let xPosition = margin;
            let yPosition = currentY + (lineIndex * lineHeight);
            
            rowData.forEach((data, colIndex) => {
              try {
                const lines = splitTextToLines(String(data), colWidths[colIndex]);
                const lineText = lines[lineIndex] || '';
                
                pdf.text(lineText, xPosition + 1, yPosition);
                xPosition += colWidths[colIndex];
              } catch (error) {
                console.error('Error drawing cell content:', error);
                pdf.text('...', xPosition + 1, yPosition);
                xPosition += colWidths[colIndex];
              }
            });
          }
        } catch (error) {
          console.error('Error drawing row content:', error);
          // Dibujar una fila simple en caso de error
          pdf.text('Error en datos', margin + 2, currentY);
        }
        
        currentY += (maxLines * lineHeight) + 5; // Espaciado entre filas
        });
        
        // Acumular tiempo total de resolución
        clientTickets.forEach(ticket => {
          try {
            const time = Number(ticket.resolution_time_hours) || 0;
            totalResolutionTime += time;
          } catch (error) {
            console.error('Error calculating resolution time:', error);
          }
        });
      });
      
      // Pie de página con total como en la imagen
      const finalY = currentY + 10;
      pdf.setFillColor(173, 216, 230); // Color azul claro para el pie
      pdf.rect(margin, finalY - 5, tableWidth, 10, 'F');
      
      // Dibujar líneas horizontales en el pie de página
      drawHorizontalLines(margin, finalY - 5, margin + tableWidth, finalY + 5);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      
      // Calcular posición para "TOTAL" y el tiempo total
      const totalLabelX = margin + 2;
      const totalValueX = margin + 2 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7] ; // Posición de la columna de tiempo
      
      pdf.text('TOTAL', totalLabelX, finalY);
      pdf.text(totalResolutionTime.toFixed(2).replace('.', ','), totalValueX, finalY);
      
      // Mostrar total de tickets después del pie de página
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total de tickets: ${ticketDetails.length}`, 20, finalY + 15);
      
      
      // Generar nombre de archivo con fecha actual
      const currentDateFile = format(new Date(), "yyyy-MM-dd");
      const fileName = `Reporte_Detallado_Tickets_${currentDateFile}.pdf`;
      
      // Descargar archivo
      pdf.save(fileName);
      
      toast({
        title: "Exportación exitosa",
        description: `Se ha exportado el reporte PDF con ${ticketDetails.length} tickets`,
      });
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al exportar el archivo PDF",
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
          <div className="flex items-center space-x-2">
            <Button
              onClick={exportToExcel}
              disabled={isExporting || ticketDetails.length === 0}
              size="sm"
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? "Exportando..." : "Excel"}</span>
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={isExporting}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? "Exportando..." : "PDF"}</span>
            </Button>
          </div>
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
                <SelectItem value="open">Solo tickets abiertos</SelectItem>
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
                {(clients as any[]).map((client) => (
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
                {(resolvers as any[]).map((resolver) => (
                  <SelectItem key={resolver.id} value={resolver.id}>
                    {resolver.full_name}
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
                  <TableHead>Título</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Usuario Solicitante</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Resolutor Asignado</TableHead>
                  <TableHead>Fecha de Cierre</TableHead>
                  <TableHead>Tiempo de Resolución (hrs)</TableHead>
                  <TableHead>Nota de Resolución</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      No se encontraron tickets con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  ticketDetails.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        {ticket.ticket_number}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {ticket.title}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {ticket.description || "Sin descripción"}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.status === 'closed' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {ticket.status === 'closed' ? 'Cerrado' :
                           ticket.status === 'in_progress' ? 'En Progreso' :
                           ticket.status === 'assigned' ? 'Asignado' :
                           'Abierto'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.priority === 'urgent' ? 'Urgente' :
                           ticket.priority === 'high' ? 'Alta' :
                           ticket.priority === 'medium' ? 'Media' :
                           'Baja'}
                        </span>
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
                        {ticket.assigned_resolver_name || "No asignado"}
                      </TableCell>
                      <TableCell>
                        {ticket.closed_at 
                          ? format(new Date(ticket.closed_at), "dd/MM/yyyy HH:mm")
                          : "No cerrado"
                        }
                      </TableCell>
                      <TableCell>
                        {ticket.resolution_time_hours 
                          ? ticket.resolution_time_hours.toString().replace('.', ',')
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
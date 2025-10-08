import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { Holiday } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HolidayForm } from "./holiday-form";
import { Search, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function HolidayList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const data = await api.getHolidays();
      return data as Holiday[];
    },
  });

  const updateHolidayMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await api.updateHoliday(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast({
        title: "Éxito",
        description: "Estado del feriado actualizado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del feriado",
        variant: "destructive",
      });
    },
  });

  const filteredHolidays = holidays.filter(
    (holiday) =>
      holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (holiday.country_name && holiday.country_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setShowForm(true);
  };

  const handleStatusChange = (holiday: Holiday, is_active: boolean) => {
    // Only update if the holiday has an is_active field or if we're setting it to true
    if (holiday.is_active !== undefined || is_active) {
      updateHolidayMutation.mutate({ id: holiday.id, is_active });
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingHoliday(null);
  };

  if (showForm) {
    return (
      <HolidayForm
        holiday={editingHoliday}
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gestión de Días Feriados</CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Feriado
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-4">Cargando feriados...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell>
                    {format(new Date(holiday.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">{holiday.name}</TableCell>
                  <TableCell>{holiday.country_name || "No especificado"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={holiday.is_active ?? true}
                        onCheckedChange={(checked) => 
                          handleStatusChange(holiday, checked)
                        }
                        disabled={updateHolidayMutation.isPending}
                      />
                      <Badge variant={(holiday.is_active ?? true) ? "default" : "secondary"}>
                        {(holiday.is_active ?? true) ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(holiday)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredHolidays.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No se encontraron feriados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
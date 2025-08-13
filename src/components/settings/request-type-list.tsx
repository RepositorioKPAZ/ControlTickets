import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequestTypeConfig } from "@/types/database";
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
import { RequestTypeForm } from "./request-type-form";
import { Search, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RequestTypeList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRequestType, setEditingRequestType] = useState<RequestTypeConfig | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requestTypes = [], isLoading } = useQuery({
    queryKey: ["request-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_types")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as RequestTypeConfig[];
    },
  });

  const updateRequestTypeMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("request_types")
        .update({ is_active })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request-types"] });
      toast({
        title: "Éxito",
        description: "Estado del tipo de solicitud actualizado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del tipo de solicitud",
        variant: "destructive",
      });
    },
  });

  const filteredRequestTypes = requestTypes.filter(
    (requestType) =>
      requestType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      requestType.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (requestType: RequestTypeConfig) => {
    setEditingRequestType(requestType);
    setShowForm(true);
  };

  const handleStatusChange = (requestType: RequestTypeConfig, is_active: boolean) => {
    updateRequestTypeMutation.mutate({ id: requestType.id, is_active });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRequestType(null);
  };

  if (showForm) {
    return (
      <RequestTypeForm
        requestType={editingRequestType}
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gestión de Tipos de Solicitud</CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Tipo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-4">Cargando tipos de solicitud...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequestTypes.map((requestType) => (
                <TableRow key={requestType.id}>
                  <TableCell className="font-medium">{requestType.name}</TableCell>
                  <TableCell>{requestType.description || "Sin descripción"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={requestType.is_active}
                        onCheckedChange={(checked) => 
                          handleStatusChange(requestType, checked)
                        }
                        disabled={updateRequestTypeMutation.isPending}
                      />
                      <Badge variant={requestType.is_active ? "default" : "secondary"}>
                        {requestType.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(requestType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequestTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No se encontraron tipos de solicitud
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
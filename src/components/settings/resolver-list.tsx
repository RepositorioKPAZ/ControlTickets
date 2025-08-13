import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Resolver } from "@/types/database";
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
import { ResolverForm } from "./resolver-form";
import { Search, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ResolverList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingResolver, setEditingResolver] = useState<Resolver | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resolvers = [], isLoading } = useQuery({
    queryKey: ["resolvers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resolvers")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Resolver[];
    },
  });

  const updateResolverMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("resolvers")
        .update({ is_active })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolvers"] });
      toast({
        title: "Éxito",
        description: "Estado del resolutor actualizado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del resolutor",
        variant: "destructive",
      });
    },
  });

  const filteredResolvers = resolvers.filter(
    (resolver) =>
      resolver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (resolver: Resolver) => {
    setEditingResolver(resolver);
    setShowForm(true);
  };

  const handleStatusChange = (resolver: Resolver, is_active: boolean) => {
    updateResolverMutation.mutate({ id: resolver.id, is_active });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingResolver(null);
  };

  if (showForm) {
    return (
      <ResolverForm
        resolver={editingResolver}
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gestión de Resolutores</CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Resolutor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-4">Cargando resolutores...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResolvers.map((resolver) => (
                <TableRow key={resolver.id}>
                  <TableCell className="font-medium">{resolver.name}</TableCell>
                  <TableCell>{resolver.email}</TableCell>
                  <TableCell>{resolver.phone || "No especificado"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={resolver.is_active}
                        onCheckedChange={(checked) => 
                          handleStatusChange(resolver, checked)
                        }
                        disabled={updateResolverMutation.isPending}
                      />
                      <Badge variant={resolver.is_active ? "default" : "secondary"}>
                        {resolver.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(resolver)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredResolvers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No se encontraron resolutores
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
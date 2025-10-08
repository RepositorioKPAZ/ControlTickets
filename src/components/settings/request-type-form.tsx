import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from "@/integrations/mysql/mock-client";
import { RequestTypeConfig } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const requestTypeSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type RequestTypeFormData = z.infer<typeof requestTypeSchema>;

interface RequestTypeFormProps {
  requestType?: RequestTypeConfig | null;
  onClose: () => void;
}

export function RequestTypeForm({ requestType, onClose }: RequestTypeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RequestTypeFormData>({
    resolver: zodResolver(requestTypeSchema),
    defaultValues: {
      name: requestType?.name || "",
      description: requestType?.description || "",
      is_active: requestType?.is_active ?? true,
    },
  });

  const createRequestTypeMutation = useMutation({
    mutationFn: async (data: RequestTypeFormData) => {
      const requestTypeData = {
        name: data.name,
        description: data.description || null,
        is_active: data.is_active,
      };

      if (requestType) {
        const { error } = await supabase
          .from("request_types")
          .update(requestTypeData)
          .eq("id", requestType.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("request_types")
          .insert([requestTypeData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request-types"] });
      toast({
        title: "Éxito",
        description: requestType
          ? "Tipo de solicitud actualizado correctamente"
          : "Tipo de solicitud creado correctamente",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: requestType
          ? "No se pudo actualizar el tipo de solicitud"
          : "No se pudo crear el tipo de solicitud",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RequestTypeFormData) => {
    createRequestTypeMutation.mutate(data);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>
            {requestType ? "Editar Tipo de Solicitud" : "Crear Nuevo Tipo de Solicitud"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Tipo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: support, bug, feature" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe el tipo de solicitud..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Estado del Tipo
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {field.value ? "Activo" : "Inactivo"}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} type="button">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createRequestTypeMutation.isPending}
              >
                {createRequestTypeMutation.isPending
                  ? "Guardando..."
                  : requestType
                  ? "Actualizar"
                  : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
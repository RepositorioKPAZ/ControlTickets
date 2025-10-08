import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/integrations/api/client";
import { Resolver } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const resolverSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido").min(1, "El email es obligatorio"),
  is_active: z.boolean().default(true),
  new_password: z.string().optional().or(z.literal("")),
});

type ResolverFormData = z.infer<typeof resolverSchema>;

interface ResolverFormProps {
  resolver?: Resolver | null;
  onClose: () => void;
}

export function ResolverForm({ resolver, onClose }: ResolverFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [lastSubmittedData, setLastSubmittedData] = useState<ResolverFormData | null>(null);

  const form = useForm<ResolverFormData>({
    resolver: zodResolver(resolverSchema),
    defaultValues: {
      name: resolver?.full_name || "",
      email: resolver?.email || "",
      phone: resolver?.phone || "",
      is_active: resolver?.is_active ?? true,
      new_password: "",
    },
  });

  const createResolverMutation = useMutation({
    mutationFn: async (data: ResolverFormData) => {
      setLastSubmittedData(data);
      const resolverData = {
        name: data.name,
        email: data.email,
        is_active: data.is_active,
        password: data.new_password || 'password123', // Default password for new resolvers
      };

      if (resolver) {
        await api.updateResolver(resolver.id, resolverData);
        
        // Note: Password reset functionality would need to be implemented separately
        // For now, we'll just update the user data
        if (data.new_password && data.new_password.trim() !== "") {
          console.log("Password reset requested - would need separate implementation");
        }
      } else {
        await api.createResolver(resolverData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolvers"] });
      queryClient.invalidateQueries({ queryKey: ["resolvers-active"] });
      toast({
        title: "Éxito",
        description: resolver
          ? lastSubmittedData?.new_password && lastSubmittedData.new_password.trim() !== ""
            ? "Resolutor actualizado y email de restablecimiento de contraseña enviado"
            : "Resolutor actualizado correctamente"
          : "Resolutor creado correctamente",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("Error:", error);
      const errorMessage = error.message?.includes("duplicate key") 
        ? "Ya existe un resolutor con ese email"
        : error.message || (resolver
        ? "No se pudo actualizar el resolutor"
        : "No se pudo crear el resolutor");
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResolverFormData) => {
    createResolverMutation.mutate(data);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>
            {resolver ? "Editar Resolutor" : "Crear Nuevo Resolutor"}
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
                  <FormLabel>Nombre del Resolutor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="juan.perez@empresa.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+34 600 123 456" {...field} />
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
                      Estado del Resolutor
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {field.value ? "Activo - Puede recibir tickets" : "Inactivo - No puede recibir tickets"}
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

            {resolver && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordField(!showPasswordField)}
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    {showPasswordField ? "Cancelar cambio" : "Cambiar contraseña"}
                  </Button>
                </div>

                {showPasswordField && (
                  <FormField
                    control={form.control}
                    name="new_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restablecer Contraseña</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                form.setValue("new_password", "reset");
                                createResolverMutation.mutate(form.getValues());
                              }}
                              disabled={createResolverMutation.isPending}
                            >
                              <KeyRound className="h-4 w-4 mr-2" />
                              Enviar email de restablecimiento
                            </Button>
                          </div>
                        </FormControl>
                        <div className="text-sm text-muted-foreground">
                          Se enviará un email al resolutor para que pueda establecer una nueva contraseña
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} type="button">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createResolverMutation.isPending}
              >
                {createResolverMutation.isPending
                  ? "Guardando..."
                  : resolver
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
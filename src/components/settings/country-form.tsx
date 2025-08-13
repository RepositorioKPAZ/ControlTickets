import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Country } from "@/types/database";
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
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const countrySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  code: z.string().optional(),
  is_active: z.boolean().default(true),
});

type CountryFormData = z.infer<typeof countrySchema>;

interface CountryFormProps {
  country?: Country | null;
  onClose: () => void;
}

export function CountryForm({ country, onClose }: CountryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CountryFormData>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      name: country?.name || "",
      code: country?.code || "",
      is_active: country?.is_active ?? true,
    },
  });

  const createCountryMutation = useMutation({
    mutationFn: async (data: CountryFormData) => {
      const countryData = {
        name: data.name,
        code: data.code || null,
        is_active: data.is_active,
      };

      if (country) {
        const { error } = await supabase
          .from("countries")
          .update(countryData)
          .eq("id", country.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("countries")
          .insert([countryData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      toast({
        title: "Éxito",
        description: country
          ? "País actualizado correctamente"
          : "País creado correctamente",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: country
          ? "No se pudo actualizar el país"
          : "No se pudo crear el país",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CountryFormData) => {
    createCountryMutation.mutate(data);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>
            {country ? "Editar País" : "Crear Nuevo País"}
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
                  <FormLabel>Nombre del País</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: España, México" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código del País (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: ES, MX, AR" {...field} />
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
                      Estado del País
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
                disabled={createCountryMutation.isPending}
              >
                {createCountryMutation.isPending
                  ? "Guardando..."
                  : country
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
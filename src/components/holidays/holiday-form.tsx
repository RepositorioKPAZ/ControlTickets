import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Holiday, Country } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const holidaySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  date: z.date({ required_error: "La fecha es obligatoria" }),
  country_id: z.string().min(1, "El país es obligatorio"),
  is_active: z.boolean().default(true),
});

type HolidayFormData = z.infer<typeof holidaySchema>;

interface HolidayFormProps {
  holiday?: Holiday | null;
  onClose: () => void;
}

export function HolidayForm({ holiday, onClose }: HolidayFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch active countries
  const { data: countries = [] } = useQuery({
    queryKey: ["countries-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Country[];
    },
  });

  const form = useForm<HolidayFormData>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      name: holiday?.name || "",
      date: holiday?.date ? new Date(holiday.date) : undefined,
      country_id: holiday?.country_id || "",
      is_active: holiday?.is_active ?? true,
    },
  });

  const createHolidayMutation = useMutation({
    mutationFn: async (data: HolidayFormData) => {
      const holidayData = {
        name: data.name,
        date: format(data.date, "yyyy-MM-dd"),
        year: data.date.getFullYear(),
        country_id: data.country_id,
        is_active: data.is_active,
      };

      if (holiday) {
        const { error } = await supabase
          .from("holidays")
          .update(holidayData)
          .eq("id", holiday.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("holidays")
          .insert([holidayData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast({
        title: "Éxito",
        description: holiday
          ? "Feriado actualizado correctamente"
          : "Feriado creado correctamente",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: holiday
          ? "No se pudo actualizar el feriado"
          : "No se pudo crear el feriado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HolidayFormData) => {
    createHolidayMutation.mutate(data);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>
            {holiday ? "Editar Feriado" : "Crear Nuevo Feriado"}
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
                  <FormLabel>Nombre del Feriado</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Día de la Independencia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      Estado del Feriado
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
                disabled={createHolidayMutation.isPending}
              >
                {createHolidayMutation.isPending
                  ? "Guardando..."
                  : holiday
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
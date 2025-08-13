import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

interface ClientFormProps {
  client?: Client | null;
  onSave: () => void;
  onCancel: () => void;
}

export const ClientForm = ({ client, onSave, onCancel }: ClientFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    country: '',
    is_active: true,
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        contact_name: client.contact_name || '',
        contact_phone: client.contact_phone || '',
        contact_email: client.contact_email || '',
        country: client.country || '',
        is_active: client.is_active,
        address: client.address || '',
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (client) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', client.id);

        if (error) throw error;

        toast({
          title: "Cliente actualizado",
          description: "Los datos del cliente se han actualizado exitosamente",
        });
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Cliente creado",
          description: "El nuevo cliente se ha registrado exitosamente",
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">
          {client ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Cliente *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_name">Nombre del Contacto *</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Email del Contacto</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Teléfono del Contacto</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Cliente activo</Label>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Guardando...' : (client ? 'Actualizar' : 'Crear')} Cliente
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
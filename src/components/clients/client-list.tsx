import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit2, Power, PowerOff } from 'lucide-react';
import { ClientForm } from './client-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const ClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleClientStatus = async (client: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: !client.is_active })
        .eq('id', client.id);

      if (error) throw error;

      setClients(clients.map(c => 
        c.id === client.id 
          ? { ...c, is_active: !c.is_active }
          : c
      ));

      toast({
        title: "Cliente actualizado",
        description: `Cliente ${!client.is_active ? 'activado' : 'desactivado'} exitosamente`,
      });
    } catch (error) {
      console.error('Error updating client status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del cliente",
        variant: "destructive",
      });
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.contact_email && client.contact_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleClientSaved = () => {
    fetchClients();
    setShowForm(false);
    setSelectedClient(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <ClientForm
        client={selectedClient}
        onSave={handleClientSaved}
        onCancel={() => {
          setShowForm(false);
          setSelectedClient(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-primary to-primary/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.contact_name}</TableCell>
                  <TableCell>{client.contact_email || '-'}</TableCell>
                  <TableCell>{client.contact_phone || '-'}</TableCell>
                  <TableCell>{client.country || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={client.is_active ? "default" : "secondary"}>
                      {client.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClient(client);
                          setShowForm(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={client.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleClientStatus(client)}
                      >
                        {client.is_active ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Client, Resolver, RequestType, PriorityLevel } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface TicketFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export function TicketForm({ onSuccess, initialData }: TicketFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Resolver[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    requesting_user: initialData?.requesting_user || '',
    client_id: initialData?.client_id || '',
    priority: initialData?.priority || 'medium',
    request_type: initialData?.request_type || 'support',
    assigned_to: initialData?.assigned_to || 'unassigned',
  });

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        console.log('Current user profile:', profile);
        setCurrentUser(profile);
      }

      // Load only active clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Load active resolvers
      const { data: resolversData, error: resolversError } = await supabase
        .from('resolvers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (resolversError) throw resolversError;
      console.log('Available resolvers:', resolversData);
      setAgents(resolversData || []);
    } catch (error: any) {
      console.error('Error loading form data:', error);
      toast({
        title: "Error",
        description: "Error al cargar datos: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.user_id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información del usuario",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Validate assigned_to value
      let assignedTo = null;
      if (formData.assigned_to && formData.assigned_to !== '' && formData.assigned_to !== 'unassigned') {
        // Check if the assigned_to value exists in resolvers table
        const resolverExists = agents.find(agent => agent.id === formData.assigned_to);
        if (resolverExists) {
          assignedTo = formData.assigned_to;
        } else {
          console.warn('Invalid assigned_to value:', formData.assigned_to);
          assignedTo = null;
        }
      }

      const ticketData = {
        title: formData.title,
        description: formData.description,
        requesting_user: formData.requesting_user,
        client_id: formData.client_id,
        priority: formData.priority,
        request_type: formData.request_type,
        assigned_to: assignedTo,
        created_by: currentUser.user_id,
        assigned_at: assignedTo ? new Date().toISOString() : null,
      };

      console.log('Current user data:', {
        id: currentUser.id,
        user_id: currentUser.user_id,
        full_name: currentUser.full_name
      });

      console.log('Inserting ticket data:', ticketData);

      const { error } = await supabase
        .from('tickets')
        .insert(ticketData as any);

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Ticket creado correctamente",
      });
      onSuccess();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: "Error al crear el ticket: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="requesting_user">Usuario Solicitante</Label>
          <Input
            id="requesting_user"
            value={formData.requesting_user}
            onChange={(e) => setFormData({ ...formData, requesting_user: e.target.value })}
            placeholder="Nombre del usuario que solicita"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_id">Cliente</Label>
          <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridad</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as PriorityLevel })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="request_type">Tipo de Solicitud</Label>
          <Select value={formData.request_type} onValueChange={(value) => setFormData({ ...formData, request_type: value as RequestType })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="support">Soporte</SelectItem>
              <SelectItem value="bug">Error</SelectItem>
              <SelectItem value="feature">Nueva Funcionalidad</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="assigned_to">Asignar a</Label>
          <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar agente (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          placeholder="Describe el problema o solicitud..."
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading} variant="corporate">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear Ticket'
          )}
        </Button>
      </div>
    </form>
  );
}

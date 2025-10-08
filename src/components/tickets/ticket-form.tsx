
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api } from '@/integrations/api/client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Client, Resolver, RequestType, PriorityLevel } from '@/types/database';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export function TicketForm({ onSuccess, initialData }: TicketFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Resolver[]>([]);
  const [openClientPopover, setOpenClientPopover] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    client_id: initialData?.client_id || '',
    usu_solicitante: initialData?.usu_solicitante || '',
    priority: initialData?.priority || 'medium',
    request_type: initialData?.request_type || 'support',
    assigned_to: initialData?.assigned_to || 'unassigned',
  });

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      // Load clients
      const clientsData = await api.getClients();
      setClients(clientsData || []);
      
      if (!clientsData || clientsData.length === 0) {
        console.warn('No clients found in database');
        toast({
          title: "Advertencia",
          description: "No hay clientes disponibles. Necesitas crear al menos un cliente para crear tickets.",
          variant: "destructive",
        });
      }

      // Load resolvers (users with agent role)
      const resolversData = await api.getResolvers();
      console.log('Resolvers loaded:', resolversData);
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

  // Función para obtener el nombre del cliente seleccionado
  const getSelectedClientName = () => {
    const selectedClient = clients.find(client => client.id === formData.client_id);
    return selectedClient ? selectedClient.name : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) {
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
        // Check if the assigned_to value exists in resolvers
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
        client_id: formData.client_id,
        usu_solicitante: formData.usu_solicitante,
        priority: formData.priority,
        request_type: formData.request_type,
        assigned_to: assignedTo,
        created_by: user.id,
        // No enviar assigned_at desde el frontend, que se maneje en el backend
        // assigned_at: assignedTo ? new Date().toISOString() : null,
      };

      console.log('Current user data:', {
        id: user.id,
        full_name: user.full_name,
        email: user.email
      });

      console.log('Inserting ticket data:', ticketData);

      await api.createTicket(ticketData);

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
          <Label htmlFor="client_id">Cliente</Label>
          <Popover open={openClientPopover} onOpenChange={setOpenClientPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openClientPopover}
                className="w-full justify-between"
              >
                {formData.client_id
                  ? getSelectedClientName()
                  : "Buscar cliente..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Escribe para buscar cliente..." />
                <CommandList>
                  <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                  <CommandGroup>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.name}
                        onSelect={() => {
                          setFormData({ ...formData, client_id: client.id });
                          setOpenClientPopover(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.client_id === client.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{client.name}</span>
                          {client.contact_name && (
                            <span className="text-xs text-muted-foreground">
                              Contacto: {client.contact_name}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="usu_solicitante">Usuario Solicitante</Label>
          <Input
            id="usu_solicitante"
            value={formData.usu_solicitante}
            onChange={(e) => setFormData({ ...formData, usu_solicitante: e.target.value })}
            placeholder="Nombre del usuario que solicita el ticket"
          />
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
                  {agent.full_name}
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

'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, MapPin, Clock, GripVertical } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { routeSchema, type RouteFormData } from '@/lib/validations/route';
import { Agency } from '@/lib/types/database';
import { getAgenciesForRoute } from '@/actions/route';

interface RouteFormProps {
  routeId?: string;
  initialData?: Partial<RouteFormData>;
  onSubmit: (data: RouteFormData) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
}

export function RouteForm({ routeId, initialData, onSubmit, onSuccess }: RouteFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [availableStops, setAvailableStops] = useState<Agency[]>([]);

  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: initialData || {
      code: '',
      name: '',
      origin_agency_id: '',
      destination_agency_id: '',
      distance_km: undefined,
      estimated_duration_minutes: undefined,
      transport_type: 'ROAD',
      frequency: 'DAILY',
      departure_time: '',
      arrival_time: '',
      is_active: true,
      route_stops: [],
    },
  });

  // Gestion des arrêts de route
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'route_stops',
  });

  // Charger les agences
  useEffect(() => {
    const loadAgencies = async () => {
      try {
        const result = await getAgenciesForRoute();
        if (result.success && result.data) {
          setAgencies(result.data);
        } else {
          toast.error('Erreur lors du chargement des agences');
        }
      } catch (error) {
        console.error('Error loading agencies:', error);
      }
    };
    loadAgencies();
  }, []);

  // Mettre à jour les agences disponibles pour les arrêts
  useEffect(() => {
    const originId = form.watch('origin_agency_id');
    const destinationId = form.watch('destination_agency_id');
    
    if (originId && destinationId) {
      // Filtrer pour exclure l'origine et la destination
      const stops = agencies.filter(agency => 
        agency.id !== originId && agency.id !== destinationId
      );
      setAvailableStops(stops);
    }
  }, [form.watch('origin_agency_id'), form.watch('destination_agency_id'), agencies]);

  const handleFormSubmit = async (data: RouteFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    const result = await onSubmit(data);
    
    if (result.success) {
      toast.success(routeId ? 'Route mise à jour' : 'Route créée');
      onSuccess?.();
      if (!routeId) {
        router.push('/dashboard/routes');
      }
    } else {
      setError(result.error || 'Une erreur est survenue');
      toast.error(result.error || 'Erreur lors de l\'enregistrement');
    }
    
    setIsSubmitting(false);
  };

  const addStop = () => {
    if (availableStops.length === 0) {
      toast.error('Aucune agence disponible pour les arrêts');
      return;
    }

    const nextOrder = fields.length + 1;
    append({
      agency_id: availableStops[0].id,
      stop_order: nextOrder,
      estimated_arrival_minutes: undefined,
      estimated_departure_minutes: undefined,
      is_mandatory: true,
      notes: '',
    });
  };

  const getAgencyName = (agencyId: string) => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency ? `${agency.name} (${agency.code})` : 'Agence inconnue';
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours}h${minutes}`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations de base</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code de la route *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: ROUTE-KIN-LUB" 
                        {...field}
                        className="uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la route *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Kinshasa - Lubumbashi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="origin_agency_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agence d'origine *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez l'agence d'origine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.name} ({agency.code}) - {agency.cities?.name}
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
                name="destination_agency_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agence de destination *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez l'agence de destination" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.name} ({agency.code}) - {agency.cities?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Distance et durée */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Distance et durée</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="distance_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distance (km)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 250.5" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée estimée (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 180" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Type de transport et fréquence */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transport et fréquence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="transport_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de transport</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ROAD">🚚 Route</SelectItem>
                        <SelectItem value="RAIL">🚆 Rail</SelectItem>
                        <SelectItem value="AIR">✈️ Air</SelectItem>
                        <SelectItem value="MARITIME">🚢 Maritime</SelectItem>
                        <SelectItem value="OTHER">📦 Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fréquence</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la fréquence" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAILY">📅 Quotidien</SelectItem>
                        <SelectItem value="WEEKLY">📋 Hebdomadaire</SelectItem>
                        <SelectItem value="BIWEEKLY">🔄 Bi-hebdomadaire</SelectItem>
                        <SelectItem value="MONTHLY">🗓️ Mensuel</SelectItem>
                        <SelectItem value="ON_DEMAND">⏰ Sur demande</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Horaires */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Horaires (optionnel)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="departure_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de départ</FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        placeholder="HH:MM"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <p className="text-sm text-muted-foreground">
                        Départ à {formatTime(field.value)}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arrival_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure d'arrivée</FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        placeholder="HH:MM"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <p className="text-sm text-muted-foreground">
                        Arrivée à {formatTime(field.value)}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Arrêts de route */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Arrêts intermédiaires</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStop}
                disabled={availableStops.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un arrêt
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Aucun arrêt intermédiaire</p>
                <p className="text-sm text-muted-foreground">
                  Ajoutez des arrêts si la route passe par d'autres agences
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Badge variant="outline">
                          Arrêt #{index + 1}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`route_stops.${index}.agency_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agence *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez une agence" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableStops.map((agency) => (
                                  <SelectItem key={agency.id} value={agency.id}>
                                    {agency.name} ({agency.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`route_stops.${index}.stop_order`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Ordre</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (index > 0) {
                              move(index, index - 1);
                              // Mettre à jour l'ordre
                              form.setValue(`route_stops.${index}.stop_order`, index);
                              form.setValue(`route_stops.${index - 1}.stop_order`, index + 1);
                            }
                          }}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (index < fields.length - 1) {
                              move(index, index + 1);
                              // Mettre à jour l'ordre
                              form.setValue(`route_stops.${index}.stop_order`, index + 2);
                              form.setValue(`route_stops.${index + 1}.stop_order`, index + 1);
                            }
                          }}
                          disabled={index === fields.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`route_stops.${index}.estimated_arrival_minutes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Arrivée estimée (min)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="Minutes depuis le départ"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`route_stops.${index}.estimated_departure_minutes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Départ estimé (min)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="Minutes depuis le départ"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`route_stops.${index}.is_mandatory`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Arrêt obligatoire</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                L'arrêt doit-il être effectué à chaque passage ?
                              </p>
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

                      <FormField
                        control={form.control}
                        name={`route_stops.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Instructions spéciales..."
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Statut */}
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Route active</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Les routes inactives ne sont pas disponibles pour les envois
                  </p>
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
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                {routeId ? 'Mise à jour...' : 'Création...'}
              </>
            ) : routeId ? (
              'Mettre à jour la route'
            ) : (
              'Créer la route'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
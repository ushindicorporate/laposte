'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, MapPin, Building, User } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { customerSchema, type CustomerFormData, type CustomerAddressFormData } from '@/lib/validations/customer';
import { City } from '@/lib/types/database';
import { getCitiesForSelect } from '@/actions/agencies';

interface CustomerFormProps {
  customerId?: string;
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
}

export function CustomerForm({ customerId, initialData, onSubmit, onSuccess }: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [activeTab, setActiveTab] = useState('info');

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      customer_type: 'PARTICULIER',
      full_name: '',
      company_name: '',
      email: '',
      phone: '',
      address: '',
      tax_id: '',
      id_type: undefined,
      id_number: '',
      is_active: true,
      notes: '',
      addresses: [],
    },
  });

  // Gestion des adresses multiples
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'addresses',
  });

  // Charger les villes
  useEffect(() => {
    const loadCities = async () => {
      try {
        const result = await getCitiesForSelect();
        if (result.success && result.data) {
          setCities(result.data);
        }
      } catch (error) {
        console.error('Error loading cities:', error);
      }
    };
    loadCities();
  }, []);

  const handleFormSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    const result = await onSubmit(data);
    
    if (result.success) {
      toast.success(customerId ? 'Client mis à jour' : 'Client créé');
      onSuccess?.();
      if (!customerId) {
        router.push('/dashboard/crm');
      }
    } else {
      setError(result.error || 'Une erreur est survenue');
      toast.error(result.error || 'Erreur lors de l\'enregistrement');
    }
    
    setIsSubmitting(false);
  };

  const addAddress = () => {
    const addressType = fields.length === 0 ? 'PRINCIPALE' : 'LIVRAISON';
    append({
      address_type: addressType,
      address_line1: '',
      address_line2: '',
      city_id: '',
      postal_code: '',
      country: 'RDC',
      is_default: fields.length === 0,
      latitude: undefined,
      longitude: undefined,
      notes: '',
    });
  };

  const customerType = form.watch('customer_type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresses ({fields.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {/* Type de client */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Type de client</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={customerType === 'PARTICULIER' ? 'default' : 'outline'}
                  className="h-auto py-4"
                  onClick={() => form.setValue('customer_type', 'PARTICULIER')}
                >
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-6 w-6" />
                    <div>Particulier</div>
                    <div className="text-xs text-muted-foreground">Client individuel</div>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant={customerType === 'ENTREPRISE' ? 'default' : 'outline'}
                  className="h-auto py-4"
                  onClick={() => form.setValue('customer_type', 'ENTREPRISE')}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Building className="h-6 w-6" />
                    <div>Entreprise</div>
                    <div className="text-xs text-muted-foreground">Société/Organisation</div>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {customerType === 'ENTREPRISE' ? 'Informations entreprise' : 'Informations personnelles'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {customerType === 'ENTREPRISE' ? 'Nom du contact *' : 'Nom complet *'}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Jean Kabasele" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {customerType === 'ENTREPRISE' && (
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'entreprise *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: SARL Mbote Trading" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input placeholder="+243 81 234 5678" {...field} />
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
                        <Input type="email" placeholder="client@example.cd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Identification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Identification</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customerType === 'ENTREPRISE' && (
                  <FormField
                    control={form.control}
                    name="tax_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro d'identification fiscale (NIF)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: A-12345-B-67890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="id_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de pièce d'identité</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PASSPORT">Passeport</SelectItem>
                          <SelectItem value="NATIONAL_ID">Carte nationale</SelectItem>
                          <SelectItem value="DRIVER_LICENSE">Permis de conduire</SelectItem>
                          <SelectItem value="OTHER">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="id_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de pièce</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: AB1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Adresse simple (pour compatibilité) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Adresse principale</h3>
              <p className="text-sm text-muted-foreground">
                Pour les adresses multiples, utilisez l'onglet "Adresses"
              </p>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse complète</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Avenue de l'Indépendance, N°123, Quartier, Commune" 
                        rows={3}
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Notes et statut */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes supplémentaires</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informations supplémentaires, préférences, etc." 
                        rows={3}
                        {...field} 
                        value={field.value || ''}
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
                      <FormLabel className="text-base">Client actif</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Les clients inactifs ne sont pas disponibles pour les nouveaux envois
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
          </TabsContent>

          <TabsContent value="addresses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Adresses du client</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAddress}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une adresse
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Aucune adresse</h3>
                <p className="text-muted-foreground mt-2">
                  Ajoutez des adresses pour ce client (livraison, facturation, etc.)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={addAddress}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une première adresse
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {form.watch(`addresses.${index}.address_type`)}
                        </Badge>
                        {form.watch(`addresses.${index}.is_default`) && (
                          <Badge variant="default">Défaut</Badge>
                        )}
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
                        name={`addresses.${index}.address_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type d'adresse</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="PRINCIPALE">Principale</SelectItem>
                                <SelectItem value="LIVRAISON">Livraison</SelectItem>
                                <SelectItem value="FACTURATION">Facturation</SelectItem>
                                <SelectItem value="AUTRE">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`addresses.${index}.is_default`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Adresse par défaut</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Utilisée par défaut pour les envois
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  // Désactiver les autres adresses par défaut
                                  fields.forEach((_, i) => {
                                    if (i !== index) {
                                      form.setValue(`addresses.${i}.is_default`, false);
                                    }
                                  });
                                  field.onChange(checked);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.address_line1`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse ligne 1 *</FormLabel>
                            <FormControl>
                              <Input placeholder="Numéro, rue, avenue" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`addresses.${index}.address_line2`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse ligne 2</FormLabel>
                            <FormControl>
                              <Input placeholder="Complément d'adresse" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.city_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez une ville" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {cities.map((city) => (
                                  <SelectItem key={city.id} value={city.id}>
                                    {city.name} - {city.regions?.name}
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
                        name={`addresses.${index}.postal_code`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code postal</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`addresses.${index}.latitude`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.000001"
                                placeholder="Ex: -4.441931"
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
                        name={`addresses.${index}.longitude`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.000001"
                                placeholder="Ex: 15.266293"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`addresses.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes pour cette adresse</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Instructions spéciales, horaires de livraison, etc."
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

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
                {customerId ? 'Mise à jour...' : 'Création...'}
              </>
            ) : customerId ? (
              'Mettre à jour le client'
            ) : (
              'Créer le client'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
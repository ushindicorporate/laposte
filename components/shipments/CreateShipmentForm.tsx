// components/shipments/CreateShipmentForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, Package, Truck, User, MapPin, DollarSign, 
  Shield, AlertTriangle, Plus, Trash2, Calculator,
  Phone, Mail, Home, FileText
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ShipmentService } from '@/lib/services/shipments';

// Schéma de validation
const shipmentFormSchema = z.object({
  // Client
  customer_id: z.string().optional(),
  
  // Service
  service_id: z.string().min(1, 'Le service est obligatoire'),
  
  // Expéditeur
  sender_name: z.string().min(2, 'Le nom est obligatoire'),
  sender_phone: z.string().min(9, 'Le téléphone est obligatoire'),
  sender_address: z.string().optional(),
  
  // Destinataire
  recipient_name: z.string().min(2, 'Le nom est obligatoire'),
  recipient_phone: z.string().min(9, 'Le téléphone est obligatoire'),
  recipient_address: z.string().optional(),
  
  // Logistique
  origin_agency_id: z.string().min(1, "L'agence d'origine est obligatoire"),
  destination_agency_id: z.string().min(1, "L'agence de destination est obligatoire"),
  reference: z.string().optional(),
  
  // Caractéristiques
  type: z.enum(['PARCEL', 'DOCUMENT', 'EXPRESS', 'ECONOMY', 'INTERNATIONAL']),
  weight_kg: z.coerce.number().min(0.1, 'Le poids doit être supérieur à 0.1kg').optional(),
  dimensions: z.string().optional(),
  package_count: z.coerce.number().min(1).default(1),
  declared_value: z.coerce.number().min(0).default(0),
  
  // Instructions
  requires_signature: z.boolean().default(false),
  is_fragile: z.boolean().default(false),
  is_perishable: z.boolean().default(false),
  is_dangerous: z.boolean().default(false),
  special_instructions: z.string().optional(),
});

type ShipmentFormData = z.infer<typeof shipmentFormSchema>;

interface CreateShipmentFormProps {
  currentAgencyId?: string;
  customerId?: string;
}

export function CreateShipmentForm({ currentAgencyId, customerId }: CreateShipmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();
  
  // Données chargées
  const [services, setServices] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [priceEstimate, setPriceEstimate] = useState<{
    basePrice: number;
    weightPrice: number;
    insurancePrice: number;
    totalPrice: number;
    insuranceAmount: number;
  } | null>(null);
  
  // Form
  const form = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      type: 'PARCEL',
      package_count: 1,
      declared_value: 0,
      requires_signature: false,
      is_fragile: false,
      is_perishable: false,
      is_dangerous: false,
      weight_kg: 1,
    },
  });
  
  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
    
    if (customerId) {
      loadCustomer(customerId);
    }
    
    if (currentAgencyId) {
      form.setValue('origin_agency_id', currentAgencyId);
    }
  }, []);
  
  const loadInitialData = async () => {
    try {
      // Charger les services
      const { data: servicesData } = await supabase
        .from('shipment_services')
        .select('*')
        .eq('is_active', true)
        .order('base_price');
      
      if (servicesData) {
        setServices(servicesData);
        if (servicesData.length > 0) {
          form.setValue('service_id', servicesData[0].id);
        }
      }
      
      // Charger les agences
      const { data: agenciesData } = await supabase
        .from('agencies')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (agenciesData) {
        setAgencies(agenciesData);
      }
      
      // Charger les clients récents
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (customersData) {
        setCustomers(customersData);
      }
      
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };
  
  const loadCustomer = async (customerId: string) => {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (customer) {
        form.setValue('customer_id', customer.id);
        form.setValue('sender_name', customer.name);
        form.setValue('sender_phone', customer.phone);
        if (customer.address) {
          form.setValue('sender_address', customer.address);
        }
      }
    } catch (error) {
      console.error('Erreur chargement client:', error);
    }
  };
  
  // Calculer le prix
  const calculatePrice = async () => {
    const values = form.getValues();
    
    if (!values.service_id || !values.weight_kg || !values.origin_agency_id || !values.destination_agency_id) {
      setError('Veuillez remplir les informations nécessaires pour calculer le prix');
      return;
    }
    
    setCalculating(true);
    setError(null);
    
    try {
      const estimate = await ShipmentService.calculatePrice(
        values.service_id,
        values.weight_kg,
        values.declared_value,
        values.origin_agency_id,
        values.destination_agency_id
      );
      
      setPriceEstimate(estimate);
    } catch (error: any) {
      setError(error.message || 'Erreur lors du calcul du prix');
    } finally {
      setCalculating(false);
    }
  };
  
  // Soumettre le formulaire
  const onSubmit = async (data: ShipmentFormData) => {
    if (!priceEstimate) {
      setError('Veuillez calculer le prix avant de soumettre');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Récupérer l'utilisateur courant
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Créer l'envoi
      const shipment = await ShipmentService.createShipment(data, userId);
      
      setSuccess(`Envoi créé avec succès ! Numéro de suivi: ${shipment.tracking_number}`);
      
      // Rediriger après 3 secondes
      setTimeout(() => {
        router.push(`/dashboard/shipments/${shipment.id}`);
      }, 3000);
      
    } catch (error: any) {
      console.error('Erreur création envoi:', error);
      setError(error.message || 'Erreur lors de la création de l\'envoi');
    } finally {
      setLoading(false);
    }
  };
  
  // Récupérer les champs du formulaire
  const watchedValues = form.watch();
  
  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Messages d'erreur/succès */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertTriangle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="sender" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="sender" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Expéditeur
            </TabsTrigger>
            <TabsTrigger value="recipient" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Destinataire
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="price" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Prix
            </TabsTrigger>
          </TabsList>
          
          {/* Onglet Expéditeur */}
          <TabsContent value="sender">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations de l'expéditeur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sélection du client */}
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Client existant (optionnel)</Label>
                  <Select
                    value={form.watch('customer_id') || ''}
                    onValueChange={(value) => loadCustomer(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nouveau client</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {customer.name}
                            <span className="text-muted-foreground text-xs">
                              ({customer.phone})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                {/* Informations manuelles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sender_name">Nom complet *</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="sender_name"
                        {...form.register('sender_name')}
                        placeholder="John Doe"
                      />
                    </div>
                    {form.formState.errors.sender_name && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.sender_name.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sender_phone">Téléphone *</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="sender_phone"
                        {...form.register('sender_phone')}
                        placeholder="+243 81 234 5678"
                      />
                    </div>
                    {form.formState.errors.sender_phone && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.sender_phone.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sender_address">Adresse</Label>
                  <div className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-muted-foreground mt-2" />
                    <Textarea
                      id="sender_address"
                      {...form.register('sender_address')}
                      placeholder="123 Avenue des Postes, Quartier..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Onglet Destinataire */}
          <TabsContent value="recipient">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations du destinataire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient_name">Nom complet *</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="recipient_name"
                        {...form.register('recipient_name')}
                        placeholder="Jane Smith"
                      />
                    </div>
                    {form.formState.errors.recipient_name && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.recipient_name.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipient_phone">Téléphone *</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="recipient_phone"
                        {...form.register('recipient_phone')}
                        placeholder="+243 99 876 5432"
                      />
                    </div>
                    {form.formState.errors.recipient_phone && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.recipient_phone.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipient_address">Adresse</Label>
                  <div className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-muted-foreground mt-2" />
                    <Textarea
                      id="recipient_address"
                      {...form.register('recipient_address')}
                      placeholder="456 Boulevard Central, Commune..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Onglet Détails */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne gauche - Logistique */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Logistique
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="origin_agency_id">Agence d'origine *</Label>
                      <Select
                        value={form.watch('origin_agency_id') || ''}
                        onValueChange={(value) => form.setValue('origin_agency_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une agence" />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies.map((agency) => (
                            <SelectItem key={agency.id} value={agency.id}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {agency.name}
                                <span className="text-muted-foreground text-xs">
                                  ({agency.code})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.origin_agency_id && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.origin_agency_id.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="destination_agency_id">Agence de destination *</Label>
                      <Select
                        value={form.watch('destination_agency_id') || ''}
                        onValueChange={(value) => form.setValue('destination_agency_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une agence" />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies.map((agency) => (
                            <SelectItem key={agency.id} value={agency.id}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {agency.name}
                                <span className="text-muted-foreground text-xs">
                                  ({agency.code})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.destination_agency_id && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.destination_agency_id.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service_id">Service *</Label>
                      <Select
                        value={form.watch('service_id') || ''}
                        onValueChange={(value) => form.setValue('service_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex flex-col">
                                <div className="font-medium">{service.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {service.description} • {service.base_price.toLocaleString()} CDF
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.service_id && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.service_id.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Type d'envoi *</Label>
                      <Select
                        value={form.watch('type')}
                        onValueChange={(value: any) => form.setValue('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PARCEL">Colis</SelectItem>
                          <SelectItem value="DOCUMENT">Document</SelectItem>
                          <SelectItem value="EXPRESS">Express</SelectItem>
                          <SelectItem value="ECONOMY">Économique</SelectItem>
                          <SelectItem value="INTERNATIONAL">International</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight_kg">Poids (kg)</Label>
                      <Input
                        id="weight_kg"
                        type="number"
                        step="0.1"
                        min="0.1"
                        {...form.register('weight_kg')}
                        placeholder="1.0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="package_count">Nombre de colis</Label>
                      <Input
                        id="package_count"
                        type="number"
                        min="1"
                        {...form.register('package_count')}
                        placeholder="1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dimensions">Dimensions (L×l×h)</Label>
                      <Input
                        id="dimensions"
                        {...form.register('dimensions')}
                        placeholder="30×20×15 cm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Colonne droite - Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requires_signature" className="cursor-pointer">
                        Signature requise
                      </Label>
                      <Switch
                        id="requires_signature"
                        checked={form.watch('requires_signature')}
                        onCheckedChange={(checked) => 
                          form.setValue('requires_signature', checked)
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_fragile" className="cursor-pointer">
                        Fragile
                      </Label>
                      <Switch
                        id="is_fragile"
                        checked={form.watch('is_fragile')}
                        onCheckedChange={(checked) => 
                          form.setValue('is_fragile', checked)
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_perishable" className="cursor-pointer">
                        Périssable
                      </Label>
                      <Switch
                        id="is_perishable"
                        checked={form.watch('is_perishable')}
                        onCheckedChange={(checked) => 
                          form.setValue('is_perishable', checked)
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_dangerous" className="cursor-pointer">
                        Dangereux
                      </Label>
                      <Switch
                        id="is_dangerous"
                        checked={form.watch('is_dangerous')}
                        onCheckedChange={(checked) => 
                          form.setValue('is_dangerous', checked)
                        }
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="declared_value">Valeur déclarée (CDF)</Label>
                    <Input
                      id="declared_value"
                      type="number"
                      min="0"
                      {...form.register('declared_value')}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reference">Référence</Label>
                    <Input
                      id="reference"
                      {...form.register('reference')}
                      placeholder="Réf. client, commande..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="special_instructions">Instructions spéciales</Label>
                    <Textarea
                      id="special_instructions"
                      {...form.register('special_instructions')}
                      placeholder="Instructions de livraison spéciales..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Onglet Prix */}
          <TabsContent value="price">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Calcul du prix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Estimation du prix</h3>
                    <p className="text-sm text-muted-foreground">
                      Calculez le prix en fonction des informations fournies
                    </p>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={calculatePrice}
                    disabled={calculating || !form.watch('service_id')}
                    className="gap-2"
                  >
                    {calculating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Calculator className="h-4 w-4" />
                    )}
                    Calculer le prix
                  </Button>
                </div>
                
                {priceEstimate ? (
                  <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Prix de base:</span>
                      <span className="font-semibold">
                        {priceEstimate.basePrice.toLocaleString()} CDF
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Prix selon le poids:</span>
                      <span className="font-semibold">
                        {priceEstimate.weightPrice.toLocaleString()} CDF
                      </span>
                    </div>
                    
                    {priceEstimate.insurancePrice > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Assurance ({priceEstimate.insuranceAmount.toLocaleString()} CDF):</span>
                        <span className="font-semibold text-green-600">
                          {priceEstimate.insurancePrice.toLocaleString()} CDF
                        </span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">
                        {priceEstimate.totalPrice.toLocaleString()} CDF
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span>
                        L'assurance couvre la valeur déclarée en cas de perte ou dommage
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Calculator className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Prix non calculé</h3>
                    <p className="text-muted-foreground mt-2">
                      Cliquez sur "Calculer le prix" pour obtenir une estimation
                    </p>
                  </div>
                )}
                
                {/* Bouton de soumission */}
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={loading || !priceEstimate}
                    className="gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4" />
                        Créer l'envoi
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
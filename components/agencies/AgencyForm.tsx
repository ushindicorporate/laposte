// /components/agencies/AgencyForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { agencySchema, AgencyFormData } from '@/lib/validations/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  cities: {
    id: string;
    name: string;
    postal_code: string | null;
  }[];
}

interface City {
  id: string;
  name: string;
  postal_code: string | null;
}

interface AgencyFormProps {
  initialData?: {
    id?: string;
    name: string;
    code: string;
    city_id: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    // manager_name?: string | null;
    opening_hours?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    is_active?: boolean;
  };
  regions: Region[];
  onSubmit: (data: AgencyFormData) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
}

export function AgencyForm({ initialData, regions, onSubmit, onSuccess }: AgencyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AgencyFormData>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      city_id: initialData?.city_id || '',
      address: initialData?.address || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      // manager_name: initialData?.manager_name || '',
      opening_hours: initialData?.opening_hours || '',
      latitude: initialData?.latitude || undefined,
      longitude: initialData?.longitude || undefined,
    },
  });
  
  // Initialiser la sélection de région basée sur la ville initiale
  useEffect(() => {
    if (initialData?.city_id && regions.length > 0) {
      // Trouver la région de la ville initiale
      const initialRegion = regions.find(region =>
        region.cities.some(city => city.id === initialData.city_id)
      );
      if (initialRegion) {
        setSelectedRegionId(initialRegion.id);
        setAvailableCities(initialRegion.cities);
      }
    }
  }, [initialData, regions]);
  
  // Mettre à jour les villes disponibles quand la région change
  useEffect(() => {
    if (selectedRegionId) {
      const selectedRegion = regions.find(r => r.id === selectedRegionId);
      if (selectedRegion) {
        setAvailableCities(selectedRegion.cities);
        // Réinitialiser la sélection de ville si elle n'appartient pas à la nouvelle région
        const currentCityId = watch('city_id');
        if (currentCityId && !selectedRegion.cities.some(c => c.id === currentCityId)) {
          setValue('city_id', '');
        }
      }
    } else {
      setAvailableCities([]);
      setValue('city_id', '');
    }
  }, [selectedRegionId, regions, setValue, watch]);
  
  const handleFormSubmit = async (data: AgencyFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    const result = await onSubmit(data);
    
    if (result.success) {
      if (!initialData) {
        reset(); // Réinitialiser le formulaire après création
        setSelectedRegionId('');
        setAvailableCities([]);
      }
      onSuccess?.();
    } else {
      setError(result.error || 'Une erreur est survenue');
    }
    
    setIsSubmitting(false);
  };
  
  const selectedCityId = watch('city_id');
  const selectedCity = availableCities.find(c => c.id === selectedCityId);
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-4">
          {/* Région (sélection) */}
          <div className="space-y-2">
            <Label htmlFor="region_id">
              Région *
            </Label>
            <Select
              value={selectedRegionId}
              onValueChange={setSelectedRegionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une région" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name} ({region.cities.length} villes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Sélectionnez d'abord la région
            </p>
          </div>
          
          {/* Ville (dépend de la région) */}
          <div className="space-y-2">
            <Label htmlFor="city_id">
              Ville *
            </Label>
            <Select
              value={selectedCityId}
              onValueChange={(value) => setValue('city_id', value)}
              disabled={!selectedRegionId}
            >
              <SelectTrigger className={errors.city_id ? 'border-destructive' : ''}>
                <SelectValue placeholder={selectedRegionId ? "Sélectionnez une ville" : "Sélectionnez d'abord une région"} />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name} {city.postal_code ? `(${city.postal_code})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.city_id && (
              <p className="text-sm text-destructive">{errors.city_id.message}</p>
            )}
            {selectedCity && (
              <p className="text-sm text-muted-foreground">
                Sélectionnée : {selectedCity.name}
              </p>
            )}
          </div>
          
          {/* Nom de l'agence */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom de l'agence *
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Agence Centrale de Kinshasa"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          
          {/* Code unique */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Code unique *
            </Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="Ex: KIN01"
              className={errors.code ? 'border-destructive' : ''}
              onChange={(e) => {
                setValue('code', e.target.value.toUpperCase());
              }}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Code unique en majuscules (ex: KIN01, LUB02)
            </p>
          </div>
          
          {/* Adresse */}
          <div className="space-y-2">
            <Label htmlFor="address">
              Adresse complète
            </Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Ex: 123 Avenue de la Poste, Quartier Commune"
              rows={3}
              className={errors.address ? 'border-destructive' : ''}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>
        </div>
        
        {/* Colonne droite */}
        <div className="space-y-4">
          {/* Coordonnées GPS */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-medium">Coordonnées GPS (optionnel)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  {...register('latitude', { valueAsNumber: true })}
                  placeholder="Ex: -4.441931"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  {...register('longitude', { valueAsNumber: true })}
                  placeholder="Ex: 15.266293"
                />
              </div>
            </div>
            {(errors.latitude || errors.longitude) && (
              <p className="text-sm text-destructive">
                {errors.latitude?.message || errors.longitude?.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Pour la géolocalisation sur les cartes
            </p>
          </div>
          
          {/* Contact */}
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="Ex: +243 81 234 5678"
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Ex: agence@poste.cd"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          
          {/* <div className="space-y-2">
            <Label htmlFor="manager_name">Nom du responsable</Label>
            <Input
              id="manager_name"
              {...register('manager_name')}
              placeholder="Ex: Jean Kabasele"
              className={errors.manager_name ? 'border-destructive' : ''}
            />
            {errors.manager_name && (
              <p className="text-sm text-destructive">{errors.manager_name.message}</p>
            )}
          </div> */}
          
          <div className="space-y-2">
            <Label htmlFor="opening_hours">Horaires d'ouverture</Label>
            <Input
              id="opening_hours"
              {...register('opening_hours')}
              placeholder="Ex: Lun-Ven: 8h-17h, Sam: 9h-13h"
              className={errors.opening_hours ? 'border-destructive' : ''}
            />
            {errors.opening_hours && (
              <p className="text-sm text-destructive">{errors.opening_hours.message}</p>
            )}
          </div>
        </div>
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : initialData ? (
          'Mettre à jour'
        ) : (
          'Créer l\'agence'
        )}
      </Button>
    </form>
  );
}
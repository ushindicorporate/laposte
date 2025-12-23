// /components/cities/CityForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { citySchema, CityFormData } from '@/lib/validations/city';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Region {
  id: string;
  name: string;
}

interface CityFormProps {
  initialData?: {
    id?: string;
    name: string;
    region_id: string;
    postal_code?: string | null;
    population?: number | null;
  };
  regions: Region[];
  onSubmit: (data: CityFormData) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
}

export function CityForm({ initialData, regions, onSubmit, onSuccess }: CityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: initialData?.name || '',
      region_id: initialData?.region_id || '',
      postal_code: initialData?.postal_code || '',
      population: initialData?.population || undefined,
    },
  });
  
  const handleFormSubmit = async (data: CityFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    const result = await onSubmit(data);
    
    if (result.success) {
      if (!initialData) {
        reset(); // Réinitialiser le formulaire après création
      }
      onSuccess?.();
    } else {
      setError(result.error || 'Une erreur est survenue');
    }
    
    setIsSubmitting(false);
  };
  
  const selectedRegionId = watch('region_id');
  const selectedRegion = regions.find(r => r.id === selectedRegionId);
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {/* Sélection Région */}
        <div className="space-y-2">
          <Label htmlFor="region_id">
            Région *
          </Label>
          <Select
            value={selectedRegionId}
            onValueChange={(value) => setValue('region_id', value)}
          >
            <SelectTrigger className={errors.region_id ? 'border-destructive' : ''}>
              <SelectValue placeholder="Sélectionnez une région" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.region_id && (
            <p className="text-sm text-destructive">{errors.region_id.message}</p>
          )}
          {selectedRegion && (
            <p className="text-sm text-muted-foreground">
              Sélectionnée : {selectedRegion.name}
            </p>
          )}
        </div>
        
        {/* Nom de la ville */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nom de la ville *
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Ex: Kinshasa"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        
        {/* Code postal */}
        <div className="space-y-2">
          <Label htmlFor="postal_code">
            Code postal
          </Label>
          <Input
            id="postal_code"
            {...register('postal_code')}
            placeholder="Ex: 001"
            className={errors.postal_code ? 'border-destructive' : ''}
          />
          {errors.postal_code && (
            <p className="text-sm text-destructive">{errors.postal_code.message}</p>
          )}
        </div>
        
        {/* Population */}
        <div className="space-y-2">
          <Label htmlFor="population">
            Population (optionnel)
          </Label>
          <Input
            id="population"
            type="number"
            {...register('population', { valueAsNumber: true })}
            placeholder="Ex: 12000000"
            className={errors.population ? 'border-destructive' : ''}
          />
          {errors.population && (
            <p className="text-sm text-destructive">{errors.population.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Pour les statistiques et rapports
          </p>
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
          'Créer la ville'
        )}
      </Button>
    </form>
  );
}
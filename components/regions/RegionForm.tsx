// /components/regions/RegionForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { regionSchema, RegionFormData } from '@/lib/validations/region';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface RegionFormProps {
  initialData?: {
    id?: string;
    name: string;
    code?: string | null;
  };
  onSubmit: (data: RegionFormData) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
}

export function RegionForm({ initialData, onSubmit, onSuccess }: RegionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegionFormData>({
    resolver: zodResolver(regionSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
    },
  });
  
  const handleFormSubmit = async (data: RegionFormData) => {
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
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Nom de la région *
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
        
        <div className="space-y-2">
          <Label htmlFor="code">
            Code (optionnel)
          </Label>
          <Input
            id="code"
            {...register('code')}
            placeholder="Ex: KIN"
            className={errors.code ? 'border-destructive' : ''}
          />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Code court pour identification rapide
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
          'Créer la région'
        )}
      </Button>
    </form>
  );
}
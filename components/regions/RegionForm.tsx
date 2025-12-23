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
  initialData?: RegionFormData;
  onSubmit: (data: RegionFormData) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
}

export function RegionForm({ initialData, onSubmit, onSuccess }: RegionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegionFormData>({
    resolver: zodResolver(regionSchema),
    defaultValues: initialData ?? { name: '', code: '' },
  });

  const handleFormSubmit = async (data: RegionFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit(data);

      if (result.success) {
        if (!initialData) form.reset();
        onSuccess();
      } else {
        setError(result.error ?? 'Une erreur est survenue');
      }
    } catch (err: any) {
      setError(err.message ?? 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la région</Label>
        <Input
          id="name"
          placeholder="Ex : Kinshasa"
          {...form.register('name')}
          aria-invalid={!!form.formState.errors.name}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Code */}
      <div className="space-y-2">
        <Label htmlFor="code">Code (optionnel)</Label>
        <Input id="code" placeholder="Ex : KIN" {...form.register('code')} />
        <p className="text-xs text-muted-foreground">
          Code court utilisé pour les références internes
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement…
          </>
        ) : initialData ? (
          'Mettre à jour la région'
        ) : (
          'Créer la région'
        )}
      </Button>
    </form>
  );
}

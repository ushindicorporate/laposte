'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegionForm } from './RegionForm';
import { updateRegion } from '@/actions/region';
import { RegionFormData } from '@/lib/validations/region';

interface EditRegionFormProps {
  region: {
    id: string;
    name: string;
    code?: string | null;
  };
}

export function EditRegionForm({ region }: EditRegionFormProps) {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (data: RegionFormData) => {
    return updateRegion(region.id, data)
      .then(() => ({ success: true }))
      .catch((err: any) => ({ success: false, error: err.message }));
  };

  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      router.push('/dashboard/regions');
      router.refresh();
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
        Région mise à jour avec succès ! Redirection...
      </div>
    );
  }

  return (
    <RegionForm
      initialData={{ name: region.name, code: region.code ?? '' }}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
    />
  );
}

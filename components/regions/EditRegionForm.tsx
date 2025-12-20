// /components/regions/EditRegionForm.tsx
'use client';

import { useState } from 'react';
import { RegionForm } from './RegionForm';
import { useRouter } from 'next/navigation';
import { updateRegion } from '@/actions/region';

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
  
  const handleSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.code) formData.append('code', data.code);
    
    return await updateRegion(region.id, formData);
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
      initialData={region}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
    />
  );
}
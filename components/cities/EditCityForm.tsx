// /components/cities/EditCityForm.tsx
'use client';

import { useState } from 'react';
import { CityForm } from './CityForm';
import { updateCity } from '@/actions/cities';
import { useRouter } from 'next/navigation';

interface Region {
  id: string;
  name: string;
}

interface EditCityFormProps {
  city: {
    id: string;
    name: string;
    region_id: string;
    postal_code?: string | null;
    population?: number | null;
  };
  regions: Region[];
}

export function EditCityForm({ city, regions }: EditCityFormProps) {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handleSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('region_id', data.region_id);
    if (data.postal_code) formData.append('postal_code', data.postal_code);
    if (data.population) formData.append('population', data.population.toString());
    
    return await updateCity(city.id, formData);
  };
  
  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      router.push('/dashboard/cities');
      router.refresh();
    }, 1500);
  };
  
  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
        Ville mise à jour avec succès ! Redirection...
      </div>
    );
  }
  
  return (
    <CityForm
      initialData={city}
      regions={regions}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
    />
  );
}
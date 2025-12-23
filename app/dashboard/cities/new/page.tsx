// /app/dashboard/cities/new/page.tsx
'use client';

import { useState } from 'react';
import { CityForm } from '@/components/cities/CityForm';
import { createCity, getRegionsForSelect } from '@/actions/cities';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewCityPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Charger les régions au montage
  useState(() => {
    const loadRegions = async () => {
      const regionsData = await getRegionsForSelect();
      setRegions(regionsData);
      setLoading(false);
    };
    loadRegions();
  });

  const handleSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('region_id', data.region_id);
    if (data.postal_code) formData.append('postal_code', data.postal_code);
    if (data.population) formData.append('population', data.population.toString());
    
    return await createCity(formData);
  };
  
  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      router.push('/dashboard/cities');
      router.refresh();
    }, 1500);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Chargement des régions...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cities">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouvelle ville</h1>
            <p className="text-muted-foreground">
              Ajouter une nouvelle ville au système
            </p>
          </div>
        </div>
        
        {isSuccess ? (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
            Ville créée avec succès ! Redirection...
          </div>
        ) : (
          <div className="bg-card rounded-lg border p-6">
            <CityForm 
              regions={regions}
              onSubmit={handleSubmit}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}
// /app/dashboard/regions/new/page.tsx
'use client';

import { useState } from 'react';
import { RegionForm } from '@/components/regions/RegionForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createRegion } from '@/actions/region';

export default function NewRegionPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handleSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.code) formData.append('code', data.code);
    
    return await createRegion(formData);
  };
  
  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      router.push('/dashboard/regions');
      router.refresh();
    }, 1500);
  };
  
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/regions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouvelle région</h1>
            <p className="text-muted-foreground">
              Ajouter une nouvelle région au système
            </p>
          </div>
        </div>
        
        {isSuccess ? (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
            Région créée avec succès ! Redirection...
          </div>
        ) : (
          <div className="bg-card rounded-lg border p-6">
            <RegionForm 
              onSubmit={handleSubmit}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}
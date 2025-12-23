import { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getGeographicHierarchy } from '@/actions/agencies';
import { AgencyForm } from '@/components/agencies/AgencyForm';
import { createAgency } from '@/actions/agencies';

export const metadata: Metadata = {
  title: 'Nouvelle Agence',
  description: 'Créer une nouvelle agence postale',
};

export default async function NewAgencyPage() {
  const hierarchyResponse = await getGeographicHierarchy();
  const regions = hierarchyResponse.success ? hierarchyResponse.data : [];

  const handleSubmit = async (data: any) => {
    'use server';
    return await createAgency(data);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/agencies">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux agences
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Créer une nouvelle agence</h1>
          <p className="text-muted-foreground">
            Remplissez les informations pour créer une nouvelle agence postale
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <AgencyForm 
            regions={regions}
            onSubmit={handleSubmit}
            onSuccess={() => {
              // Redirection gérée dans le composant AgencyForm
            }}
          />
        </div>
      </div>
    </div>
  );
}
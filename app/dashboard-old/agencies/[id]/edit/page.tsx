import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAgencyById, getGeographicHierarchy, updateAgency } from '@/actions/agencies';
import { AgencyForm } from '@/components/agencies/AgencyForm';

interface EditAgencyPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditAgencyPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Modifier l'agence ${id}`,
  };
}

export default async function EditAgencyPage({ params }: EditAgencyPageProps) {
  const { id } = await params;
  
  const [agencyResponse, hierarchyResponse] = await Promise.all([
    getAgencyById(id),
    getGeographicHierarchy(),
  ]);

  if (!agencyResponse.success || !agencyResponse.data) {
    notFound();
  }

  const agency = agencyResponse.data;
  const regions = hierarchyResponse.success ? hierarchyResponse.data : [];

  // Préparer les données initiales pour le formulaire
  const initialData = {
    name: agency.name,
    code: agency.code,
    city_id: agency.city_id,
    address: agency.address || '',
    phone: agency.phone || '',
    email: agency.email || '',
    manager_name: agency.manager_name || '',
    opening_hours: agency.opening_hours || '',
    latitude: agency.latitude || undefined,
    longitude: agency.longitude || undefined,
  };

  const handleSubmit = async (data: any) => {
    'use server';
    return await updateAgency(id, data);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href={`/dashboard/agencies/${id}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux détails
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier l'agence</h1>
          <p className="text-muted-foreground">
            Modifiez les informations de l'agence {agency.name}
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <AgencyForm 
            initialData={initialData}
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
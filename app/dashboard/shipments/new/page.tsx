// app/dashboard/shipments/new/page.tsx
import { Metadata } from 'next';
import { CreateShipmentForm } from '@/components/shipments/CreateShipmentForm';

export const metadata: Metadata = {
  title: 'Nouvel envoi - Système Postal',
  description: 'Créez un nouvel envoi postal',
};

interface NewShipmentPageProps {
  searchParams: Promise<{
    customerId?: string;
  }>;
}

export default async function NewShipmentPage({ searchParams }: NewShipmentPageProps) {
  const params = await searchParams;
  const currentAgency = await getCurrentUserAgency();
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Nouvel envoi</h1>
        <p className="text-muted-foreground">
          Créez un nouvel envoi postal pour un client
        </p>
      </div>
      
      <CreateShipmentForm 
        currentAgencyId={currentAgency?.id}
        customerId={params.customerId}
      />
    </div>
  );
}
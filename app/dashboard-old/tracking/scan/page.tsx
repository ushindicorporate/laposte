// app/dashboard/tracking/scan/page.tsx
import { Metadata } from 'next';
import { ScanEventForm } from '@/components/tracking/ScanEventForm';
import { getCurrentUserAgency } from '@/actions/agencies';

export const metadata: Metadata = {
  title: 'Scanner événement - Système Postal',
  description: 'Scanner un événement de tracking',
};

export default async function ScanTrackingPage() {
  const currentAgency = await getCurrentUserAgency();
  
  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Scanner un événement</h1>
        <p className="text-muted-foreground">
          Scannez un colis et mettez à jour son statut
        </p>
      </div>
      
      <ScanEventForm 
        currentAgencyId={currentAgency?.id}
      />
      
      {/* Instructions */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions :</h3>
        <ul className="space-y-2 text-sm">
          <li>1. Entrez le numéro de suivi du colis</li>
          <li>2. Sélectionnez le nouveau statut</li>
          <li>3. Ajoutez une description si nécessaire</li>
          <li>4. Cliquez sur "Scanner l'événement"</li>
        </ul>
      </div>
    </div>
  );
}
// app/dashboard/shipments/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShipmentDetail } from '@/components/shipments/ShipmentDetail';
import { createClient } from '@/lib/supabase/server';

interface ShipmentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ShipmentDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: shipment } = await supabase
    .from('shipments')
    .select('tracking_number')
    .eq('id', id)
    .single();
  
  return {
    title: `${shipment?.tracking_number || 'Envoi'} - Système Postal`,
    description: `Détails de l'envoi ${shipment?.tracking_number}`,
  };
}

export default async function ShipmentDetailPage({ params }: ShipmentDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Récupérer l'envoi avec toutes ses relations
  const { data: shipment, error } = await supabase
    .from('shipments')
    .select(`
      *,
      service:shipment_services(*),
      origin_agency:agencies(*),
      destination_agency:agencies(*),
      current_agency:agencies(*),
      customer:customers(*),
      items:shipment_items(*),
      status_history:shipment_status_history(
        *,
        location_agency:agencies(*),
        scanned_by:users(
          id,
          email,
          profiles:profiles(full_name)
        )
      ),
      tracking_events:tracking_events(
        *,
        location_agency:agencies(*),
        scanned_by:users(
          id,
          email,
          profiles:profiles(full_name)
        )
      ),
      transactions:transactions(*),
      delivery_attempts:delivery_attempts(
        *,
        attempted_by:users(
          id,
          email,
          profiles:profiles(full_name)
        )
      )
    `)
    .eq('id', id)
    .single();
  
  if (error || !shipment) {
    notFound();
  }
  
  // Vérifier les permissions
  const canUpdate = await canUpdateShipment(shipment);
  
  return (
    <div className="container mx-auto py-6">
      <ShipmentDetail 
        shipment={shipment}
        canUpdateStatus={canUpdate}
      />
    </div>
  );
}
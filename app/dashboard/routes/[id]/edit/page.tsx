import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RouteForm } from '@/components/routes/RouteForm';
import { getRouteById, updateRoute } from '@/actions/route';

interface EditRoutePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditRoutePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Modifier la route ${id}`,
  };
}

export default async function EditRoutePage({ params }: EditRoutePageProps) {
  const { id } = await params;
  const response = await getRouteById(id);

  if (!response.success || !response.data) {
    notFound();
  }

  const route = response.data;

  // Préparer les données initiales pour le formulaire
  const initialData = {
    code: route.code,
    name: route.name,
    origin_agency_id: route.origin_agency_id,
    destination_agency_id: route.destination_agency_id,
    distance_km: route.distance_km || undefined,
    estimated_duration_minutes: route.estimated_duration_minutes || undefined,
    transport_type: route.transport_type,
    frequency: route.frequency,
    departure_time: route.departure_time || '',
    arrival_time: route.arrival_time || '',
    is_active: route.is_active,
    route_stops: route.route_stops?.map(stop => ({
      agency_id: stop.agency_id,
      stop_order: stop.stop_order,
      estimated_arrival_minutes: stop.estimated_arrival_minutes || undefined,
      estimated_departure_minutes: stop.estimated_departure_minutes || undefined,
      is_mandatory: stop.is_mandatory,
      notes: stop.notes || '',
    })) || [],
  };

  const handleSubmit = async (data: any) => {
    'use server';
    return await updateRoute(id, data);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href={`/dashboard/routes/${id}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux détails
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier la route</h1>
          <p className="text-muted-foreground">
            Modifiez les informations de la route {route.name}
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <RouteForm 
            routeId={id}
            initialData={initialData}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
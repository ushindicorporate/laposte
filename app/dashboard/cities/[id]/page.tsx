// /app/dashboard/cities/[id]/page.tsx
import { getCityById, getRegionsForSelect } from '@/actions/cities';
import { EditCityForm } from '@/components/cities/EditCityForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface EditCityPageProps {
  params: {
    id: string;
  };
}

export default async function EditCityPage({ params }: EditCityPageProps) {
  const [city, regions] = await Promise.all([
    getCityById(params.id),
    getRegionsForSelect(),
  ]);
  
  if (!city) {
    notFound();
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
            <h1 className="text-3xl font-bold tracking-tight">Éditer la ville</h1>
            <p className="text-muted-foreground">
              Modifier les informations de &quot;{city.name}&quot;
            </p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <EditCityForm city={city} regions={regions} />
        </div>
      </div>
    </div>
  );
}
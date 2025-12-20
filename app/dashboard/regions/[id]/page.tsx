import { getRegionById } from '@/actions/region';
import { EditRegionForm } from '@/components/regions/EditRegionForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface EditRegionPageProps {
  params: {
    id: string;
  };
}

export default async function EditRegionPage({ params }: EditRegionPageProps) {
  const region = await getRegionById(params.id);
  
  if (!region) {
    notFound();
  }
  
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
            <h1 className="text-3xl font-bold tracking-tight">Éditer la région</h1>
            <p className="text-muted-foreground">
              Modifier les informations de &quot;{region.name}&quot;
            </p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <EditRegionForm region={region} />
        </div>
      </div>
    </div>
  );
}
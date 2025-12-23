import { getRegions } from '@/actions/region';
import { RegionsTable } from '@/components/regions/RegionsTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function RegionsPage() {
  const regions = await getRegions();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Régions</h1>
          <p className="text-muted-foreground max-w-xl">
            Les régions définissent la structure géographique du réseau postal national.
            Elles servent de base aux villes, agences et opérations logistiques.
          </p>
        </div>
        <Link href="/dashboard/regions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle région
          </Button>
        </Link>
      </div>
      
      <div className="bg-card rounded-lg border p-4">
        <RegionsTable regions={regions} />
      </div>
      
      <div className="text-sm text-muted-foreground">
        {regions.length} région(s) au total
      </div>
    </div>
  );
}
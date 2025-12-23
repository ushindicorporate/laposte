// /app/dashboard/cities/page.tsx
import { getCities, getRegionsForSelect } from '@/actions/cities';
import { CitiesTable } from '@/components/cities/CitiesTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function CitiesPage() {
  const [cities, regions] = await Promise.all([
    getCities(),
    getRegionsForSelect(),
  ]);
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Villes</h1>
          <p className="text-muted-foreground">
            Gérez les villes du système postal national
          </p>
        </div>
        <Link href="/dashboard/cities/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle ville
          </Button>
        </Link>
      </div>
      
      <div className="bg-card rounded-lg border p-4">
        <CitiesTable cities={cities} regions={regions} />
      </div>
      
      <div className="text-sm text-muted-foreground">
        {cities.length} ville(s) répartie(s) dans {regions.length} région(s)
      </div>
    </div>
  );
}
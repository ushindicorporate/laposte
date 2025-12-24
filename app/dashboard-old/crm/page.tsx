import { Suspense } from 'react';
import { Metadata } from 'next';
import { CustomersTable } from '@/components/crm/CustomersTable';
import { CustomerSearch } from '@/components/crm/CustomerSearch';
import { CustomerStats } from '@/components/crm/CustomerStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, TrendingUp, Package } from 'lucide-react';
import Link from 'next/link';
import { searchCustomers, getCustomerSearchStats } from '@/actions/customers';
import { CustomerSearchFilters } from '@/lib/types/customers';

interface CRMClientPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    page?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export const metadata: Metadata = {
  title: 'Gestion Clients - Système Postal',
  description: 'Gérez vos clients et prospects',
};

export default async function CRMClientPage({ searchParams }: CRMClientPageProps) {
  const params = await searchParams;
  
  // Convertir les params en filtres
  const filters: CustomerSearchFilters = {
    query: params.q || '',
    type: (params.type as any) || 'all',
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  };

  // Récupérer les données
  const [searchResult, stats] = await Promise.all([
    searchCustomers(filters),
    getCustomerSearchStats()
  ]);

  const handleSearch = async (searchFilters: CustomerSearchFilters) => {
    'use server';
    return searchCustomers(searchFilters);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion Clients</h1>
          <p className="text-muted-foreground">
            Gérez vos clients particuliers et entreprises
          </p>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/crm/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Link>
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_customers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.last_30_days_new} nouveaux sur 30 jours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Répartition</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_particuliers} part. / {stats.total_entreprises} ent.
            </div>
            <p className="text-xs text-muted-foreground">
              Moyenne: {stats.avg_shipments_per_customer} envois/client
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Localisation</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats.top_city || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.top_region ? `Région ${stats.top_region}` : 'Aucune région'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Suspense fallback={<div>Chargement des filtres...</div>}>
        <CustomerSearch 
          onSearch={handleSearch}
          initialFilters={filters}
          stats={{
            total: stats.total_customers,
            particuliers: stats.total_particuliers,
            entreprises: stats.total_entreprises
          }}
        />
      </Suspense>

      {/* Tableau des résultats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des clients</CardTitle>
            <div className="text-sm text-muted-foreground">
              {searchResult.total_count} client{searchResult.total_count !== 1 ? 's' : ''} trouvé{searchResult.total_count !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Chargement des clients...</div>}>
            <CustomersTable 
              customers={searchResult.customers}
              totalCount={searchResult.total_count}
              currentPage={searchResult.page}
              totalPages={searchResult.total_pages}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Section pour les statistiques détaillées */}
      <CustomerStats stats={[]} />
    </div>
  );
}
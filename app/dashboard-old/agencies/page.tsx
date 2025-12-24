// /app/dashboard/agencies/page.tsx
import { getAgencies, getGeographicHierarchy } from '@/actions/agencies';
import { AgenciesTable } from '@/components/agencies/AgenciesTable';
import { Button } from '@/components/ui/button';
import { Plus, Download, Map, AlertTriangle, CheckCircle, Info, MapPin, Building2, User, Globe } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Agency } from '@/lib/types/agency';

export default async function AgenciesPage() {
  // Récupérer les données avec la nouvelle structure de réponse
  const [agenciesResponse, hierarchyResponse] = await Promise.all([
    getAgencies(),
    getGeographicHierarchy(),
  ]);
  
  // Gérer les erreurs
  if (!agenciesResponse.success || !hierarchyResponse.success) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>
            {agenciesResponse.error || hierarchyResponse.error || 'Impossible de charger les données'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const agencies = agenciesResponse.data || [];
  const hierarchy = hierarchyResponse.data || [];
  
  // Transformer la hiérarchie en régions simples pour le filtre
  const regions = hierarchy.map((region: any) => ({
    id: region.id,
    name: region.name,
  }));
  
  // Calculer les statistiques globales
  const stats = {
    total: agencies.length,
    active: agencies.filter((a: Agency) => a.is_active).length,
    withGPS: agencies.filter((a: Agency) => a.latitude && a.longitude).length,
    withManager: agencies.filter((a: Agency) => a.manager_name).length,
    byRegion: regions.map((region: any) => ({
      ...region,
      count: agencies.filter((a: Agency) => a.cities?.regions?.id === region.id).length
    }))
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agences Postales</h1>
          <p className="text-muted-foreground">
            Gérez le réseau des agences postales nationales
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            disabled={stats.withGPS === 0}
            title={stats.withGPS === 0 ? "Ajoutez des coordonnées GPS pour activer la carte" : "Voir sur la carte"}
          >
            <Map className="h-4 w-4" />
            Carte ({stats.withGPS})
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Link href="/dashboard/agencies/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle agence
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total des agences</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 text-sm">
            <span className="text-green-600">{stats.active} actives</span>
            <span className="mx-2">•</span>
            <span className="text-amber-600">{stats.total - stats.active} inactives</span>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avec géolocalisation</p>
              <p className="text-2xl font-bold">{stats.withGPS}</p>
            </div>
            <MapPin className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2 text-sm">
            {stats.withGPS === 0 ? (
              <span className="text-amber-600">Aucune coordonnée GPS</span>
            ) : (
              <span className="text-green-600">{Math.round((stats.withGPS / stats.total) * 100)}% du réseau</span>
            )}
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avec responsable</p>
              <p className="text-2xl font-bold">{stats.withManager}</p>
            </div>
            <User className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2 text-sm">
            {stats.withManager === 0 ? (
              <span className="text-amber-600">Aucun responsable assigné</span>
            ) : (
              <span className="text-green-600">{Math.round((stats.withManager / stats.total) * 100)}% avec responsable</span>
            )}
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Régions couvertes</p>
              <p className="text-2xl font-bold">
                {stats.byRegion.filter((r: any) => r.count > 0).length}/{regions.length}
              </p>
            </div>
            <Globe className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-2 text-sm">
            <span className="text-blue-600">
              {stats.byRegion.filter((r: any) => r.count > 0).length} régions actives
            </span>
          </div>
        </div>
      </div>
      
      {/* Tableau principal */}
      <div className="bg-card rounded-lg border">
        {agencies.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold">Aucune agence créée</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              Commencez par créer votre première agence postale
            </p>
            <Link href="/dashboard/agencies/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Créer une agence
              </Button>
            </Link>
          </div>
        ) : (
          <AgenciesTable agencies={agencies} regions={regions} />
        )}
      </div>
      
      {/* Informations et conseils */}
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Bonnes pratiques</AlertTitle>
          <AlertDescription className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                💡 <strong>Code unique :</strong> Utilisez un code en majuscules (ex: KIN01, LUB02)
              </div>
              <div>
                📍 <strong>Géolocalisation :</strong> Ajoutez les coordonnées GPS pour activer les fonctionnalités cartes
              </div>
              <div>
                ⚠️ <strong>Suppression :</strong> Impossible si des utilisateurs ou envois sont associés
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        {/* Bandeau de vérification */}
        {stats.active < stats.total && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Agences inactives</AlertTitle>
            <AlertDescription>
              {stats.total - stats.active} agence(s) sont actuellement inactives. 
              Elles n'apparaîtront pas dans les listes de sélection.
            </AlertDescription>
          </Alert>
        )}
        
        {stats.withGPS < stats.total && (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertTitle>Géolocalisation manquante</AlertTitle>
            <AlertDescription>
              {stats.total - stats.withGPS} agence(s) n'ont pas de coordonnées GPS. 
              Ajoutez-les pour activer les fonctionnalités de carte.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

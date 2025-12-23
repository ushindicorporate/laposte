// app/dashboard/deliveries/page.tsx
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Package, Search, Filter, Truck, 
  CheckCircle, XCircle, Clock, MapPin 
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Livraisons - Système Postal',
  description: 'Gérez les livraisons et tentatives',
};

export default function DeliveriesPage() {
  return (
    <div className="container mx-auto py-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Livraisons</h1>
          <p className="text-muted-foreground">
            Gérez les tentatives de livraison et suivez les colis
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/tracking/scan">
              <Package className="h-4 w-4 mr-2" />
              Scanner un colis
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À livrer aujourd'hui</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +3 vs hier
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrés aujourd'hui</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              Taux de succès: 75%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échecs aujourd'hui</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              À retenter
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Pour demain
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro de suivi, destinataire..."
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtres
              </Button>
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des livraisons */}
      <Card>
        <CardHeader>
          <CardTitle>Colis à livrer aujourd'hui</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Exemple de carte de livraison */}
            {[1, 2, 3].map((item) => (
              <div key={item} className="p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      RDC240101ABC{item}23
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Jean Dupont • +243 81 234 5678
                    </div>
                    <div className="text-sm flex items-center gap-2 mt-1">
                      <MapPin className="h-3 w-3" />
                      123 Avenue des Postes, Kinshasa
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Détails
                    </Button>
                    <Button size="sm">
                      Marquer livré
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Instructions pour les livreurs :</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium">✅ En cas de livraison réussie :</div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Vérifier l'identité du destinataire</li>
                <li>Prendre une photo de preuve</li>
                <li>Obtenir une signature si nécessaire</li>
                <li>Enregistrer la géolocalisation</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">❌ En cas d'échec :</div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Noter le motif de l'échec</li>
                <li>Laisser un avis de passage</li>
                <li>Planifier une nouvelle tentative</li>
                <li>Si 3 échecs, marquer pour retour</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
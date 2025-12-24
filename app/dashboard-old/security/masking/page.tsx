// app/dashboard/security/masking/page.tsx
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  Eye, 
  Users, 
  FileText, 
  Settings,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Masquage des données - Sécurité',
  description: 'Gérez le masquage des données sensibles',
};

export default async function DataMaskingPage() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Masquage des données sensibles
          </h1>
          <p className="text-muted-foreground">
            Gérez la protection et l'accès aux informations confidentielles
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter logs
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Alertes */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Protection des données activée
            </p>
            <p className="text-xs text-amber-700">
              Les données sensibles sont masquées selon les permissions des rôles
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-amber-300">
            <RefreshCw className="h-3 w-3 mr-2" />
            Vérifier
          </Button>
        </CardContent>
      </Card>

      {/* Onglets principaux */}
      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs d'accès
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <MaskingConfiguration />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionManager />
        </TabsContent>

        <TabsContent value="logs">
          <AccessLogsTable />
        </TabsContent>
      </Tabs>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Champs protégés</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Données sensibles configurées
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accès journaliers</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">
              +12% vs hier
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rôles configurés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Niveaux d'accès définis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <h3>Guide d'utilisation du masquage</h3>
            <ul>
              <li>Les données sensibles sont automatiquement masquées selon les permissions</li>
              <li>Les administrateurs peuvent voir toutes les données sans restriction</li>
              <li>Les agents voient les données partiellement masquées</li>
              <li>Tous les accès sont loggués pour audit</li>
            </ul>
            
            <h3>Types de masquage</h3>
            <ul>
              <li><strong>PHONE</strong>: Garde les 4 derniers chiffres visibles</li>
              <li><strong>EMAIL</strong>: Garde le premier et dernier caractère du local part</li>
              <li><strong>ADDRESS</strong>: Masque les détails, garde la ville visible</li>
              <li><strong>TAX_ID</strong>: Garde les 4 derniers caractères visibles</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/security/policies">
                Voir les politiques
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/security/audit">
                Audit complet
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
// app/dashboard/finance/page.tsx
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, TrendingUp, CreditCard, 
  FileText, Calculator, BarChart3,
  Download, Filter, Search
} from 'lucide-react';
import Link from 'next/link';
import { PriceCalculator } from '@/components/finance/PriceCalculator';
import TransactionList from '@/components/finance/TransactionList';

export const metadata: Metadata = {
  title: 'Finance - Système Postal',
  description: 'Gestion financière et tarification',
};

export default function FinancePage() {
  return (
    <div className="container mx-auto py-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground">
            Gestion financière, tarification et paiements
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Statistiques financières */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu du jour</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,250,000 CDF</div>
            <p className="text-xs text-muted-foreground">
              +12% vs hier
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              450,000 CDF à recevoir
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne par envoi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,625 CDF</div>
            <p className="text-xs text-muted-foreground">
              +5% vs mois dernier
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de paiement</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              8% en attente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deux colonnes principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche - Calculateur de prix */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculateur de prix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PriceCalculator />
            </CardContent>
          </Card>

          {/* Statistiques par agence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenus par agence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Kinshasa Centre', revenue: 450000, growth: '+12%' },
                  { name: 'Lubumbashi Sud', revenue: 320000, growth: '+8%' },
                  { name: 'Kisangani Nord', revenue: 280000, growth: '+15%' },
                  { name: 'Mbuji-Mayi Est', revenue: 200000, growth: '+5%' },
                ].map((agency, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{agency.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {agency.growth} vs mois dernier
                      </div>
                    </div>
                    <div className="font-bold">
                      {new Intl.NumberFormat('fr-CD', {
                        style: 'currency',
                        currency: 'CDF',
                        minimumFractionDigits: 0
                      }).format(agency.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite - Transactions récentes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Transactions récentes
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionList />
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="justify-start h-auto py-3">
                  <Link href="/dashboard/finance/payments">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Paiements</div>
                      <div className="text-xs text-muted-foreground">
                        Gérer les paiements
                      </div>
                    </div>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start h-auto py-3">
                  <Link href="/dashboard/finance/invoices">
                    <FileText className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Factures</div>
                      <div className="text-xs text-muted-foreground">
                        Voir les factures
                      </div>
                    </div>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start h-auto py-3">
                  <Link href="/dashboard/finance/tariffs">
                    <Calculator className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Tarifs</div>
                      <div className="text-xs text-muted-foreground">
                        Configurer les tarifs
                      </div>
                    </div>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start h-auto py-3">
                  <Link href="/dashboard/finance/reports">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Rapports</div>
                      <div className="text-xs text-muted-foreground">
                        Voir les rapports
                      </div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
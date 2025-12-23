// app/tracking/page.tsx
import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Package, Truck, Clock, Shield, 
  MapPin, CheckCircle, Users 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Suivi de Colis - Système Postal',
  description: 'Suivez vos colis en temps réel',
};

export default function TrackingHomePage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Truck className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold">Suivi de Colis</h1>
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Suivez votre colis en temps réel avec notre système de tracking
          </p>
        </div>
        
        {/* Formulaire de recherche */}
        <Card className="mb-12">
          <CardContent className="pt-8">
            <div className="text-center mb-8">
              <Package className="mx-auto h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Suivre un colis</h2>
              <p className="text-muted-foreground">
                Entrez votre numéro de suivi pour connaître le statut de votre colis
              </p>
            </div>
            
            <form action="/tracking" method="GET" className="max-w-md mx-auto">
              <div className="flex gap-2">
                <Input
                  name="trackingNumber"
                  placeholder="Ex: RDC240101ABC123"
                  required
                  className="text-center"
                />
                <Button type="submit" size="lg" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Suivre
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Le numéro de suivi se trouve sur votre reçu
              </p>
            </form>
          </CardContent>
        </Card>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <MapPin className="mx-auto h-10 w-10 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Suivi en Temps Réel</h3>
              <p className="text-muted-foreground text-sm">
                Suivez chaque étape du trajet de votre colis
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Notifications</h3>
              <p className="text-muted-foreground text-sm">
                Soyez informé des mises à jour importantes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="mx-auto h-10 w-10 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Support 24/7</h3>
              <p className="text-muted-foreground text-sm">
                Notre équipe est disponible pour vous aider
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Information */}
        <div className="text-center">
          <h3 className="font-bold text-lg mb-4">Comment utiliser le suivi ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <div className="font-medium mb-1">1. Trouvez votre numéro</div>
              <p>Le numéro de suivi se trouve sur votre reçu d'envoi</p>
            </div>
            <div>
              <div className="font-medium mb-1">2. Entrez le numéro</div>
              <p>Saisissez-le dans le champ ci-dessus</p>
            </div>
            <div>
              <div className="font-medium mb-1">3. Suivez votre colis</div>
              <p>Consultez l'historique complet du trajet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
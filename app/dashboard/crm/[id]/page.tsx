import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  Calendar,
  Shield,
  BadgeCheck,
  BadgeX,
  Package,
  MessageSquare,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCustomerById } from '@/actions/customers';
import { CustomerAddresses } from '@/components/crm/CustomerAddresses';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CustomerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const response = await getCustomerById(id);
  
  return {
    title: response.success ? `Client ${response.data?.customer_code}` : 'Client non trouvé',
  };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const response = await getCustomerById(id);

  if (!response.success || !response.data) {
    notFound();
  }

  const customer = response.data;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.full_name}</h1>
            <p className="text-muted-foreground">
              Code: {customer.customer_code} • {customer.customer_type}
              {customer.company_name && ` • ${customer.company_name}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/crm/${customer.id}/edit`}>
            <Button>Modifier</Button>
          </Link>
          <Badge variant={customer.is_active ? "default" : "destructive"}>
            {customer.is_active ? (
              <>
                <BadgeCheck className="mr-1 h-3 w-3" /> Actif
              </>
            ) : (
              <>
                <BadgeX className="mr-1 h-3 w-3" /> Inactif
              </>
            )}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="addresses">Adresses ({customer.addresses?.length || 0})</TabsTrigger>
          <TabsTrigger value="shipments">Envois (0)</TabsTrigger> {/* À implémenter */}
          <TabsTrigger value="history">Historique</TabsTrigger> {/* À implémenter */}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informations principales */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {customer.customer_type === 'ENTREPRISE' ? (
                    <Building className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  Informations du client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{customer.phone}</div>
                          <div className="text-sm text-muted-foreground">Téléphone</div>
                        </div>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{customer.email}</div>
                            <div className="text-sm text-muted-foreground">Email</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Identification */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Identification</h3>
                    <div className="space-y-3">
                      {customer.tax_id && (
                        <div>
                          <div className="text-sm text-muted-foreground">NIF</div>
                          <div className="font-medium">{customer.tax_id}</div>
                        </div>
                      )}
                      {customer.id_number && (
                        <div>
                          <div className="text-sm text-muted-foreground">Pièce d'identité</div>
                          <div className="font-medium">
                            {customer.id_type} : {customer.id_number}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Adresse simple (pour compatibilité) */}
                {customer.address && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Adresse</h3>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">{customer.address}</div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {customer.notes && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                      <div className="text-sm bg-slate-50 dark:bg-slate-800 rounded p-3">
                        {customer.notes}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Métadonnées */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Créé le</div>
                    <div>{formatDate(customer.created_at)}</div>
                    {customer.created_by_user && (
                      <div className="text-xs text-muted-foreground">
                        par {customer.created_by_user.email}
                      </div>
                    )}
                  </div>
                  {customer.updated_at && (
                    <div>
                      <div className="text-muted-foreground">Modifié le</div>
                      <div>{formatDate(customer.updated_at)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground">Statut</div>
                    <div>
                      <Badge variant={customer.is_active ? "default" : "secondary"}>
                        {customer.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats et actions rapides */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Adresses</span>
                      <span className="font-medium">{customer.addresses?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Envois envoyés</span>
                      <span className="font-medium">0</span> {/* À implémenter */}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Envois reçus</span>
                      <span className="font-medium">0</span> {/* À implémenter */}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total dépensé</span>
                      <span className="font-medium">0 CDF</span> {/* À implémenter */}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link href={`/dashboard/crm/${customer.id}/edit`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier le client
                      </Button>
                    </Link>
                    <Link href={`/dashboard/shipments/new?customer=${customer.id}`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Package className="mr-2 h-4 w-4" />
                        Nouvel envoi
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Envoyer un message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="addresses">
          <CustomerAddresses 
            customerId={customer.id}
            addresses={customer.addresses || []}
          />
        </TabsContent>

        <TabsContent value="shipments">
          <CustomerShipments customerId={customer.id} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique du client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Historique vide</h3>
                <p className="text-muted-foreground mt-2">
                  L'historique des interactions sera disponible bientôt
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

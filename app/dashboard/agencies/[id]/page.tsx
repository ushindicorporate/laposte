import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, Mail, Clock, User, Building2, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getAgencyById } from '@/actions/agencies';

interface AgencyDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AgencyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const response = await getAgencyById(id);
  
  return {
    title: response.success ? `Agence ${response.data?.name}` : 'Agence non trouvée',
  };
}

export default async function AgencyDetailPage({ params }: AgencyDetailPageProps) {
  const { id } = await params;
  const response = await getAgencyById(id);

  if (!response.success || !response.data) {
    notFound();
  }

  const agency = response.data;

  return (
    <div className="container mx-auto p-6">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/agencies">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{agency.name}</h1>
            <p className="text-muted-foreground">
              Code: {agency.code} • {agency.cities?.name}, {agency.cities?.regions?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/agencies/${agency.id}/edit`}>
            <Button>Modifier</Button>
          </Link>
          <Badge variant={agency.is_active ? "default" : "destructive"}>
            {agency.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Localisation */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Localisation</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{agency.cities?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agency.cities?.regions?.name}
                        </div>
                      </div>
                    </div>
                    {agency.address && (
                      <div className="pl-6">
                        <div className="text-sm">{agency.address}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact */}
                {(agency.phone || agency.email) && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact</h3>
                    <div className="space-y-2">
                      {agency.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{agency.phone}</span>
                        </div>
                      )}
                      {agency.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{agency.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Horaires et Responsable */}
              <div className="space-y-4">
                {agency.opening_hours && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Horaires d'ouverture</h3>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{agency.opening_hours}</span>
                    </div>
                  </div>
                )}

                {agency.manager_name && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Responsable</h3>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{agency.manager_name}</span>
                    </div>
                  </div>
                )}

                {/* Coordonnées GPS */}
                {(agency.latitude && agency.longitude) && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Coordonnées GPS</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Latitude:</span>
                        <div className="font-mono">{agency.latitude}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Longitude:</span>
                        <div className="font-mono">{agency.longitude}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Métadonnées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Date de création</div>
                <div>
                  {new Date(agency.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              {agency.updated_at && (
                <div>
                  <div className="text-muted-foreground">Dernière modification</div>
                  <div>
                    {new Date(agency.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                </div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground">Utilisateurs associés</div>
                <div className="font-medium">
                  {/* {agency.profiles?.[0]?.count || 0} utilisateur(s) */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href={`/dashboard/agencies/${agency.id}/edit`}>
                <Button variant="outline">Modifier les informations</Button>
              </Link>
              <Button variant="outline" disabled={!agency.latitude || !agency.longitude}>
                Voir sur la carte
              </Button>
              <Link href={`/dashboard/users?agency=${agency.id}`}>
                <Button variant="outline">Voir les utilisateurs</Button>
              </Link>
              <Link href={`/dashboard/shipments?agency=${agency.id}`}>
                <Button variant="outline">Voir les envois</Button>
              </Link>
              <Link href={`/dashboard/agencies/${agency.id}/agents`}>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Gérer les agents ({agency._count?.profiles || 0})
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
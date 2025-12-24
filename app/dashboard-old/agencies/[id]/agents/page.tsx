import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, UserPlus, Users, Filter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getAgencyById } from '@/actions/agencies';
import { getAgentsByAgency, getAvailableAgents, assignAgentToAgency } from '@/actions/agents';
import { AvailableAgentsTable } from '@/components/agencies/AvailableAgentsTable';
import { AgentsTable } from '@/components/agencies/AgentsTable';

interface AgencyAgentsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AgencyAgentsPageProps): Promise<Metadata> {
  const { id } = await params;
  const response = await getAgencyById(id);
  
  return {
    title: response.success ? `Agents - ${response.data?.name}` : 'Agents',
  };
}

export default async function AgencyAgentsPage({ params }: AgencyAgentsPageProps) {
  const { id } = await params;
  
  const [agencyResponse, agentsResponse, availableAgentsResponse] = await Promise.all([
    getAgencyById(id),
    getAgentsByAgency(id),
    getAvailableAgents(),
  ]);

  if (!agencyResponse.success || !agencyResponse.data) {
    notFound();
  }

  const agency = agencyResponse.data;
  const agents = agentsResponse.success ? agentsResponse.data : [];
  const availableAgents = availableAgentsResponse.success ? availableAgentsResponse.data : [];

  return (
    <div className="container mx-auto p-6">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/agencies/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des agents</h1>
            <p className="text-muted-foreground">
              {agency.name} • {agents?.length || 0} agent(s) assigné(s)
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents assignés</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents?.length}</div>
              <p className="text-xs text-muted-foreground">
                Actuellement dans cette agence
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents actifs</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents?.filter(a => a.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {agents && agents.length > 0 
                  ? `${Math.round((agents.filter(a => a.is_active).length / agents.length) * 100)}% d'activité`
                  : 'Aucun agent'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents disponibles</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableAgents?.length}</div>
              <p className="text-xs text-muted-foreground">
                Sans affectation d'agence
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="assigned" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agents assignés ({agents?.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Agents disponibles ({availableAgents?.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agents de l'agence {agency.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {agents?.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Aucun agent assigné</h3>
                    <p className="text-muted-foreground mt-2">
                      Assignez des agents depuis l'onglet "Agents disponibles"
                    </p>
                  </div>
                ) : (
                  <AgentsTable 
                    agents={agents || []} 
                    agencyId={id}
                    onAgentRemoved={() => {
                      // Cette fonction sera implémentée côté client
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agents disponibles pour affectation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Agents sans agence assignée
                </p>
              </CardHeader>
              <CardContent>
                {availableAgents?.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Aucun agent disponible</h3>
                    <p className="text-muted-foreground mt-2">
                      Tous les agents ont déjà une affectation
                    </p>
                  </div>
                ) : (
                  <AvailableAgentsTable 
                    agents={availableAgents || []} 
                    agencyId={id}
                    onAgentAssigned={() => {
                      // Cette fonction sera implémentée côté client
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
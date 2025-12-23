'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Shield, Trash2, Eye } from 'lucide-react';
import { DataTable } from '../table/data-table';
import { AgentWithDetails } from '@/actions/agents';
import { removeAgentFromAgency } from '@/actions/agents';
import { toast } from 'sonner';

interface AgentsTableProps {
  agents: AgentWithDetails[];
  agencyId: string;
  onAgentRemoved?: () => void;
}

export function AgentsTable({ agents, agencyId, onAgentRemoved }: AgentsTableProps) {
  const [removingAgentId, setRemovingAgentId] = useState<string | null>(null);

  const handleRemoveAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${agentName} de cette agence ?`)) {
      return;
    }

    setRemovingAgentId(agentId);
    try {
      const result = await removeAgentFromAgency(agentId);
      
      if (result.success) {
        toast.success('Agent retiré avec succès');
        onAgentRemoved?.();
      } else {
        toast.error(result.error || 'Erreur lors du retrait');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setRemovingAgentId(null);
    }
  };

  const columns: ColumnDef<AgentWithDetails>[] = [
    {
      accessorKey: "full_name",
      header: "Agent",
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <div className="font-medium">{agent.full_name || 'Non renseigné'}</div>
              <div className="text-xs text-muted-foreground">{agent.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className="space-y-1">
            {agent.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3" />
                {agent.email}
              </div>
            )}
            {agent.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3" />
                {agent.phone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "roles",
      header: "Rôles",
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {agent.roles.map(role => (
              <Badge 
                key={role.id} 
                variant="outline"
                className="text-xs"
              >
                <Shield className="mr-1 h-3 w-3" />
                {role.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <Badge variant={agent.is_active ? "default" : "secondary"}>
            {agent.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(`/dashboard/users/${agent.id}`, '_blank')}
              title="Voir profil"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveAgent(agent.id, agent.full_name || 'cet agent')}
              disabled={removingAgentId === agent.id}
              className="text-destructive hover:text-destructive"
              title="Retirer de l'agence"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={agents}
      searchKey="full_name"
      placeholder="Rechercher un agent..."
    />
  );
}
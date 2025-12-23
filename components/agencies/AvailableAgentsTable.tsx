'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Shield, UserPlus } from 'lucide-react';
import { DataTable } from '../table/data-table';
import { AgentWithDetails } from '@/actions/agents';
import { assignAgentToAgency } from '@/actions/agents';
import { toast } from 'sonner';

interface AvailableAgentsTableProps {
  agents: AgentWithDetails[];
  agencyId: string;
  onAgentAssigned?: () => void;
}

export function AvailableAgentsTable({ agents, agencyId, onAgentAssigned }: AvailableAgentsTableProps) {
  const [assigningAgentId, setAssigningAgentId] = useState<string | null>(null);

  const handleAssignAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Assigner ${agentName} à cette agence ?`)) {
      return;
    }

    setAssigningAgentId(agentId);
    try {
      const result = await assignAgentToAgency(agentId, agencyId);
      
      if (result.success) {
        toast.success('Agent assigné avec succès');
        onAgentAssigned?.();
      } else {
        toast.error(result.error || 'Erreur lors de l\'assignation');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setAssigningAgentId(null);
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAssignAgent(agent.id, agent.full_name || 'cet agent')}
            disabled={assigningAgentId === agent.id}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {assigningAgentId === agent.id ? 'Assignation...' : 'Assigner'}
          </Button>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={agents}
      searchKey="full_name"
      placeholder="Rechercher un agent disponible..."
    />
  );
}
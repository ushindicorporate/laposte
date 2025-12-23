'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  UserX
} from 'lucide-react';
import Link from 'next/link';
import { DataTable } from '../table/data-table';
import { toggleCustomerStatus, deleteCustomer } from '@/actions/customers';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CustomerWithRelations } from '@/lib/types/customers';

interface CustomersTableProps {
  customers: CustomerWithRelations[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleStatus = async (id: string, isActive: boolean, customerName: string) => {
    setTogglingId(id);
    try {
      const result = await toggleCustomerStatus(id, !isActive);
      
      if (result.success) {
        toast.success(
          isActive 
            ? `Client ${customerName} désactivé` 
            : `Client ${customerName} activé`
        );
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur lors du changement de statut');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le client "${customerName}" ?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteCustomer(id);
      
      if (result.success) {
        toast.success('Client supprimé avec succès');
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<CustomerWithRelations>[] = [
    {
      accessorKey: "customer_code",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-mono font-bold">{row.getValue("customer_code")}</div>
      ),
    },
    {
      accessorKey: "full_name",
      header: "Client",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              customer.customer_type === 'ENTREPRISE' 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-purple-100 text-purple-600'
            }`}>
              {customer.customer_type === 'ENTREPRISE' ? (
                <Building className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div>
              <div className="font-medium">{customer.full_name}</div>
              {customer.company_name && (
                <div className="text-xs text-muted-foreground">
                  {customer.company_name}
                </div>
              )}
              <div className="text-xs">
                <Badge variant="outline" className="mt-1">
                  {customer.customer_type}
                </Badge>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-37.5">{customer.email}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "address_info",
      header: "Localisation",
      cell: ({ row }) => {
        const customer = row.original;
        const defaultAddress = customer.addresses?.find(addr => addr.is_default);
        const addressCount = customer.addresses?.length || 0;
        
        return (
          <div className="space-y-1">
            {defaultAddress ? (
              <>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-37.5">
                    {defaultAddress.address_line1}
                  </span>
                </div>
                {defaultAddress.city && (
                  <div className="text-xs text-muted-foreground">
                    {defaultAddress.city.name}
                  </div>
                )}
              </>
            ) : customer.address ? (
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-37.5">{customer.address}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Pas d'adresse</span>
            )}
            {addressCount > 1 && (
              <div className="text-xs text-blue-600">
                +{addressCount - 1} autre(s) adresse(s)
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "identification",
      header: "Identification",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="space-y-1 text-sm">
            {customer.tax_id && (
              <div>
                <div className="text-muted-foreground text-xs">NIF:</div>
                <div>{customer.tax_id}</div>
              </div>
            )}
            {customer.id_number && (
              <div>
                <div className="text-muted-foreground text-xs">ID:</div>
                <div className="font-mono text-xs">{customer.id_number}</div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(
                customer.id, 
                customer.is_active, 
                customer.full_name
              )}
              disabled={togglingId === customer.id}
              className="h-8 w-8 p-0"
              title={customer.is_active ? 'Désactiver' : 'Activer'}
            >
              {togglingId === customer.id ? (
                <span className="animate-spin">⟳</span>
              ) : customer.is_active ? (
                <UserCheck className="h-4 w-4 text-green-600" />
              ) : (
                <UserX className="h-4 w-4 text-red-600" />
              )}
            </Button>
            <Badge variant={customer.is_active ? "default" : "secondary"}>
              {customer.is_active ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Link href={`/dashboard/crm/${customer.id}`}>
              <Button variant="ghost" size="icon" title="Voir détails">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/crm/${customer.id}/edit`}>
              <Button variant="ghost" size="icon" title="Modifier">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(customer.id, customer.full_name)}
              disabled={deletingId === customer.id}
              className="text-destructive hover:text-destructive"
              title="Supprimer"
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
      data={customers}
      searchKey="full_name"
      placeholder="Rechercher un client..."
      enableRowSelection={true}
    />
  );
}
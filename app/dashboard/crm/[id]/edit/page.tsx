import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCustomerById, updateCustomer } from '@/actions/customers';
import { CustomerForm } from '@/components/crm/CustomerForm';

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditCustomerPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Modifier le client ${id}`,
  };
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const response = await getCustomerById(id);

  if (!response.success || !response.data) {
    notFound();
  }

  const customer = response.data;

  // Préparer les données initiales pour le formulaire
  const initialData = {
    customer_type: customer.customer_type,
    full_name: customer.full_name,
    company_name: customer.company_name || '',
    email: customer.email || '',
    phone: customer.phone,
    address: customer.address || '',
    tax_id: customer.tax_id || '',
    id_type: customer.id_type || undefined,
    id_number: customer.id_number || '',
    is_active: customer.is_active,
    notes: customer.notes || '',
    addresses: customer.addresses?.map(addr => ({
      address_type: addr.address_type,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city_id: addr.city_id || '',
      postal_code: addr.postal_code || '',
      country: addr.country || 'RDC',
      is_default: addr.is_default,
      latitude: addr.latitude || undefined,
      longitude: addr.longitude || undefined,
      notes: addr.notes || '',
    })) || [],
  };

  const handleSubmit = async (data: any) => {
    'use server';
    return await updateCustomer(id, data);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href={`/dashboard/crm/${id}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux détails
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier le client</h1>
          <p className="text-muted-foreground">
            Modifiez les informations de {customer.full_name}
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <CustomerForm 
            customerId={id}
            initialData={initialData}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
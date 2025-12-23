import { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createCustomer } from '@/actions/customers';
import { CustomerForm } from '@/components/crm/CustomerForm';

export const metadata: Metadata = {
  title: 'Nouveau Client',
  description: 'Créer un nouveau client',
};

export default function NewCustomerPage() {
  const handleSubmit = async (data: any) => {
    'use server';
    return await createCustomer(data);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/crm">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux clients
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Créer un nouveau client</h1>
          <p className="text-muted-foreground">
            Enregistrez un nouveau client particulier ou entreprise
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <CustomerForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
import { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RouteForm } from '@/components/routes/RouteForm';
import { createRoute } from '@/actions/route';

export const metadata: Metadata = {
  title: 'Nouvelle Route',
  description: 'Créer une nouvelle route postale',
};

export default function NewRoutePage() {
  const handleSubmit = async (data: any) => {
    'use server';
    return await createRoute(data);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/dashboard/routes">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux routes
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Créer une nouvelle route</h1>
          <p className="text-muted-foreground">
            Définissez une nouvelle route postale entre deux agences
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <RouteForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
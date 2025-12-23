'use client';

import { useState } from 'react';
import { RegionForm } from '@/components/regions/RegionForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createRegion } from '@/actions/region';
import { RegionFormData } from '@/lib/validations/region';

export default function NewRegionPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (data: RegionFormData) => {
    return await createRegion({
      name: data.name,
      code: data.code?.toUpperCase() || null,
    });
  };

  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      router.push('/dashboard/regions');
      router.refresh();
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/regions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Nouvelle région
            </h1>
            <p className="text-sm text-muted-foreground">
              Ajouter une région administrative au système
            </p>
          </div>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">
              Région créée avec succès. Redirection…
            </span>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <RegionForm
              onSubmit={handleSubmit}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}

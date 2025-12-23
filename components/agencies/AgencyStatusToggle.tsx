'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Loader2, Check, X } from 'lucide-react';
import { toggleAgencyStatus } from '@/actions/agencies';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AgencyStatusToggleProps {
  agencyId: string;
  isActive: boolean;
  onToggle?: () => void;
}

export function AgencyStatusToggle({ agencyId, isActive, onToggle }: AgencyStatusToggleProps) {
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();
  
  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const result = await toggleAgencyStatus(agencyId, !isActive);
      
      if (result.success) {
        toast.success(
          isActive ? 'Agence désactivée avec succès' : 'Agence activée avec succès'
        );
        if (onToggle) {
          onToggle();
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error || 'Erreur lors du changement de statut');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsToggling(false);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={isToggling}
          />
          <span className={`flex items-center gap-1 text-sm ${isActive ? 'text-green-600' : 'text-red-600'}`}>
            {isActive ? (
              <>
                <Check className="h-3 w-3" /> Actif
              </>
            ) : (
              <>
                <X className="h-3 w-3" /> Inactif
              </>
            )}
          </span>
        </>
      )}
    </div>
  );
}
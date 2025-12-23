'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteAgency } from '@/actions/agencies';
import { Loader2, Building2, Users, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface DeleteAgencyDialogProps {
  agencyId: string | null;
  agencyName?: string;
  agencyStats?: {
    users: number;
    shipments: number;
  };
  onClose: () => void;
}

export function DeleteAgencyDialog({ 
  agencyId, 
  agencyName,
  agencyStats = { users: 0, shipments: 0 },
  onClose 
}: DeleteAgencyDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  const handleDelete = async () => {
    if (!agencyId) return;
    
    setIsDeleting(true);
    const result = await deleteAgency(agencyId);
    setIsDeleting(false);
    
    if (result.success) {
      toast.success('Agence supprimée avec succès');
      router.refresh();
      onClose();
    } else {
      toast.error(result.error || 'Erreur lors de la suppression');
    }
  };
  
  return (
    <AlertDialog open={!!agencyId} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-destructive" />
            Supprimer l'agence
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {agencyName && (
              <p className="font-medium text-foreground">
                Êtes-vous sûr de vouloir supprimer l'agence <span className="text-destructive">"{agencyName}"</span> ?
              </p>
            )}
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-amber-800">
                ⚠️ Cette action est irréversible et vérifiera :
              </p>
              
              <div className="space-y-2">
                {agencyStats.users > 0 ? (
                  <div className="flex items-center gap-2 text-amber-700">
                    <Users className="h-4 w-4" />
                    <span>
                      <strong>{agencyStats.users} utilisateur(s)</strong> associé(s) - Impossible de supprimer
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-700">
                    <Users className="h-4 w-4" />
                    <span>Aucun utilisateur associé ✓</span>
                  </div>
                )}
                
                {agencyStats.shipments > 0 ? (
                  <div className="flex items-center gap-2 text-amber-700">
                    <Package className="h-4 w-4" />
                    <span>
                      <strong>{agencyStats.shipments} envoi(s)</strong> associé(s) - Impossible de supprimer
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-700">
                    <Package className="h-4 w-4" />
                    <span>Aucun envoi associé ✓</span>
                  </div>
                )}
              </div>
              
              {(agencyStats.users > 0 || agencyStats.shipments > 0) && (
                <p className="text-xs text-amber-600">
                  Solution : Désactivez l'agence plutôt que de la supprimer
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || agencyStats.users > 0 || agencyStats.shipments > 0}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                'Supprimer définitivement'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
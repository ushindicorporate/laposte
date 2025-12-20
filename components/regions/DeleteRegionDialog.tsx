// /components/regions/DeleteRegionDialog.tsx
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
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteRegion } from '@/actions/region';

interface DeleteRegionDialogProps {
  regionId: string | null;
  onClose: () => void;
}

export function DeleteRegionDialog({ regionId, onClose }: DeleteRegionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  const handleDelete = async () => {
    if (!regionId) return;
    
    setIsDeleting(true);
    const result = await deleteRegion(regionId);
    setIsDeleting(false);
    
    if (result.success) {
      router.refresh();
      onClose();
    } else {
      alert(result.error || 'Erreur lors de la suppression');
    }
  };
  
  return (
    <AlertDialog open={!!regionId} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. La région sera définitivement supprimée.
            Assurez-vous qu&apos;aucune ville n&apos;est associée à cette région.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
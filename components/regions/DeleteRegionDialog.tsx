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
import { disableRegion } from '@/actions/region';

interface DeleteRegionDialogProps {
  regionId: string | null;
  onClose: () => void;
}

export function DeleteRegionDialog({ regionId, onClose }: DeleteRegionDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleDisable = async () => {
    if (!regionId) return;

    setIsProcessing(true);
    const result = await disableRegion(regionId);
    setIsProcessing(false);

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      alert(result.error || 'Erreur lors de la désactivation');
    }
  };

  return (
    <AlertDialog open={!!regionId} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Désactiver la région</AlertDialogTitle>
          <AlertDialogDescription>
            Cette région sera désactivée et ne pourra plus être utilisée.
            <br />
            Les données existantes seront conservées à des fins d’historique.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>
            Annuler
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Désactivation...
                </>
              ) : (
                'Désactiver'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

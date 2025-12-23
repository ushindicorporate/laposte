// components/delivery/ReturnForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import { markAsReturned } from '@/actions/delivery';
import { supabase } from '@/lib/supabase/client';

interface ReturnFormProps {
  shipmentId: string;
  shipmentInfo?: {
    tracking_number: string;
    sender_name: string;
  };
  onSuccess?: () => void;
}

export function ReturnForm({ shipmentId, shipmentInfo, onSuccess }: ReturnFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm('Êtes-vous sûr de vouloir marquer cet envoi comme retourné ?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Récupérer l'utilisateur courant
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      // Marquer comme retourné
      const result = await markAsReturned(shipmentId, userId);

      if (!result.success) {
        throw new Error('Erreur lors du marquage');
      }

      setSuccess('Envoi marqué comme retourné avec succès !');
      
      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setNotes('');
        setSuccess(null);
        onSuccess?.();
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors du marquage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info de l'envoi */}
          {shipmentInfo && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-medium">{shipmentInfo.tracking_number}</div>
                  <div className="text-sm">
                    Retour vers: {shipmentInfo.sender_name}
                  </div>
                  <p className="text-sm text-amber-700 mt-2">
                    Cette action marquera l'envoi comme retourné à l'expéditeur.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes sur le retour (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Raison du retour, état du colis, etc."
              rows={3}
            />
          </div>

          {/* Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Bouton de soumission */}
          <Button
            type="submit"
            disabled={loading}
            variant="destructive"
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Marquer comme retourné
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
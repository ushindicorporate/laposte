// components/finance/CreatePaymentForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, CheckCircle, CreditCard, Smartphone, Building } from 'lucide-react';
import { createPayment } from '@/actions/pricing';
import { supabase } from '@/lib/supabase/client';

interface CreatePaymentFormProps {
  shipmentId: string;
  shipmentInfo?: {
    tracking_number: string;
    price: number;
    recipient_name: string;
  };
  onSuccess?: () => void;
}

export function CreatePaymentForm({ shipmentId, shipmentInfo, onSuccess }: CreatePaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: shipmentInfo?.price?.toString() || '',
    payment_method: 'CASH',
    payment_reference: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Le montant doit être un nombre positif');
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

      // Créer le paiement
      const result = await createPayment(
        shipmentId,
        amount,
        formData.payment_method,
        userId
      );

      if (!result.success) {
        throw new Error('Erreur lors de la création du paiement');
      }

      setSuccess('Paiement enregistré avec succès !');
      
      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setFormData({
          amount: shipmentInfo?.price?.toString() || '',
          payment_method: 'CASH',
          payment_reference: '',
        });
        setSuccess(null);
        onSuccess?.();
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'CASH', label: 'Espèces', icon: <DollarSign className="h-4 w-4" /> },
    { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'BANK_TRANSFER', label: 'Virement bancaire', icon: <Building className="h-4 w-4" /> },
    { value: 'CREDIT_CARD', label: 'Carte de crédit', icon: <CreditCard className="h-4 w-4" /> },
    { value: 'CREDIT', label: 'Crédit', icon: <CheckCircle className="h-4 w-4" /> },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info de l'envoi */}
          {shipmentInfo && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{shipmentInfo.tracking_number}</div>
                  <div className="text-sm">
                    {shipmentInfo.recipient_name}
                  </div>
                </div>
                <div className="text-lg font-bold">
                  {new Intl.NumberFormat('fr-CD', {
                    style: 'currency',
                    currency: 'CDF',
                    minimumFractionDigits: 0
                  }).format(shipmentInfo.price || 0)}
                </div>
              </div>
            </div>
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant à payer (CDF)</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0"
              required
            />
          </div>

          {/* Méthode de paiement */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">Méthode de paiement</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      {method.icon}
                      {method.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Référence de paiement */}
          {(formData.payment_method === 'MOBILE_MONEY' || 
            formData.payment_method === 'BANK_TRANSFER') && (
            <div className="space-y-2">
              <Label htmlFor="payment_reference">Numéro de transaction</Label>
              <Input
                id="payment_reference"
                value={formData.payment_reference}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_reference: e.target.value }))}
                placeholder="Ex: MTN-1234567890"
              />
            </div>
          )}

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
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Enregistrer le paiement
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
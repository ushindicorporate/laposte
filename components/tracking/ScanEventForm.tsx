// components/tracking/ScanEventForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, CheckCircle, XCircle, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createTrackingEvent } from '@/actions/trackings';
import { Separator } from '../ui/separator';

interface ScanEventFormProps {
  shipmentId?: string;
  currentAgencyId?: string;
  onSuccess?: () => void;
}

export function ScanEventForm({ shipmentId, currentAgencyId, onSuccess }: ScanEventFormProps) {
    const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState(shipmentId || '');
  const [shipmentInfo, setShipmentInfo] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    status: 'RECEIVED',
    description: '',
  });

  // Statuts possibles
  const statusOptions = [
    { value: 'RECEIVED', label: 'Reçu', icon: <Package className="h-4 w-4" /> },
    { value: 'IN_TRANSIT', label: 'En transit', icon: <Clock className="h-4 w-4" /> },
    { value: 'ARRIVED_AT_DESTINATION', label: 'Arrivé à destination', icon: <MapPin className="h-4 w-4" /> },
    { value: 'OUT_FOR_DELIVERY', label: 'En livraison', icon: <Package className="h-4 w-4" /> },
    { value: 'DELIVERED', label: 'Livré', icon: <CheckCircle className="h-4 w-4" /> },
    { value: 'FAILED_DELIVERY', label: 'Échec livraison', icon: <XCircle className="h-4 w-4" /> },
    { value: 'ON_HOLD', label: 'En attente', icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  // Rechercher un envoi par son numéro de suivi
  const searchShipment = async () => {
    if (!trackingNumber.trim()) {
      setError('Veuillez entrer un numéro de suivi');
      return;
    }

    setLoading(true);
    setError(null);
    setShipmentInfo(null);

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id,
          tracking_number,
          status,
          recipient_name,
          origin_agency:agencies(name),
          destination_agency:agencies(name)
        `)
        .eq('tracking_number', trackingNumber.trim())
        .single();

      if (error) throw error;
      
      if (data) {
        setShipmentInfo(data);
        setFormData(prev => ({ ...prev, status: data.status }));
      } else {
        setError('Aucun envoi trouvé avec ce numéro de suivi');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Soumettre l'événement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shipmentInfo) {
      setError('Veuillez d\'abord rechercher un envoi');
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

      // Créer l'événement
      const result = await createTrackingEvent({
        shipment_id: shipmentInfo.id,
        status: formData.status,
        location_agency_id: currentAgencyId,
        description: formData.description,
      }, userId);

      if (!result.success) {
        throw new Error('Erreur lors de la création de l\'événement');
      }

      setSuccess('Événement enregistré avec succès !');
      
      // Réinitialiser le formulaire
      setTimeout(() => {
        setTrackingNumber('');
        setShipmentInfo(null);
        setFormData({ status: 'RECEIVED', description: '' });
        setSuccess(null);
        onSuccess?.();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recherche de l'envoi */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="trackingNumber">Numéro de suivi</Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="RDC240101ABC123"
                  disabled={loading}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={searchShipment}
                  disabled={loading || !trackingNumber.trim()}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  Rechercher
                </Button>
              </div>
            </div>

            {/* Info de l'envoi trouvé */}
            {shipmentInfo && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{shipmentInfo.tracking_number}</div>
                    <div className="text-sm text-muted-foreground">
                      Destinataire: {shipmentInfo.recipient_name}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div>De: {shipmentInfo.origin_agency?.name || 'N/A'}</div>
                    <div>Vers: {shipmentInfo.destination_agency?.name || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Formulaire d'événement */}
          {shipmentInfo && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Nouveau statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            {option.icon}
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ajoutez des détails sur cet événement..."
                    rows={3}
                  />
                </div>
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
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    Scanner l'événement
                  </>
                )}
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
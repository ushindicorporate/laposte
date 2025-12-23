// components/delivery/DeliveryForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Loader2, Package, CheckCircle, XCircle, 
  User, FileText, MapPin, Camera, Upload
} from 'lucide-react';
import { createDeliveryAttempt } from '@/actions/delivery';
import { supabase } from '@/lib/supabase/client';
import { Separator } from '../ui/separator';

interface DeliveryFormProps {
  shipmentId: string;
  shipmentInfo?: {
    tracking_number: string;
    recipient_name: string;
    recipient_phone: string;
  };
  onSuccess?: () => void;
}

export function DeliveryForm({ shipmentId, shipmentInfo, onSuccess }: DeliveryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    status: 'SUCCESS' as 'SUCCESS' | 'FAILED',
    recipient_name: '',
    recipient_relationship: '',
    recipient_id_type: 'CNI',
    recipient_id_number: '',
    failure_reason: '',
    notes: '',
    latitude: '',
    longitude: '',
    proof_urls: [] as string[],
  });

  // Pré-remplir avec les infos de l'envoi
  useEffect(() => {
    if (shipmentInfo) {
      setFormData(prev => ({
        ...prev,
        recipient_name: shipmentInfo.recipient_name
      }));
    }
  }, [shipmentInfo]);

  // Géolocalisation automatique
  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        setLoading(false);
      },
      (error) => {
        setError('Impossible d\'obtenir la localisation: ' + error.message);
        setLoading(false);
      }
    );
  };

  // Upload d'une preuve
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `delivery-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        proof_urls: [...prev.proof_urls, publicUrl]
      }));

    } catch (err: any) {
      setError('Erreur lors du téléchargement: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.status === 'FAILED' && !formData.failure_reason.trim()) {
      setError('Veuillez spécifier le motif de l\'échec');
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

      // Préparer les données
      const deliveryData = {
        shipment_id: shipmentId,
        status: formData.status,
        failure_reason: formData.status === 'FAILED' ? formData.failure_reason : undefined,
        recipient_name: formData.recipient_name.trim() || undefined,
        recipient_relationship: formData.recipient_relationship.trim() || undefined,
        recipient_id_type: formData.recipient_id_type.trim() || undefined,
        recipient_id_number: formData.recipient_id_number.trim() || undefined,
        proof_urls: formData.proof_urls,
        notes: formData.notes.trim() || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      };

      // Créer la tentative
      const result = await createDeliveryAttempt(deliveryData, userId);

      if (!result.success) {
        throw new Error('Erreur lors de l\'enregistrement');
      }

      setSuccess(
        formData.status === 'SUCCESS' 
          ? 'Livraison enregistrée avec succès !' 
          : 'Échec de livraison enregistré !'
      );
      
      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setFormData({
          status: 'SUCCESS',
          recipient_name: shipmentInfo?.recipient_name || '',
          recipient_relationship: '',
          recipient_id_type: 'CNI',
          recipient_id_number: '',
          failure_reason: '',
          notes: '',
          latitude: '',
          longitude: '',
          proof_urls: [],
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
                    Destinataire: {shipmentInfo.recipient_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tél: {shipmentInfo.recipient_phone}
                  </div>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </div>
          )}

          {/* Statut de livraison */}
          <div className="space-y-4">
            <div>
              <Label>Résultat de la livraison</Label>
              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant={formData.status === 'SUCCESS' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, status: 'SUCCESS' }))}
                  className="flex-1 gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Livraison réussie
                </Button>
                <Button
                  type="button"
                  variant={formData.status === 'FAILED' ? 'destructive' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, status: 'FAILED' }))}
                  className="flex-1 gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Échec de livraison
                </Button>
              </div>
            </div>

            {formData.status === 'FAILED' && (
              <div className="space-y-2">
                <Label htmlFor="failure_reason">Motif de l'échec *</Label>
                <Select
                  value={formData.failure_reason}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, failure_reason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un motif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABSENT">Destinataire absent</SelectItem>
                    <SelectItem value="REFUSED">Colis refusé</SelectItem>
                    <SelectItem value="WRONG_ADDRESS">Adresse incorrecte</SelectItem>
                    <SelectItem value="BUSINESS_CLOSED">Entreprise fermée</SelectItem>
                    <SelectItem value="OTHER">Autre raison</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Informations du destinataire */}
          {formData.status === 'SUCCESS' && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations du destinataire
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient_name">Nom du destinataire</Label>
                    <Input
                      id="recipient_name"
                      value={formData.recipient_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                      placeholder="Nom complet"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipient_relationship">Relation</Label>
                    <Input
                      id="recipient_relationship"
                      value={formData.recipient_relationship}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipient_relationship: e.target.value }))}
                      placeholder="Ex: Conjoint, Colocataire, etc."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient_id_type">Type de pièce d'identité</Label>
                    <Select
                      value={formData.recipient_id_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, recipient_id_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CNI">Carte Nationale d'Identité</SelectItem>
                        <SelectItem value="PASSPORT">Passeport</SelectItem>
                        <SelectItem value="DRIVER_LICENSE">Permis de conduire</SelectItem>
                        <SelectItem value="OTHER">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipient_id_number">Numéro de pièce</Label>
                    <Input
                      id="recipient_id_number"
                      value={formData.recipient_id_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipient_id_number: e.target.value }))}
                      placeholder="Numéro de la pièce"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Preuves de livraison */}
          {formData.status === 'SUCCESS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Preuves de livraison
                </Label>
                <div className="text-sm text-muted-foreground">
                  {formData.proof_urls.length} fichier(s)
                </div>
              </div>
              
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  Téléchargez une photo de preuve
                </p>
                <input
                  type="file"
                  id="proof-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <label htmlFor="proof-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    className="gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    {uploading ? 'Téléchargement...' : 'Choisir un fichier'}
                  </Button>
                </label>
                
                {formData.proof_urls.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Fichiers téléchargés:</p>
                    <div className="space-y-1">
                      {formData.proof_urls.map((url, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          Preuve {index + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Géolocalisation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localisation
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getLocation}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <MapPin className="h-3 w-3" />
                )}
                Obtenir la position
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="Ex: -4.4419"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="Ex: 15.2663"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes (optionnel)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ajoutez des observations..."
              rows={3}
            />
          </div>

          {/* Messages d'erreur/succès */}
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
            ) : formData.status === 'SUCCESS' ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Enregistrer la livraison
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Enregistrer l'échec
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
// components/shipments/ShipmentDetail.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, Truck, MapPin, Calendar, DollarSign, 
  User, Phone, Home, FileText, Shield, AlertTriangle,
  Printer, Download, Share2, RefreshCw, Eye
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '@/lib/types/shipments';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ShipmentDetailProps {
  shipment: Shipment;
  canUpdateStatus?: boolean;
}

export function ShipmentDetail({ shipment, canUpdateStatus = false }: ShipmentDetailProps) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  
  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case 'CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'RECEIVED':
        return 'bg-indigo-100 text-indigo-800';
      case 'IN_TRANSIT':
        return 'bg-amber-100 text-amber-800';
      case 'ARRIVED_AT_DESTINATION':
        return 'bg-purple-100 text-purple-800';
      case 'OUT_FOR_DELIVERY':
        return 'bg-orange-100 text-orange-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'FAILED_DELIVERY':
        return 'bg-red-100 text-red-800';
      case 'RETURNED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusLabel = (status: ShipmentStatus) => {
    const labels: Record<ShipmentStatus, string> = {
      CREATED: 'Créé',
      RECEIVED: 'Reçu',
      IN_TRANSIT: 'En transit',
      ARRIVED_AT_DESTINATION: 'Arrivé à destination',
      OUT_FOR_DELIVERY: 'En livraison',
      DELIVERED: 'Livré',
      FAILED_DELIVERY: 'Échec livraison',
      RETURNED: 'Retourné',
      CANCELLED: 'Annulé',
      ON_HOLD: 'En attente'
    };
    return labels[status] || status;
  };
  
  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {shipment.tracking_number}
            </h1>
            <Badge className={getStatusColor(shipment.status)}>
              {getStatusLabel(shipment.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Créé le {format(new Date(shipment.created_at), 'PPP', { locale: fr })}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          {canUpdateStatus && (
            <Button 
              onClick={() => setShowUpdateDialog(true)}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Mettre à jour
            </Button>
          )}
        </div>
      </div>
      
      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Informations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expéditeur et Destinataire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Expéditeur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Nom</div>
                  <div className="font-medium">{shipment.sender_name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Téléphone</div>
                  <div className="font-medium">{shipment.sender_phone}</div>
                </div>
                {shipment.sender_address && (
                  <div>
                    <div className="text-sm text-muted-foreground">Adresse</div>
                    <div className="font-medium">{shipment.sender_address}</div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Destinataire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Nom</div>
                  <div className="font-medium">{shipment.recipient_name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Téléphone</div>
                  <div className="font-medium">{shipment.recipient_phone}</div>
                </div>
                {shipment.recipient_address && (
                  <div>
                    <div className="text-sm text-muted-foreground">Adresse</div>
                    <div className="font-medium">{shipment.recipient_address}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Détails de l'envoi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Détails de l'envoi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="font-medium">{shipment.type}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Poids</div>
                  <div className="font-medium">
                    {shipment.weight_kg ? `${shipment.weight_kg} kg` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Colis</div>
                  <div className="font-medium">{shipment.package_count}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Valeur déclarée</div>
                  <div className="font-medium">
                    {shipment.declared_value.toLocaleString()} CDF
                  </div>
                </div>
              </div>
              
              {shipment.special_instructions && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <div className="text-sm text-muted-foreground">Instructions spéciales</div>
                    <div className="font-medium italic">{shipment.special_instructions}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Historique du suivi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ShipmentTimeline 
                statusHistory={shipment.status_history || []}
                trackingEvents={shipment.tracking_events || []}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Colonne droite - Informations complémentaires */}
        <div className="space-y-6">
          {/* Prix et paiement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Prix et paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prix total:</span>
                <span className="font-bold text-lg">
                  {shipment.price.toLocaleString()} CDF
                </span>
              </div>
              
              {shipment.insurance_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assurance:</span>
                  <span className="font-medium text-green-600">
                    {shipment.insurance_amount.toLocaleString()} CDF
                  </span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut paiement:</span>
                <Badge variant={shipment.is_paid ? 'default' : 'destructive'}>
                  {shipment.is_paid ? 'Payé' : 'En attente'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Méthode:</span>
                <span className="font-medium">
                  {shipment.payment_method || 'Non spécifiée'}
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Logistique */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Logistique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Agence d'origine</div>
                <div className="font-medium">
                  {shipment.origin_agency?.name || 'N/A'}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Agence de destination</div>
                <div className="font-medium">
                  {shipment.destination_agency?.name || 'N/A'}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Agence actuelle</div>
                <div className="font-medium">
                  {shipment.current_agency?.name || 'N/A'}
                </div>
              </div>
              
              {shipment.estimated_delivery_date && (
                <div>
                  <div className="text-sm text-muted-foreground">Livraison estimée</div>
                  <div className="font-medium">
                    {format(new Date(shipment.estimated_delivery_date), 'PPP', { locale: fr })}
                  </div>
                </div>
              )}
              
              {shipment.actual_delivery_date && (
                <div>
                  <div className="text-sm text-muted-foreground">Livraison réelle</div>
                  <div className="font-medium">
                    {format(new Date(shipment.actual_delivery_date), 'PPP', { locale: fr })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Service</div>
                <div className="font-medium">{shipment.service?.name || 'N/A'}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Code</div>
                <div className="font-mono text-sm">{shipment.service?.code || 'N/A'}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="text-sm">{shipment.service?.description || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>
          
          {/* Articles */}
          {shipment.items && shipment.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Articles ({shipment.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shipment.items.map((item, index) => (
                  <div key={item.id} className="pb-3 border-b last:border-0">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity}x • {item.weight_kg ? `${item.weight_kg} kg` : ''}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Dialog pour mettre à jour le statut */}
      {showUpdateDialog && (
        <UpdateStatusDialog
          shipmentId={shipment.id}
          currentStatus={shipment.status}
          currentAgencyId={shipment.current_agency_id}
          open={showUpdateDialog}
          onClose={() => setShowUpdateDialog(false)}
        />
      )}
    </div>
  );
}
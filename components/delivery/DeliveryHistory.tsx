// components/delivery/DeliveryHistory.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, XCircle, Clock, User, 
  MapPin, FileText, Calendar 
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DeliveryAttempt {
  id: string;
  attempt_number: number;
  attempted_at: string;
  status: string;
  failure_reason: string | null;
  recipient_name: string | null;
  proof_urls: string[];
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  attempted_by_user?: {
    profiles?: {
      full_name: string;
    };
  };
}

interface DeliveryHistoryProps {
  attempts: DeliveryAttempt[];
}

export function DeliveryHistory({ attempts }: DeliveryHistoryProps) {
  if (attempts.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Aucune tentative</h3>
        <p className="text-muted-foreground">
          Aucune tentative de livraison n'a été enregistrée
        </p>
      </div>
    );
  }

  const getStatusInfo = (status: string, failureReason: string | null) => {
    switch (status) {
      case 'SUCCESS':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          label: 'Réussie',
          color: 'bg-green-100 text-green-800',
          reason: null
        };
      case 'FAILED':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          label: 'Échec',
          color: 'bg-red-100 text-red-800',
          reason: failureReason
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          label: 'En attente',
          color: 'bg-amber-100 text-amber-800',
          reason: null
        };
    }
  };

  const getFailureReasonLabel = (reason: string | null) => {
    if (!reason) return '';
    
    const reasons: Record<string, string> = {
      'ABSENT': 'Destinataire absent',
      'REFUSED': 'Colis refusé',
      'WRONG_ADDRESS': 'Adresse incorrecte',
      'BUSINESS_CLOSED': 'Entreprise fermée',
      'OTHER': 'Autre raison'
    };
    
    return reasons[reason] || reason;
  };

  return (
    <div className="space-y-4">
      {attempts.map((attempt) => {
        const statusInfo = getStatusInfo(attempt.status, attempt.failure_reason);
        
        return (
          <Card key={attempt.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {statusInfo.icon}
                  <div>
                    <div className="font-medium">
                      Tentative #{attempt.attempt_number}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(attempt.attempted_at), 'PPP à pp', { locale: fr })}
                    </div>
                  </div>
                </div>
                
                <Badge className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
              </div>

              {/* Détails */}
              <div className="space-y-3">
                {attempt.recipient_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Destinataire: {attempt.recipient_name}</span>
                  </div>
                )}

                {statusInfo.reason && (
                  <div className="text-sm">
                    <div className="font-medium">Motif de l'échec:</div>
                    <div className="text-muted-foreground">
                      {getFailureReasonLabel(attempt.failure_reason)}
                    </div>
                  </div>
                )}

                {(attempt.latitude && attempt.longitude) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Position: {attempt.latitude.toFixed(4)}, {attempt.longitude.toFixed(4)}
                    </span>
                  </div>
                )}

                {attempt.proof_urls.length > 0 && (
                  <div className="text-sm">
                    <div className="font-medium">Preuves:</div>
                    <div className="text-muted-foreground">
                      {attempt.proof_urls.length} fichier(s)
                    </div>
                  </div>
                )}

                {attempt.notes && (
                  <div className="text-sm">
                    <div className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes:
                    </div>
                    <div className="text-muted-foreground italic">
                      {attempt.notes}
                    </div>
                  </div>
                )}

                {attempt.attempted_by_user && (
                  <div className="text-sm text-muted-foreground">
                    Effectué par: {attempt.attempted_by_user.profiles?.full_name || 'Agent'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
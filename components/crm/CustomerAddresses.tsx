'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Truck, FileText, Globe } from 'lucide-react';
import { CustomerAddressWithCity } from '@/lib/types/customers';

interface CustomerAddressesProps {
  customerId: string;
  addresses: CustomerAddressWithCity[];
}

export function CustomerAddresses({ customerId, addresses }: CustomerAddressesProps) {
  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'PRINCIPALE':
        return <Home className="h-4 w-4" />;
      case 'LIVRAISON':
        return <Truck className="h-4 w-4" />;
      case 'FACTURATION':
        return <FileText className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  if (addresses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucune adresse</h3>
          <p className="text-muted-foreground mt-2">
            Ce client n'a pas encore d'adresse enregistrée
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {addresses.map((address) => (
        <Card key={address.id} className={address.is_default ? 'border-primary' : ''}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                {getAddressTypeIcon(address.address_type)}
                <h3 className="font-semibold">{address.address_type}</h3>
              </div>
              <div className="flex gap-2">
                {address.is_default && (
                  <Badge variant="default">Défaut</Badge>
                )}
                <Badge variant="outline">{address.address_type}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Adresse</div>
                <div className="font-medium">{address.address_line1}</div>
                {address.address_line2 && (
                  <div>{address.address_line2}</div>
                )}
              </div>

              {(address.city || address.postal_code) && (
                <div>
                  <div className="text-sm text-muted-foreground">Localité</div>
                  <div className="flex items-center gap-1">
                    {address.city && (
                      <>
                        <Globe className="h-3 w-3" />
                        <span>{address.city.name}</span>
                        {address.city.regions && (
                          <span className="text-muted-foreground">
                            ({address.city.regions.name})
                          </span>
                        )}
                      </>
                    )}
                    {address.postal_code && (
                      <Badge variant="outline" className="ml-2">
                        {address.postal_code}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {(address.latitude && address.longitude) && (
                <div>
                  <div className="text-sm text-muted-foreground">Coordonnées GPS</div>
                  <div className="text-sm font-mono">
                    {address.latitude}, {address.longitude}
                  </div>
                </div>
              )}

              {address.notes && (
                <div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="text-sm italic">{address.notes}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
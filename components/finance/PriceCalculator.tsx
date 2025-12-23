// components/finance/PriceCalculator.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, Calculator, DollarSign, Package, 
  Shield, Weight, 
} from 'lucide-react';
import { calculatePrice } from '@/actions/pricing';

export function PriceCalculator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    weight_kg: '1',
    volume_cm3: '',
    distance_km: '',
    service_type: 'EXPRESS',
    declared_value: '',
    has_insurance: false,
    requires_signature: false,
  });

  const handleCalculate = async () => {
    const weight = parseFloat(formData.weight_kg);
    const volume = formData.volume_cm3 ? parseFloat(formData.volume_cm3) : undefined;
    const declaredValue = formData.declared_value ? parseFloat(formData.declared_value) : undefined;
    const distance = formData.distance_km ? parseFloat(formData.distance_km) : undefined;
    
    if (isNaN(weight) || weight <= 0) {
      setError('Le poids doit être un nombre positif');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const calculation = await calculatePrice({
        weight_kg: weight,
        volume_cm3: volume,
        distance_km: distance,
        service_type: formData.service_type,
        declared_value: declaredValue,
        has_insurance: formData.has_insurance,
        requires_signature: formData.requires_signature,
      });

      setResult(calculation);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Formulaire */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Type de service
                </Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPRESS">Express</SelectItem>
                    <SelectItem value="ECONOMY">Économique</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    <SelectItem value="INTERNATIONAL">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight_kg" className="flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Poids (kg)
                </Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                  placeholder="1.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="volume_cm3" className="flex items-center gap-2">
                  {/* <Cube className="h-4 w-4" /> */}
                  Volume (cm³)
                </Label>
                <Input
                  id="volume_cm3"
                  type="number"
                  value={formData.volume_cm3}
                  onChange={(e) => setFormData(prev => ({ ...prev, volume_cm3: e.target.value }))}
                  placeholder="Optionnel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="declared_value" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Valeur déclarée (CDF)
                </Label>
                <Input
                  id="declared_value"
                  type="number"
                  value={formData.declared_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, declared_value: e.target.value }))}
                  placeholder="Optionnel"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="has_insurance" className="cursor-pointer">
                    Assurance
                  </Label>
                  <Switch
                    id="has_insurance"
                    checked={formData.has_insurance}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, has_insurance: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="requires_signature" className="cursor-pointer">
                    Signature requise
                  </Label>
                  <Switch
                    id="requires_signature"
                    checked={formData.requires_signature}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, requires_signature: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bouton de calcul */}
          <Button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Calcul en cours...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Calculer le prix
              </>
            )}
          </Button>

          {/* Messages d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Résultats */}
          {result && (
            <div className="space-y-4">
              <Separator />
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(result.total_amount)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Prix total TTC
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Détail du calcul:</h4>
                <div className="space-y-1">
                  {result.breakdown.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-sm">
                  <div className="text-muted-foreground">Sous-total</div>
                  <div className="font-medium">{formatCurrency(result.subtotal)}</div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">TVA (16%)</div>
                  <div className="font-medium">{formatCurrency(result.tax_amount)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
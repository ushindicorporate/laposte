// components/ui/sensitive-data-display.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Lock, AlertCircle, UserCheck, Shield } from 'lucide-react';
import { UserMaskingPermissions, FieldType } from '@/lib/types/masking';
import { cn } from '@/lib/utils';
import { DataMaskingService } from '@/lib/services/masking';

interface SensitiveDataDisplayProps {
  value: string | null | undefined;
  fieldType: FieldType;
  fieldKey: string;
  userPermissions: UserMaskingPermissions | null;
  customerId?: string;
  className?: string;
  showIcon?: boolean;
  showTooltip?: boolean;
  logAccess?: boolean;
}

export function SensitiveDataDisplay({
  value,
  fieldType,
  fieldKey,
  userPermissions,
  customerId,
  className,
  showIcon = true,
  showTooltip = true,
  logAccess = true
}: SensitiveDataDisplayProps) {
  const [masked, setMasked] = useState(true);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [hasPartialAccess, setHasPartialAccess] = useState(true);
  
  useEffect(() => {
    if (!value) return;
    
    const permission = userPermissions?.permissions[fieldKey];
    const canViewFull = permission?.canViewFull || false;
    const canViewPartial = permission?.canViewPartial || true;
    
    setHasFullAccess(canViewFull);
    setHasPartialAccess(canViewPartial);
    
    // Logger l'accès si configuré
    if (logAccess && userPermissions?.userId && customerId && value) {
      DataMaskingService.logSensitiveDataAccess(
        userPermissions.userId,
        customerId,
        null,
        'VIEW'
      ).catch(console.error);
    }
  }, [value, fieldKey, userPermissions, customerId, logAccess]);
  
  if (!value) {
    return (
      <span className={cn("text-muted-foreground italic", className)}>
        Non renseigné
      </span>
    );
  }
  
  const displayValue = masked && !hasFullAccess
    ? DataMaskingService.maskValue(value, fieldType, 'partial', userPermissions, fieldKey)
    : value;
  
  const canToggleMask = hasPartialAccess && !hasFullAccess && value.length > 4;
  
  const getFieldTypeIcon = () => {
    switch (fieldType) {
      case 'PHONE':
        return <Shield className="h-3 w-3" />;
      case 'EMAIL':
        return <Lock className="h-3 w-3" />;
      case 'ADDRESS':
        return <AlertCircle className="h-3 w-3" />;
      case 'TAX_ID':
        return <UserCheck className="h-3 w-3" />;
      default:
        return <Lock className="h-3 w-3" />;
    }
  };
  
  const getFieldTypeLabel = () => {
    switch (fieldType) {
      case 'PHONE':
        return 'Téléphone';
      case 'EMAIL':
        return 'Email';
      case 'ADDRESS':
        return 'Adresse';
      case 'TAX_ID':
        return 'Numéro fiscal';
      default:
        return 'Donnée sensible';
    }
  };
  
  const content = (
    <div className="flex items-center gap-2">
      {showIcon && (
        <span className="text-muted-foreground">
          {getFieldTypeIcon()}
        </span>
      )}
      
      <span className={className}>
        {displayValue}
      </span>
      
      {canToggleMask && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setMasked(!masked)}
        >
          {masked ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}
        </Button>
      )}
      
      {hasFullAccess && (
        <Badge variant="outline" className="text-xs">
          Accès complet
        </Badge>
      )}
    </div>
  );
  
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center">
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{getFieldTypeLabel()}</div>
              <div className="text-xs text-muted-foreground">
                {hasFullAccess 
                  ? 'Vous avez un accès complet' 
                  : hasPartialAccess 
                    ? 'Accès partiel - données masquées' 
                    : 'Accès restreint'}
              </div>
              {userPermissions?.roleIds.length === 0 && (
                <div className="text-xs text-amber-600">
                  Aucun rôle attribué - accès limité
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return content;
}

// Composant pour afficher une liste de données sensibles
interface SensitiveDataListProps {
  data: Array<{
    label: string;
    value: string | null | undefined;
    fieldType: FieldType;
    fieldKey: string;
  }>;
  userPermissions: UserMaskingPermissions | null;
  customerId?: string;
  className?: string;
}

export function SensitiveDataList({
  data,
  userPermissions,
  customerId,
  className
}: SensitiveDataListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => (
        <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="text-sm font-medium text-muted-foreground min-w-30">
            {item.label}:
          </div>
          <div className="flex-1">
            <SensitiveDataDisplay
              value={item.value}
              fieldType={item.fieldType}
              fieldKey={item.fieldKey}
              userPermissions={userPermissions}
              customerId={customerId}
              className="font-medium"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
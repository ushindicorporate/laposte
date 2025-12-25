// components/auth/role-gate.tsx
'use client';

import { useUser } from '@/lib/hooks/useUser';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: string[]; // ex: ['SUPER_ADMIN', 'REGIONAL_MANAGER']
}

export const RoleGate = ({ children, allowedRoles }: RoleGateProps) => {
  const { userProfile, loading } = useUser();

  if (loading) return null; // Ou un skeleton discret

  // Le Super Admin a accès à tout, tout le temps (God Mode)
  if (userProfile?.roles?.includes('SUPER_ADMIN')) {
    return <>{children}</>;
  }

  // Vérifie si l'utilisateur a au moins un des rôles requis
  const hasAccess = userProfile?.roles?.some((role: string) => 
    allowedRoles.includes(role)
  );

  if (!hasAccess) {
    return null; // N'affiche rien si pas autorisé
  }

  return <>{children}</>;
};
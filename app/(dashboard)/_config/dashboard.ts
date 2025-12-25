// /config/dashboard.ts
import {
  LayoutDashboard,
  Package,
  Truck,
  ScanLine,
  Users,
  Wallet,
  MapPin,
  Building2,
  Route,
  BarChart3,
  UserCog,
  type LucideIcon,
  UserCheck,
} from 'lucide-react'

export type DashboardNavItem = {
  name: string
  href: string
  icon: LucideIcon
  roles: string[] // RBAC
}

export type DashboardNavCategory = {
  name: string
  items: DashboardNavItem[]
}

export const dashboardConfig: DashboardNavCategory[] = [
  {
    name: 'Opérations',
    items: [
      { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'FINANCE', 'SUPER_ADMIN'] },
      { name: 'Envois & Colis', href: '/dashboard/shipments', icon: Package, roles: ['AGENT', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
      { name: 'Suivi (Tracking)', href: '/dashboard/tracking', icon: Truck, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
      { name: 'Scanner', href: '/dashboard/tracking/scan', icon: ScanLine, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
      { name: 'Clients & CRM', href: '/dashboard/customers', icon: Users, roles: ['AGENT', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
      { 
        name: 'Livraison Finale', 
        href: '/dashboard/delivery', 
        icon: UserCheck, // Import from lucide-react
        roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'SUPER_ADMIN'] 
      },
    ],
  },
  {
    name: 'Réseau Postal',
    items: [
      { name: 'Régions', href: '/dashboard/regions', icon: MapPin, roles: ['SUPER_ADMIN', 'REGIONAL_MANAGER'] },
      { name: 'Villes', href: '/dashboard/cities', icon: Building2, roles: ['SUPER_ADMIN', 'REGIONAL_MANAGER'] },
      { name: 'Agences', href: '/dashboard/agencies', icon: Building2, roles: ['SUPER_ADMIN'] },
      { name: 'Routes & Trajets', href: '/dashboard/routes', icon: Route, roles: ['SUPER_ADMIN', 'REGIONAL_MANAGER', 'AGENCY_MANAGER'] },
    ],
  },
  {
    name: 'Administration',
    items: [
      { name: 'Finance & Compta', href: '/dashboard/finance', icon: Wallet, roles: ['FINANCE', 'SUPER_ADMIN'] },
      { name: 'Rapports & KPI', href: '/dashboard/reports', icon: BarChart3, roles: ['AGENCY_MANAGER', 'SUPER_ADMIN'] },
      { name: 'Utilisateurs', href: '/dashboard/users', icon: UserCog, roles: ['SUPER_ADMIN'] },
    ],
  },
]
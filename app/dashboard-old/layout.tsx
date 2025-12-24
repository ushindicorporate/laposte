'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  LogOut,
  Menu,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useUser } from '@/lib/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { logAuthEvent } from '@/lib/logger'

/* ---------------- MENU CONFIG ---------------- */

const menuCategories = [
  {
    name: 'Opérations',
    items: [
      { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'FINANCE', 'SUPER_ADMIN'] },
      { name: 'Envois & Colis', href: '/dashboard/shipments', icon: Package, roles: ['AGENT', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
      { name: 'Suivi (Tracking)', href: '/dashboard/tracking', icon: Truck, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
      { name: 'Scanner', href: '/dashboard/tracking/scan', icon: ScanLine, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
      { name: 'Clients & CRM', href: '/dashboard/crm', icon: Users, roles: ['AGENT', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
    ],
  },
  {
    name: 'Réseau',
    items: [
      { name: 'Régions', href: '/dashboard/regions', icon: MapPin, roles: ['SUPER_ADMIN', 'REGIONAL_MANAGER'] },
      { name: 'Villes', href: '/dashboard/cities', icon: Building2, roles: ['SUPER_ADMIN', 'REGIONAL_MANAGER'] },
      { name: 'Agences', href: '/dashboard/agencies', icon: Building2, roles: ['SUPER_ADMIN'] },
      { name: 'Routes', href: '/dashboard/routes', icon: Route, roles: ['SUPER_ADMIN', 'REGIONAL_MANAGER', 'AGENCY_MANAGER'] },
    ],
  },
  {
    name: 'Administration',
    items: [
      { name: 'Finance', href: '/dashboard/finance', icon: Wallet, roles: ['FINANCE', 'SUPER_ADMIN'] },
      { name: 'Rapports', href: '/dashboard/reports', icon: BarChart3, roles: ['AGENCY_MANAGER', 'SUPER_ADMIN'] },
      { name: 'Utilisateurs', href: '/dashboard/users', icon: UserCog, roles: ['SUPER_ADMIN'] },
    ],
  },
]

/* ---------------- LAYOUT ---------------- */

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const { user, userProfile, loading } = useUser()

  /* ---------- STATES ---------- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Chargement du tableau de bord…
      </div>
    )
  }

  if (!user || !userProfile) {
    router.push('/login')
    return null
  }

  const roles = userProfile.roles
  const agency = userProfile.agency

  const canAccess = (allowed: string[]) =>
    roles.includes('SUPER_ADMIN') || allowed.some(r => roles.includes(r))

  const handleLogout = async () => {
    await logAuthEvent('LOGOUT', user.id, userProfile.id)
    await supabase.auth.signOut()
    router.push('/login')
  }

  /* ---------- SIDEBAR CONTENT (REUSED) ---------- */

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center gap-3 px-6 border-b">
        <div className="relative w-9 h-9">
          <Image src="/logo.png" alt="Poste RDC" fill className="object-contain" />
        </div>
        <span className="font-bold tracking-tight text-primary text-lg">
          POSTE RDC
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {menuCategories.map(category => {
          const items = category.items.filter(item => canAccess(item.roles))
          if (!items.length) return null

          return (
            <div key={category.name} className="space-y-2">
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category.name}
              </h3>

              {items.map(item => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
                      ${
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="border-t p-4 space-y-3">
        {agency && (
          <div className="rounded-lg bg-primary/5 p-3 text-xs">
            <div className="font-medium text-primary truncate">{agency.name}</div>
            <div className="opacity-70 truncate">
              {agency.city?.name} • {agency.code}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-xs">
          <div className="font-medium truncate">
            {userProfile.full_name || 'Utilisateur'}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {roles.map(role => (
              <span
                key={role}
                className="rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px]"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </>
  )

  /* ---------- RENDER ---------- */

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-slate-950 fixed inset-y-0">
        <SidebarContent />
      </aside>

      {/* MAIN */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* MOBILE HEADER */}
        <header className="md:hidden h-16 flex items-center gap-4 border-b bg-white dark:bg-slate-950 px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <span className="font-bold text-primary">Poste RDC</span>

          {agency && (
            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {agency.code}
            </span>
          )}
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  Users, 
  Settings, 
  LogOut, 
  Truck,
  Menu,
  ScanLine,
  BarChart3,
  Wallet,
  Building2,
  UserCog,
  Route // AJOUTER CETTE IMPORTATION
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { UserData } from '@/lib/types/user'
import { useUser } from '@/lib/hooks/useUser'
import { logAuthEvent } from '@/lib/logger'

// Mettre à jour les items du menu
const menuItems = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'FINANCE', 'SUPER_ADMIN'] },
  { name: 'Envois & Colis', href: '/dashboard/shipments', icon: Package, roles: ['AGENT', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
  { name: 'Suivi (Tracking)', href: '/dashboard/tracking', icon: Truck, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
  { name: 'Scanner (Mise à jour)', href: '/dashboard/tracking/scan', icon: ScanLine, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
  { name: 'Clients & CRM', href: '/dashboard/crm', icon: Users, roles: ['AGENT', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
  { name: 'Finance & Revenus', href: '/dashboard/finance', icon: Wallet, roles: ['FINANCE', 'SUPER_ADMIN'] },
  
  // SECTION GÉOGRAPHIE & RÉSEAU
  { name: 'Régions', href: '/dashboard/regions', icon: MapPin, roles: ['SUPER_ADMIN', 'REGIONAL_MANAGER'] },
  { name: 'Villes', href: '/dashboard/cities', icon: Building2, roles: ['SUPER_ADMIN', 'REGIONAL_MANAGER'] },
  { name: 'Agences', href: '/dashboard/agencies', icon: MapPin, roles: ['SUPER_ADMIN'] },
  
  // AJOUTER LA NOUVELLE ENTRÉE POUR LES ROUTES
  { name: 'Routes', href: '/dashboard/routes', icon: Route, roles: ['SUPER_ADMIN', 'REGIONAL_MANAGER', 'AGENCY_MANAGER'] },
  
  // AUTRES SECTIONS
  { name: 'Rapports', href: '/dashboard/reports', icon: BarChart3, roles: ['AGENCY_MANAGER', 'SUPER_ADMIN'] },
  { name: 'Gestion Utilisateurs', href: '/dashboard/users', icon: UserCog, roles: ['SUPER_ADMIN'] },
  
  // AJOUTER UNE SECTION POUR LES PARAMÈTRES SI NÉCESSAIRE
  // { name: 'Paramètres', href: '/dashboard/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
];

// Fonction pour regrouper les items par catégorie
const menuCategories = [
  {
    name: 'Opérations',
    items: menuItems.filter(item => 
      ['Tableau de bord', 'Envois & Colis', 'Suivi (Tracking)', 'Scanner (Mise à jour)', 'Clients & CRM'].includes(item.name)
    )
  },
  {
    name: 'Géographie & Réseau',
    items: menuItems.filter(item => 
      ['Régions', 'Villes', 'Agences', 'Routes'].includes(item.name)
    )
  },
  {
    name: 'Administration',
    items: menuItems.filter(item => 
      ['Finance & Revenus', 'Rapports', 'Gestion Utilisateurs'].includes(item.name)
    )
  }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { user, userProfile, loading } = useUser();

  const [userData, setUserData] = useState<UserData | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        const data = await response.json();

        if (data?.user && data.userProfile) {
          setUserData(data as UserData);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
        await supabase.auth.signOut();
        router.push('/login');
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    if (user?.id) {
      await logAuthEvent('LOGOUT', user.id, userProfile?.id, { ip: 'getClientIpFromBrowser()' });
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loadingUser) return <div className="flex min-h-screen items-center justify-center">Chargement du profil...</div>;
  if (!userData?.user) {
    router.push('/login');
    return null;
  }

  const currentUserRoles = userData?.userProfile?.roles || [];
  const currentUserAgency = userData?.userProfile?.agency;

  const canAccess = (requiredRoles: string[]) => {
    return requiredRoles.some(role => currentUserRoles.includes(role)) || currentUserRoles.includes('SUPER_ADMIN');
  };

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-slate-50 dark:bg-slate-900">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-slate-950 min-h-screen fixed left-0 top-0">
        <div className="p-6 flex items-center gap-3 border-b h-16">
          <div className="relative w-8 h-8">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <span className="font-bold text-lg text-primary tracking-tight">POSTE RDC</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuCategories.map((category) => {
            // Filtrer les items accessibles dans cette catégorie
            const accessibleItems = category.items.filter(item => canAccess(item.roles));
            
            // Ne pas afficher la catégorie si aucun item accessible
            if (accessibleItems.length === 0) return null;

            return (
              <div key={category.name} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                  {category.name}
                </h3>
                <div className="space-y-1">
                  {accessibleItems.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                          ${isActive 
                            ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-200' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50'
                          }
                        `}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          {currentUserAgency && (
            <div className="mb-2 p-2 text-xs bg-blue-50/30 dark:bg-blue-900/30 rounded text-primary/80 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <div className="truncate">
                <div className="font-medium">{currentUserAgency.name}</div>
                <div className="text-xs opacity-75">
                  {currentUserAgency?.city?.name} • {currentUserAgency.code}
                </div>
              </div>
            </div>
          )}
          
          {/* Infos utilisateur */}
          <div className="mb-3 p-2 text-xs bg-slate-50 dark:bg-slate-800 rounded">
            <div className="font-medium truncate">
              {userData.userProfile?.full_name || 'Utilisateur'}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {currentUserRoles.map((role) => (
                <span key={role} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">
                  {role}
                </span>
              ))}
            </div>
          </div>

          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* MOBILE HEADER & CONTENT */}
      <div className="flex-1 md:ml-64">
        <header className="md:hidden flex h-16 items-center gap-4 border-b bg-white px-6 dark:bg-slate-950">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-6 border-b flex items-center gap-2">
                <div className="relative w-8 h-8">
                  <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="font-bold text-lg text-primary">POSTE RDC</span>
              </div>
              
              <nav className="flex-col gap-6 p-4 flex overflow-y-auto h-full">
                {menuCategories.map((category) => {
                  const accessibleItems = category.items.filter(item => canAccess(item.roles));
                  if (accessibleItems.length === 0) return null;

                  return (
                    <div key={category.name} className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                        {category.name}
                      </h3>
                      <div className="space-y-1">
                        {accessibleItems.map((item) => {
                          const isActive = pathname === item.href || 
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center gap-2 p-2 rounded-md text-lg font-medium transition-colors 
                                ${isActive 
                                  ? 'bg-primary/10 text-primary' 
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50'}
                              `}
                            >
                              <item.icon className="h-5 w-5" />
                              {item.name}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>
              
              {/* Infos utilisateur mobile */}
              <div className="mt-auto p-4 border-t">
                {currentUserAgency && (
                  <div className="mb-2 p-2 text-xs bg-blue-50/30 dark:bg-blue-900/30 rounded text-primary/80">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-primary" />
                      <div className="font-medium truncate">{currentUserAgency.name}</div>
                    </div>
                    <div className="text-xs opacity-75 truncate">
                      {currentUserAgency?.city?.name} • {currentUserAgency.code}
                    </div>
                  </div>
                )}
                
                <div className="mb-3 p-2 text-xs bg-slate-50 dark:bg-slate-800 rounded">
                  <div className="font-medium truncate">
                    {userData.userProfile?.full_name || 'Utilisateur'}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentUserRoles.map(role => (
                      <span key={role} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 font-bold text-primary">Poste RDC</div>
          
          {/* Badge pour l'agence sur mobile */}
          {currentUserAgency && (
            <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full hidden sm:block">
              {currentUserAgency.code}
            </div>
          )}
        </header>

        {/* CONTENU DE LA PAGE */}
        <main className="p-4 md:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}
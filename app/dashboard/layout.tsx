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
  Building2, // Pour le nom de l'agence
  UserCog
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client' // Client browser pour les actions (logout)
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { UserData } from '@/lib/types/user'

// Définition du menu avec rôles requis
const menuItems = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'FINANCE', 'SUPER_ADMIN'] },
  { name: 'Envois & Colis', href: '/dashboard/shipments', icon: Package, roles: ['AGENT', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
  { name: 'Suivi (Tracking)', href: '/dashboard/tracking', icon: Truck, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
  { name: 'Scanner (Mise à jour)', href: '/dashboard/tracking/scan', icon: ScanLine, roles: ['AGENT', 'DRIVER', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
  { name: 'Clients & CRM', href: '/dashboard/crm', icon: Users, roles: ['AGENT', 'AGENCY_MANAGER', 'SUPER_ADMIN'] },
  { name: 'Finance & Revenus', href: '/dashboard/finance', icon: Wallet, roles: ['FINANCE', 'SUPER_ADMIN'] },
  { name: 'Agences', href: '/dashboard/agencies', icon: MapPin, roles: ['SUPER_ADMIN'] }, // Réservé aux admins
  { name: 'Rapports', href: '/dashboard/reports', icon: BarChart3, roles: ['AGENCY_MANAGER', 'SUPER_ADMIN'] },
  { name: 'Gestion Utilisateurs', href: '/dashboard/users', icon: UserCog, roles: ['SUPER_ADMIN'] },
  // { name: 'Paramètres', href: '/dashboard/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient() // Client browser pour logout

  const [userData, setUserData] = useState<UserData | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Récupération des données utilisateur via les headers ajoutés par le middleware
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user'); // Endpoint factice pour déclencher la lecture des headers
        const data = await response.json();

        if (data?.user && data.userProfile) {
          setUserData(data as UserData);
        } else {
          // Si pas d'utilisateur dans les headers, c'est que le middleware a redirigé
          // ou que la session est expirée. On ne devrait pas arriver ici si le middleware fonctionne.
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
        // En cas d'erreur, force la déconnexion pour revenir au login
        await supabase.auth.signOut();
        router.push('/login');
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Gérer le cas où l'utilisateur est en cours de chargement ou n'existe pas
  if (loadingUser) return <div className="flex min-h-screen items-center justify-center">Chargement du profil...</div>;
  if (!userData?.user) { // Si pas d'utilisateur après vérification
     router.push('/login'); // Redirige au cas où le middleware n'aurait pas géré
     return null;
  }

  const currentUserRoles = userData?.userProfile?.roles || [];
  const currentUserAgency = userData?.userProfile?.agency;

  // Fonction pour vérifier si l'utilisateur a au moins un des rôles requis pour un menu item
  const canAccess = (requiredRoles: string[]) => {
    return requiredRoles.some(role => currentUserRoles.includes(role)) || currentUserRoles.includes('SUPER_ADMIN'); // SUPER_ADMIN a toujours accès
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

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            // Vérifier si l'utilisateur a l'un des rôles requis pour afficher le lien
            if (!canAccess(item.roles)) return null;

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
        </nav>

        <div className="p-4 border-t">
          {currentUserAgency && (
            <div className="mb-2 p-2 text-xs bg-blue-50/30 dark:bg-blue-900/30 rounded text-primary/80 flex items-center gap-2">
               <Building2 className="h-4 w-4 text-primary" />
               {currentUserAgency?.city?.name} - {currentUserAgency.name}
            </div>
          )}
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
        {/* Header Mobile seulement */}
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
              <nav className="flex-col gap-2 p-4 flex overflow-y-auto h-full">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href
                  if (!canAccess(item.roles)) return null;

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
              </nav>
              {/* Infos utilisateur mobile */}
              <div className="mt-auto p-4 border-t">
                 {currentUserAgency && (
                    <div className="mb-2 p-2 text-xs bg-blue-50/30 dark:bg-blue-900/30 rounded text-primary/80 flex items-center gap-2">
                       <Building2 className="h-4 w-4 text-primary" />
                       {currentUserAgency?.city?.name} - {currentUserAgency.name}
                    </div>
                  )}
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
        </header>

        {/* CONTENU DE LA PAGE */}
        <main className="p-4 md:p-8 min-h-[calc(100vh-4rem)]"> {/* Ajustement pour couvrir toute la hauteur */}
          {children}
        </main>
      </div>
    </div>
  )
}
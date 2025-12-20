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
  ScanLine
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Définition du menu
const menuItems = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Envois & Colis', href: '/dashboard/shipments', icon: Package }, // Module 4.3
  { name: 'Suivi (Tracking)', href: '/dashboard/tracking', icon: Truck }, // Module 4.4
  { name: 'Scanner (Mise à jour)', href: '/dashboard/tracking/scan', icon: ScanLine }, // Module 4.4.1
  { name: 'Agences', href: '/dashboard/agencies', icon: MapPin }, // Module 4.2
  { name: 'Clients & CRM', href: '/dashboard/crm', icon: Users }, // Module 4.5
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
              <div className="p-6 border-b">
                 <span className="font-bold text-lg text-primary">POSTE RDC</span>
              </div>
              <nav className="flex-col gap-2 p-4 flex">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 text-lg font-medium"
                  >
                     <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex-1 font-bold text-primary">Poste RDC</div>
        </header>

        {/* CONTENU DE LA PAGE */}
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
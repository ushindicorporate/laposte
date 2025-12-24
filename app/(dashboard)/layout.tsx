// /app/(dashboard)/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useUser } from '@/lib/hooks/useUser'
import { Loader2 } from 'lucide-react'
import { AppSidebar } from './_components/layout/app-sidebar'
import { ModeToggle } from '@/components/mode-toggle'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, userProfile, loading } = useUser()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Protection de route basique (Le Middleware doit faire le gros du travail, ceci est une sécurité UX)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !userProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
           <p className="text-sm text-muted-foreground animate-pulse">Chargement de l'espace de travail...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <AppSidebar userProfile={userProfile} />
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300 ease-in-out">
        
        {/* HEADER (Modifié pour inclure le Toggle) */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-6 sticky top-0 z-40">
          
          {/* Partie Gauche : Titre + Menu Mobile */}
          <div className="flex items-center gap-4">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r-sidebar-border bg-sidebar">
                <AppSidebar userProfile={userProfile} className="border-none" />
              </SheetContent>
            </Sheet>
            
            {/* Breadcrumb ou Titre Dynamique (A améliorer plus tard) */}
            <div className="font-semibold text-lg hidden sm:block">
              La Poste RDC <span className="text-muted-foreground font-normal mx-2">/</span> Espace Opérationnel
            </div>
            <div className="font-semibold text-lg sm:hidden">Poste RDC</div>
          </div>

          {/* Partie Droite : Actions Globales */}
          <div className="flex items-center gap-2">
            
            {/* LE TOGGLE THEME EST ICI */}
            <ModeToggle />
            
          </div>
        </header>

        {/* CONTENU PRINCIPAL SCROLLABLE */}
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
             {children}
          </div>
        </main>
      </div>
    </div>
  )
}
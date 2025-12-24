// /components/layout/app-sidebar.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { dashboardConfig } from '../../_config/dashboard'
import { UserNav } from './user-nav'

interface AppSidebarProps {
  userProfile: any // Remplace 'any' par ton type Profile réel (ex: UserProfile)
  className?: string
}

export function AppSidebar({ userProfile, className }: AppSidebarProps) {
  const pathname = usePathname()
  const userRoles = userProfile?.roles || []

  // Helper pour vérifier les droits
  const canAccess = (allowedRoles: string[]) =>
    userRoles.includes('SUPER_ADMIN') || allowedRoles.some(r => userRoles.includes(r))

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-r border-sidebar-border", className)}>
      
      {/* 1. HEADER LOGO */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="relative w-8 h-8">
          <Image src="/logo.png" alt="Poste RDC" fill className="object-contain" priority />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-sidebar-foreground text-sm">
            POSTE RDC
          </span>
          <span className="text-[10px] text-muted-foreground font-medium bg-sidebar-accent px-1.5 py-0.5 rounded w-fit">
            ERP v1.0
          </span>
        </div>
      </div>

      {/* 2. NAVIGATION SCROLLABLE */}
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-4 px-4">
          {dashboardConfig.map((category, index) => {
            // Filtrer les items visibles pour l'utilisateur
            const visibleItems = category.items.filter(item => canAccess(item.roles))
            if (!visibleItems.length) return null

            return (
              <div key={index} className="space-y-1">
                <h4 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 font-mono">
                  {category.name}
                </h4>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* 3. USER FOOTER (Sera géré par UserNav pour le dropdown) */}
      <div className="border-t border-sidebar-border p-4">
         <UserNav userProfile={userProfile} />
      </div>
    </div>
  )
}
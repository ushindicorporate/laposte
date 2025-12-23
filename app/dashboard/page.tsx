// /app/dashboard/page.tsx - Version mise à jour
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Package, Truck, AlertTriangle, CheckCircle, MapPin, Building2, Users, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useUser } from '@/lib/hooks/useUser' // ← Importer useUser

export default function DashboardHome() {
  const [stats, setStats] = useState({
    total: 0,
    inTransit: 0,
    delivered: 0,
    issues: 0
  })
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()
  const { user, userProfile, loading: userLoading } = useUser() // ← Utiliser useUser

  useEffect(() => {
    async function loadStats() {
      // Auth check via useUser
      if (!userLoading && !user) {
        router.push('/login')
        return
      }

      if (user) {
        // Calcul des stats
        const { data: shipments } = await supabase.from('shipments').select('status')
        
        if (shipments) {
          setStats({
            total: shipments.length,
            inTransit: shipments.filter(s => ['IN_TRANSIT', 'ARRIVED_AT_AGENCY', 'OUT_FOR_DELIVERY'].includes(s.status)).length,
            delivered: shipments.filter(s => s.status === 'DELIVERED').length,
            issues: shipments.filter(s => s.status === 'ISSUE').length
          })
        }
        setLoading(false)
      }
    }
    
    if (!userLoading) {
      loadStats()
    }
  }, [router, supabase, user, userLoading])

  if (userLoading || loading) return <div className="p-8">Chargement du tableau de bord...</div>

  // Fonction utilitaire pour vérifier les rôles
  const hasRole = (role: string) => {
    return userProfile?.roles?.includes(role) || false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Tableau de Bord</h1>
        <p className="text-muted-foreground">
          Bienvenue, {userProfile?.full_name || user?.email}
          {userProfile?.agency && ` (${userProfile.agency.name})`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Envois</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Depuis le début du mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Transit (Actifs)</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">En mouvement dans le réseau</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Livraisons réussies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problèmes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.issues}</div>
            <p className="text-xs text-muted-foreground">Nécessitent une action</p>
          </CardContent>
        </Card>

      </div>

      {/* CARTES D'ACCÈS RAPIDE AVEC RBAC */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Carte Régions - visible seulement pour SUPER_ADMIN et REGIONAL_MANAGER */}
        {(hasRole('SUPER_ADMIN') || hasRole('REGIONAL_MANAGER')) && (
          <Link href="/dashboard/regions">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Régions</CardTitle>
                <MapPin className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Gérer</div>
                <p className="text-xs text-muted-foreground">
                  Gestion des régions postales
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Carte Villes - visible seulement pour SUPER_ADMIN et REGIONAL_MANAGER */}
        {(hasRole('SUPER_ADMIN') || hasRole('REGIONAL_MANAGER')) && (
          <Link href="/dashboard/cities">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Villes</CardTitle>
                <Building2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Gérer</div>
                <p className="text-xs text-muted-foreground">
                  Gestion des villes par région
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Carte Agences - visible seulement pour SUPER_ADMIN */}
        {hasRole('SUPER_ADMIN') && (
          <Link href="/dashboard/agencies">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agences</CardTitle>
                <Building2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Gérer</div>
                <p className="text-xs text-muted-foreground">
                  Gestion des agences postales
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Carte Rapports - visible pour AGENCY_MANAGER et SUPER_ADMIN */}
        {(hasRole('AGENCY_MANAGER') || hasRole('SUPER_ADMIN')) && (
          <Link href="/dashboard/reports">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rapports</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Analyser</div>
                <p className="text-xs text-muted-foreground">
                  Rapports et statistiques
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Carte Utilisateurs - visible seulement pour SUPER_ADMIN */}
        {hasRole('SUPER_ADMIN') && (
          <Link href="/dashboard/users">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Gérer</div>
                <p className="text-xs text-muted-foreground">
                  Gestion des utilisateurs et rôles
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

      </div>

      {/* Zone Graphique ou Tableau récent */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-50 flex items-center justify-center text-muted-foreground bg-slate-50 rounded border border-dashed">
              Graphique des volumes (Phase 2)
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Performance Agences</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-50 flex items-center justify-center text-muted-foreground bg-slate-50 rounded border border-dashed">
              Top Agences (Phase 2)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
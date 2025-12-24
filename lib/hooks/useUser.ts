// lib/hooks/useUser.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserData } from '@/lib/types/user'
import { createClient } from '@/lib/supabase/client' // Ton client browser

export const useUser = () => {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const refreshUser = useCallback(async () => {
    try {
      // On appelle notre nouvelle API Route
      const res = await fetch('/api/user')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setUserData(data)
    } catch (error) {
      setUserData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // 1. Chargement initial
    refreshUser()

    // 2. Abonnement aux changements d'état (Login, Logout, Token Refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserData(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // On recharge les données profil complètes si la session change
        refreshUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshUser, supabase])

  return {
    user: userData?.user ?? null,
    userProfile: userData?.userProfile ?? null,
    loading,
    refreshUser // Utile pour forcer le rafraîchissement après une modification de profil
  }
}
'use client'

import { useEffect, useState } from 'react'
import { UserData } from '@/lib/types/user'

export const useUser = () => {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user')

        if (!res.ok) {
          setUserData(null)
          return
        }

        const data = await res.json()

        if (data?.user && data?.userProfile) {
          setUserData(data as UserData)
        } else {
          setUserData(null)
        }
      } catch (error) {
        console.error('useUser error:', error)
        setUserData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return {
    user: userData?.user,
    userProfile: userData?.userProfile,
    loading,
  }
}

'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        // Si pas connecté, on renvoie au login
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    getUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return <div className="p-8">Vérification de l'accès...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center bg-white p-6 rounded-lg shadow mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
            <p className="text-gray-500">Bienvenue, {user.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 transition"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Carte factice pour montrer la structure */}
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm uppercase font-bold">Colis en transit</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm uppercase font-bold">Livrés aujourd'hui</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm uppercase font-bold">Problèmes signalés</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
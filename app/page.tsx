'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [regions, setRegions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getRegions() {
      // On récupère les régions depuis la table 'regions'
      const { data, error } = await supabase.from('regions').select('*')
      
      if (error) console.error('Erreur:', error)
      else setRegions(data || [])
      
      setLoading(false)
    }

    getRegions()
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Poste RDC - Système de Gestion 🇨🇩</h1>
      
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h2 className="text-2xl mb-4">Test de connexion BDD :</h2>
        
        {loading ? (
          <p>Chargement des données...</p>
        ) : (
          <div className="grid gap-4">
            {regions.map((region) => (
              <div key={region.id} className="p-4 border rounded bg-gray-100 dark:bg-gray-800">
                <p className="font-bold">{region.name}</p>
                <p className="text-xs text-gray-500">{region.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
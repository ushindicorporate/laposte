'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client' // Vérifie que c'est bien le bon chemin selon ton projet

// Shadcn UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Identifiants incorrects. Veuillez réessayer.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      
      {/* Container Principal */}
      <Card className="w-full max-w-[400px] shadow-xl border-t-4 border-t-primary">
        <CardHeader className="flex flex-col items-center space-y-2 pb-6 pt-8">
          
          {/* LOGO CENTRÉ */}
          <div className="relative w-28 h-28 mb-2">
            <Image 
              src="/logo.png" 
              alt="Logo La Poste RDC" 
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-primary">Connexion</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Portail de gestion postal
            </p>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            {/* Groupe Email */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-left font-medium">Email professionnel</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nom.prenom@laposte.cd" 
                required 
                className="h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Groupe Password */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                required 
                className="h-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2 pb-8">
            <Button 
              className="w-full bg-primary hover:bg-blue-700 text-white font-bold h-10 text-md transition-all" 
              type="submit" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Ouverture de session...' : 'Se connecter'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {/* Footer légal */}
      <div className="absolute bottom-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} La Poste RDC. Système sécurisé.
      </div>
    </div>
  )
}
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Identifiants incorrects. Veuillez réessayer.')
      setLoading(false)
      return
    }

    // Redirection temporaire (sera améliorée avec RBAC)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="flex flex-col items-center space-y-2 pt-8 pb-6">
          <div className="relative w-28 h-28">
            <Image
              src="/logo.png"
              alt="Logo La Poste RDC"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">Connexion</h1>
            <p className="text-sm text-muted-foreground">
              Portail de gestion postal
            </p>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email professionnel</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom.prenom@laposte.cd"
                autoFocus
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </CardContent>

          <CardFooter className="pb-8 pt-2">
            <Button
              type="submit"
              className="w-full h-10 font-semibold"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="absolute bottom-6 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} La Poste RDC — Système sécurisé
      </div>
    </div>
  )
}

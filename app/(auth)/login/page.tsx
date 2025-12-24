// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Schéma de validation strict
const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
})

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        // Gestion d'erreur pro : on ne dit pas si c'est l'email ou le mdp qui est faux (sécurité)
        toast.error("Échec de connexion", {
          description: "Vérifiez vos identifiants et réessayez.",
        })
        return
      }

      toast.success("Connexion réussie", {
        description: "Redirection vers votre espace de travail...",
      })
      
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error("Erreur système", {
        description: "Une erreur inattendue est survenue."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Connexion</h1>
        <p className="text-balance text-muted-foreground">
          Saisissez vos identifiants professionnels pour accéder au portail.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="agent@poste.cd" 
                    type="email" 
                    autoComplete="email"
                    disabled={isLoading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Mot de passe</FormLabel>
                  <Link
                    href="/forgot-password" // À créer plus tard
                    className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-primary"
                  >
                    Oublié ?
                  </Link>
                </div>
                <FormControl>
                  <Input 
                    type="password" 
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Besoin d&apos;un accès ?{" "}
        <span className="underline cursor-help" title="Contactez la DSI">
          Contactez votre administrateur
        </span>
      </div>
    </>
  )
}
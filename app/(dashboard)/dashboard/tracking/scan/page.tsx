import { Metadata } from "next"
import { getAuthenticatedUserWithProfile } from "@/lib/auth.server" // Ta fonction existante ou équivalent
import { createClient } from "@/lib/supabase/server"
import { ScanForm } from "@/components/tracking/scan-form"

export const metadata: Metadata = { title: "Scanner" }

export default async function ScanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // On récupère l'agence de l'agent
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user?.id)
    .single()

  if (!profile?.agency_id) {
    return <div className="p-10 text-center text-destructive">Erreur : Vous n'êtes affecté à aucune agence.</div>
  }

  return (
    <div className="space-y-6 pt-10">
      <ScanForm currentAgencyId={profile.agency_id} />
    </div>
  )
}
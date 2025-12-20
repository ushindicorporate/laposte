import { createClient } from '@/lib/supabase/server' // Note l'import SERVER ici
import TransactionList from '@/components/finance/TransactionList'
import { redirect } from 'next/navigation'

export default async function FinancePage() {
  // 1. Connexion Supabase Côté Serveur
  const supabase = await createClient()

  // 2. Vérification Auth (Côté Serveur)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 3. Récupération des données (Fetch)
  // On récupère les 100 dernières transactions pour l'instant
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      agencies (name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error("Erreur chargement finance:", error)
    return <div>Erreur lors du chargement des données financières.</div>
  }

  // 4. Rendu
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Finance & Revenus</h1>
        <p className="text-muted-foreground">Suivi des encaissements journaliers des agences.</p>
      </div>

      {/* On passe les données au composant Client */}
      <TransactionList initialTransactions={transactions || []} />
    </div>
  )
}
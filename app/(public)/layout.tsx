import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="h-16 flex items-center justify-between px-6 border-b bg-white dark:bg-slate-900">
        <div className="font-bold text-xl text-primary">POSTE RDC</div>
        <Link href="/login"><Button variant="ghost">Espace Agent</Button></Link>
      </header>
      <main className="flex-1 container mx-auto py-10">
        {children}
      </main>
    </div>
  )
}
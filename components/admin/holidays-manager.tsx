'use client'

import { useState } from "react"
import { toast } from "sonner"
import { Trash2, Plus, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { createHoliday, deleteHoliday } from "@/actions/admin"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function HolidaysManager({ holidays }: { holidays: any[] }) {
  const [date, setDate] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!date || !name) return toast.error("Remplir tous les champs")
    setLoading(true)
    const res = await createHoliday(date, name)
    setLoading(false)
    if (res.success) {
        toast.success("Jour férié ajouté")
        setDate("")
        setName("")
    }
  }

  const handleDelete = async (id: string) => {
    await deleteHoliday(id)
    toast.success("Supprimé")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jours Fériés & Chômés</CardTitle>
        <CardDescription>Impacte le calcul des délais de livraison.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Formulaire Ajout */}
        <div className="flex gap-2 items-end bg-muted/20 p-4 rounded-md border">
            <div className="space-y-1">
                <label className="text-xs font-medium">Date</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1 flex-1">
                <label className="text-xs font-medium">Nom de l'événement</label>
                <Input placeholder="Ex: Fête de l'Indépendance" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <Button size="icon" onClick={handleAdd} disabled={loading}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>

        {/* Liste */}
        <div className="border rounded-md">
            <Table>
                <TableBody>
                    {holidays.length === 0 ? (
                        <TableRow>
                            <TableCell className="text-center text-muted-foreground italic">Aucun jour configuré.</TableCell>
                        </TableRow>
                    ) : (
                        holidays.map(h => (
                            <TableRow key={h.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {format(new Date(h.holiday_date), "d MMMM", { locale: fr })}
                                    </div>
                                </TableCell>
                                <TableCell>{h.name}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDelete(h.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  )
}
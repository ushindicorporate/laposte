import { notFound } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { getShipmentByTracking } from "@/actions/shipments"
import { ReceiptPrintButton } from "@/components/shipments/receipt-print-button"

interface PageProps {
  params: { trackingNumber: string }
}

export default async function ReceiptPage({ params }: PageProps) {
  const shipment = await getShipmentByTracking(params.trackingNumber)

  if (!shipment) return notFound()

  return (
    <div className="min-h-screen bg-white p-8 text-black font-sans max-w-[210mm] mx-auto">
      
      {/* BOUTON IMPRESSION (Caché à l'impression) */}
      <div className="no-print mb-8 flex justify-end">
        <ReceiptPrintButton />
      </div>

      {/* EN-TÊTE */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider">La Poste RDC</h1>
          <p className="text-sm mt-1">Société Congolaise des Postes</p>
          <p className="text-sm">Agence : {shipment.origin_agency?.name}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">REÇU DE DÉPÔT</h2>
          <p className="font-mono text-lg mt-1">{shipment.tracking_number}</p>
          <p className="text-sm mt-1">Date : {format(new Date(shipment.created_at), "dd/MM/yyyy")}</p>
        </div>
      </div>

      {/* INFO EXPÉDITEUR / DESTINATAIRE */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="border p-4 rounded-sm">
          <h3 className="font-bold text-sm uppercase mb-2 border-b pb-1">Expéditeur</h3>
          <p className="font-bold">{shipment.sender_name}</p>
          <p className="text-sm">{shipment.sender_phone}</p>
          <p className="text-sm">{shipment.sender_address}</p>
        </div>
        <div className="border p-4 rounded-sm">
          <h3 className="font-bold text-sm uppercase mb-2 border-b pb-1">Destinataire</h3>
          <p className="font-bold">{shipment.recipient_name}</p>
          <p className="text-sm">{shipment.recipient_phone}</p>
          <p className="text-sm">{shipment.destination_agency?.city?.name} ({shipment.destination_agency?.code})</p>
        </div>
      </div>

      {/* DÉTAILS COLIS */}
      <div className="mb-8">
        <h3 className="font-bold text-sm uppercase mb-2">Détails de l'envoi</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-2 text-sm">Description</th>
              <th className="text-right py-2 text-sm">Poids</th>
              <th className="text-right py-2 text-sm">Quantité</th>
            </tr>
          </thead>
          <tbody>
            {shipment.items?.map((item: any, i: number) => (
              <tr key={i} className="border-b border-gray-300">
                <td className="py-2 text-sm">{item.description}</td>
                <td className="py-2 text-sm text-right">{item.weight_kg} kg</td>
                <td className="py-2 text-sm text-right">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAIEMENT */}
      <div className="flex justify-end mb-12">
        <div className="w-1/2">
          <div className="flex justify-between py-2 border-b">
            <span>Poids Total</span>
            <span className="font-bold">{shipment.weight_kg} kg</span>
          </div>
          <div className="flex justify-between py-2 border-b text-xl font-bold bg-gray-100 px-2">
            <span>TOTAL PAYÉ</span>
            <span>{shipment.total_price} $</span>
          </div>
          <div className="mt-2 text-right text-xs uppercase">
            Statut : {shipment.payment_status === 'PAID' ? 'PAYÉ' : 'EN ATTENTE'}
          </div>
        </div>
      </div>

      {/* FOOTER LÉGAL */}
      <div className="text-center text-xs text-gray-500 mt-auto pt-8 border-t">
        <p>Merci de votre confiance. Pour suivre votre colis, rendez-vous sur <strong>poste.cd/track</strong></p>
        <p className="mt-1">Les conditions générales de transport s'appliquent. La responsabilité est limitée en cas de perte non assurée.</p>
        
        {/* Code Barres (Simulation CSS) */}
        <div className="mt-6 flex flex-col items-center">
            <div className="h-12 w-64 bg-[url('/barcode-pattern.png')] bg-repeat-x border border-black flex items-center justify-center opacity-50">
                {/* Ici on mettrait un vrai composant code-barres (ex: react-barcode) */}
                <span className="sr-only">Code Barres</span>
            </div>
            <span className="font-mono text-sm mt-1 tracking-[0.2em]">{shipment.tracking_number}</span>
        </div>
      </div>

    </div>
  )
}
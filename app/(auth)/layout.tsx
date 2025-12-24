// app/(auth)/layout.tsx
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* COLONNE GAUCHE (Image & Branding) - Caché sur mobile */}
      <div className="hidden bg-muted lg:block relative overflow-hidden">
        {/* Overlay couleur primaire pour teinter l'image */}
        <div className="absolute inset-0 bg-primary/90 mix-blend-multiply z-10" />
        
        {/* Logo en haut à gauche */}
        <div className="absolute top-10 left-10 z-20 flex items-center text-lg font-medium text-white">
          <div className="relative h-8 w-8 mr-2">
             {/* Remplace par ton vrai logo blanc si tu as */}
             <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-primary font-bold">
              <Image
                src="/logo.png" // Mets une image pro ici plus tard
                alt="Opérations Postales"
                fill
                className="object-cover"
                priority
              />
             </div>
          </div>
          La Poste RDC
        </div>

        {/* Image de fond (Suggestion : Une carte de la RDC ou un camion postal) */}
        <Image
          src="/logo.png" // Mets une image pro ici plus tard
          alt="Opérations Postales"
          fill
          className="object-cover grayscale"
          priority
        />

        {/* Citation / Footer institutionnel */}
        <div className="absolute bottom-10 left-10 right-10 z-20">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium text-white">
              &ldquo;Assurer la connectivité logistique et financière de chaque citoyen, de Kinshasa aux zones les plus reculées.&rdquo;
            </p>
            <footer className="text-sm text-white/80">
              — Direction Générale
            </footer>
          </blockquote>
        </div>
      </div>

      {/* COLONNE DROITE (Formulaire) */}
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-87.5 gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}
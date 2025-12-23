// app/_components/marketing/HomeCard.tsx
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";

export default function HomeCard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md text-center shadow-xl border-t-4 border-primary">
        <CardHeader className="space-y-3 pt-8">
          <div className="relative mx-auto h-24 w-24">
            <Image
              src="/logo.png"
              alt="La Poste RDC"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-primary">
            La Poste RDC
          </h1>
          <CardDescription>
            Système national de gestion postale
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Accédez à la plateforme sécurisée pour la gestion, le suivi et
            l’optimisation des opérations postales.
          </p>

          <Link href="/login">
            <Button className="w-full h-11 text-base font-semibold">
              Accéder au système
            </Button>
          </Link>
        </CardContent>
      </Card>

      <footer className="absolute bottom-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} La Poste RDC – Usage interne sécurisé
      </footer>
    </div>
  );
}

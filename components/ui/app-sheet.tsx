// components/ui/app-sheet.tsx
'use client'

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface AppSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function AppSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className
}: AppSheetProps) {
  
  // Cette fonction fait le pont entre l'event de Shadcn/Radix et ton state
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {/* 
         Note: On ne met PAS de SheetTrigger ici car l'ouverture est contrôlée par le parent.
         On passe directement le state 'open' au composant Root.
      */}
      <SheetContent className={`sm:max-w-125 w-full overflow-y-auto ${className}`}>
        <SheetHeader className="mb-6">
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>
        
        {/* Le contenu (Formulaire) est rendu ici */}
        <div className="mt-2">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
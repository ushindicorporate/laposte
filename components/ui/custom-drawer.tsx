// components/ui/custom-drawer.tsx
'use client'

import { X } from "lucide-react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

interface CustomDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
}

export function CustomDrawer({
  isOpen,
  onClose,
  title,
  description,
  children,
}: CustomDrawerProps) {
  
  // Petit bonus UX : Empêcher le scroll de la page quand le drawer est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Si fermé, on ne rend RIEN. Radical.
  if (!isOpen) return null

  return (
    // Z-INDEX TRÈS ÉLEVÉ pour passer au dessus de tout
    <div className="fixed inset-0 z-100 flex justify-end">
      
      {/* 1. LE BACKDROP (Fond noir transparent) */}
      {/* On clique dessus -> ça ferme */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 2. LE PANNEAU LATÉRAL */}
      <div className="relative z-10 h-full w-full max-w-125 border-l bg-background p-6 shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          
          {/* Bouton Croix */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenu (Formulaire) */}
        <div className="overflow-y-auto h-[calc(100vh-100px)] pb-10">
          {children}
        </div>

      </div>
    </div>
  )
}
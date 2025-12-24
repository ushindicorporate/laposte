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

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset"
    return () => { document.body.style.overflow = "unset" }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-100 flex justify-end">
      
      {/* ✅ SEUL le backdrop ferme */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ✅ Le panel ne ferme JAMAIS */}
      <div
        className="relative z-10 h-full w-full max-w-125 border-l bg-background p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-100px)] pb-10">
          {children}
        </div>
      </div>
    </div>
  )
}
"use client"

import { Toaster as SonnerToaster, toast } from "sonner"

const Toaster = () => {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
        },
      }}
    />
  )
}

const useToast = () => {
  return { toast }
}

export { Toaster, useToast, toast }

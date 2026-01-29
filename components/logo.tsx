import React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "light" | "dark"
}

export function Logo({ className, showText = false, size = "md", variant = "light" }: LogoProps) {
  // Dimensions adaptées pour chaque taille
  const sizeConfig = {
    sm: { width: 120, height: 40 },
    md: { width: 160, height: 55 },
    lg: { width: 200, height: 70 },
    xl: { width: 250, height: 85 },
  }

  const dimensions = sizeConfig[size]

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/logo.png"
        alt="A-Logistics"
        width={dimensions.width}
        height={dimensions.height}
        className={cn(
          "object-contain",
          // Si le variant est dark et que l'image a besoin d'être inversée
          // vous pouvez ajouter: variant === "dark" && "brightness-0 invert"
        )}
        priority
      />
    </div>
  )
}

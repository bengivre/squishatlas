import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-input text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-moon-gold focus-visible:ring-[3px] focus-visible:ring-moon-gold disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-moon-gold text-night-deep hover:bg-moon-gold/90",
        destructive:
          "bg-blush text-night-deep hover:bg-blush/90 focus-visible:ring-moon-gold",
        outline:
          "border border-star-dim/20 bg-night-plum text-lamplight hover:bg-night-plum/80 hover:text-lamplight",
        secondary:
          "bg-night-plum text-lamplight hover:bg-night-plum/80",
        ghost:
          "text-lamplight hover:bg-night-plum hover:text-lamplight",
        link: "text-moon-gold underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 min-h-11 px-4 py-2 has-[>svg]:px-3",
        xs: "h-11 min-h-11 gap-1 rounded-input px-3 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-11 min-h-11 gap-1.5 rounded-input px-3 has-[>svg]:px-2.5",
        lg: "h-11 min-h-11 rounded-input px-6 has-[>svg]:px-4",
        icon: "size-11 min-h-11 min-w-11",
        "icon-xs": "size-11 min-h-11 min-w-11 rounded-input [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-11 min-h-11 min-w-11",
        "icon-lg": "size-11 min-h-11 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

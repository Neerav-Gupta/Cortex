import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[color,background-color,border-color,transform] duration-150 ease-fb active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary: ink fill, paper text. Hover deepens fill — no lift.
        default: "bg-ink text-paper hover:bg-ink/90",
        // Destructive: secondary shape with redline text + icon.
        destructive:
          "border border-rule bg-transparent text-redline hover:border-redline hover:bg-redline/10",
        // Secondary / outline: transparent, hairline border, ink text.
        outline:
          "border border-rule bg-transparent text-ink hover:border-rule-strong hover:bg-paper-3",
        secondary:
          "border border-rule bg-transparent text-ink hover:border-rule-strong hover:bg-paper-3",
        ghost: "text-ink hover:bg-paper-3",
        link: "text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

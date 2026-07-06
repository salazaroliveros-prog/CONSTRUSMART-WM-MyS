import * as React from "react"
import { cn } from "@/lib/utils"

type CardVariant = "default" | "interactive" | "kpi" | "modal" | "glass"
type AccentPosition = "top" | "left" | "none"

export interface ElevatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  accent?: AccentPosition
  accentColor?: string
  padding?: "none" | "sm" | "md" | "lg"
  hoverable?: boolean
  onClick?: () => void
}

const paddingMap = {
  none: "",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5 md:p-6",
  lg: "p-5 sm:p-6 md:p-8",
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-card border-border/40 card-elevation",
  interactive: "bg-card border-border/40 card-interactive",
  kpi: "border-border/40 card-kpi",
  modal: "bg-card border-border/40 elevation-dialog",
  glass: "bg-card/70 backdrop-blur-md border-border/30 card-elevation",
}

const accentClasses: Record<AccentPosition, string> = {
  top: "relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-primary before:to-primary/50 before:opacity-0 before:transition-opacity before:duration-250 hover:before:opacity-100",
  left: "relative overflow-hidden before:absolute before:top-0 before:left-0 before:bottom-0 before:w-[3px] before:bg-gradient-to-b before:from-primary before:to-primary/50 before:opacity-0 before:transition-opacity before:duration-250 hover:before:opacity-100",
  none: "",
}

const ElevatedCard = React.forwardRef<HTMLDivElement, ElevatedCardProps>(
  ({
    className,
    variant = "default",
    accent = "none",
    accentColor,
    padding = "md",
    hoverable = false,
    onClick,
    children,
    ...props
  }, ref) => {
    const isClickable = onClick !== undefined || hoverable

    return (
      <div
        ref={ref}
        onClick={onClick}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() } : undefined}
        className={cn(
          "rounded-xl",
          variantClasses[variant],
          accentClasses[accent],
          paddingMap[padding],
          isClickable && "cursor-pointer select-none",
          "transition-shadow transition-transform duration-250 ease-in-out",
          className
        )}
        style={
          accentColor && (accent === "top" || accent === "left")
            ? {
                "--card-accent-color": accentColor,
                backgroundImage: undefined,
              } as React.CSSProperties
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    )
  }
)
ElevatedCard.displayName = "ElevatedCard"

const ElevatedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-3", className)}
    {...props}
  />
))
ElevatedCardHeader.displayName = "ElevatedCardHeader"

const ElevatedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base sm:text-lg font-semibold leading-tight tracking-tight text-foreground flex items-center gap-2",
      className
    )}
    {...props}
  />
))
ElevatedCardTitle.displayName = "ElevatedCardTitle"

const ElevatedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs sm:text-sm text-muted-foreground", className)}
    {...props}
  />
))
ElevatedCardDescription.displayName = "ElevatedCardDescription"

const ElevatedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
ElevatedCardContent.displayName = "ElevatedCardContent"

const ElevatedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/40", className)}
    {...props}
  />
))
ElevatedCardFooter.displayName = "ElevatedCardFooter"

export {
  ElevatedCard,
  ElevatedCardHeader,
  ElevatedCardTitle,
  ElevatedCardDescription,
  ElevatedCardContent,
  ElevatedCardFooter,
}
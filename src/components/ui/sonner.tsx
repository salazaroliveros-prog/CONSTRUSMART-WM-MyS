
import React from "react"
import { Toaster as Sonner, toast } from "sonner"
import { useErp } from "@/erp/store"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { appSettings } = useErp()
  const theme = appSettings.appTheme === 'dark-pro' ? 'dark' : 'light'

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position={appSettings.toastPosition ?? "bottom-right"}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

 
export { Toaster, toast }

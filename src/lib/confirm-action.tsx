import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmActionOptions {
  title: string
  content?: string
  okText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  centered?: boolean
}

let rootInstance: { root: Root; container: HTMLDivElement } | null = null

function cleanup() {
  if (rootInstance) {
    try { rootInstance.root.unmount() } catch {}
    try { document.body.removeChild(rootInstance.container) } catch {}
    rootInstance = null
  }
}

export function confirmAction(options: ConfirmActionOptions): Promise<void> {
  cleanup()
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  rootInstance = { root, container }

  return new Promise<void>((resolve, reject) => {
    const handleCancel = () => {
      cleanup()
      reject(new Error('cancelled'))
    }

    const handleConfirm = () => {
      cleanup()
      resolve()
    }

    root.render(
      <Dialog open={true} onOpenChange={(open) => { if (!open) handleCancel() }}>
        <DialogContent className={options.centered ? '' : ''}>
          <DialogHeader>
            <DialogTitle>{options.title}</DialogTitle>
            {options.content && <DialogDescription>{options.content}</DialogDescription>}
          </DialogHeader>
          <DialogFooter className={options.centered ? 'sm:justify-center' : ''}>
            <Button variant="outline" onClick={handleCancel}>
              {options.cancelText || 'Cancelar'}
            </Button>
            <Button variant={options.variant === 'destructive' ? 'destructive' : 'default'} onClick={handleConfirm}>
              {options.okText || 'Aceptar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  })
}

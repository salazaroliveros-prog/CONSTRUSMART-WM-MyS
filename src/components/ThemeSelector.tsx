import { useState, useEffect } from 'react'
import { THEMES, ThemeName, applyTheme, getStoredTheme } from '@/lib/themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Eye } from 'lucide-react'

export function ThemeSelector() {
  const [activeTheme, setActiveTheme] = useState<ThemeName>(getStoredTheme())
  const [previewTheme, setPreviewTheme] = useState<ThemeName | null>(null)

  useEffect(() => {
    const stored = getStoredTheme()
    setActiveTheme(stored)
  }, [])

  const handleThemeChange = (themeName: ThemeName) => {
    const theme = THEMES[themeName]
    applyTheme(theme)
    setActiveTheme(themeName)
    setPreviewTheme(null)
  }

  const handleThemePreview = (themeName: ThemeName) => {
    if (previewTheme === themeName) {
      setPreviewTheme(null)
      const theme = THEMES[activeTheme]
      applyTheme(theme)
    } else {
      setPreviewTheme(themeName)
      const theme = THEMES[themeName]
      applyTheme(theme)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎨 Tema de la Aplicación</CardTitle>
          <CardDescription>
            Elige tu tema visual preferido. Los cambios se aplican instantáneamente en toda la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grid de temas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(THEMES).map(([key, theme]) => {
              const isActive = activeTheme === key
              const isPreviewing = previewTheme === key

              return (
                <div
                  key={key}
                  className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer group
                    ${isActive
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/50'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  {/* Preview de colores */}
                  <div className="space-y-3 mb-4">
                    <div className="flex gap-1.5">
                      <div
                        className="flex-1 h-6 rounded"
                        style={{
                          backgroundColor: `hsl(${theme.colors.primary})`,
                        }}
                        title="Primary"
                      />
                      <div
                        className="flex-1 h-6 rounded"
                        style={{
                          backgroundColor: `hsl(${theme.colors.secondary})`,
                        }}
                        title="Secondary"
                      />
                      <div
                        className="flex-1 h-6 rounded"
                        style={{
                          backgroundColor: `hsl(${theme.colors.accent})`,
                        }}
                        title="Accent"
                      />
                    </div>
                    <div
                      className="h-8 rounded border border-border"
                      style={{
                        backgroundColor: `hsl(${theme.colors.background})`,
                        color: `hsl(${theme.colors.foreground})`,
                      }}
                      title="Background"
                    />
                  </div>

                  {/* Nombre del tema */}
                  <p className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1">
                    {theme.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {theme.description}
                  </p>

                  {/* Botones de acción */}
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant={isActive ? 'default' : 'outline'}
                      className="flex-1 h-7 text-xs"
                      onClick={() => handleThemeChange(key as ThemeName)}
                    >
                      {isActive ? '✓ Activo' : 'Elegir'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleThemePreview(key as ThemeName)}
                      title={isPreviewing ? 'Cancelar preview' : 'Vista previa'}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Indicador activo */}
                  {isActive && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  {/* Indicador preview */}
                  {isPreviewing && (
                    <div className="absolute bottom-2 right-2 bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
                      Preview
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Información del tema activo */}
          <div className="pt-4 border-t border-border">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Tema Activo: {THEMES[activeTheme].label}</h3>
              <p className="text-xs text-muted-foreground">
                {THEMES[activeTheme].description}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="text-xs">
                  <p className="font-semibold text-muted-foreground">Border Radius</p>
                  <p className="text-foreground">{THEMES[activeTheme].styles.borderRadius}</p>
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-muted-foreground">Transición Base</p>
                  <p className="text-foreground">{THEMES[activeTheme].styles.transitions.base}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview interactivo */}
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-sm font-semibold">Vista Previa de Componentes</p>
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
              {/* Botones */}
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="default">
                  Botón Primary
                </Button>
                <Button size="sm" variant="secondary">
                  Botón Secondary
                </Button>
                <Button size="sm" variant="outline">
                  Botón Outline
                </Button>
                <Button size="sm" variant="destructive">
                  Eliminar
                </Button>
              </div>

              {/* Inputs */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Input text"
                  className="px-3 py-2 text-xs border border-border rounded-md bg-input text-foreground"
                  disabled
                />
                <select className="px-3 py-2 text-xs border border-border rounded-md bg-input text-foreground" disabled>
                  <option>Select option</option>
                </select>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-card border border-border">
                  <p className="text-xs font-semibold text-card-foreground mb-1">Card Title</p>
                  <p className="text-xs text-muted-foreground">Card description text</p>
                </div>
                <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                  <p className="text-xs font-semibold mb-1">Primary Card</p>
                  <p className="text-xs opacity-90">With accent styling</p>
                </div>
              </div>

              {/* Alert */}
              <div className="p-3 rounded-lg border-l-4 border-primary bg-primary/10 text-foreground">
                <p className="text-xs font-semibold">Alert Message</p>
                <p className="text-xs text-muted-foreground">Esta es una alerta de ejemplo</p>
              </div>

              {/* Badge */}
              <div className="flex gap-2 flex-wrap">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                  Badge Primary
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
                  Badge Secondary
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-accent text-accent-foreground">
                  Badge Accent
                </span>
              </div>
            </div>
          </div>

          {/* Nota importante */}
          <div className="p-3 rounded-lg bg-muted border border-border">
            <p className="text-xs text-muted-foreground">
              ℹ️ Tu preferencia de tema se guardará automáticamente. Los temas se aplican instantáneamente a toda la aplicación, incluidos login, módulos, tablas y componentes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ThemeSelector

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog"
import { Settings, RotateCcw, Zap } from "lucide-react"
import { useReimbursementSettings } from "@/lib/contexts/reimbursement-settings-context"

interface ReimbursementSettingsModalProps {
  children: React.ReactNode
}

export function ReimbursementSettingsModal({ children }: ReimbursementSettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useReimbursementSettings()
  const [isOpen, setIsOpen] = useState(false)

  const handleDelayChange = (value: string) => {
    const minutes = parseInt(value) || 0
    updateSettings({ delayMinutes: minutes })
  }

  const handleDistanceChange = (value: string) => {
    const km = parseInt(value) || 0
    updateSettings({ tripDistance: km })
  }

  const handleReset = () => {
    resetSettings()
  }

  const handleSimulationToggle = (enabled: boolean) => {
    updateSettings({ simulationMode: enabled })
    if (!enabled) {
      // Reset to defaults when simulation is turned off
      resetSettings()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Regelsimulering
          </DialogTitle>
          <DialogDescription>
            Simulera olika scenarion för att se hur ersättningsreglerna påverkar utbetalningen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Simulation Mode Toggle */}
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    Simuleringsläge
                  </CardTitle>
                  <CardDescription className="text-amber-700 dark:text-amber-300">
                    Aktivera för att testa olika regelscenarier
                  </CardDescription>
                </div>
                <Switch
                  checked={settings.simulationMode}
                  onCheckedChange={handleSimulationToggle}
                />
              </div>
            </CardHeader>
          </Card>

          {settings.simulationMode && (
            <>
              {/* Trip Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resedetaljer</CardTitle>
                  <CardDescription>
                    Påverkar vilka EU-regler som tillämpas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="distance">Reseavstånd (km)</Label>
                      <Input
                        id="distance"
                        type="number"
                        value={settings.tripDistance}
                        onChange={(e) => handleDistanceChange(e.target.value)}
                        min="0"
                        max="2000"
                      />
                      <p className="text-xs text-muted-foreground">
                        {settings.isLongDistance ? "Långdistans (EU 2021/782)" : "Kortdistans (SE 2015:953)"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delay">Försening (minuter)</Label>
                      <Input
                        id="delay"
                        type="number"
                        value={settings.delayMinutes}
                        onChange={(e) => handleDelayChange(e.target.value)}
                        min="0"
                        max="480"
                      />
                      <p className="text-xs text-muted-foreground">
                        {settings.hasDelay ? `${settings.delayMinutes} min försening` : "Ingen försening"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SJ Provided Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">SJ:s tjänster</CardTitle>
                  <CardDescription>
                    Tjänster som SJ redan tillhandahållit (minskar ersättning)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Mat och dryck</Label>
                      <p className="text-sm text-muted-foreground">
                        SJ bjöd på måltider/förfriskningar under väntan
                      </p>
                    </div>
                    <Switch
                      checked={settings.sjProvidedMeals}
                      onCheckedChange={(checked) => updateSettings({ sjProvidedMeals: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Logi</Label>
                      <p className="text-sm text-muted-foreground">
                        SJ ordnade hotellövernattning
                      </p>
                    </div>
                    <Switch
                      checked={settings.sjProvidedAccommodation}
                      onCheckedChange={(checked) => updateSettings({ sjProvidedAccommodation: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Alternativ transport</Label>
                      <p className="text-sm text-muted-foreground">
                        SJ ordnade buss/taxi som ersättning
                      </p>
                    </div>
                    <Switch
                      checked={settings.sjProvidedTransport}
                      onCheckedChange={(checked) => updateSettings({ sjProvidedTransport: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delay-based Rules Info */}
              {settings.hasDelay && (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">
                        Gällande regler för {settings.delayMinutes} minuters försening:
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        {settings.delayMinutes >= 60 && settings.isLongDistance && (
                          <>
                            <li>• Rätt till måltider och förfriskningar</li>
                            <li>• {settings.delayMinutes >= 120 ? "200 SEK" : "100 SEK"} max för mat/dryck</li>
                            {settings.delayMinutes >= 120 && <li>• Rätt till logi om övernattning krävs</li>}
                          </>
                        )}
                        {settings.delayMinutes >= 20 && !settings.isLongDistance && (
                          <>
                            <li>• Rätt till alternativ transport</li>
                            <li>• {settings.delayMinutes >= 60 ? "100 SEK" : "50 SEK"} max för mat/dryck</li>
                          </>
                        )}
                        {settings.delayMinutes < (settings.isLongDistance ? 60 : 20) && (
                          <li>• Ingen automatisk rätt till ersättning för utlägg</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Återställ
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Stäng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

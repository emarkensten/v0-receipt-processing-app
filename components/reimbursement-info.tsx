"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import type { ReimbursementSummary } from "@/lib/hooks/use-reimbursement-rules"

interface ReimbursementInfoProps {
  summary: ReimbursementSummary
  showDetails?: boolean
}

export function ReimbursementInfo({ summary, showDetails = false }: ReimbursementInfoProps) {
  const [showDetailedRules, setShowDetailedRules] = useState(false)
  
  const formatCurrency = (amount: number) => `${Math.round(amount)} SEK`
  const hasReductions = summary.totalExpenses > summary.totalReimbursement

  if (!hasReductions && !showDetails) {
    return null // Don't show info if no reductions and not explicitly requested
  }

  return (
    <>
      {/* Main Info Alert */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="space-y-2">
            <p className="font-medium">
              {hasReductions 
                ? "Ersättningen kan vara begränsad enligt SJ:s regler" 
                : "Ersättning beräknad enligt SJ:s regler"
              }
            </p>
            
            <div className="text-sm space-y-1">
              {summary.explanations.map((explanation, index) => (
                <p key={index}>• {explanation}</p>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-blue-700 dark:text-blue-300">
                    <Info className="h-3 w-3 mr-1" />
                    Visa detaljerade regler
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>SJ:s ersättningsregler</DialogTitle>
                    <DialogDescription>
                      Baserat på EU-förordning 2021/782 och svensk lag 2015:953
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Summary Statistics */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Sammanfattning</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span>Totalt utlägg:</span>
                          <span className="font-medium">{formatCurrency(summary.totalExpenses)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ersättning:</span>
                          <span className="font-medium text-green-600">{formatCurrency(summary.totalReimbursement)}</span>
                        </div>
                        {summary.totalExcluded > 0 && (
                          <div className="flex justify-between">
                            <span>Ej ersatt:</span>
                            <span className="font-medium text-red-600">{formatCurrency(summary.totalExcluded)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Per-Receipt Breakdown */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Detaljerad beräkning</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {summary.calculations.map((calc, index) => (
                          <div key={index} className="border rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Kvitto {index + 1}</span>
                              <Badge variant={calc.reimbursedAmount === calc.originalAmount ? "default" : "secondary"}>
                                {calc.appliedRule}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span>Ursprungligt belopp:</span>
                              <span>{formatCurrency(calc.originalAmount)}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span>Ersättning:</span>
                              <span className={calc.reimbursedAmount < calc.originalAmount ? "text-amber-600" : "text-green-600"}>
                                {formatCurrency(calc.reimbursedAmount)}
                                {calc.reimbursedAmount < calc.originalAmount && (
                                  <span className="ml-1">({Math.round(calc.reimbursementPercentage)}%)</span>
                                )}
                              </span>
                            </div>

                            {calc.exclusions.length > 0 && (
                              <div className="space-y-1">
                                {calc.exclusions.map((exclusion, i) => (
                                  <div key={i} className="flex items-center gap-1 text-sm text-red-600">
                                    <XCircle className="h-3 w-3" />
                                    {exclusion}
                                  </div>
                                ))}
                              </div>
                            )}

                            {calc.notes.length > 0 && (
                              <div className="space-y-1">
                                {calc.notes.map((note, i) => (
                                  <div key={i} className="flex items-center gap-1 text-sm text-blue-600">
                                    <CheckCircle className="h-3 w-3" />
                                    {note}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Rules Overview */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Gällande regler</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-green-700 dark:text-green-400">✅ Berättigade kostnader</h4>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• <strong>Måltider:</strong> Upp till 200 SEK vid förseningar över 60 minuter</li>
                            <li>• <strong>Logi:</strong> Upp till 1500 SEK per natt vid övernattning</li>
                            <li>• <strong>Alternativ transport:</strong> Upp till 1200 SEK vid förseningar</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-red-700 dark:text-red-400">❌ Exkluderade kostnader</h4>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Alkoholhaltiga drycker</li>
                            <li>• Tobaksprodukter</li>
                            <li>• Kostnader som SJ redan tillhandahållit</li>
                            <li>• Kostnader över fastställda gränser</li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-blue-700 dark:text-blue-400">ℹ️ Viktigt att veta</h4>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Kvitto krävs för alla kostnader</li>
                            <li>• Ersättning utbetalas inom 30 dagar</li>
                            <li>• Slutgiltig bedömning görs av SJ:s kundtjänst</li>
                            <li>• Baserat på EU-förordning 2021/782 och svensk lag</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </>
  )
}

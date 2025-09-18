"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trees } from "lucide-react"
import { ExpenseSelectionSheet } from "@/components/expense-selection-sheet"
import { ThemeToggle } from "@/components/theme-toggle"

interface WelcomeScreenProps {
  onStartExpenseFlow: () => void
  onSkip: () => void
  showExpenseSheet: boolean
  onCloseExpenseSheet: () => void
  uploadedFiles: File[]
  onFileUpload: (files: File[]) => void
  onRemoveFile: (index: number) => void
  isProcessing?: boolean
  error?: string | null
  processingProgress?: { current: number; total: number; currentFile: string }
}

export function WelcomeScreen({ 
  onStartExpenseFlow, 
  onSkip, 
  showExpenseSheet,
  onCloseExpenseSheet,
  uploadedFiles,
  onFileUpload,
  onRemoveFile,
  isProcessing,
  error,
  processingProgress = { current: 0, total: 0, currentFile: "" }
}: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <Trees className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground">
          Egna utlägg
        </h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground leading-relaxed">
          Om du lagt ut pengar för mat, boende eller alternativa transporter kan du ansöka om ersättning för det.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            onClick={onStartExpenseFlow}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            Lägg till egna utlägg
          </Button>
          
          <Button 
            onClick={onSkip}
            className="w-full"
            size="lg"
          >
            Hoppa över
          </Button>
        </div>
      </div>

      {/* Expense Selection Sheet */}
      <ExpenseSelectionSheet
        isOpen={showExpenseSheet}
        onClose={onCloseExpenseSheet}
        uploadedFiles={uploadedFiles}
        onFileUpload={onFileUpload}
        onRemoveFile={onRemoveFile}
        isProcessing={isProcessing}
        error={error}
        processingProgress={processingProgress}
      />
    </div>
  )
}

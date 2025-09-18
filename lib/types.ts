export interface Receipt {
  id: string
  image_url: string
  type: "expense"
  category: "Mat" | "Transport" | "Boende" | "Övrigt"
  date: string
  amount: number
  currency: string
  name: string // store_name
  website: string | null
  tax_amount: number | null
  tax_rate: number | null
  tax_type: string | null
  language: string
  metadata: {
    register_number: string | null
    cashier_name: string | null
    email: string | null
  }
  sj_approval: {
    status: "approved" | "rejected" | "warning"
    reason?: string
    category_mapped: "Mat" | "Boende" | "Alternativ transport" | "Ej godkänd"
    contains_alcohol: boolean
    contains_tobacco: boolean
    is_reimbursable: boolean
  }
}

export interface ExpenseSubmission {
  receipts: Receipt[]
  totalAmount: number
  contactInfo: {
    name: string
    email: string
    phone: string
  }
  travelDetails: {
    travelType: string
    delayReason?: string
    connectionMissed?: boolean
  }
}

export interface GetDocumentRequest {
  documentUrl: string
}

export interface SJValidationResult {
  category: "Mat" | "Boende" | "Alternativ transport" | "Ej godkänd"
  is_reimbursable: boolean
  contains_alcohol: boolean
  contains_tobacco: boolean
  warning_message?: string
  approval_status: "approved" | "rejected" | "warning"
}

export interface ProcessedReceiptData {
  store_name: string
  total_amount: number
  currency: string
  date: string
  tax_amount?: number
  tax_rate?: number
  tax_type?: string
  language: string
  website?: string
  email?: string
  register_number?: string
  cashier_name?: string
  items?: Array<{
    name: string
    price: number
    quantity?: number
  }>
  sj_validation: SJValidationResult
}

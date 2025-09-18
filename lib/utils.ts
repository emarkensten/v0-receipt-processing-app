export function getDomainFromEmail(email: string | null): string | null {
  if (!email) return null
  const match = email.match(/@(.+)/)
  return match ? match[1] : null
}

export function removeProtocolFromDomain(domain: string | null): string | null {
  if (!domain) return null
  return domain.replace(/^https?:\/\//, "").replace(/^www\./, "")
}

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ")
}

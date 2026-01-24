// Dynamic imports to avoid SSR issues
let heic2any: any = null
let imageCompression: any = null

// Lazy load libraries only when needed (client-side)
async function loadLibraries() {
  if (typeof window === "undefined") {
    throw new Error("Image processing is only available in the browser")
  }

  if (!heic2any) {
    heic2any = (await import("heic2any")).default
  }

  if (!imageCompression) {
    imageCompression = (await import("browser-image-compression")).default
  }
}

export interface ProcessedImage {
  file: File
  originalSize: number
  compressedSize: number
  originalFormat: string
  finalFormat: string
  processingTime: number
}

export interface ImageProcessorOptions {
  maxHeight: number
  maxWidth: number
  quality: number
  maxSizeMB: number
  useServerSideHEIC: boolean
}

const DEFAULT_OPTIONS: ImageProcessorOptions = {
  maxHeight: 2500,
  maxWidth: 2500,
  quality: 0.85,
  maxSizeMB: 2,
  useServerSideHEIC: true,
}

export class ImagePreprocessor {
  private options: ImageProcessorOptions

  constructor(options: Partial<ImageProcessorOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  async processFile(file: File): Promise<ProcessedImage> {
    const startTime = Date.now()
    const originalSize = file.size
    const originalFormat = file.type || this.getFileTypeFromName(file.name)

    console.log(
      `[ImagePreprocessor] Processing ${file.name} (${this.formatBytes(originalSize)}, ${originalFormat})`
    )

    try {
      let processedFile = file

      // Step 1: Convert HEIC to JPEG if needed
      if (this.isHEICFile(file)) {
        console.log("[ImagePreprocessor] Converting HEIC to JPEG...")

        // Try server-side first (more reliable), then fallback to client-side
        if (this.options.useServerSideHEIC) {
          try {
            processedFile = await this.convertHEICServerSide(file)
          } catch (serverError) {
            console.warn("[ImagePreprocessor] Server-side HEIC conversion failed, trying client-side...")
            await loadLibraries()
            processedFile = await this.convertHEICToJPEG(file)
          }
        } else {
          await loadLibraries()
          processedFile = await this.convertHEICToJPEG(file)
        }
      } else {
        // Load libraries for compression
        await loadLibraries()
      }

      // Step 2: Compress and resize image if it's too large
      if (this.needsCompression(processedFile)) {
        console.log("[ImagePreprocessor] Compressing image...")
        await loadLibraries()
        processedFile = await this.compressImage(processedFile)
      }

      const processingTime = Date.now() - startTime
      const compressedSize = processedFile.size

      console.log(
        `[ImagePreprocessor] Completed in ${processingTime}ms: ${this.formatBytes(originalSize)} → ${this.formatBytes(compressedSize)}`
      )

      return {
        file: processedFile,
        originalSize,
        compressedSize,
        originalFormat,
        finalFormat: processedFile.type,
        processingTime,
      }
    } catch (error) {
      console.error("[ImagePreprocessor] Processing failed:", error)

      // Fallback: return original file if processing fails
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        originalFormat,
        finalFormat: originalFormat,
        processingTime: Date.now() - startTime,
      }
    }
  }

  async processFiles(files: File[]): Promise<ProcessedImage[]> {
    const results = await Promise.allSettled(files.map((file) => this.processFile(file)))

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value
      } else {
        console.error(
          `[ImagePreprocessor] Failed to process file ${files[index].name}:`,
          result.reason
        )
        // Return original file as fallback
        return {
          file: files[index],
          originalSize: files[index].size,
          compressedSize: files[index].size,
          originalFormat: files[index].type,
          finalFormat: files[index].type,
          processingTime: 0,
        }
      }
    })
  }

  private isHEICFile(file: File): boolean {
    const fileName = file.name.toLowerCase()
    const fileType = file.type.toLowerCase()

    return (
      fileName.endsWith(".heic") ||
      fileName.endsWith(".heif") ||
      fileType.includes("heic") ||
      fileType.includes("heif")
    )
  }

  private async convertHEICServerSide(file: File): Promise<File> {
    try {
      // Read file as base64
      const base64 = await this.fileToBase64(file)

      // Call server-side API
      const response = await fetch("/api/convert-heic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64Data: base64,
          filename: file.name,
        }),
      })

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || "Conversion failed")
      }

      // Convert base64 back to File
      const convertedFile = await this.base64ToFile(result.data, file.name.replace(/\.(heic|heif)$/i, ".jpg"))

      console.log(
        `[ImagePreprocessor] Server-side HEIC conversion: ${this.formatBytes(file.size)} → ${this.formatBytes(convertedFile.size)}`
      )

      return convertedFile
    } catch (error) {
      console.error("[ImagePreprocessor] Server-side HEIC conversion failed:", error)
      throw error
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  private async base64ToFile(base64: string, filename: string): Promise<File> {
    const response = await fetch(base64)
    const blob = await response.blob()
    return new File([blob], filename, { type: "image/jpeg" })
  }

  private async convertHEICToJPEG(file: File): Promise<File> {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: this.options.quality,
      })

      // heic2any can return Blob or Blob[], handle both cases
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob

      // Create new file with .jpg extension
      const fileName = file.name.replace(/\.(heic|heif)$/i, ".jpg")
      return new File([blob], fileName, { type: "image/jpeg" })
    } catch (error) {
      console.error("[ImagePreprocessor] Client-side HEIC conversion failed:", error)
      throw new Error(`HEIC-konvertering misslyckades: ${error}`)
    }
  }

  private needsCompression(file: File): boolean {
    const sizeMB = file.size / (1024 * 1024)
    return sizeMB > this.options.maxSizeMB || !this.isImageFile(file)
  }

  private async compressImage(file: File): Promise<File> {
    try {
      const options = {
        maxSizeMB: this.options.maxSizeMB,
        maxWidthOrHeight: Math.max(this.options.maxWidth, this.options.maxHeight),
        useWebWorker: true,
        fileType: "image/jpeg" as const,
        quality: this.options.quality,
      }

      const compressedFile = await imageCompression(file, options)

      // Ensure the compressed file has the correct name and type
      const fileName = this.ensureJPEGExtension(file.name)
      return new File([compressedFile], fileName, { type: "image/jpeg" })
    } catch (error) {
      console.error("[ImagePreprocessor] Compression failed:", error)
      throw new Error(`Bildkomprimering misslyckades: ${error}`)
    }
  }

  private isImageFile(file: File): boolean {
    return file.type.startsWith("image/") || this.getFileTypeFromName(file.name).startsWith("image/")
  }

  private getFileTypeFromName(fileName: string): string {
    const extension = fileName.toLowerCase().split(".").pop()
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      heic: "image/heic",
      heif: "image/heif",
      pdf: "application/pdf",
    }
    return mimeTypes[extension || ""] || "application/octet-stream"
  }

  private ensureJPEGExtension(fileName: string): string {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "")
    return `${nameWithoutExt}.jpg`
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}

// Export a default instance
export const defaultImagePreprocessor = new ImagePreprocessor()

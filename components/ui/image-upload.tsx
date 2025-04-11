"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  onImagesCapture: (files: File[]) => void
  className?: string
}

export function ImageUpload({ onImagesCapture, className }: ImageUploadProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles)
      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)

      // Create preview URLs for the new files
      const newPreviewUrls: string[] = []
      newFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          newPreviewUrls.push(reader.result as string)
          if (newPreviewUrls.length === newFiles.length) {
            setPreviewUrls([...previewUrls, ...newPreviewUrls])
          }
        }
        reader.readAsDataURL(file)
      })

      onImagesCapture(updatedFiles)
    }
  }

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const removeImage = (index: number) => {
    const updatedPreviewUrls = [...previewUrls]
    updatedPreviewUrls.splice(index, 1)
    setPreviewUrls(updatedPreviewUrls)

    const updatedFiles = [...files]
    updatedFiles.splice(index, 1)
    setFiles(updatedFiles)

    onImagesCapture(updatedFiles)
  }

  const clearAllImages = () => {
    setPreviewUrls([])
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onImagesCapture([])
  }

  return (
    <div className={cn("relative w-full", className)}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        multiple
      />

      {previewUrls.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden h-40">
                <img
                  src={url || "/placeholder.svg"}
                  alt={`Ingredient ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-40 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={handleCameraClick}
            >
              <Plus className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-xs text-gray-500">Add more</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={clearAllImages}>
              Clear All
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center h-64 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={handleCameraClick}
        >
          <div className="flex flex-col items-center text-center">
            <Camera className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900">Take photos of your ingredients</p>
            <p className="text-xs text-gray-500 mt-1">or click to upload multiple images</p>
          </div>
        </div>
      )}
    </div>
  )
}

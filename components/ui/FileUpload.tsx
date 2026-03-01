'use client'

import { useRef, useState } from 'react'

interface FileUploadProps {
  onUpload: (file: File) => void
  isUploading: boolean
  uploadText?: string
}

export default function FileUpload({ onUpload, isUploading, uploadText = 'Upuść plik napisów' }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      onUpload(file)
    }
  }

  return (
    <div
      className={`relative bg-[#13151f] border-2 border-dashed rounded-[16px] p-6 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
        isDragging ? 'border-[#7c5af0] border-solid' : 'border-[#2e3148]'
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(124,90,240,0.14)] to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
      
      <div className="relative">
        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-[#7c5af0] to-[#9d7ef5] rounded-[14px] flex items-center justify-center shadow-lg shadow-purple-500/30">
          <i className="bi bi-cloud-arrow-up text-2xl text-white"></i>
        </div>
        
        <h3 className="text-sm font-semibold text-[#dde0ed] mb-1">
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Uploading...
            </span>
          ) : (
            uploadText
          )}
        </h3>
        
        <p className="text-[11px] text-[#666980]">
          <span className="inline-flex items-center gap-1">
            <i className="bi bi-file-earmark-text text-[#7c5af0] text-[10px]"></i>
            SRT
          </span>
          <span className="mx-1.5">•</span>
          <span className="inline-flex items-center gap-1">
            <i className="bi bi-file-earmark-text text-[#9d7ef5] text-[10px]"></i>
            ASS
          </span>
          <span className="mx-1.5">•</span>
          <span className="inline-flex items-center gap-1">
            <i className="bi bi-file-earmark-text text-[#e8a93a] text-[10px]"></i>
            VTT
          </span>
          <span className="mx-1.5">•</span>
          <span className="inline-flex items-center gap-1">
            <i className="bi bi-database text-[#2dd98f] text-[10px]"></i>
            100MB
          </span>
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".srt,.ass,.ssa,.vtt"
        className="hidden"
      />
    </div>
  )
}
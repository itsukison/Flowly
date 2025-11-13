'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'

interface DataImportProps {
  tableId: string
  columns: any[]
  onImportComplete?: () => void
}

export default function DataImport({ tableId, columns, onImportComplete }: DataImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ]

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      setErrorMessage('対応していないファイル形式です。Excel (.xlsx, .xls) または CSV (.csv) ファイルを選択してください。')
      setUploadStatus('error')
      return
    }

    setFile(selectedFile)
    setUploadStatus('idle')
    setErrorMessage('')
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadStatus('idle')
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tableId', tableId)

      const response = await fetch('/api/import/data', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('インポートに失敗しました')
      }

      const result = await response.json()
      setUploadStatus('success')

      if (onImportComplete) {
        onImportComplete()
      }
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : '予期せぬエラーが発生しました')
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setUploadStatus('idle')
    setErrorMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragging
            ? 'border-[#09090B] bg-[#F4F4F5]'
            : uploadStatus === 'error'
            ? 'border-red-300 bg-red-50'
            : uploadStatus === 'success'
            ? 'border-green-300 bg-green-50'
            : 'border-[#E4E4E7] hover:border-[#71717B]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploadStatus === 'idle' && !file && (
          <>
            <Upload className="w-16 h-16 text-[#71717B] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#09090B] mb-2">
              ファイルをドラッグ＆ドロップ
            </h3>
            <p className="text-sm text-[#71717B] mb-6">
              またはクリックしてファイルを選択
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
            >
              ファイルを選択
            </button>
            <p className="text-xs text-[#71717B] mt-4">
              対応形式: Excel (.xlsx, .xls), CSV (.csv)
            </p>
          </>
        )}

        {file && uploadStatus === 'idle' && (
          <div className="flex flex-col items-center">
            <FileText className="w-16 h-16 text-[#09090B] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#09090B] mb-2">
              {file.name}
            </h3>
            <p className="text-sm text-[#71717B] mb-6">
              サイズ: {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors disabled:opacity-50"
              >
                {isUploading ? 'インポート中...' : 'インポート開始'}
              </button>
              <button
                onClick={resetForm}
                disabled={isUploading}
                className="px-6 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#09090B] mb-2">
              インポート完了
            </h3>
            <p className="text-sm text-[#71717B] mb-6">
              データが正常にインポートされました
            </p>
            <button
              onClick={resetForm}
              className="px-6 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
            >
              別のファイルをインポート
            </button>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex flex-col items-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#09090B] mb-2">
              インポートエラー
            </h3>
            <p className="text-sm text-[#71717B] mb-6 max-w-md">
              {errorMessage || 'ファイルのインポート中にエラーが発生しました'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="px-6 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Column Mapping Info */}
      <div className="bg-[#F4F4F5] rounded-lg p-4">
        <h4 className="font-medium text-[#09090B] mb-3">列のマッピングについて</h4>
        <div className="space-y-2 text-sm text-[#71717B]">
          <p>
            • インポートするファイルの列名とテーブルの列名が自動的にマッピングされます
          </p>
          <p>
            • マッピングできない列は手動で設定できます
          </p>
          <p>
            • 既存のデータは上書きされず、新しいレコードとして追加されます
          </p>
          <div className="mt-3 pt-3 border-t border-[#E4E4E7]">
            <p className="font-medium text-[#09090B] mb-2">現在のテーブル列:</p>
            <div className="flex flex-wrap gap-2">
              {columns.map((column) => (
                <span
                  key={column.id}
                  className="px-2 py-1 bg-white rounded text-xs border border-[#E4E4E7]"
                >
                  {column.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
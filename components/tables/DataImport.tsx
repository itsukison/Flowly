'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { parseExcel, parseCSV, validateFile } from '@/lib/utils/fileParser'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const [parsedData, setParsedData] = useState<any>(null)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [showMapping, setShowMapping] = useState(false)
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

  const handleFileSelect = async (selectedFile: File) => {
    setErrorMessage('')
    setUploadStatus('idle')
    
    // Validate file
    const validation = validateFile(selectedFile)
    if (!validation.valid) {
      setErrorMessage(validation.error || 'ファイルが無効です')
      setUploadStatus('error')
      return
    }

    setFile(selectedFile)
    
    // Parse file
    try {
      let data: any
      const extension = selectedFile.name.split('.').pop()?.toLowerCase()
      
      if (extension === 'csv') {
        data = await parseCSV(selectedFile)
      } else {
        data = await parseExcel(selectedFile)
      }

      if (data.totalRows === 0) {
        setErrorMessage('ファイルにデータがありません')
        setUploadStatus('error')
        return
      }

      if (data.totalRows > 10000) {
        setErrorMessage('行数が上限を超えています（最大10,000行）')
        setUploadStatus('error')
        return
      }

      // Convert rows to data for API compatibility
      const parsedDataWithData = {
        ...data,
        data: data.rows // API expects 'data' property
      }
      setParsedData(parsedDataWithData)
      
      // Auto-map columns
      const autoMapping: Record<string, string> = {}
      data.headers.forEach((header: string) => {
        const normalizedHeader = header.toLowerCase().trim()
        const matchingColumn = columns.find(col => 
          col.name.toLowerCase() === normalizedHeader || 
          col.label.toLowerCase() === normalizedHeader
        )
        if (matchingColumn) {
          autoMapping[header] = matchingColumn.name
        }
      })
      setColumnMapping(autoMapping)
      setShowMapping(true)
      
    } catch (err: any) {
      setErrorMessage(err.message || 'ファイルの解析に失敗しました')
      setUploadStatus('error')
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!parsedData || !file) return

    setIsUploading(true)
    setUploadStatus('idle')
    setErrorMessage('')

    try {
      // Get organization_id and user_id from the table
      const response = await fetch(`/api/tables/${tableId}`)
      if (!response.ok) throw new Error('テーブル情報の取得に失敗しました')
      
      const tableData = await response.json()
      
      const importResponse = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: tableId,
          organization_id: tableData.organization_id,
          user_id: tableData.created_by,
          data: parsedData.data,
          mapping: columnMapping,
          options: {
            deduplicate: true,
            enrich: false
          }
        }),
      })

      if (!importResponse.ok) {
        const errorData = await importResponse.json()
        throw new Error(errorData.error || 'インポートに失敗しました')
      }

      const result = await importResponse.json()
      setUploadStatus('success')

      if (onImportComplete) {
        setTimeout(() => {
          onImportComplete()
        }, 1500)
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
    setParsedData(null)
    setColumnMapping({})
    setShowMapping(false)
    setUploadStatus('idle')
    setErrorMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Column Mapping */}
      {showMapping && parsedData && (
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 mb-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#09090B] mb-1">列のマッピング</h3>
              <p className="text-sm text-[#71717B]">
                インポートファイルの列をテーブルの列にマッピングしてください
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={isUploading || Object.keys(columnMapping).length === 0}
                className="px-4 py-2 text-sm bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors disabled:opacity-50"
              >
                {isUploading ? 'インポート中...' : 'インポート開始'}
              </button>
              <button
                onClick={resetForm}
                disabled={isUploading}
                className="px-4 py-2 text-sm border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {parsedData.headers.map((header: string) => (
              <div key={header} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#09090B]">
                    {header}
                  </label>
                </div>
                <div className="flex-1">
                  <Select
                    value={columnMapping[header] || '__none__'}
                    onValueChange={(value) => {
                      const newMapping = { ...columnMapping }
                      if (value === '__none__') {
                        delete newMapping[header]
                      } else {
                        newMapping[header] = value
                      }
                      setColumnMapping(newMapping)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="マッピングしない" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">マッピングしない</SelectItem>
                      {columns.map((col) => (
                        <SelectItem key={col.id} value={col.name}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
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
        {uploadStatus === 'idle' && !file && !showMapping && (
          <>
            <Upload className="w-12 h-12 text-[#71717B] mx-auto mb-3" />
            <h3 className="text-base font-medium text-[#09090B] mb-1">
              ファイルをドラッグ＆ドロップ
            </h3>
            <p className="text-sm text-[#71717B] mb-4">
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
              className="px-5 py-2 text-sm bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
            >
              ファイルを選択
            </button>
            <p className="text-xs text-[#71717B] mt-3">
              対応形式: Excel (.xlsx, .xls), CSV (.csv)
            </p>
          </>
        )}

        {file && uploadStatus === 'idle' && showMapping && parsedData && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-10 h-10 text-[#09090B]" />
              <div className="text-left">
                <h3 className="text-sm font-medium text-[#09090B]">
                  {file.name}
                </h3>
                <p className="text-xs text-[#71717B]">
                  {parsedData.totalRows}行、{parsedData.headers.length}列 • {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-[#09090B] mb-1">
              インポート完了
            </h3>
            <p className="text-sm text-[#71717B] mb-4">
              データが正常にインポートされました
            </p>
            <button
              onClick={resetForm}
              className="px-5 py-2 text-sm bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
            >
              別のファイルをインポート
            </button>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-[#09090B] mb-1">
              インポートエラー
            </h3>
            <p className="text-sm text-[#71717B] mb-4 max-w-md">
              {errorMessage || 'ファイルのインポート中にエラーが発生しました'}
            </p>
            <button
              onClick={resetForm}
              className="px-5 py-2 text-sm bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
            >
              再試行
            </button>
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
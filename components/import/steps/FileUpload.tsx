'use client'

import { useState, useCallback } from 'react'
import { Upload, File, X, AlertCircle } from 'lucide-react'
import { parseExcel, parseCSV, validateFile, ParsedData } from '@/lib/utils/fileParser'

interface FileUploadProps {
  onFileUploaded: (data: ParsedData) => void
}

export default function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }

  const handleFile = async (selectedFile: File) => {
    setError('')
    setFile(selectedFile)
    setParsing(true)

    // Validate file
    const validation = validateFile(selectedFile)
    if (!validation.valid) {
      setError(validation.error || 'ファイルが無効です')
      setParsing(false)
      return
    }

    try {
      let data: ParsedData

      const extension = selectedFile.name.split('.').pop()?.toLowerCase()
      if (extension === 'csv') {
        data = await parseCSV(selectedFile)
      } else {
        data = await parseExcel(selectedFile)
      }

      if (data.totalRows === 0) {
        setError('ファイルにデータがありません')
        setParsing(false)
        return
      }

      if (data.totalRows > 10000) {
        setError('行数が上限を超えています（最大10,000行）')
        setParsing(false)
        return
      }

      setParsedData(data)
    } catch (err: any) {
      setError(err.message || 'ファイルの解析に失敗しました')
    } finally {
      setParsing(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setParsedData(null)
    setError('')
  }

  const handleNext = () => {
    if (parsedData) {
      onFileUploaded(parsedData)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#09090B] mb-2">
          ファイルをアップロード
        </h2>
        <p className="text-[#71717B]">
          Excel（.xlsx, .xls）またはCSV（.csv）ファイルを選択してください
        </p>
      </div>

      {!file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
            ${isDragging 
              ? 'border-[#09090B] bg-[#F4F4F5]' 
              : 'border-[#E4E4E7] hover:border-[#09090B] hover:bg-[#FAFAFA]'
            }
          `}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-16 h-16 text-[#E4E4E7] mx-auto mb-4" />
            <p className="text-lg font-semibold text-[#09090B] mb-2">
              ファイルをドラッグ＆ドロップ
            </p>
            <p className="text-sm text-[#71717B] mb-4">
              または クリックして選択
            </p>
            <p className="text-xs text-[#A1A1AA]">
              対応形式: .xlsx, .xls, .csv（最大10MB、10,000行）
            </p>
          </label>
        </div>
      )}

      {file && !parsedData && !error && (
        <div className="border border-[#E4E4E7] rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <File className="w-12 h-12 text-[#09090B]" />
            <div className="flex-1">
              <p className="font-semibold text-[#09090B]">{file.name}</p>
              <p className="text-sm text-[#71717B]">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
            {parsing && (
              <div className="text-sm text-[#71717B]">解析中...</div>
            )}
          </div>
        </div>
      )}

      {parsedData && (
        <div className="border border-[#E4E4E7] rounded-2xl p-6 bg-[#FAFAFA]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <File className="w-12 h-12 text-[#0CB300]" />
              <div>
                <p className="font-semibold text-[#09090B]">{parsedData.fileName}</p>
                <p className="text-sm text-[#71717B]">
                  {parsedData.totalRows}行、{parsedData.headers.length}列
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#71717B]" />
            </button>
          </div>

          <div className="bg-white rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-[#09090B] mb-2">検出された列:</p>
            <div className="flex flex-wrap gap-2">
              {parsedData.headers.map((header, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-[#F4F4F5] text-[#09090B] text-xs rounded-full"
                >
                  {header}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-[#09090B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#27272A] transition-colors"
          >
            次へ：列をマッピング
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">エラー</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={handleRemoveFile}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}

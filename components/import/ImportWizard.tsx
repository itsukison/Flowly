'use client'

import { useState } from 'react'
import FileUpload from './FileUpload'
import ColumnMapper from './ColumnMapper'
import ImportPreview from './ImportPreview'
import DuplicateResolver from './DuplicateResolver'
import ImportProgress from './ImportProgress'
import ImportSummary from './ImportSummary'
import { ParsedData } from '@/lib/utils/fileParser'
import { ColumnMapping } from '@/lib/utils/columnMatcher'

interface ImportWizardProps {
  organizationId: string
  userId: string
  users: any[]
}

type Step = 'upload' | 'mapping' | 'preview' | 'duplicates' | 'importing' | 'summary'

export default function ImportWizard({ organizationId, userId, users }: ImportWizardProps) {
  const [step, setStep] = useState<Step>('upload')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [validRows, setValidRows] = useState<any[]>([])
  const [invalidRows, setInvalidRows] = useState<any[]>([])
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [importResult, setImportResult] = useState<any>(null)

  const handleFileUploaded = (data: ParsedData) => {
    setParsedData(data)
    setStep('mapping')
  }

  const handleMappingComplete = (columnMappings: ColumnMapping[]) => {
    const mappingObj: Record<string, string> = {}
    columnMappings.forEach(m => {
      if (m.targetField) {
        mappingObj[m.sourceColumn] = m.targetField
      }
    })
    setMappings(mappingObj)
    setStep('preview')
  }

  const handlePreviewComplete = (valid: any[], invalid: any[]) => {
    setValidRows(valid)
    setInvalidRows(invalid)
    setStep('duplicates')
  }

  const handleDuplicatesResolved = (rowsToImport: any[], dupsFound: any[]) => {
    setValidRows(rowsToImport)
    setDuplicates(dupsFound)
    setStep('importing')
  }

  const handleImportComplete = (result: any) => {
    setImportResult(result)
    setStep('summary')
  }

  const handleStartOver = () => {
    setParsedData(null)
    setMappings({})
    setValidRows([])
    setInvalidRows([])
    setDuplicates([])
    setImportResult(null)
    setStep('upload')
  }

  return (
    <div>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { key: 'upload', label: 'ファイル選択' },
            { key: 'mapping', label: '列マッピング' },
            { key: 'preview', label: 'プレビュー' },
            { key: 'duplicates', label: '重複確認' },
            { key: 'importing', label: 'インポート' },
            { key: 'summary', label: '完了' },
          ].map((s, index) => {
            const stepIndex = ['upload', 'mapping', 'preview', 'duplicates', 'importing', 'summary'].indexOf(step)
            const currentIndex = ['upload', 'mapping', 'preview', 'duplicates', 'importing', 'summary'].indexOf(s.key)
            const isActive = currentIndex === stepIndex
            const isCompleted = currentIndex < stepIndex

            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2
                      ${isActive ? 'bg-[#09090B] text-white' : ''}
                      ${isCompleted ? 'bg-[#0CB300] text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-[#F4F4F5] text-[#71717B]' : ''}
                    `}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span
                    className={`
                      text-xs text-center hidden md:block
                      ${isActive ? 'text-[#09090B] font-semibold' : 'text-[#71717B]'}
                    `}
                  >
                    {s.label}
                  </span>
                </div>
                {index < 5 && (
                  <div
                    className={`
                      h-0.5 flex-1 mx-2
                      ${isCompleted ? 'bg-[#0CB300]' : 'bg-[#E4E4E7]'}
                    `}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 md:p-8">
        {step === 'upload' && (
          <FileUpload onFileUploaded={handleFileUploaded} />
        )}

        {step === 'mapping' && parsedData && (
          <ColumnMapper
            headers={parsedData.headers}
            sampleRows={parsedData.rows.slice(0, 3)}
            onComplete={handleMappingComplete}
            onBack={() => setStep('upload')}
          />
        )}

        {step === 'preview' && parsedData && (
          <ImportPreview
            rows={parsedData.rows}
            mappings={mappings}
            organizationId={organizationId}
            userId={userId}
            onComplete={handlePreviewComplete}
            onBack={() => setStep('mapping')}
          />
        )}

        {step === 'duplicates' && (
          <DuplicateResolver
            rows={validRows}
            organizationId={organizationId}
            userId={userId}
            onComplete={handleDuplicatesResolved}
            onBack={() => setStep('preview')}
          />
        )}

        {step === 'importing' && (
          <ImportProgress
            rows={validRows}
            organizationId={organizationId}
            userId={userId}
            onComplete={handleImportComplete}
          />
        )}

        {step === 'summary' && importResult && (
          <ImportSummary
            result={importResult}
            totalRows={parsedData?.totalRows || 0}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  )
}

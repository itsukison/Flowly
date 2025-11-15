'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TableSelector from './TableSelector'
import FileUpload from '../steps/FileUpload'
import ColumnMapping from '../steps/ColumnMapping'
import DataPreview from '../steps/DataPreview'
import ImportProgress from '../steps/ImportProgress'

interface Table {
  id: string
  name: string
  icon: string | null
  description: string | null
}

interface ImportWizardProps {
  organizationId: string
  userId: string
  tables: Table[]
  users: any[]
}

type Step = 'table' | 'upload' | 'mapping' | 'preview' | 'importing'

export default function ImportWizard({ organizationId, userId, tables, users }: ImportWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('table')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [parsedData, setParsedData] = useState<any>(null)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [detectionResults, setDetectionResults] = useState<any>(null)

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table)
    setStep('upload')
  }

  const handleFileUpload = (data: any) => {
    setParsedData(data)
    setStep('mapping')
  }

  const handleMappingComplete = (mapping: Record<string, string>) => {
    setColumnMapping(mapping)
    // Run detection
    detectIssues(parsedData.data, mapping)
    setStep('preview')
  }

  const detectIssues = async (data: any[], mapping: Record<string, string>) => {
    // Detect duplicates and missing data
    const duplicates: any[] = []
    const missingEmail: any[] = []
    const missingPhone: any[] = []

    data.forEach((row, index) => {
      // Check for missing email
      const emailField = Object.keys(mapping).find(k => mapping[k] === 'email')
      if (emailField && !row[emailField]) {
        missingEmail.push({ index, row })
      }

      // Check for missing phone
      const phoneField = Object.keys(mapping).find(k => mapping[k] === 'phone')
      if (phoneField && !row[phoneField]) {
        missingPhone.push({ index, row })
      }

      // Simple duplicate detection by name
      const nameField = Object.keys(mapping).find(k => mapping[k] === 'name')
      if (nameField && row[nameField]) {
        const duplicateIndex = data.findIndex((r, i) => 
          i !== index && r[nameField]?.toLowerCase() === row[nameField]?.toLowerCase()
        )
        if (duplicateIndex !== -1 && duplicateIndex < index) {
          duplicates.push({ index, row, duplicateOf: duplicateIndex })
        }
      }
    })

    setDetectionResults({
      duplicates,
      missingEmail,
      missingPhone,
      totalRows: data.length,
    })
  }

  const handleImport = async (options: { deduplicate: boolean; enrich: boolean }) => {
    setStep('importing')

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: selectedTable?.id,
          organization_id: organizationId,
          user_id: userId,
          data: parsedData.data,
          mapping: columnMapping,
          options,
        }),
      })

      if (!response.ok) throw new Error('Import failed')

      // Redirect to table view
      router.push(`/dashboard/tables/${selectedTable?.id}`)
    } catch (error) {
      console.error('Import error:', error)
      alert('インポートに失敗しました')
      setStep('preview')
    }
  }

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden">
      {/* Progress Steps */}
      <div className="border-b border-[#E4E4E7] px-6 py-4">
        <div className="flex items-center justify-between">
          {[
            { key: 'table', label: 'テーブル選択' },
            { key: 'upload', label: 'ファイル' },
            { key: 'mapping', label: '列マッピング' },
            { key: 'preview', label: 'プレビュー' },
          ].map((s, index) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === s.key
                    ? 'bg-[#09090B] text-white'
                    : ['table', 'upload', 'mapping', 'preview'].indexOf(step) > index
                    ? 'bg-green-600 text-white'
                    : 'bg-[#F4F4F5] text-[#71717B]'
                }`}
              >
                {['table', 'upload', 'mapping', 'preview'].indexOf(step) > index ? '✓' : index + 1}
              </div>
              <span className="ml-2 text-sm font-medium text-[#09090B] hidden md:inline">
                {s.label}
              </span>
              {index < 3 && (
                <div className="w-12 md:w-24 h-0.5 bg-[#E4E4E7] mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {step === 'table' && (
          <TableSelector
            tables={tables}
            onSelect={handleTableSelect}
            organizationId={organizationId}
          />
        )}

        {step === 'upload' && selectedTable && (
          <FileUpload
            onFileUploaded={handleFileUpload}
          />
        )}

        {step === 'mapping' && parsedData && selectedTable && (
          <ColumnMapping
            data={parsedData}
            tableId={selectedTable.id}
            onComplete={handleMappingComplete}
            onBack={() => setStep('upload')}
          />
        )}

        {step === 'preview' && detectionResults && (
          <DataPreview
            data={parsedData.data}
            mapping={columnMapping}
            detectionResults={detectionResults}
            onImport={handleImport}
            onBack={() => setStep('mapping')}
          />
        )}

        {step === 'importing' && (
          <ImportProgress />
        )}
      </div>
    </div>
  )
}

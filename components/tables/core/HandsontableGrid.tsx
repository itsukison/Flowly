import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { HotTable } from '@handsontable/react-wrapper'
import { registerAllModules } from 'handsontable/registry'
import Handsontable from 'handsontable'
import { useRouter } from 'next/navigation'
import { DEFAULT_HANDSONTABLE_SETTINGS, COLUMN_TYPE_MAPPING } from '@/lib/handsontable-config'
import {
  createStatusRenderer,
  createCheckboxRenderer,
  createActionsRenderer,
  readOnlyRenderer,
} from './HandsontableRenderers'
import {
  emailValidator,
  phoneValidator,
  urlValidator,
  requiredValidator,
  numberValidator,
} from './HandsontableValidators'
import EditRecordModal from '../modals/EditRecordModal'
import DeleteRecordModal from '../modals/DeleteRecordModal'

// Register Handsontable modules
registerAllModules()

interface Column {
  id: string
  name: string
  label: string
  type: string
  options: any
  is_required: boolean | null
  display_order: number
}

interface Status {
  id: string
  name: string
  color: string | null
  display_order: number
}

interface TableRecord {
  id: string
  name?: string
  email?: string
  company?: string
  status?: string
  data: Record<string, any>
  organization_id?: string
  [key: string]: any
}

interface HandsontableGridProps {
  columns: Column[]
  statuses: Status[]
  records: TableRecord[]
  tableId: string
  onSelectionChange?: (selectedIds: string[]) => void
}

export default function HandsontableGrid({
  columns,
  statuses,
  records,
  tableId,
  onSelectionChange,
}: HandsontableGridProps) {
  const router = useRouter()
  const hotRef = useRef<any>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingRecord, setEditingRecord] = useState<TableRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<TableRecord | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Ensure all records have a data object initialized
  const normalizedRecords = useMemo(() => {
    return records.map(record => ({
      ...record,
      data: record.data || {},
    }))
  }, [records])

  // Debug logging
  console.log('HandsontableGrid - records:', normalizedRecords.length)
  console.log('HandsontableGrid - columns:', columns.length)

  // Handle checkbox toggle
  const handleCheckboxToggle = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }, [])

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    const newSet = checked ? new Set(normalizedRecords.map(r => r.id)) : new Set<string>()
    setSelectedIds(newSet)
  }, [normalizedRecords])

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIds))
  }, [selectedIds, onSelectionChange])

  // Build column definitions
  const columnDefs = useMemo(() => {
    const defs: any[] = []

    // Checkbox column for selection
    defs.push({
      data: '_checkbox',
      title: '<input type="checkbox" class="select-all-checkbox" />',
      readOnly: true,
      renderer: createCheckboxRenderer(selectedIds, normalizedRecords, handleCheckboxToggle),
      width: 50,
      className: 'htCenter htMiddle',
      disableVisualSelection: true,
    })

    // Dynamic columns from table definition
    columns.forEach((column) => {
      // Check if this is a direct property or nested in data JSONB
      const isDirectProperty = ['name', 'email', 'company'].includes(column.name)
      
      const colDef: any = {
        // Use function for nested JSONB fields, direct property for others
        data: isDirectProperty 
          ? column.name 
          : function(row: any, value?: any) {
              if (arguments.length === 1) {
                // Getter: return nested value from data object
                return row.data?.[column.name]
              }
              // Setter: set nested value in data object
              if (!row.data) {
                row.data = {}
              }
              row.data[column.name] = value
            },
        title: column.label,
        type: COLUMN_TYPE_MAPPING[column.type] || 'text',
        className: 'htLeft htMiddle',
      }

      // Add validator based on type
      if (column.is_required) {
        colDef.validator = requiredValidator
      } else if (column.type === 'email') {
        colDef.validator = emailValidator
      } else if (column.type === 'phone') {
        colDef.validator = phoneValidator
      } else if (column.type === 'url') {
        colDef.validator = urlValidator
      } else if (column.type === 'number') {
        colDef.validator = numberValidator
      }

      // Add dropdown source for select type
      if (column.type === 'select' && column.options?.choices) {
        colDef.source = column.options.choices
      }

      // Add date format
      if (column.type === 'date') {
        colDef.dateFormat = 'YYYY-MM-DD'
        colDef.correctFormat = true
      }

      defs.push(colDef)
    })

    // Status column
    defs.push({
      data: 'status',
      title: 'ステータス',
      type: 'dropdown',
      source: statuses.map(s => s.name),
      renderer: createStatusRenderer(statuses),
      width: 120,
      className: 'htCenter htMiddle',
    })

    // Actions column
    defs.push({
      data: '_actions',
      title: '操作',
      readOnly: true,
      renderer: createActionsRenderer(setEditingRecord, setDeletingRecord, normalizedRecords),
      width: 80,
      className: 'htRight htMiddle',
      disableVisualSelection: true,
    })

    return defs
  }, [columns, statuses, normalizedRecords, selectedIds, handleCheckboxToggle])

  // Handle data changes
  const handleAfterChange = useCallback(
    (changes: Handsontable.CellChange[] | null, source: string) => {
      if (!changes || source === 'loadData') return

      // Debounce save operations
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      setIsSaving(true)

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          for (const [row, prop, oldValue, newValue] of changes) {
            if (oldValue === newValue) continue

            const record = normalizedRecords[row]
            if (!record) continue

            // Determine which column was changed
            const changedColumn = columns.find(col => {
              const isDirectProperty = ['name', 'email', 'company'].includes(col.name)
              if (isDirectProperty) {
                return prop === col.name
              }
              // For function-based data accessors, prop will be the function itself
              // We need to check if this change is in the data object
              return typeof prop === 'function'
            })

            let updatePayload: any
            
            if (typeof prop === 'string') {
              // Direct property update (name, email, company, status)
              updatePayload = {
                [prop]: newValue,
              }
            } else {
              // Function-based accessor means it's a nested data field
              // The value is already set in the record.data by the function
              // We need to send the entire updated data object
              updatePayload = {
                data: record.data,
              }
            }

            // Save to Supabase using records API
            const response = await fetch(`/api/records/${record.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatePayload),
            })

            if (!response.ok) {
              throw new Error('Failed to save changes')
            }
          }

          // Refresh data
          router.refresh()
        } catch (error) {
          console.error('Error saving changes:', error)
          alert('変更の保存に失敗しました')
        } finally {
          setIsSaving(false)
        }
      }, 500)
    },
    [normalizedRecords, columns, tableId, router]
  )

  // Handle select all checkbox in header
  const handleAfterRender = useCallback(() => {
    const selectAllCheckbox = document.querySelector('.select-all-checkbox') as HTMLInputElement
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = normalizedRecords.length > 0 && selectedIds.size === normalizedRecords.length
      selectAllCheckbox.indeterminate = selectedIds.size > 0 && selectedIds.size < normalizedRecords.length
      
      selectAllCheckbox.onclick = (e) => {
        e.stopPropagation()
        handleSelectAll(selectAllCheckbox.checked)
      }
    }
  }, [normalizedRecords.length, selectedIds.size, handleSelectAll])

  // Handle row creation/deletion from context menu
  const handleBeforeCreateRow = useCallback(() => {
    // Allow row creation - will be handled by afterCreateRow
    return true
  }, [])

  const handleAfterCreateRow = useCallback(
    async (index: number, amount: number) => {
      try {
        // Get organization_id from first record
        const organizationId = normalizedRecords[0]?.organization_id
        if (!organizationId) {
          throw new Error('Organization ID not found')
        }

        // Create new empty records
        for (let i = 0; i < amount; i++) {
          const response = await fetch(`/api/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              table_id: tableId,
              organization_id: organizationId,
              status: statuses[0]?.name || null,
              data: {},
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to create record')
          }
        }

        // Refresh data
        router.refresh()
      } catch (error) {
        console.error('Error creating record:', error)
        alert('レコードの作成に失敗しました')
      }
    },
    [tableId, statuses, router, normalizedRecords]
  )

  const handleBeforeRemoveRow = useCallback(() => {
    // Confirm deletion
    return confirm('選択した行を削除しますか？')
  }, [])

  const handleAfterRemoveRow = useCallback(
    async (index: number, amount: number, physicalRows: number[]) => {
      try {
        // Delete the removed records
        for (const rowIndex of physicalRows) {
          const record = normalizedRecords[rowIndex]
          if (record) {
            const response = await fetch(`/api/records/${record.id}`, {
              method: 'DELETE',
            })

            if (!response.ok) {
              throw new Error('Failed to delete record')
            }
          }
        }

        // Refresh data
        router.refresh()
      } catch (error) {
        console.error('Error deleting record:', error)
        alert('レコードの削除に失敗しました')
      }
    },
    [normalizedRecords, router]
  )

  // Empty state
  if (normalizedRecords.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F4F4F5] flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#71717B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#09090B] mb-2">
          レコードがありません
        </h3>
        <p className="text-[#71717B]">
          最初のレコードを追加してください
        </p>
      </div>
    )
  }

  // Add afterInit hook to log when table is initialized
  const handleAfterInit = useCallback(() => {
    console.log('HotTable initialized')
  }, [])

  return (
    <>
      <div className="relative w-full" style={{ height: 'calc(100vh - 200px)' }}>
        {isSaving && (
          <div className="absolute top-2 right-2 z-50 bg-[#09090B] text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            保存中...
          </div>
        )}
        <HotTable
          ref={hotRef}
          data={normalizedRecords}
          columns={columnDefs}
          colHeaders={true}
          rowHeaders={true}
          height="100%"
          width="100%"
          licenseKey="non-commercial-and-evaluation"
          afterInit={handleAfterInit}
          afterChange={handleAfterChange}
          afterRender={handleAfterRender}
          beforeCreateRow={handleBeforeCreateRow}
          afterCreateRow={handleAfterCreateRow}
          beforeRemoveRow={handleBeforeRemoveRow}
          afterRemoveRow={handleAfterRemoveRow}
          stretchH="none"
          rowHeights={36}
          colWidths={150}
          autoRowSize={false}
          autoColumnSize={false}
          contextMenu={{
            items: {
              row_above: {
                name: '上に行を挿入',
              },
              row_below: {
                name: '下に行を挿入',
              },
              remove_row: {
                name: '行を削除',
              },
              separator1: '---------',
              copy: {
                name: 'コピー',
              },
              cut: {
                name: '切り取り',
              },
              separator2: '---------',
              undo: {
                name: '元に戻す',
              },
              redo: {
                name: 'やり直し',
              },
            },
          }}
        />
      </div>

      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          columns={columns}
          statuses={statuses}
          tableId={tableId}
          onClose={() => setEditingRecord(null)}
        />
      )}

      {deletingRecord && (
        <DeleteRecordModal
          record={deletingRecord}
          onClose={() => setDeletingRecord(null)}
        />
      )}
    </>
  )
}

'use client'

interface Column {
  name: string
  label: string
  type: string
  options?: any
  is_required?: boolean
}

interface DynamicFieldRendererProps {
  column: Column
  value: any
  onChange?: (value: any) => void
  readOnly?: boolean
}

export default function DynamicFieldRenderer({
  column,
  value,
  onChange,
  readOnly = false,
}: DynamicFieldRendererProps) {
  const handleChange = (newValue: any) => {
    if (onChange) {
      onChange(newValue)
    }
  }

  // Read-only display
  if (readOnly) {
    if (!value) {
      return <span className="text-[#A1A1AA]">-</span>
    }

    switch (column.type) {
      case 'date':
        return (
          <span className="text-sm text-[#09090B]">
            {new Date(value).toLocaleDateString('ja-JP')}
          </span>
        )
      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-sm text-blue-600 hover:underline">
            {value}
          </a>
        )
      case 'phone':
        return (
          <a href={`tel:${value}`} className="text-sm text-blue-600 hover:underline">
            {value}
          </a>
        )
      case 'url':
        return (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {value}
          </a>
        )
      case 'boolean':
        return (
          <span className="text-sm text-[#09090B]">
            {value ? '✓' : '✗'}
          </span>
        )
      case 'number':
        return <span className="text-sm text-[#09090B]">{value.toLocaleString()}</span>
      case 'multiselect':
        const values = Array.isArray(value) ? value : []
        return (
          <div className="flex flex-wrap gap-1">
            {values.map((v: string, i: number) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-[#F4F4F5] text-[#09090B]"
              >
                {v}
              </span>
            ))}
          </div>
        )
      default:
        return <span className="text-sm text-[#09090B]">{value}</span>
    }
  }

  // Editable fields
  const baseInputClass = "w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B]"

  switch (column.type) {
    case 'text':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={column.label}
          required={column.is_required}
          className={baseInputClass}
        />
      )

    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={column.label}
          required={column.is_required}
          rows={3}
          className={baseInputClass}
        />
      )

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={column.label}
          required={column.is_required}
          className={baseInputClass}
        />
      )

    case 'email':
      return (
        <input
          type="email"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={column.label}
          required={column.is_required}
          className={baseInputClass}
        />
      )

    case 'phone':
      return (
        <input
          type="tel"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={column.label}
          required={column.is_required}
          className={baseInputClass}
        />
      )

    case 'url':
      return (
        <input
          type="url"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={column.label}
          required={column.is_required}
          className={baseInputClass}
        />
      )

    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          required={column.is_required}
          className={baseInputClass}
        />
      )

    case 'boolean':
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleChange(e.target.checked)}
            className="w-4 h-4 rounded border-[#E4E4E7] text-[#09090B] focus:ring-[#09090B]"
          />
          <span className="text-sm text-[#71717B]">{column.label}</span>
        </label>
      )

    case 'select':
      const options = column.options || []
      return (
        <select
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          required={column.is_required}
          className={baseInputClass}
        >
          <option value="">選択してください</option>
          {options.map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )

    case 'multiselect':
      const multiselectOptions = column.options || []
      const selectedValues = Array.isArray(value) ? value : []
      
      return (
        <div className="space-y-2">
          {multiselectOptions.map((option: string) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={(e) => {
                  const newValues = e.target.checked
                    ? [...selectedValues, option]
                    : selectedValues.filter((v: string) => v !== option)
                  handleChange(newValues)
                }}
                className="w-4 h-4 rounded border-[#E4E4E7] text-[#09090B] focus:ring-[#09090B]"
              />
              <span className="text-sm text-[#09090B]">{option}</span>
            </label>
          ))}
        </div>
      )

    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={column.label}
          required={column.is_required}
          className={baseInputClass}
        />
      )
  }
}

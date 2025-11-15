/**
 * Custom cell renderers for Handsontable
 * These renderers create custom HTML for different cell types
 */

import Handsontable from 'handsontable'

interface Status {
  id: string
  name: string
  color: string | null
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

/**
 * Status renderer
 * Renders status as a colored badge
 */
export function createStatusRenderer(statuses: Status[]) {
  return function statusRenderer(
    instance: Handsontable,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: string | number,
    value: any,
    cellProperties: Handsontable.CellProperties
  ) {
    Handsontable.renderers.TextRenderer.apply(this, arguments as any)
    
    if (value) {
      const status = statuses.find(s => s.name === value)
      const color = status?.color || '#71717B'
      
      td.innerHTML = `
        <span style="
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
          background-color: ${color}20;
          color: ${color};
          white-space: nowrap;
        ">
          ${value}
        </span>
      `
    } else {
      td.textContent = ''
    }
    
    return td
  }
}

/**
 * Checkbox renderer for row selection
 * Renders a checkbox in the first column
 */
export function createCheckboxRenderer(
  selectedIds: Set<string>,
  customers: TableRecord[],
  onToggle: (id: string, checked: boolean) => void
) {
  return function checkboxRenderer(
    instance: Handsontable,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: string | number,
    value: any,
    cellProperties: Handsontable.CellProperties
  ) {
    td.innerHTML = ''
    td.style.textAlign = 'center'
    td.style.verticalAlign = 'middle'
    
    const customer = customers[row]
    if (!customer) return td
    
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = selectedIds.has(customer.id)
    checkbox.className = 'cursor-pointer w-4 h-4'
    checkbox.style.accentColor = '#09090B'
    
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation()
      onToggle(customer.id, checkbox.checked)
    })
    
    td.appendChild(checkbox)
    return td
  }
}

/**
 * Actions renderer
 * Renders an action button that opens a menu
 */
export function createActionsRenderer(
  onEdit: (customer: TableRecord) => void,
  onDelete: (customer: TableRecord) => void,
  customers: TableRecord[]
) {
  return function actionsRenderer(
    instance: Handsontable,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: string | number,
    value: any,
    cellProperties: Handsontable.CellProperties
  ) {
    td.innerHTML = ''
    td.style.textAlign = 'right'
    td.style.verticalAlign = 'middle'
    td.style.position = 'relative'
    
    const customer = customers[row]
    if (!customer) return td
    
    const button = document.createElement('button')
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
      </svg>
    `
    button.className = 'p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors'
    button.style.border = 'none'
    button.style.background = 'transparent'
    button.style.cursor = 'pointer'
    button.style.color = '#71717B'
    
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      
      // Create dropdown menu
      const menu = document.createElement('div')
      menu.className = 'absolute right-0 mt-2 w-48 bg-white border border-[#E4E4E7] rounded-lg shadow-lg z-50'
      menu.style.top = '100%'
      
      const editButton = document.createElement('button')
      editButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        編集
      `
      editButton.className = 'w-full flex items-center px-4 py-2 text-sm hover:bg-[#F4F4F5] transition-colors'
      editButton.style.border = 'none'
      editButton.style.background = 'transparent'
      editButton.style.cursor = 'pointer'
      editButton.style.textAlign = 'left'
      editButton.addEventListener('click', () => {
        onEdit(customer)
        menu.remove()
      })
      
      const deleteButton = document.createElement('button')
      deleteButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        削除
      `
      deleteButton.className = 'w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
      deleteButton.style.border = 'none'
      deleteButton.style.background = 'transparent'
      deleteButton.style.cursor = 'pointer'
      deleteButton.style.textAlign = 'left'
      deleteButton.addEventListener('click', () => {
        onDelete(customer)
        menu.remove()
      })
      
      menu.appendChild(editButton)
      menu.appendChild(deleteButton)
      
      // Close menu when clicking outside
      const closeMenu = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
          menu.remove()
          document.removeEventListener('click', closeMenu)
        }
      }
      
      setTimeout(() => {
        document.addEventListener('click', closeMenu)
      }, 0)
      
      td.appendChild(menu)
    })
    
    td.appendChild(button)
    return td
  }
}

/**
 * Read-only text renderer with proper styling
 */
export function readOnlyRenderer(
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: any,
  cellProperties: Handsontable.CellProperties
) {
  Handsontable.renderers.TextRenderer.apply(this, arguments as any)
  td.style.backgroundColor = '#F4F4F5'
  td.style.color = '#71717B'
  return td
}

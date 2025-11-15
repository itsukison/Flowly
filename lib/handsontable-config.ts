/**
 * Handsontable Configuration
 * 
 * This file contains the license key and default settings for Handsontable.
 * 
 * License Options:
 * - 'non-commercial-and-evaluation' - For non-commercial use and evaluation
 * - Commercial key - For commercial use (requires purchase)
 * 
 * To use a commercial license, replace the license key below with your purchased key.
 * Get a license at: https://handsontable.com/pricing
 */

export const HANDSONTABLE_LICENSE_KEY = 'non-commercial-and-evaluation'

/**
 * Default Handsontable settings that match Flowly's design system
 */
export const DEFAULT_HANDSONTABLE_SETTINGS = {
  licenseKey: HANDSONTABLE_LICENSE_KEY,
  
  // Layout
  stretchH: 'all' as const, // Stretch columns to fill width
  autoWrapRow: true,
  autoWrapCol: true,
  
  // Features
  contextMenu: true, // Right-click menu
  manualColumnResize: true, // Resize columns
  manualColumnMove: true, // Reorder columns
  columnSorting: true, // Sort by column
  filters: true, // Filter by column
  dropdownMenu: true, // Column dropdown menu
  
  // Advanced features
  undo: true, // Enable undo/redo
  copyPaste: true, // Enable copy/paste
  fillHandle: true, // Enable drag to fill
  
  // Row/Column headers
  rowHeaders: true, // Show row numbers
  colHeaders: true, // Show column headers
  
  // Selection
  selectionMode: 'multiple' as const, // Allow multiple cell selection
  outsideClickDeselects: false, // Keep selection on outside click
  
  // Editing
  enterMoves: { row: 1, col: 0 }, // Move down on Enter
  tabMoves: { row: 0, col: 1 }, // Move right on Tab
  
  // Performance
  renderAllRows: false, // Use virtualization
  viewportRowRenderingOffset: 30, // Render 30 extra rows above/below viewport
  viewportColumnRenderingOffset: 10, // Render 10 extra columns left/right
  
  // Optimize rendering
  preventOverflow: 'horizontal' as const,
  trimWhitespace: false, // Don't trim for better performance
  
  // Styling
  className: 'htCenter htMiddle', // Center align by default
  
  // Language - removed ja-JP as it's not included by default
  // language: 'ja-JP',
  
  // Keyboard shortcuts
  fragmentSelection: true, // Enable Ctrl+C/V for fragments
}

/**
 * Column type mappings from Flowly to Handsontable
 */
export const COLUMN_TYPE_MAPPING: Record<string, string> = {
  text: 'text',
  email: 'text',
  phone: 'text',
  url: 'text',
  select: 'dropdown',
  date: 'date',
  number: 'numeric',
  textarea: 'text',
  checkbox: 'checkbox',
}

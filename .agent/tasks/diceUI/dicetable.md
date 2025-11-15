Data Grid
A high-performance editable data grid component with virtualization, keyboard navigation, and cell editing capabilities.

Docs
API
Copy Markdown
Open
Preview
Code

Installation
Install the main component and dependencies:

npm
pnpm
yarn
bun

npx shadcn@2.4.0-canary.12 add "https://diceui.com/r/data-grid"
Install the DataGridSortMenu (optional):

npm
pnpm
yarn
bun

npx shadcn@2.4.0-canary.12 add "https://diceui.com/r/data-grid-sort-menu"
Install the DataGridRowHeightMenu (optional):

npm
pnpm
yarn
bun

npx shadcn@2.4.0-canary.12 add "https://diceui.com/r/data-grid-row-height-menu"
Install the DataGridViewMenu (optional):

npm
pnpm
yarn
bun

npx shadcn@2.4.0-canary.12 add "https://diceui.com/r/data-grid-view-menu"
Install the DataGridKeyboardShortcuts (optional):

npm
pnpm
yarn
bun

npx shadcn@2.4.0-canary.12 add "https://diceui.com/r/data-grid-keyboard-shortcuts"
Features
The Data Grid component provides a comprehensive spreadsheet-like experience with:

High Performance: Virtualized rows and columns for handling large datasets
Cell Editing: In-place editing with various cell types (text, number, select, date, etc.)
Cell Selection: Single and multi-cell selection
Cell Copying: Copy selected cells to clipboard
Keyboard Navigation: Full keyboard support with Excel-like shortcuts
Context Menu: Right-click actions for rows and cells
Sorting: Multi-column sorting with drag-and-drop reordering and ascending/descending controls
Search: Find and navigate to matching cells with keyboard shortcuts
Row Management: Add, delete, and reorder rows
Column Resizing: Adjustable column widths
Layout
Import the components and compose them together:


import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { DataGridRowHeightMenu } from "@/components/data-grid/data-grid-row-height-menu";
import { DataGridViewMenu } from "@/components/data-grid/data-grid-view-menu";
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts";
import { useDataGrid } from "@/hooks/use-data-grid";
const { table, ...dataGridProps } = useDataGrid({
  data,
  columns,
  onDataChange: setData,
});
<div className="flex flex-col gap-4">
  {/* Toolbar with menu components */}
  <div className="flex items-center gap-2 self-end">
    <DataGridSortMenu table={table} />
    <DataGridRowHeightMenu table={table} />
    <DataGridViewMenu table={table} />
  </div>
  {/* Keyboard shortcuts dialog (opens with Ctrl+/) */}
  <DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
  {/* Data grid */}
  <DataGrid table={table} {...dataGridProps} />
</div>
Cell Architecture
The Data Grid uses a three-layer cell composition pattern:

DataGridCell: Routes to the appropriate cell variant based on the column's meta.cell.variant property
Cell Variants: Implement specific editing UIs for different data types (text, number, select, etc.)
DataGridCellWrapper: Provides common functionality for all cells (focus, selection, keyboard interactions)

// Cell composition flow
<DataGridCell cell={cell} table={table} />
  ↓
<ShortTextCell {...props} />  // Based on variant
  ↓
<DataGridCellWrapper {...props}>
  {/* Cell-specific content */}
</DataGridCellWrapper>
Each cell variant receives the same props and wraps its content in DataGridCellWrapper, which provides:

Focus management and visual focus ring
Selection state and highlighting
Search match highlighting
Click, double-click, and keyboard event management
Edit mode triggering (Enter, F2, Space, or typing)
Cell Types
The Data Grid supports various cell types for different data formats:

Short Text Cell

{
  id: "name",
  accessorKey: "name",
  header: "Name",
  meta: {
    label: "Name",
    cell: {
      variant: "short-text",
    },
  },
}
Long Text Cell

{
  id: "notes",
  accessorKey: "notes",
  header: "Notes",
  meta: {
    label: "Notes",
    cell: {
      variant: "long-text",
    },
  },
}
Number Cell

{
  id: "price",
  accessorKey: "price",
  header: "Price",
  meta: {
    label: "Price",
    cell: {
      variant: "number",
      min: 0,
      step: 0.01,
    },
  },
}
Select Cell

{
  id: "category",
  accessorKey: "category",
  header: "Category",
  meta: {
    label: "Category",
    cell: {
      variant: "select",
      options: [
        { label: "Electronics", value: "electronics" },
        { label: "Clothing", value: "clothing" },
        { label: "Books", value: "books" },
      ],
    },
  },
}
Multi-Select Cell

{
  id: "skills",
  accessorKey: "skills",
  header: "Skills",
  meta: {
    label: "Skills",
    cell: {
      variant: "multi-select",
      options: [
        { label: "JavaScript", value: "javascript" },
        { label: "TypeScript", value: "typescript" },
        { label: "React", value: "react" },
      ],
    },
  },
}
Date Cell

{
  id: "startDate",
  accessorKey: "startDate",
  header: "Start Date",
  meta: {
    label: "Start Date",
    cell: {
      variant: "date",
    },
  },
}
Checkbox Cell

{
  id: "isActive",
  accessorKey: "isActive",
  header: "Active",
  meta: {
    label: "Active",
    cell: {
      variant: "checkbox",
    },
  },
}
Usage
With Toolbar and Keyboard Shortcuts

import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { DataGridRowHeightMenu } from "@/components/data-grid/data-grid-row-height-menu";
import { DataGridViewMenu } from "@/components/data-grid/data-grid-view-menu";
import { useDataGrid } from "@/hooks/use-data-grid";
export default function MyDataGrid() {
  const { table, ...dataGridProps } = useDataGrid({
    data,
    columns,
    enableSearch: true,
  });
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar with menu components */}
      <div className="flex items-center gap-2 self-end">
        <DataGridSortMenu table={table} />
        <DataGridRowHeightMenu table={table} />
        <DataGridViewMenu table={table} />
      </div>
      
      {/* Keyboard shortcuts dialog (opens with Ctrl+/) */}
      <DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
      
      {/* Data grid */}
      <DataGrid table={table} {...dataGridProps} />
    </div>
  );
}
Row Selection
Add a selection column to enable row selection:


import { Checkbox } from "@/components/ui/checkbox";
const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
  // ... other columns
];
Row Management
Add and delete rows with callbacks:


const onRowAdd = React.useCallback(() => {
  const newRow = {
    id: `${Date.now()}`,
    // ... other default values
  };
  setData(prev => [...prev, newRow]);
  
  return {
    rowIndex: data.length,
    columnId: "name", // Focus this column after adding
  };
}, [data.length]);
const onRowsDelete = React.useCallback((rows) => {
  setData(prev => prev.filter(row => !rows.includes(row)));
}, []);
const { table, ...dataGridProps } = useDataGrid({
  data,
  columns,
  onRowAdd,
  onRowsDelete,
});
Context Menu Actions
Right-click on cells to access context menu options:

Copy: Copy selected cells to clipboard
Clear: Clear content from selected cells
Delete rows: Remove selected rows (only available when onRowsDelete is provided)
API Reference
useDataGrid
Hook for initializing the data grid with state management and editing capabilities.

Prop

Type


onDataChange?
function

onRowAdd?
function

onRowsDelete?
function

rowHeight?
"extra-tall" | "tall" | "medium" | "short"

overscan?
number

autoFocus?
Partial<object> | boolean

enableColumnSelection?
boolean

enableSearch?
boolean

data
array

columns
array

getRowId?
function

defaultColumn?
Partial<object> | Partial<Partial<object> & object>

initialState?
object

state?
Partial<object>
DataGrid
Main data grid with virtualization and editing capabilities.

Prop

Type


table
object

dataGridRef
object

headerRef
object

footerRef
object

rowMapRef
object

rowVirtualizer
object

height?
number

searchState?
object

columnSizeVars
object

onRowAdd?
function
DataGridColumnHeader
Column header with sorting controls and visual indicators for sort direction.

Prop

Type


header
object

table
object
DataGridCell
Routes to the appropriate cell variant based on the column's meta.cell.variant property.

Prop

Type


cell
object

table
object
DataGridCellWrapper
Base wrapper providing common functionality for all cell variants including focus management, selection state, search highlighting, and keyboard interactions.

Prop

Type


cell
object

table
object

rowIndex
number

columnId
string

isFocused
boolean

isEditing
boolean

isSelected
boolean
DataGridCellVariants
Individual cell variants for different data types. Each variant implements the DataGridCellVariantProps interface and wraps its content in DataGridCellWrapper.

Prop

Type


cell
object

table
object

rowIndex
number

columnId
string

isFocused
boolean

isEditing
boolean

isSelected
boolean
Available cell variants:

ShortTextCell: Single-line text input with inline contentEditable
LongTextCell: Multi-line textarea displayed in a popover dialog
NumberCell: Numeric input with optional min, max, and step constraints
SelectCell: Single-select dropdown with predefined options
MultiSelectCell: Multi-select input with badge display and command palette
CheckboxCell: Boolean checkbox for true/false values
DateCell: Date picker with calendar popover
Creating Custom Cell Variants
You can create custom cell variants by implementing the DataGridCellVariantProps interface and wrapping your content in DataGridCellWrapper:


import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import type { DataGridCellVariantProps } from "@/types/docs/data-grid";
export function CustomCell<TData>({
  cell,
  table,
  rowIndex,
  columnId,
  isFocused,
  isEditing,
  isSelected,
}: DataGridCellVariantProps<TData>) {
  const value = cell.getValue() as YourType;
  
  return (
    <DataGridCellWrapper
      cell={cell}
      table={table}
      rowIndex={rowIndex}
      columnId={columnId}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
    >
      {/* Your custom cell content */}
    </DataGridCellWrapper>
  );
}
DataGridRow
Individual row with virtualization for large datasets.

Prop

Type


row
object

rowMapRef
object

virtualRowIndex
number

rowVirtualizer
object

rowHeight
RowHeightValue

focusedCell
object | null
DataGridSearch
Search dialog with keyboard shortcuts for finding and navigating between matching cells in the grid.

Prop

Type


searchQuery
string

onSearchQueryChange
function

searchMatches
array

matchIndex
number

searchOpen
boolean

onSearchOpenChange
function

onNavigateToNextMatch
function

onNavigateToPrevMatch
function

onSearch
function
DataGridContextMenu
Right-click context menu for quick access to common cell and row actions like copy, clear, and delete.

Prop

Type


table
object
DataGridSortMenu
Menu for managing multi-column sorting with drag-and-drop reordering and ascending/descending controls.

Prop

Type


table
object
DataGridRowHeightMenu
Menu for adjusting row heights between short, medium, tall, and extra-tall options with persistent preferences.

Prop

Type


table
object
DataGridViewMenu
Menu for controlling column visibility with search and toggle all functionality.

Prop

Type


table
object
DataGridKeyboardShortcuts
Searchable reference dialog for all available keyboard shortcuts for navigating and interacting with the data grid.

Prop

Type


enableSearch?
boolean
Accessibility
The Data Grid follows WAI-ARIA guidelines for grid widgets:

Full keyboard navigation support
Screen reader announcements for cell changes
Focus management during editing
Proper ARIA labels and roles
High contrast mode support
Keyboard Interactions
Key	Description
Navigate between cells
Move to next cell
Move to previous cell
Move to first column
Move to last column
Move to first cell
Move to last cell
Move up one page
Move down one page
Extend selection
Select all cells
Toggle cell selection
Select range
Clear selection or exit edit mode
Start editing cell
Start editing cell
Clear selected cells
Clear selected cells
Open search
Toggle the sort menu
Show keyboard shortcuts
Credits
# Tables Components

Organized following architecture rules: domain-based structure with clear separation of concerns.

## Directory Structure

### `/core/` - Foundational Components (4 files)
Core table rendering components with no dependencies on other table components.

- **DynamicTable.tsx** - Main table component with full features (selection, actions, etc.)
- **DynamicFieldRenderer.tsx** - Renders individual field values based on column type
- **CompactTableView.tsx** - Simplified table view for main page (10 rows, 5 columns max)
- **BulkActionBar.tsx** - Toolbar for bulk operations (delete, status change, etc.)

### `/modals/` - Modal Dialogs (9 files)
All modal dialogs for table operations. Depend on core components.

**Record Modals:**
- **AddRecordModal.tsx** - Manual record entry form
- **AddRecordModalWithImport.tsx** - Dual-mode entry (manual or file import)
- **EditRecordModal.tsx** - Edit existing record
- **DeleteRecordModal.tsx** - Delete confirmation
- **BulkDeleteModal.tsx** - Bulk delete confirmation

**Column Modals:**
- **AddColumnModal.tsx** - Add new column to table

**Status Modals:**
- **AddStatusModal.tsx** - Add new status
- **EditStatusModal.tsx** - Edit existing status
- **BulkStatusModal.tsx** - Bulk status change

### `/managers/` - Management Interfaces (4 files)
Complex management UIs. Depend on core and modals.

- **ColumnManager.tsx** - Basic column management interface
- **ColumnManagerWrapper.tsx** - Wrapper for column manager
- **EnhancedColumnManager.tsx** - Advanced column management with drag-drop
- **StatusManager.tsx** - Status management interface

### `/views/` - Page-Level Views (3 files)
High-level page components. Depend on all other components.

- **TableDataView.tsx** - Full data page with all actions (filter, dedupe, enrich)
- **TableMainView.tsx** - Main page with stats cards and compact table
- **TableTemplates.tsx** - Table template selection

### `/deprecated/` - Legacy Files (3 files)
Old files to be removed in future cleanup.

- **TableLayoutClient.tsx** - Old layout wrapper
- **EnhancedTableView.tsx** - Old enhanced view
- **TableView.tsx** - Old basic view

## Dependency Flow

```
views/ (high-level)
  ↓
managers/ (orchestration)
  ↓
modals/ (user interactions)
  ↓
core/ (foundational)
```

## Import Guidelines

- Use relative imports within the same directory
- Use `../` to import from sibling directories
- Follow the dependency flow (don't import from higher levels)

Example:
```typescript
// In views/TableDataView.tsx
import DynamicTable from '../core/DynamicTable'
import AddRecordModalWithImport from '../modals/AddRecordModalWithImport'

// In modals/EditRecordModal.tsx
import DynamicFieldRenderer from '../core/DynamicFieldRenderer'
```

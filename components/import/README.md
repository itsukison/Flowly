# Import Components

Data import functionality organized by feature and responsibility.

## Directory Structure

### `/core/` - Main Import Component (1 file)
- **DataImport.tsx** - Complete import flow with file upload, column mapping, and preview

### `/wizard/` - Wizard Orchestration (2 files)
Multi-step import wizard components.

- **ImportWizard.tsx** - Main wizard orchestrator managing step flow
- **TableSelector.tsx** - Table selection step

### `/steps/` - Individual Wizard Steps (8 files)
Individual steps in the import process.

- **FileUpload.tsx** - File upload interface
- **ColumnMapper.tsx** - Column mapping logic
- **ColumnMapping.tsx** - Column mapping UI
- **DataPreview.tsx** - Preview imported data
- **DuplicateResolver.tsx** - Resolve duplicate records
- **ImportPreview.tsx** - Final preview before import
- **ImportProgress.tsx** - Import progress indicator
- **ImportSummary.tsx** - Import completion summary

## Usage

The import functionality can be used in two ways:

1. **Standalone Import Flow** - Use `DataImport.tsx` for a complete import experience
2. **Wizard Flow** - Use `ImportWizard.tsx` for a step-by-step guided import

### Example: Using DataImport

```typescript
import DataImport from '@/components/import/core/DataImport'

<DataImport
  tableId={tableId}
  columns={columns}
  onImportComplete={() => router.refresh()}
/>
```

### Example: Using ImportWizard

```typescript
import ImportWizard from '@/components/import/wizard/ImportWizard'

<ImportWizard
  organizationId={orgId}
  onComplete={() => router.push('/dashboard')}
/>
```

## Dependency Flow

```
wizard/ (orchestration)
  ↓
steps/ (individual steps)
  ↓
core/ (complete flow)
```

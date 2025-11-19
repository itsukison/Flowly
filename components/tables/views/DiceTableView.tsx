"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { useDataGrid } from "@/hooks/use-data-grid";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { DeduplicationModal } from "@/components/tables/modals/DeduplicationModal";
import { ContactEnrichmentModal } from "@/components/tables/modals/ContactEnrichmentModal";
import { AIChatModal } from "@/components/tables/modals/AIChatModal";
import { EditColumnModal } from "@/components/tables/modals/EditColumnModal";
import { AddColumnModal } from "@/components/tables/modals/AddColumnModal";
import AddRecordModalWithImport from "@/components/tables/modals/AddRecordModalWithImport";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import type { Json } from "@/lib/supabase/database.types";

interface Column {
  id: string;
  name: string;
  label: string;
  type: string;
  options: any;
  is_required: boolean | null;
  display_order: number;
}

interface Status {
  id: string;
  name: string;
  color: string | null;
  display_order: number;
}

interface TableRecord {
  id: string;
  table_id?: string;
  organization_id?: string;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  status?: string | null;
  data: Json | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

type NormalizedTableRecord = Omit<TableRecord, "data"> & {
  data: Record<string, any>;
};

interface Table {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
}

interface DiceTableViewProps {
  table: Table;
  columns: Column[];
  statuses: Status[];
  records: TableRecord[];
  totalRecords?: number;
  pageSize?: number;
}

export default function DiceTableView({
  table,
  columns,
  statuses,
  records,
  totalRecords = 0,
  pageSize = 100,
}: DiceTableViewProps) {
  const router = useRouter();
  const { isCollapsed, toggleCollapse } = useSidebar();

  // Pagination state - must be before normalizedRecords
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allRecords, setAllRecords] = useState<TableRecord[]>(records);
  const hasMore = totalRecords > allRecords.length;

  // Normalize records to ensure data field exists
  const normalizedRecords = useMemo<NormalizedTableRecord[]>(() => {
    return allRecords.map((record) => ({
      ...record,
      data: (record.data as Record<string, any>) || {},
    }));
  }, [allRecords]);

  // Add empty placeholder rows (like Excel) to fill the screen
  const dataWithPlaceholders = useMemo<NormalizedTableRecord[]>(() => {
    const PLACEHOLDER_COUNT = 50; // Reduced from 200 for better performance
    const placeholders: NormalizedTableRecord[] = [];
    
    for (let i = 0; i < PLACEHOLDER_COUNT; i++) {
      placeholders.push({
        id: `temp-${i}`,
        table_id: table.id,
        organization_id: normalizedRecords[0]?.organization_id || '',
        data: {},
      } as NormalizedTableRecord);
    }
    
    return [...normalizedRecords, ...placeholders];
  }, [normalizedRecords, table.id]);

  const [data, setData] = useState(dataWithPlaceholders);

  // Undo/Redo functionality
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
  } = useUndoRedo({
    initialData: dataWithPlaceholders,
    maxHistorySize: 50,
    onRestore: (restoredData) => {
      setData(restoredData);
      // Note: We don't save to database on undo/redo
      // The user can make further edits and those will be saved
    },
  });

  // Update data when records change (e.g., after refresh)
  useEffect(() => {
    setData(dataWithPlaceholders);
  }, [dataWithPlaceholders]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeduplicationOpen, setIsDeduplicationOpen] = useState(false);
  const [recordsForDeduplication, setRecordsForDeduplication] = useState<NormalizedTableRecord[]>([]);
  const [isEnrichmentOpen, setIsEnrichmentOpen] = useState(false);
  const [recordsForEnrichment, setRecordsForEnrichment] = useState<NormalizedTableRecord[]>([]);
  const [enrichmentStatus, setEnrichmentStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isEditColumnOpen, setIsEditColumnOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<{ id: string; label: string } | null>(null);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);

  // Debounced batch save refs
  const pendingChanges = useRef<Map<string, any>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Incremental change detection - track dirty cells
  type CellKey = `${string}-${string}`; // `${recordId}-${columnId}`
  const dirtyCells = useRef<Set<CellKey>>(new Set());
  const originalValues = useRef<Map<CellKey, any>>(new Map());

  // Load more records
  const loadMoreRecords = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await fetch(
        `/api/records/paginated?tableId=${table.id}&page=${nextPage}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error("Failed to load more records");
      }

      const { records: newRecords } = await response.json();
      setAllRecords((prev) => [...prev, ...newRecords]);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Error loading more records:", error);
      alert("レコードの読み込みに失敗しました");
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, table.id, pageSize]);

  // Set table context for sidebar
  useEffect(() => {
    document.body.setAttribute("data-table-name", table.name);
    document.body.setAttribute("data-table-icon", table.icon || "table");

    return () => {
      document.body.removeAttribute("data-table-name");
      document.body.removeAttribute("data-table-icon");
    };
  }, [table.name, table.icon]);

  // Handle keyboard shortcuts for sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  // Force sidebar to be expanded when open on data page
  useEffect(() => {
    if (isSidebarOpen && isCollapsed) {
      toggleCollapse();
    }
  }, [isSidebarOpen, isCollapsed, toggleCollapse]);

  // Override sidebar collapse behavior for data page
  // When sidebar is open, intercept collapse button clicks to close sidebar instead
  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleSidebarToggle = (e: Event) => {
      const target = e.target as HTMLElement;
      // Look for collapse button with Japanese title in both desktop and mobile sidebars
      const collapseButton = target.closest('button[title*="折りたたむ"], [data-sidebar-close]');
      if (collapseButton) {
        e.preventDefault();
        e.stopPropagation();
        setIsSidebarOpen(false);
      }
    };

    // Add listener to both the desktop sidebar and mobile sidebar container
    const desktopSidebar = document.querySelector('aside');
    const mobileSidebar = document.querySelector('.fixed.top-16.bottom-0.left-0');

    const elements = [desktopSidebar, mobileSidebar].filter(Boolean);

    elements.forEach(element => {
      element?.addEventListener("click", handleSidebarToggle, true);
    });

    return () => {
      elements.forEach(element => {
        element?.removeEventListener("click", handleSidebarToggle, true);
      });
    };
  }, [isSidebarOpen]);

  // Helper function to check if a row is empty
  const isRowEmpty = useCallback((record: NormalizedTableRecord) => {
    const directFields = ["name", "email", "company", "status"] as const;
    const hasDirectData = directFields.some(field => record[field]);
    const hasJsonbData = Object.keys(record.data || {}).some(key => record.data[key]);
    return !hasDirectData && !hasJsonbData;
  }, []);

  // Mark cell as dirty for incremental change detection
  const markCellDirty = useCallback((recordId: string, columnId: string, oldValue: any) => {
    const key: CellKey = `${recordId}-${columnId}`;
    
    // Store original value if first edit
    if (!dirtyCells.current.has(key)) {
      originalValues.current.set(key, oldValue);
    }
    
    dirtyCells.current.add(key);
  }, []);

  // Handle data changes with debounced batch save
  const handleDataChange = useCallback(
    (newData: NormalizedTableRecord[]) => {
      // FIX: The built-in onDataUpdate puts JSONB fields at the wrong level
      // It does: updatedRow[columnId] = value
      // But for JSONB fields, we need: updatedRow.data[columnId] = value
      // So we need to move misplaced fields into the data object
      const fixedData = newData.map((record) => {
        const fixed = { ...record, data: { ...record.data } };

        // Check each column to see if it's a JSONB field that was misplaced
        columns.forEach((column) => {
          const isDirectProperty = [
            "name",
            "email",
            "company",
            "status",
          ].includes(column.name);

          if (!isDirectProperty && column.name in record) {
            // This is a JSONB field that was placed at root level - move it
            // (Always move it, even if it already exists in data, because the new value is at root)
            fixed.data[column.name] = (record as any)[column.name];
            delete (fixed as any)[column.name];
          }
        });

        return fixed;
      });

      // Find what changed by comparing with current data
      const updates: Array<{ record: NormalizedTableRecord; changes: any }> =
        [];
      const newRecordsToCreate: Array<{ record: NormalizedTableRecord; index: number }> = [];

      fixedData.forEach((newRecord, index) => {
        const oldRecord = data[index];
        if (!oldRecord) {
          return;
        }

        // Type guard to ensure we have id property
        if (!('id' in oldRecord) || !('id' in newRecord)) {
          return;
        }

        if (oldRecord.id !== newRecord.id) {
          return;
        }

        // Check if this is a placeholder row that now has data
        const isPlaceholder = oldRecord.id.startsWith('temp-');
        const wasEmpty = isRowEmpty(oldRecord);
        const hasData = !isRowEmpty(newRecord);

        if (isPlaceholder && wasEmpty && hasData) {
          // Placeholder row got data - need to create a new record
          newRecordsToCreate.push({ record: newRecord, index });
          return;
        }

        // Skip placeholder rows that are still empty
        if (isPlaceholder) {
          return;
        }

        // Check for changes in direct fields
        const directFields = ["name", "email", "company", "status"] as const;
        const directChanges: any = {};
        let hasDirectChanges = false;

        directFields.forEach((field) => {
          const oldValue = (oldRecord as any)[field];
          const newValue = (newRecord as any)[field];
          // Skip if both are empty/null/undefined
          if (!oldValue && !newValue) return;
          if (oldValue !== newValue) {
            directChanges[field] = newValue;
            hasDirectChanges = true;
          }
        });

        // Check for changes in JSONB data
        const dataChanges: any = {};
        let hasDataChanges = false;

        const oldData = oldRecord.data || {};
        const newDataObj = newRecord.data || {};

        Object.keys(newDataObj).forEach((key) => {
          const oldValue = oldData[key];
          const newValue = newDataObj[key];
          
          // Skip if both are empty/null/undefined (especially for virtual columns)
          if (!oldValue && !newValue) return;
          
          if (oldValue !== newValue) {
            dataChanges[key] = newValue;
            hasDataChanges = true;
          }
        });

        if (hasDirectChanges || hasDataChanges) {
          const payload: any = { ...directChanges };
          if (hasDataChanges) {
            payload.data = { ...oldData, ...dataChanges };
          }
          updates.push({ record: newRecord, changes: payload });
        }
      });

      // Update local state immediately for optimistic UI (instant feedback)
      setData(fixedData);
      
      // Push to history for undo/redo (only if there are actual changes)
      if (updates.length > 0 || newRecordsToCreate.length > 0) {
        pushHistory(fixedData);
      }

      // Add changes to pending queue
      updates.forEach(({ record, changes }) => {
        const existing = pendingChanges.current.get(record.id) || {};
        pendingChanges.current.set(record.id, { ...existing, ...changes });
      });

      // Handle new records immediately (can't batch these)
      if (newRecordsToCreate.length > 0) {
        (async () => {
          try {
            const createdRecords = await Promise.all(
              newRecordsToCreate.map(async ({ record, index }) => {
                const organizationId = normalizedRecords[0]?.organization_id;
                if (!organizationId) {
                  throw new Error("Organization ID not found");
                }

                const payload: any = {
                  table_id: table.id,
                  organization_id: organizationId,
                  status: record.status || statuses[0]?.name || null,
                  data: record.data || {},
                };

                if (record.name) payload.name = record.name;
                if (record.email) payload.email = record.email;
                if (record.company) payload.company = record.company;

                const response = await fetch(`/api/records`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });

                if (!response.ok) {
                  throw new Error("Failed to create record");
                }

                const newRecord = await response.json();
                return { index, newRecord };
              })
            );

            // Replace placeholder rows with real records
            setData((currentData) => {
              const updated = [...currentData];
              createdRecords.forEach(({ index, newRecord }) => {
                updated[index] = {
                  ...newRecord,
                  data: (newRecord.data as Record<string, any>) || {},
                };
              });
              return updated;
            });
          } catch (error) {
            console.error("Error creating records:", error);
            alert("レコードの作成に失敗しました");
          }
        })();
      }

      // Debounce + batch save for updates (500ms after last change)
      if (updates.length > 0) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
          if (pendingChanges.current.size === 0) return;

          setIsSaving(true);
          setSaveStatus("saving");

          const batchUpdates = Array.from(pendingChanges.current.entries()).map(
            ([id, changes]) => ({ id, changes })
          );

          try {
            // Single batch API call
            const response = await fetch('/api/records/batch', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ updates: batchUpdates }),
            });

            if (!response.ok) {
              throw new Error('Failed to batch save');
            }

            pendingChanges.current.clear();
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          } catch (error) {
            console.error("Error batch saving:", error);
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 3000);
            alert("変更の保存に失敗しました");
          } finally {
            setIsSaving(false);
          }
        }, 500); // 500ms debounce
      }
    },
    [data, columns, normalizedRecords, table.id, statuses, isRowEmpty]
  );

  // Handle adding new rows
  const handleRowAdd = useCallback(async (): Promise<
    Partial<{ rowIndex: number; columnId: string }>
  > => {
    try {
      const organizationId = normalizedRecords[0]?.organization_id;
      if (!organizationId) {
        throw new Error("Organization ID not found");
      }

      const response = await fetch(`/api/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_id: table.id,
          organization_id: organizationId,
          status: statuses[0]?.name || null,
          data: {},
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create record");
      }

      router.refresh();

      return {
        rowIndex: data.length,
        columnId: "name",
      };
    } catch (error) {
      console.error("Error creating record:", error);
      alert("レコードの作成に失敗しました");
      return {};
    }
  }, [table.id, statuses, normalizedRecords, data.length, router]);

  // Handle deleting rows
  const handleRowsDelete = useCallback(
    async (rows: NormalizedTableRecord[]) => {
      try {
        for (const record of rows) {
          const response = await fetch(`/api/records/${record.id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete record");
          }
        }

        router.refresh();
      } catch (error) {
        console.error("Error deleting records:", error);
        alert("レコードの削除に失敗しました");
      }
    },
    [router]
  );

  // Handle editing column
  const handleEditColumn = useCallback((columnId: string, currentLabel: string) => {
    // Find the actual column data
    const column = columns.find(col => col.name === columnId);
    if (column) {
      setEditingColumn({ id: column.id, label: currentLabel });
      setIsEditColumnOpen(true);
    }
  }, [columns]);

  // Handle saving column edit
  const handleSaveColumnEdit = useCallback(async (columnId: string, newLabel: string) => {
    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel }),
      });

      if (!response.ok) {
        throw new Error("Failed to update column");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating column:", error);
      throw error;
    }
  }, [router]);

  // Handle deleting column
  const handleDeleteColumn = useCallback(async (columnId: string, columnLabel: string) => {
    const confirmed = window.confirm(
      `「${columnLabel}」列を削除してもよろしいですか？\n\nこの操作は取り消せません。この列のすべてのデータが失われます。`
    );

    if (!confirmed) return;

    try {
      // Find the actual column data
      const column = columns.find(col => col.name === columnId);
      if (!column) {
        throw new Error("Column not found");
      }

      const response = await fetch(`/api/columns/${column.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete column");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting column:", error);
      alert("列の削除に失敗しました");
    }
  }, [columns, router]);

  // Handle adding column
  const handleAddColumn = useCallback(() => {
    setIsAddColumnOpen(true);
  }, []);

  // Handle column reordering
  const handleColumnReorder = useCallback(async (sourceColumnId: string, targetColumnId: string) => {
    // Don't reorder virtual columns or special columns
    if (sourceColumnId.startsWith('col_') || targetColumnId.startsWith('col_')) return;
    if (sourceColumnId === 'select' || sourceColumnId === 'status') return;
    if (targetColumnId === 'select' || targetColumnId === 'status') return;

    // Find the source and target columns
    const sourceColumn = columns.find(col => col.name === sourceColumnId);
    const targetColumn = columns.find(col => col.name === targetColumnId);

    if (!sourceColumn || !targetColumn) return;

    // Create new column order
    const newColumns = [...columns];
    const sourceIndex = newColumns.findIndex(col => col.id === sourceColumn.id);
    const targetIndex = newColumns.findIndex(col => col.id === targetColumn.id);

    // Remove source and insert at target position
    const [removed] = newColumns.splice(sourceIndex, 1);
    newColumns.splice(targetIndex, 0, removed);

    // Update display_order for all affected columns
    const updates = newColumns.map((col, index) => ({
      id: col.id,
      display_order: index,
    }));

    try {
      const response = await fetch('/api/columns/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder columns');
      }

      router.refresh();
    } catch (error) {
      console.error('Error reordering columns:', error);
      alert('列の並び替えに失敗しました');
    }
  }, [columns, router]);

  // Handle saving new column
  const handleSaveNewColumn = useCallback(async (columnData: {
    table_id: string;
    name: string;
    label: string;
    type: string;
    display_order: number;
  }) => {
    try {
      const response = await fetch(`/api/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(columnData),
      });

      if (!response.ok) {
        throw new Error("Failed to create column");
      }

      router.refresh();
    } catch (error) {
      console.error("Error creating column:", error);
      throw error;
    }
  }, [router]);

  // Handle CSV Export
  const handleExportCSV = useCallback(async () => {
    try {
      const XLSX = await import('xlsx');
      
      // Prepare headers
      const headers = columns.map(col => col.label);
      headers.push('ステータス'); // Add status column

      // Prepare data rows
      const rows = normalizedRecords.map(record => {
        const row: any[] = [];
        
        columns.forEach(column => {
          const isDirectProperty = ['name', 'email', 'company'].includes(column.name);
          const value = isDirectProperty 
            ? (record as any)[column.name] 
            : record.data?.[column.name];
          row.push(value ?? '');
        });
        
        // Add status
        row.push(record.status ?? '');
        
        return row;
      });

      // Create worksheet
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${table.name}_${timestamp}.csv`;
      
      // Download
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('CSVのエクスポートに失敗しました');
    }
  }, [columns, normalizedRecords, table.name]);

  // Handle deduplication confirmation
  const handleDeduplicationConfirm = useCallback(
    async (recordIds: string[]) => {
      try {
        for (const recordId of recordIds) {
          const response = await fetch(`/api/records/${recordId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete record");
          }
        }

        router.refresh();
      } catch (error) {
        console.error("Error deleting duplicates:", error);
        throw error;
      }
    },
    [router]
  );

  // Transform columns to Dice UI format
  const diceColumns = useMemo<ColumnDef<NormalizedTableRecord>[]>(() => {
    const cols: ColumnDef<NormalizedTableRecord>[] = [];

    // Add checkbox selection column (pinned to left)
    cols.push({
      id: "select",
      header: ({ table }) => (
        <div className="pl-3">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="pl-3">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      size: 52,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
    });

    // Process all columns from database
    columns.forEach((column) => {
      // Check if this is a direct property or JSONB field
      const isDirectProperty = ["name", "email", "company"].includes(
        column.name
      );

      let variant: any = "short-text";
      const cellMeta: any = {};

      // Map column types to Dice UI variants
      switch (column.type) {
        case "text":
          variant = "short-text";
          break;
        case "textarea":
          variant = "long-text";
          break;
        case "number":
          variant = "number";
          cellMeta.min = 0;
          cellMeta.step = 1;
          break;
        case "email":
          variant = "short-text";
          break;
        case "phone":
          variant = "short-text";
          break;
        case "url":
          variant = "short-text";
          break;
        case "date":
          variant = "date";
          break;
        case "boolean":
          variant = "checkbox";
          break;
        case "select":
          variant = "select";
          if (column.options?.choices) {
            cellMeta.options = column.options.choices.map((choice: string) => ({
              label: choice,
              value: choice,
            }));
          }
          break;
        case "multiselect":
          variant = "multi-select";
          if (column.options?.choices) {
            cellMeta.options = column.options.choices.map((choice: string) => ({
              label: choice,
              value: choice,
            }));
          }
          break;
      }

      cols.push({
        id: column.name,
        // Use accessorKey for direct properties, accessorFn for JSONB fields
        ...(isDirectProperty
          ? { accessorKey: column.name }
          : {
              accessorFn: (row: NormalizedTableRecord) =>
                row.data?.[column.name] ?? "",
            }),
        header: column.label,
        enableSorting: true,
        meta: {
          label: column.label,
          cell: {
            variant,
            ...cellMeta,
          },
        },
      });
    });

    // Add status column
    cols.push({
      id: "status",
      accessorKey: "status",
      header: "ステータス",
      enableSorting: true,
      meta: {
        label: "ステータス",
        cell: {
          variant: "select",
          options: statuses.map((s) => ({
            label: s.name,
            value: s.name,
          })),
        },
      },
    });

    // Add 20 virtual columns with empty headers
    // Users can add more columns manually if needed
    for (let i = 0; i < 20; i++) {
      const columnKey = `col_${i}`;
      
      cols.push({
        id: columnKey,
        accessorFn: (row: NormalizedTableRecord) =>
          row.data?.[columnKey] ?? "",
        header: "", // Empty header
        enableSorting: false, // Disable sorting for virtual columns to improve performance
        size: 120,
        meta: {
          label: "",
          isVirtual: true,
          cell: {
            variant: "short-text",
          },
        },
      });
    }

    return cols;
  }, [columns, statuses]);

  // Initialize data grid with custom meta for cell updates
  const { table: dataGridTable, ...dataGridProps } = useDataGrid({
    data,
    columns: diceColumns,
    onDataChange: handleDataChange,
    onRowAdd: handleRowAdd,
    onRowsDelete: handleRowsDelete,
    onUndo: undo,
    onRedo: redo,
    enableSearch: true,
    autoFocus: true,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    initialState: {
      columnPinning: {
        left: ["select"],
      },
    },
    state: {
      columnPinning: {
        left: ["select"],
      },
    },
  });

  return (
    <>
      {/* Sidebar - Only shown when open, positioned below header */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar - positioned below header (top-16 = 64px header height) */}
          <div className="fixed top-16 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#E4E4E7] shadow-xl">
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E4E4E7] md:hidden">
              <h2 className="text-lg font-semibold">メニュー</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                data-sidebar-close="true"
                className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
                title="サイドバーを閉じる"
              >
                <X className="w-5 h-5 text-[#71717B]" />
              </button>
            </div>

            {/* Sidebar content */}
            <div className="overflow-y-auto h-full">
              <DashboardSidebar />
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="fixed inset-0 pt-16 z-30 flex flex-col bg-white">
        {/* Sticky Toolbar - Fixed at top, won't scroll with table */}
        <div 
          data-grid-popover 
          className="sticky top-0 z-20 flex items-center justify-between px-4 h-12 bg-white border-b border-[#E4E4E7] shrink-0"
        >
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 hover:bg-[#F4F4F5] rounded-lg transition-colors"
              title="メニューを開く"
            >
              <Menu className="w-4 h-4 text-[#71717B]" />
            </button>
            <div className="h-4 w-px bg-[#E4E4E7]" /> {/* Separator */}
            <h1 className="text-sm font-semibold text-[#09090B]">
              {table.name}
            </h1>
            
            {/* Export Button - Icon only, text on hover */}
            <button
              onClick={handleExportCSV}
              className="group p-1.5 hover:bg-[#F4F4F5] rounded-lg transition-colors relative"
              title="CSVエクスポート"
            >
              <svg className="w-4 h-4 text-[#71717B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                エクスポート
              </span>
            </button>
            
            {/* Undo/Redo buttons - moved here with reduced spacing */}
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              title="元に戻す (Ctrl+Z)"
              className="h-7 w-7 p-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              title="やり直す (Ctrl+Shift+Z)"
              className="h-7 w-7 p-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </Button>
            
            {isSaving && (
              <div className="flex items-center gap-2 text-xs text-[#71717B]">
                <svg
                  className="animate-spin h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                保存中...
              </div>
            )}
            {!isSaving && saveStatus === "saved" && (
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                保存完了
              </div>
            )}
            {!isSaving && saveStatus === "error" && (
              <div className="flex items-center gap-1.5 text-xs text-red-600">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                保存失敗
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Add Record Button - opens modal with import/enrichment options */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddRecordOpen(true)}
              className="gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              レコードを追加
            </Button>
            
            <DataGridSortMenu table={dataGridTable} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAIChatOpen(true)}
              className="gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              AIチャット
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // If processing or done, just reopen the modal
                if (enrichmentStatus !== 'idle') {
                  setIsEnrichmentOpen(true);
                  return;
                }
                
                const selectedRows = dataGridTable.getSelectedRowModel().rows;
                
                if (selectedRows.length === 0) {
                  alert('エンリッチメントする行を選択してください');
                  return;
                }
                
                const records = selectedRows
                  .map(row => row.original)
                  .filter(record => !record.id.startsWith('temp-'));
                
                setRecordsForEnrichment(records);
                setIsEnrichmentOpen(true);
              }}
              disabled={enrichmentStatus === 'idle' && dataGridTable.getSelectedRowModel().rows.length === 0}
              className={enrichmentStatus === 'done' ? 'border-green-500 text-green-700' : ''}
            >
              {enrichmentStatus === 'processing' && (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </>
              )}
              {enrichmentStatus === 'done' && (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  完了
                </>
              )}
              {enrichmentStatus === 'idle' && (
                <>
                  連絡先を取得
                  {dataGridTable.getSelectedRowModel().rows.length > 0 && (
                    <span className="ml-1.5 text-xs">
                      ({dataGridTable.getSelectedRowModel().rows.length})
                    </span>
                  )}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                // Prevent any default behavior and stop propagation
                e.preventDefault();
                e.stopPropagation();
                
                // Immediately capture selected rows before any state changes
                const selectedRows = dataGridTable.getSelectedRowModel().rows;
                
                if (selectedRows.length < 2) {
                  alert('重複を検出するには、少なくとも2つの行を選択してください');
                  return;
                }
                
                // Extract and store the records immediately
                const records = selectedRows
                  .map(row => row.original)
                  .filter(record => !record.id.startsWith('temp-'));
                
                // Store records in state before opening modal
                setRecordsForDeduplication(records);
                
                // Now open the modal
                setIsDeduplicationOpen(true);
              }}
              disabled={dataGridTable.getSelectedRowModel().rows.length < 2}
            >
              重複を削除
              {dataGridTable.getSelectedRowModel().rows.length > 0 && (
                <span className="ml-1.5 text-xs">
                  ({dataGridTable.getSelectedRowModel().rows.length})
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Scrollable Table Container - Takes remaining space */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden">
            <DataGrid 
              table={dataGridTable} 
              {...dataGridProps}
              onEditColumn={handleEditColumn}
              onDeleteColumn={handleDeleteColumn}
              onAddColumn={handleAddColumn}
              onColumnReorder={handleColumnReorder}
            />
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="border-t border-[#E4E4E7] p-3 bg-white">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMoreRecords}
                disabled={isLoadingMore}
                className="w-full"
              >
                {isLoadingMore ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    読み込み中...
                  </>
                ) : (
                  <>
                    さらに読み込む ({allRecords.length} / {totalRecords})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Dialog */}
        <DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
      </div>

      {/* Contact Enrichment Modal (New Gemini 3 Pro) */}
      <ContactEnrichmentModal
        open={isEnrichmentOpen}
        onOpenChange={(open) => {
          setIsEnrichmentOpen(open);
          if (!open) {
            setRecordsForEnrichment([]);
            setEnrichmentStatus('idle');
          }
        }}
        tableId={table.id}
        columns={columns}
        records={recordsForEnrichment as any}
        onComplete={() => {
          setEnrichmentStatus('done');
          router.refresh();
        }}
      />

      {/* Deduplication Modal */}
      {isDeduplicationOpen && (
        <DeduplicationModal
          open={isDeduplicationOpen}
          onOpenChange={(open) => {
            setIsDeduplicationOpen(open);
            // Clear stored records when modal closes
            if (!open) {
              setRecordsForDeduplication([]);
            }
          }}
          columns={columns}
          records={recordsForDeduplication as any}
          onConfirm={handleDeduplicationConfirm}
        />
      )}

      {/* AI Chat Modal */}
      <AIChatModal
        open={isAIChatOpen}
        onOpenChange={setIsAIChatOpen}
        tableId={table.id}
        tableName={table.name}
        columns={columns}
      />

      {/* Edit Column Modal */}
      {editingColumn && (
        <EditColumnModal
          open={isEditColumnOpen}
          onOpenChange={setIsEditColumnOpen}
          columnId={editingColumn.id}
          currentLabel={editingColumn.label}
          onSave={handleSaveColumnEdit}
        />
      )}

      {/* Add Column Modal */}
      <AddColumnModal
        open={isAddColumnOpen}
        onOpenChange={setIsAddColumnOpen}
        tableId={table.id}
        displayOrder={columns.length}
        onAdd={handleSaveNewColumn}
      />

      {/* Add Record Modal with Import/Enrichment */}
      {isAddRecordOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsAddRecordOpen(false)}
          />
          <AddRecordModalWithImport
            tableId={table.id}
            tableName={table.name}
            columns={columns}
            statuses={statuses}
            organizationId={normalizedRecords[0]?.organization_id || ''}
            onClose={() => {
              setIsAddRecordOpen(false);
              router.refresh();
            }}
          />
        </>
      )}
    </>
  );
}

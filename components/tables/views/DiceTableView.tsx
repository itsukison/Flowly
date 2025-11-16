"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { useDataGrid } from "@/hooks/use-data-grid";
import { DeduplicationModal } from "@/components/tables/modals/DeduplicationModal";
import { EnrichmentModal } from "@/components/tables/modals/EnrichmentModal";
import { AIChatModal } from "@/components/tables/modals/AIChatModal";
import { EditColumnModal } from "@/components/tables/modals/EditColumnModal";
import { AddColumnModal } from "@/components/tables/modals/AddColumnModal";
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
}

export default function DiceTableView({
  table,
  columns,
  statuses,
  records,
}: DiceTableViewProps) {
  const router = useRouter();
  const { isCollapsed, toggleCollapse } = useSidebar();

  // Normalize records to ensure data field exists
  const normalizedRecords = useMemo<NormalizedTableRecord[]>(() => {
    return records.map((record) => ({
      ...record,
      data: (record.data as Record<string, any>) || {},
    }));
  }, [records]);

  // Add empty placeholder rows (like Excel) to fill the screen
  const dataWithPlaceholders = useMemo<NormalizedTableRecord[]>(() => {
    const PLACEHOLDER_COUNT = 200;
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

  // Handle data changes with auto-save
  const handleDataChange = useCallback(
    async (newData: NormalizedTableRecord[]) => {
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
          if (oldData[key] !== newDataObj[key]) {
            dataChanges[key] = newDataObj[key];
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

      // Update local state immediately for responsive UI with fixed data
      setData(fixedData);

      // Save changes to API (both updates and new records)
      if (updates.length > 0 || newRecordsToCreate.length > 0) {
        setIsSaving(true);
        setSaveStatus("saving");

        try {
          // Create new records from placeholder rows
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

              // Add direct fields if they exist
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

          // Update existing records
          await Promise.all(
            updates.map(({ record, changes }) =>
              fetch(`/api/records/${record.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(changes),
              }).then((res) => {
                if (!res.ok) throw new Error("Failed to save");
                return res.json();
              })
            )
          );

          // Replace placeholder rows with real records in state
          if (createdRecords.length > 0) {
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
          }

          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
          console.error("Error saving changes:", error);
          setSaveStatus("error");
          setTimeout(() => setSaveStatus("idle"), 3000);
          alert("変更の保存に失敗しました");
        } finally {
          setIsSaving(false);
        }
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

    return cols;
  }, [columns, statuses]);

  // Initialize data grid with custom meta for cell updates
  const { table: dataGridTable, ...dataGridProps } = useDataGrid({
    data,
    columns: diceColumns,
    onDataChange: handleDataChange,
    onRowAdd: handleRowAdd,
    onRowsDelete: handleRowsDelete,
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
        <div className="flex-1 overflow-hidden">
          <DataGrid 
            table={dataGridTable} 
            {...dataGridProps}
            onEditColumn={handleEditColumn}
            onDeleteColumn={handleDeleteColumn}
            onAddColumn={handleAddColumn}
          />
        </div>

        {/* Keyboard Shortcuts Dialog */}
        <DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
      </div>

      {/* Enrichment Modal */}
      <EnrichmentModal
        open={isEnrichmentOpen}
        onOpenChange={(open) => {
          setIsEnrichmentOpen(open);
          if (!open && enrichmentStatus === 'idle') {
            setRecordsForEnrichment([]);
          }
        }}
        columns={columns}
        records={recordsForEnrichment as any}
        onComplete={() => {
          router.refresh();
        }}
        onStatusChange={(status) => {
          setEnrichmentStatus(status);
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
    </>
  );
}

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { DataGridRowHeightMenu } from "@/components/data-grid/data-grid-row-height-menu";
import { useDataGrid } from "@/hooks/use-data-grid";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import type { ColumnDef } from "@tanstack/react-table";

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
  name?: string;
  email?: string;
  company?: string;
  status?: string;
  data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface Table {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

interface DiceTableTestViewProps {
  table: Table;
  columns: Column[];
  statuses: Status[];
  records: TableRecord[];
}

export default function DiceTableTestView({
  table,
  columns,
  statuses,
  records,
}: DiceTableTestViewProps) {
  const router = useRouter();

  // Normalize records to ensure data field exists
  const normalizedRecords = useMemo(() => {
    return records.map((record) => ({
      ...record,
      data: record.data || {},
    }));
  }, [records]);

  const [data, setData] = useState(normalizedRecords);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Handle data changes with auto-save
  const handleDataChange = useCallback(async (newData: TableRecord[]) => {
    console.log("Data changed:", newData);
    setData(newData);
  }, []);

  // Handle individual cell updates from the data grid
  const handleCellUpdate = useCallback(
    async (
      props:
        | { rowIndex: number; columnId: string; value: any }
        | Array<{ rowIndex: number; columnId: string; value: any }>
    ) => {
      // Handle both single and batch updates
      const updates = Array.isArray(props) ? props : [props];

      for (const { rowIndex, columnId, value } of updates) {
        const record = data[rowIndex];
        if (!record) continue;

        setIsSaving(true);

        try {
          // Determine if this is a direct property or JSONB field
          const isDirectProperty = [
            "name",
            "email",
            "company",
            "status",
          ].includes(columnId);

          let updatePayload: any;
          if (isDirectProperty) {
            // Direct property update
            updatePayload = { [columnId]: value };
          } else {
            // JSONB field update - merge with existing data
            updatePayload = {
              data: {
                ...record.data,
                [columnId]: value,
              },
            };
          }

          console.log("Updating record:", record.id, updatePayload);

          const response = await fetch(`/api/records/${record.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatePayload),
          });

          if (!response.ok) {
            throw new Error("Failed to save changes");
          }

          // Update local state
          setData((prevData) => {
            const newData = [...prevData];
            if (isDirectProperty) {
              newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
            } else {
              newData[rowIndex] = {
                ...newData[rowIndex],
                data: { ...newData[rowIndex].data, [columnId]: value },
              };
            }
            return newData;
          });
        } catch (error) {
          console.error("Error saving changes:", error);
          alert("変更の保存に失敗しました");
        } finally {
          setIsSaving(false);
        }
      }
    },
    [data]
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
    async (rows: TableRecord[]) => {
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

  // Transform columns to Dice UI format
  const diceColumns = useMemo<ColumnDef<TableRecord>[]>(() => {
    const cols: ColumnDef<TableRecord>[] = [];

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
              accessorFn: (row: TableRecord) => row.data?.[column.name] ?? "",
            }),
        header: column.label,
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
    meta: {
      onDataUpdate: handleCellUpdate,
    },
  });

  return (
    <>
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E4E4E7] shadow-xl transform transition-transform">
            {/* Close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E4E7]">
              <h2 className="text-sm font-semibold text-[#09090B]">メニュー</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 hover:bg-[#F4F4F5] rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-[#71717B]" />
              </button>
            </div>

            {/* Sidebar content */}
            <div className="overflow-y-auto h-[calc(100vh-57px)]">
              <DashboardSidebar />
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="fixed inset-0 pt-16 z-30 flex flex-col bg-white">
        {/* Sticky Toolbar - Fixed at top, won't scroll with table */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 h-12 bg-white border-b border-[#E4E4E7] shrink-0">
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
              {table.name} - Dice UI
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
          </div>
          <div className="flex items-center gap-2">
            <DataGridSortMenu table={dataGridTable} />
            <DataGridRowHeightMenu table={dataGridTable} />
            <Link
              href={`/dashboard/tables/${table.id}/data`}
              className="px-3 py-1.5 text-sm font-medium text-white bg-[#09090B] hover:bg-[#27272A] rounded-md transition-colors"
            >
              Handsontable版
            </Link>
          </div>
        </div>

        {/* Scrollable Table Container - Takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <DataGrid table={dataGridTable} {...dataGridProps} />
        </div>

        {/* Keyboard Shortcuts Dialog */}
        <DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
      </div>
    </>
  );
}

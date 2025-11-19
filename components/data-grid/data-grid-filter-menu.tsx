"use client";
import type { Table } from "@tanstack/react-table";
import { Filter, X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FILTER_SHORTCUT_KEY = "f";

interface DataGridFilterMenuProps<TData>
  extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>;
}

export function DataGridFilterMenu<TData>({
  table,
  ...props
}: DataGridFilterMenuProps<TData>) {
  const id = React.useId();
  const labelId = React.useId();
  const descriptionId = React.useId();
  const [open, setOpen] = React.useState(false);

  const columnFilters = table.getState().columnFilters;

  const { columnLabels, availableColumns } = React.useMemo(() => {
    const labels = new Map<string, string>();
    const filteringIds = new Set(columnFilters.map((f) => f.id));
    const available: { id: string; label: string }[] = [];

    for (const column of table.getAllColumns()) {
      if (!column.getCanFilter()) continue;

      const label = column.columnDef.meta?.label ?? column.id;
      labels.set(column.id, label);

      if (!filteringIds.has(column.id)) {
        available.push({ id: column.id, label });
      }
    }

    return {
      columnLabels: labels,
      availableColumns: available,
    };
  }, [columnFilters, table]);

  const onFilterAdd = React.useCallback(() => {
    const firstColumn = availableColumns[0];
    if (!firstColumn) return;

    table.setColumnFilters((prev) => [
      ...prev,
      { id: firstColumn.id, value: "" },
    ]);
  }, [availableColumns, table]);

  const onFilterUpdate = React.useCallback(
    (columnId: string, value: string) => {
      table.setColumnFilters((prev) =>
        prev.map((filter) =>
          filter.id === columnId ? { ...filter, value } : filter
        )
      );
    },
    [table]
  );

  const onFilterRemove = React.useCallback(
    (columnId: string) => {
      table.setColumnFilters((prev) =>
        prev.filter((filter) => filter.id !== columnId)
      );
    },
    [table]
  );

  const onFiltersClear = React.useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Global keyboard shortcut (Ctrl+Shift+F)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === FILTER_SHORTCUT_KEY
      ) {
        setOpen((prev) => !prev);
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeFilterCount = columnFilters.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs",
            activeFilterCount > 0 && "border-primary"
          )}
          data-grid-popover
        >
          <Filter className="size-3.5" />
          <span className="hidden sm:inline">フィルタ</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 px-1 py-0 text-[10px] font-normal"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        {...props}
        className={cn("w-96 p-4", props.className)}
        align="end"
        role="dialog"
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        data-grid-popover
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 id={labelId} className="text-sm font-semibold">
                フィルタ
              </h4>
              <p id={descriptionId} className="text-xs text-muted-foreground">
                列にフィルタを適用して表示を絞り込みます
              </p>
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onFiltersClear}
              >
                すべてクリア
              </Button>
            )}
          </div>

          {columnFilters.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                フィルタが設定されていません
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {columnFilters.map((filter) => (
                <div key={filter.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">
                      {columnLabels.get(filter.id) || filter.id}
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onFilterRemove(filter.id)}
                    >
                      <X className="size-3" />
                      <span className="sr-only">フィルタを削除</span>
                    </Button>
                  </div>
                  <Input
                    placeholder="値を入力..."
                    value={(filter.value as string) || ""}
                    onChange={(e) => onFilterUpdate(filter.id, e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {availableColumns.length > 0 && (
            <div className="border-t pt-3">
              <Select
                value=""
                onValueChange={(columnId) => {
                  table.setColumnFilters((prev) => [
                    ...prev,
                    { id: columnId, value: "" },
                  ]);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="列を追加..." />
                </SelectTrigger>
                <SelectContent data-grid-popover>
                  {availableColumns.map((column) => (
                    <SelectItem
                      key={column.id}
                      value={column.id}
                      className="text-xs"
                    >
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}


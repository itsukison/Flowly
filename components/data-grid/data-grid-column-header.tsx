"use client";

import type {
  ColumnSort,
  Header,
  SortDirection,
  SortingState,
  Table,
} from "@tanstack/react-table";
import {
  BaselineIcon,
  CalendarIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeOffIcon,
  FilterIcon,
  HashIcon,
  ListChecksIcon,
  ListIcon,
  PinIcon,
  PinOffIcon,
  TextInitialIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Cell } from "@/types/data-grid";
import { Edit2Icon, Trash2Icon } from "lucide-react";

function getColumnVariant(variant?: Cell["variant"]): {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
} | null {
  switch (variant) {
    case "short-text":
      return { icon: BaselineIcon, label: "Short text" };
    case "long-text":
      return { icon: TextInitialIcon, label: "Long text" };
    case "number":
      return { icon: HashIcon, label: "Number" };
    case "select":
      return { icon: ListIcon, label: "Select" };
    case "multi-select":
      return { icon: ListChecksIcon, label: "Multi-select" };
    case "checkbox":
      return { icon: CheckSquareIcon, label: "Checkbox" };
    case "date":
      return { icon: CalendarIcon, label: "Date" };
    default:
      return null;
  }
}

interface DataGridColumnHeaderProps<TData, TValue>
  extends React.ComponentProps<typeof DropdownMenuTrigger> {
  header: Header<TData, TValue>;
  table: Table<TData>;
  onEditColumn?: (columnId: string, currentLabel: string) => void;
  onDeleteColumn?: (columnId: string, columnLabel: string) => void;
  onColumnReorder?: (sourceColumnId: string, targetColumnId: string) => void;
}

export function DataGridColumnHeader<TData, TValue>({
  header,
  table,
  className,
  onPointerDown,
  onEditColumn,
  onDeleteColumn,
  onColumnReorder,
  ...props
}: DataGridColumnHeaderProps<TData, TValue>) {
  const column = header.column;
  const label = column.columnDef.meta?.label
    ? column.columnDef.meta.label
    : typeof column.columnDef.header === "string"
    ? column.columnDef.header
    : column.id;

  const isAnyColumnResizing =
    table.getState().columnSizingInfo.isResizingColumn;

  const [isDragging, setIsDragging] = React.useState(false);
  const [isDropTarget, setIsDropTarget] = React.useState(false);

  const cellVariant = column.columnDef.meta?.cell;
  const columnVariant = getColumnVariant(cellVariant?.variant);

  const pinnedPosition = column.getIsPinned();
  const isPinnedLeft = pinnedPosition === "left";
  const isPinnedRight = pinnedPosition === "right";

  const onSortingChange = React.useCallback(
    (direction: SortDirection) => {
      table.setSorting((prev: SortingState) => {
        const existingSortIndex = prev.findIndex(
          (sort) => sort.id === column.id
        );
        const newSort: ColumnSort = {
          id: column.id,
          desc: direction === "desc",
        };

        if (existingSortIndex >= 0) {
          const updated = [...prev];
          updated[existingSortIndex] = newSort;
          return updated;
        } else {
          return [...prev, newSort];
        }
      });
    },
    [column.id, table]
  );

  const onSortRemove = React.useCallback(() => {
    table.setSorting((prev: SortingState) =>
      prev.filter((sort) => sort.id !== column.id)
    );
  }, [column.id, table]);

  const onFilterSet = React.useCallback(() => {
    table.setColumnFilters((prev) => {
      // If filter already exists, focus on it
      const exists = prev.some((f) => f.id === column.id);
      if (exists) return prev;
      
      // Add new filter
      return [...prev, { id: column.id, value: "" }];
    });
  }, [column.id, table]);

  const onFilterRemove = React.useCallback(() => {
    table.setColumnFilters((prev) =>
      prev.filter((filter) => filter.id !== column.id)
    );
  }, [column.id, table]);

  const onLeftPin = React.useCallback(() => {
    column.pin("left");
  }, [column]);

  const onRightPin = React.useCallback(() => {
    column.pin("right");
  }, [column]);

  const onUnpin = React.useCallback(() => {
    column.pin(false);
  }, [column]);

  const onTriggerPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event);
      if (event.defaultPrevented) return;

      if (event.button !== 0) {
        return;
      }
      table.options.meta?.onColumnClick?.(column.id);
    },
    [table.options.meta, column.id, onPointerDown]
  );

  const handleEditColumn = React.useCallback(() => {
    onEditColumn?.(column.id, label);
  }, [onEditColumn, column.id, label]);

  const handleDeleteColumn = React.useCallback(() => {
    onDeleteColumn?.(column.id, label);
  }, [onDeleteColumn, column.id, label]);

  // Don't show edit/delete for special columns
  const isSpecialColumn = column.id === "select" || column.id === "status";
  const canEditDelete = !isSpecialColumn && (onEditColumn || onDeleteColumn);

  // Drag and drop handlers
  const canDrag = Boolean(!column.getIsPinned() && onColumnReorder);

  const handleDragStart = React.useCallback((e: React.DragEvent) => {
    if (!canDrag) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", column.id);
    setIsDragging(true);
  }, [canDrag, column.id]);

  const handleDragEnd = React.useCallback(() => {
    setIsDragging(false);
    setIsDropTarget(false);
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    if (!canDrag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDropTarget(true);
  }, [canDrag]);

  const handleDragLeave = React.useCallback(() => {
    setIsDropTarget(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    if (!canDrag) return;
    e.preventDefault();
    const sourceColumnId = e.dataTransfer.getData("text/plain");
    if (sourceColumnId && sourceColumnId !== column.id) {
      onColumnReorder?.(sourceColumnId, column.id);
    }
    setIsDropTarget(false);
  }, [canDrag, column.id, onColumnReorder]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          draggable={canDrag}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-1 px-2 text-xs hover:bg-accent/40 data-[state=open]:bg-accent/40 [&_svg]:size-3",
            isAnyColumnResizing && "pointer-events-none",
            isDragging && "opacity-50",
            isDropTarget && "border-l-2 border-blue-500",
            canDrag && "cursor-move",
            className
          )}
          onPointerDown={onTriggerPointerDown}
          {...props}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {columnVariant && (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <columnVariant.icon className="size-3 shrink-0 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{columnVariant.label}</p>
                </TooltipContent>
              </Tooltip>
            )}
            <span className="truncate text-xs font-medium">{label}</span>
          </div>
          <ChevronDownIcon className="shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={0} className="w-60">
          {column.getCanSort() && (
            <>
              <DropdownMenuCheckboxItem
                className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
                checked={column.getIsSorted() === "asc"}
                onClick={() => onSortingChange("asc")}
              >
                <ChevronUpIcon />
                昇順で並び替え
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
                checked={column.getIsSorted() === "desc"}
                onClick={() => onSortingChange("desc")}
              >
                <ChevronDownIcon />
                降順で並び替え
              </DropdownMenuCheckboxItem>
              {column.getIsSorted() && (
                <DropdownMenuItem onClick={onSortRemove}>
                  <XIcon />
                  並び替えを解除
                </DropdownMenuItem>
              )}
            </>
          )}
          {column.getCanFilter() && (
            <>
              {column.getCanSort() && <DropdownMenuSeparator />}
              {column.getIsFiltered() ? (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onClick={onFilterRemove}
                >
                  <XIcon />
                  フィルタを解除
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onClick={onFilterSet}
                >
                  <FilterIcon />
                  フィルタを設定
                </DropdownMenuItem>
              )}
            </>
          )}
          {column.getCanPin() && (
            <>
              {(column.getCanSort() || column.getCanFilter()) && <DropdownMenuSeparator />}

              {isPinnedLeft ? (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onClick={onUnpin}
                >
                  <PinOffIcon />
                  左固定を解除
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onClick={onLeftPin}
                >
                  <PinIcon />
                  左に固定
                </DropdownMenuItem>
              )}
              {isPinnedRight ? (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onClick={onUnpin}
                >
                  <PinOffIcon />
                  右固定を解除
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onClick={onRightPin}
                >
                  <PinIcon />
                  右に固定
                </DropdownMenuItem>
              )}
            </>
          )}
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
                checked={!column.getIsVisible()}
                onClick={() => column.toggleVisibility(false)}
              >
                <EyeOffIcon />
                列を非表示
              </DropdownMenuCheckboxItem>
            </>
          )}
          {canEditDelete && (
            <>
              <DropdownMenuSeparator />
              {onEditColumn && (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onClick={handleEditColumn}
                >
                  <Edit2Icon />
                  列名を編集
                </DropdownMenuItem>
              )}
              {onDeleteColumn && (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground text-red-600"
                  onClick={handleDeleteColumn}
                >
                  <Trash2Icon />
                  列を削除
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {header.column.getCanResize() && (
        <DataGridColumnResizer header={header} table={table} label={label} />
      )}
    </>
  );
}

const DataGridColumnResizer = React.memo(
  DataGridColumnResizerImpl,
  (prev, next) => {
    const prevColumn = prev.header.column;
    const nextColumn = next.header.column;

    if (
      prevColumn.getIsResizing() !== nextColumn.getIsResizing() ||
      prevColumn.getSize() !== nextColumn.getSize()
    ) {
      return false;
    }

    if (prev.label !== next.label) return false;

    return true;
  }
) as typeof DataGridColumnResizerImpl;

interface DataGridColumnResizerProps<TData, TValue>
  extends DataGridColumnHeaderProps<TData, TValue> {
  label: string;
}

function DataGridColumnResizerImpl<TData, TValue>({
  header,
  table,
  label,
}: DataGridColumnResizerProps<TData, TValue>) {
  const defaultColumnDef = table._getDefaultColumnDef();

  const onDoubleClick = React.useCallback(() => {
    header.column.resetSize();
  }, [header.column]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label} column`}
      aria-valuenow={header.column.getSize()}
      aria-valuemin={defaultColumnDef.minSize}
      aria-valuemax={defaultColumnDef.maxSize}
      tabIndex={0}
      className={cn(
        "after:-translate-x-1/2 -right-px absolute top-0 z-50 h-full w-0.5 cursor-ew-resize touch-none select-none bg-border transition-opacity after:absolute after:inset-y-0 after:left-1/2 after:h-full after:w-[18px] after:content-[''] hover:bg-primary focus:bg-primary focus:outline-none",
        header.column.getIsResizing()
          ? "bg-primary"
          : "opacity-0 hover:opacity-100"
      )}
      onDoubleClick={onDoubleClick}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
    />
  );
}

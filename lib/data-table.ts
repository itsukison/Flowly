import type { CSSProperties } from "react";
import type { Column } from "@tanstack/react-table";

export function getCommonPinningStyles<TData>({
  column,
}: {
  column: Column<TData>;
}): CSSProperties {
  // Check if pinning methods exist (they may not in all versions)
  const isPinned = typeof (column as any).getIsPinned === 'function' 
    ? (column as any).getIsPinned() 
    : false;
  
  const isLastLeftPinnedColumn =
    isPinned === "left" && 
    typeof (column as any).getIsLastColumn === 'function' &&
    (column as any).getIsLastColumn("left");
    
  const isFirstRightPinnedColumn =
    isPinned === "right" && 
    typeof (column as any).getIsFirstColumn === 'function' &&
    (column as any).getIsFirstColumn("right");

  return {
    boxShadow: isLastLeftPinnedColumn
      ? "-4px 0 4px -4px gray inset"
      : isFirstRightPinnedColumn
        ? "4px 0 4px -4px gray inset"
        : undefined,
    left: isPinned === "left" && typeof (column as any).getStart === 'function'
      ? `${(column as any).getStart("left")}px` 
      : undefined,
    right: isPinned === "right" && typeof (column as any).getAfter === 'function'
      ? `${(column as any).getAfter("right")}px` 
      : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? "sticky" : "relative",
    width: typeof column.getSize === 'function' ? column.getSize() : undefined,
    zIndex: isPinned ? 10 : 0,
  };
}

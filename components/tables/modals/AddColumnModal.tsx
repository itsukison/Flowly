"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddColumnModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  tableId: string;
  displayOrder?: number;
  onAdd?: (columnData: {
    table_id: string;
    name: string;
    label: string;
    type: string;
    display_order: number;
  }) => Promise<void>;
  // Legacy props for backward compatibility
  existingColumns?: any[];
  onClose?: () => void;
}

export function AddColumnModal({
  open = true,
  onOpenChange,
  tableId,
  displayOrder = 0,
  onAdd,
  existingColumns,
  onClose,
}: AddColumnModalProps) {
  // Support legacy onClose prop
  const handleOpenChange = onOpenChange || ((isOpen: boolean) => {
    if (!isOpen && onClose) {
      onClose();
    }
  });
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!label.trim()) {
      alert("列名を入力してください");
      return;
    }

    setIsAdding(true);
    try {
      // Generate a safe column name from the label
      const name = label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

      const columnData = {
        table_id: tableId,
        name: name || `column_${Date.now()}`,
        label: label.trim(),
        type,
        display_order: displayOrder,
      };

      if (onAdd) {
        await onAdd(columnData);
      } else {
        // Legacy: call API directly
        const response = await fetch("/api/columns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(columnData),
        });

        if (!response.ok) {
          throw new Error("Failed to create column");
        }

        window.location.reload();
      }

      // Reset form
      setLabel("");
      setType("text");
      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding column:", error);
      alert("列の追加に失敗しました");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>列を追加</DialogTitle>
          <DialogDescription>
            新しい列を追加します。後から編集できます。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="label">列名</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例: 電話番号"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">列の種類</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">テキスト</SelectItem>
                <SelectItem value="textarea">長文テキスト</SelectItem>
                <SelectItem value="number">数値</SelectItem>
                <SelectItem value="email">メール</SelectItem>
                <SelectItem value="phone">電話番号</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="date">日付</SelectItem>
                <SelectItem value="boolean">チェックボックス</SelectItem>
                <SelectItem value="select">選択</SelectItem>
                <SelectItem value="multiselect">複数選択</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isAdding}
          >
            キャンセル
          </Button>
          <Button onClick={handleAdd} disabled={isAdding}>
            {isAdding ? "追加中..." : "追加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

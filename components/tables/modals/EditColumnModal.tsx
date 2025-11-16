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

interface EditColumnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  currentLabel: string;
  onSave: (columnId: string, newLabel: string) => Promise<void>;
}

export function EditColumnModal({
  open,
  onOpenChange,
  columnId,
  currentLabel,
  onSave,
}: EditColumnModalProps) {
  const [label, setLabel] = useState(currentLabel);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) {
      alert("列名を入力してください");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(columnId, label.trim());
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving column:", error);
      alert("列の更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>列名を編集</DialogTitle>
          <DialogDescription>
            列の表示名を変更します。データは保持されます。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="label">列名</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="列名を入力"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

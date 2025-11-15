"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
  Edit2,
  Check,
  Columns,
} from "lucide-react";
import AddColumnModal from "../modals/AddColumnModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Column {
  id: string;
  name: string;
  label: string;
  type: string;
  options: any;
  is_required: boolean | null;
  display_order: number;
}

interface ColumnManagerProps {
  tableId: string;
  columns: Column[];
  visibleColumns: string[];
  onVisibilityChange: (columns: string[]) => void;
  onClose: () => void;
}

const columnTypes = [
  { value: "text", label: "テキスト", description: "短いテキスト入力" },
  {
    value: "longtext",
    label: "長文テキスト",
    description: "複数行のテキスト入力",
  },
  { value: "number", label: "数値", description: "整数や少数" },
  { value: "email", label: "メールアドレス", description: "メール形式の入力" },
  { value: "tel", label: "電話番号", description: "電話番号形式の入力" },
  { value: "date", label: "日付", description: "カレンダーから日付選択" },
  { value: "datetime", label: "日時", description: "日付と時刻" },
  { value: "select", label: "選択肢", description: "定義された選択肢から選択" },
  { value: "checkbox", label: "チェックボックス", description: "ON/OFFの選択" },
  { value: "url", label: "URL", description: "ウェブサイトリンク" },
];

export default function EnhancedColumnManager({
  tableId,
  columns,
  visibleColumns: initialVisibleColumns,
  onVisibilityChange,
  onClose,
}: ColumnManagerProps) {
  const router = useRouter();
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Column>>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    initialVisibleColumns
  );

  const toggleVisibility = (columnId: string) => {
    const newVisibleColumns = visibleColumns.includes(columnId)
      ? visibleColumns.filter((id) => id !== columnId)
      : [...visibleColumns, columnId];
    setVisibleColumns(newVisibleColumns);
    onVisibilityChange(newVisibleColumns);
  };

  const startEdit = (column: Column) => {
    setEditingColumn(column.id);
    setEditForm({
      label: column.label,
      type: column.type,
      is_required: column.is_required,
    });
  };

  const cancelEdit = () => {
    setEditingColumn(null);
    setEditForm({});
  };

  const saveEdit = async (columnId: string) => {
    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error("Failed to update column");

      router.refresh();
      cancelEdit();
    } catch (error) {
      console.error("Error updating column:", error);
      alert("列の更新に失敗しました");
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("この列を削除してもよろしいですか？データも削除されます。")) {
      return;
    }

    setDeleting(columnId);
    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete column");

      router.refresh();
    } catch (error) {
      console.error("Error deleting column:", error);
      alert("列の削除に失敗しました");
    } finally {
      setDeleting(null);
    }
  };

  const getColumnTypeLabel = (type: string) => {
    const columnType = columnTypes.find((t) => t.value === type);
    return columnType ? columnType.label : type;
  };

  return (
    <div className="space-y-6">
      {/* Add Column Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#09090B]">列の一覧</h3>
          <p className="text-sm text-[#71717B] mt-1">
            ドラッグして順序を変更できます
          </p>
        </div>
        <button
          onClick={() => setShowAddColumn(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
        >
          <Plus className="w-4 h-4" />
          列を追加
        </button>
      </div>

      {/* Column Type Legend */}
      <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <h4 className="font-semibold text-[#09090B] mb-4 text-base">
          列の種類
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {columnTypes.map((type) => (
            <div key={type.value} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#09090B] rounded-full flex-shrink-0"></div>
              <span className="text-sm text-[#71717B]">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Columns List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {columns.map((column, index) => {
          const isVisible = visibleColumns.includes(column.id);
          const isDeleting = deleting === column.id;
          const isEditing = editingColumn === column.id;

          return (
            <div
              key={column.id}
              className="bg-white border border-[#E4E4E7] rounded-xl hover:shadow-[0px_4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-hidden"
            >
              {/* Header Section - Always Visible */}
              <div className="bg-[#FAFAFA] border-b border-[#E4E4E7] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#71717B] w-8">
                    #{index + 1}
                  </span>
                  {!isEditing && (
                    <h3 className="font-semibold text-[#09090B] text-base">
                      {column.label}
                    </h3>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleVisibility(column.id)}
                    className="p-2 hover:bg-white rounded-lg transition-all duration-200"
                    title={isVisible ? "非表示にする" : "表示する"}
                  >
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-[#09090B]" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-[#A1A1AA]" />
                    )}
                  </button>

                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit(column.id)}
                        className="p-2 hover:bg-white rounded-lg transition-all duration-200"
                        title="保存"
                      >
                        <Check className="w-4 h-4 text-[#09090B]" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 hover:bg-white rounded-lg transition-all duration-200"
                        title="キャンセル"
                      >
                        <X className="w-4 h-4 text-[#71717B]" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(column)}
                        className="p-2 hover:bg-white rounded-lg transition-all duration-200"
                        title="編集"
                      >
                        <Edit2 className="w-4 h-4 text-[#09090B]" />
                      </button>
                      <button
                        onClick={() => handleDeleteColumn(column.id)}
                        disabled={isDeleting}
                        className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-all duration-200 disabled:opacity-50"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4 text-[#71717B]" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Content Section - Fixed Height */}
              <div className="p-5 h-[180px] flex flex-col justify-between">
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Editing Form */}
                    <div>
                      <label className="block text-xs font-semibold text-[#09090B] mb-2">
                        表示名
                      </label>
                      <input
                        type="text"
                        value={editForm.label || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            label: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-[#09090B] transition-all bg-white"
                        placeholder="列の表示名"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#09090B] mb-2">
                          種類
                        </label>
                        <Select
                          value={editForm.type || ""}
                          onValueChange={(value) =>
                            setEditForm({ ...editForm, type: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="種類を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {columnTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 px-3 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors cursor-pointer h-9">
                          <Checkbox
                            checked={editForm.is_required || false}
                            onCheckedChange={(checked) =>
                              setEditForm({
                                ...editForm,
                                is_required: checked as boolean,
                              })
                            }
                          />
                          <span className="text-sm text-[#09090B] font-medium">
                            必須
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* View Mode */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-[#09090B] border-[#E4E4E7]"
                      >
                        {getColumnTypeLabel(column.type)}
                      </Badge>
                      {column.is_required && (
                        <Badge
                          variant="outline"
                          className="text-[#09090B] border-[#E4E4E7]"
                        >
                          必須
                        </Badge>
                      )}
                      {isVisible && (
                        <Badge
                          variant="outline"
                          className="text-[#09090B] border-[#E4E4E7]"
                        >
                          表示中
                        </Badge>
                      )}
                    </div>
                    <div className="pt-2 border-t border-[#E4E4E7]">
                      <p className="text-xs text-[#A1A1AA] mb-1.5">
                        フィールド ID
                      </p>
                      <code className="text-sm font-mono text-[#09090B] bg-[#FAFAFA] px-2.5 py-1.5 rounded-lg border border-[#E4E4E7] inline-block">
                        {column.name}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {columns.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white border-2 border-dashed border-[#E4E4E7] rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="w-20 h-20 bg-[#F4F4F5] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Columns className="w-10 h-10 text-[#71717B]" />
            </div>
            <h3 className="text-xl font-bold text-[#09090B] mb-2">
              列がありません
            </h3>
            <p className="text-sm text-[#71717B] mb-6 max-w-sm mx-auto">
              最初の列を追加してデータの構造を定義しましょう
            </p>
            <button
              onClick={() => setShowAddColumn(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors shadow-[0px_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0px_6px_30px_rgba(0,0,0,0.25)] font-medium"
            >
              <Plus className="w-5 h-5" />
              最初の列を追加
            </button>
          </div>
        )}
      </div>

      {/* Add Column Modal */}
      {showAddColumn && (
        <AddColumnModal
          tableId={tableId}
          existingColumns={columns}
          onClose={() => setShowAddColumn(false)}
        />
      )}
    </div>
  );
}

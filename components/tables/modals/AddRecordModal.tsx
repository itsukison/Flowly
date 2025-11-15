"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2 } from "lucide-react";
import DynamicFieldRenderer from "../core/DynamicFieldRenderer";

interface RowData {
  [key: string]: any;
  _tempId: string;
}

export default function AddRecordModal({
  tableId,
  columns,
  statuses,
  organizationId,
  onClose,
}: any) {
  const router = useRouter();
  const [rows, setRows] = useState<RowData[]>([
    { _tempId: crypto.randomUUID(), status: statuses[0]?.name || "リード" },
    { _tempId: crypto.randomUUID(), status: statuses[0]?.name || "リード" },
    { _tempId: crypto.randomUUID(), status: statuses[0]?.name || "リード" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addRow = () => {
    setRows([
      ...rows,
      { _tempId: crypto.randomUUID(), status: statuses[0]?.name || "リード" },
    ]);
  };

  const removeRow = (tempId: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row._tempId !== tempId));
    }
  };

  const updateCell = (tempId: string, columnName: string, value: any) => {
    setRows(
      rows.map((row) =>
        row._tempId === tempId ? { ...row, [columnName]: value } : row
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Common fields that go to top-level columns
      const commonFields = ["name", "email", "company", "status"];

      const recordsToCreate = rows
        .filter((row) => {
          // Only include rows that have at least one non-empty field (excluding _tempId and status)
          return Object.keys(row).some(
            (key) =>
              key !== "_tempId" &&
              key !== "status" &&
              row[key] !== null &&
              row[key] !== "" &&
              row[key] !== undefined
          );
        })
        .map((row) => {
          const recordData: any = {
            organization_id: organizationId,
            table_id: tableId,
            name: null,
            email: null,
            company: null,
            status: row.status || statuses[0]?.name || "リード",
            data: {},
          };

          columns.forEach((col: any) => {
            const value = row[col.name];
            
            // Map company_name to company
            if (col.name === "company_name") {
              recordData.company = value || null;
            } else if (commonFields.includes(col.name)) {
              recordData[col.name] = value || null;
            } else {
              // All other fields go into data JSONB
              recordData.data[col.name] = value || null;
            }
          });

          return recordData;
        });

      if (recordsToCreate.length === 0) {
        setError("少なくとも1つのレコードにデータを入力してください");
        setLoading(false);
        return;
      }

      // Create all records
      const createPromises = recordsToCreate.map((data) =>
        fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      );

      const responses = await Promise.all(createPromises);
      const failed = responses.filter((r) => !r.ok);

      if (failed.length > 0) {
        throw new Error(`${failed.length}件のレコード作成に失敗しました`);
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || "レコードの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-[#09090B]">
              複数レコードを追加
            </h2>
            <p className="text-sm text-[#71717B] mt-1">
              スプレッドシートのように複数のレコードを一度に追加できます
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spreadsheet Table */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#FAFAFA] z-10">
                <tr>
                  <th className="border border-[#E4E4E7] px-4 py-3 text-left text-xs font-semibold text-[#71717B] w-12">
                    #
                  </th>
                  {columns.map((column: any) => (
                    <th
                      key={column.id}
                      className="border border-[#E4E4E7] px-4 py-3 text-left text-xs font-semibold text-[#71717B] min-w-[200px]"
                    >
                      {column.label}
                      {column.is_required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </th>
                  ))}
                  <th className="border border-[#E4E4E7] px-4 py-3 text-left text-xs font-semibold text-[#71717B] min-w-[150px]">
                    ステータス
                  </th>
                  <th className="border border-[#E4E4E7] px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr
                    key={row._tempId}
                    className="hover:bg-[#F4F4F5] transition-colors"
                  >
                    <td className="border border-[#E4E4E7] px-4 py-2 text-sm text-[#71717B] text-center">
                      {rowIndex + 1}
                    </td>
                    {columns.map((column: any) => (
                      <td
                        key={column.id}
                        className="border border-[#E4E4E7] p-2"
                      >
                        <DynamicFieldRenderer
                          column={column}
                          value={row[column.name]}
                          onChange={(value) =>
                            updateCell(row._tempId, column.name, value)
                          }
                        />
                      </td>
                    ))}
                    <td className="border border-[#E4E4E7] p-2">
                      <select
                        value={row.status || statuses[0]?.name || ""}
                        onChange={(e) =>
                          updateCell(row._tempId, "status", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B] text-sm bg-white"
                      >
                        {statuses.map((status: any) => (
                          <option key={status.id} value={status.name}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-[#E4E4E7] p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row._tempId)}
                        disabled={rows.length === 1}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="行を削除"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-[#E4E4E7] px-6 py-4 bg-white rounded-b-2xl">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-2 px-4 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                行を追加
              </button>

              {error && (
                <div className="flex-1 mx-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors font-medium"
                  disabled={loading}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] disabled:opacity-50 transition-colors font-medium shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                >
                  {loading ? "作成中..." : `${rows.length}件のレコードを作成`}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

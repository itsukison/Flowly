"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Settings,
  Filter,
  Database,
  Columns,
  Upload,
  Settings2,
  Target,
  TrendingUp,
  CheckCircle2,
  Users,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import DynamicTable from "./DynamicTable";
import AddRecordModal from "./AddRecordModal";
import ColumnManager from "./EnhancedColumnManager";
import DataImport from "./DataImport";
import { getIconComponent } from "@/lib/iconMapping";

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

interface Customer {
  id: string;
  [key: string]: any;
}

interface TableViewProps {
  table: any;
  columns: Column[];
  statuses: Status[];
  initialCustomers: Customer[];
}

type TabType = "data" | "columns" | "import" | "settings";

export default function TableView({
  table,
  columns,
  statuses,
  initialCustomers,
}: TableViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("data");
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const tabs = [
    { id: "data", label: "データ", icon: Database },
    { id: "columns", label: "列の管理", icon: Columns },
    { id: "import", label: "データインポート", icon: Upload },
    { id: "settings", label: "設定", icon: Settings2 },
  ];

  const totalRecords = initialCustomers.length;
  const statusStats = statuses.slice(0, 3).map((status) => ({
    name: status.name,
    count: initialCustomers.filter((c) => c.status === status.name).length,
  }));

  const handleDeduplicate = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`${selectedIds.length}件のレコードから重複を検出しますか？`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/deduplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) throw new Error('Deduplication failed');

      router.refresh();
      setSelectedIds([]);
      alert('重複検出が完了しました');
    } catch (error) {
      console.error('Deduplication error:', error);
      alert('重複検出に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnrich = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`${selectedIds.length}件のレコードをエンリッチしますか？`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) throw new Error('Enrichment failed');

      router.refresh();
      setSelectedIds([]);
      alert('エンリッチメントをキューに追加しました');
    } catch (error) {
      console.error('Enrichment error:', error);
      alert('エンリッチメントに失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get the icon component for the table
  const TableIcon = getIconComponent(table.icon);

  // Map status names to icons
  const getStatusIcon = (statusName: string) => {
    const lowerName = statusName.toLowerCase();
    if (lowerName.includes("リード") || lowerName.includes("lead"))
      return Target;
    if (
      lowerName.includes("商談") ||
      lowerName.includes("交渉") ||
      lowerName.includes("negotiation")
    )
      return TrendingUp;
    if (
      lowerName.includes("契約") ||
      lowerName.includes("成約") ||
      lowerName.includes("contract") ||
      lowerName.includes("closed")
    )
      return CheckCircle2;
    if (lowerName.includes("顧客") || lowerName.includes("customer"))
      return Users;
    return Target; // Default icon
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
            <TableIcon className="w-7 h-7 text-[#09090B]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#09090B]">{table.name}</h1>
            {table.description && (
              <p className="text-[#71717B] mt-1">{table.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#71717B]">総レコード数</h3>
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
              <Database className="w-5 h-5 text-[#71717B]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#09090B]">{totalRecords}</p>
          <p className="text-xs text-[#71717B]">すべてのレコード</p>
        </div>

        {statusStats.map((stat, index) => {
          const StatusIcon = getStatusIcon(stat.name);
          return (
            <div
              key={index}
              className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#71717B]">
                  {stat.name}
                </h3>
                <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
                  <StatusIcon className="w-5 h-5 text-[#09090B]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#09090B]">{stat.count}</p>
              <p className="text-xs text-[#71717B]">レコード</p>
            </div>
          );
        })}

        {statusStats.length < 3 &&
          Array.from({ length: 3 - statusStats.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] opacity-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#71717B]">-</h3>
                <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#A1A1AA]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#09090B]">0</p>
              <p className="text-xs text-[#71717B]">レコード</p>
            </div>
          ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#E4E4E7] mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 transition-colors
                  ${
                    isActive
                      ? "border-[#09090B] text-[#09090B]"
                      : "border-transparent text-[#71717B] hover:text-[#09090B]"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "data" && (
          <div>
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors">
                  <Filter className="w-4 h-4" />
                  フィルター
                </button>
                <button
                  onClick={handleDeduplicate}
                  disabled={selectedIds.length === 0 || isProcessing}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    selectedIds.length > 0
                      ? 'border-[#09090B] bg-[#09090B] text-white hover:bg-[#27272A]'
                      : 'border-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  重複を削除
                </button>
                <button
                  onClick={handleEnrich}
                  disabled={selectedIds.length === 0 || isProcessing}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    selectedIds.length > 0
                      ? 'border-[#09090B] bg-[#09090B] text-white hover:bg-[#27272A]'
                      : 'border-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  情報を補完
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddRecord(true)}
                  className="flex items-center gap-2 bg-[#09090B] text-white px-4 py-2 rounded-lg hover:bg-[#27272A] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  レコードを追加
                </button>
              </div>
            </div>

            {/* Table */}
            <DynamicTable
              columns={columns}
              statuses={statuses}
              customers={initialCustomers}
              tableId={table.id}
              onSelectionChange={setSelectedIds}
            />
          </div>
        )}

        {activeTab === "columns" && (
          <ColumnManager
            tableId={table.id}
            columns={columns}
            visibleColumns={columns.map((col) => col.id)}
            onVisibilityChange={() => {}}
            onClose={() => {}}
          />
        )}

        {activeTab === "import" && (
          <DataImport
            tableId={table.id}
            columns={columns}
            onImportComplete={() => window.location.reload()}
          />
        )}

        {activeTab === "settings" && (
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#09090B] mb-2">
                テーブル設定
              </h2>
              <p className="text-sm text-[#71717B]">
                テーブルの基本情報や表示設定を管理できます。
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-[#09090B] mb-4">基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#71717B] mb-1">
                      テーブル名
                    </label>
                    <input
                      type="text"
                      value={table.name}
                      className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B]"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#71717B] mb-1">
                      アイコン
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-[#F4F4F5] rounded-lg flex items-center justify-center">
                        <TableIcon className="w-6 h-6 text-[#09090B]" />
                      </div>
                      <button className="px-3 py-1 text-sm border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors">
                        変更
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-[#09090B] mb-4">説明</h3>
                <textarea
                  value={table.description || ""}
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B]"
                  rows={3}
                  readOnly
                />
              </div>

              <div className="pt-4 border-t border-[#E4E4E7]">
                <button className="px-6 py-2 bg-[#09090B] text-white rounded-lg hover:bg-[#27272A] transition-colors">
                  変更を保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddRecord && (
        <AddRecordModal
          tableId={table.id}
          columns={columns}
          statuses={statuses}
          organizationId={table.organization_id}
          onClose={() => setShowAddRecord(false)}
        />
      )}
    </div>
  );
}

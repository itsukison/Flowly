"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  Database,
  Settings,
  Trash2,
  Copy,
  Download,
  Upload,
  Users,
  Clock,
  Shield
} from "lucide-react";
import { getIconComponent } from "@/lib/iconMapping";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface TableSettingsFormProps {
  tableId: string;
  initialData: {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    created_at: string;
    updated_at: string;
  };
}

const iconOptions = [
  { name: "Table", value: "table" },
  { name: "Database", value: "database" },
  { name: "Users", value: "users" },
  { name: "Settings", value: "settings" },
  { name: "Clock", value: "clock" },
  { name: "Shield", value: "shield" },
];

export default function TableSettingsForm({ tableId, initialData }: TableSettingsFormProps) {
  const [formData, setFormData] = useState({
    name: initialData.name,
    description: initialData.description || "",
    icon: initialData.icon,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const supabase = createClient();

  const TableIcon = getIconComponent(formData.icon);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('tables')
        .update({
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tableId);

      if (error) {
        throw error;
      }

      toast.success("テーブル設定を保存しました");
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error("テーブル設定の保存に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTable = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);

      if (error) {
        throw error;
      }

      toast.success("テーブルを削除しました");
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error("テーブルの削除に失敗しました");
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleExportData = async () => {
    try {
      const { data: records, error } = await supabase
        .from('records')
        .select('*')
        .eq('table_id', tableId);

      if (error) {
        throw error;
      }

      const dataStr = JSON.stringify(records, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `${formData.name}_data.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast.success("データをエクスポートしました");
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error("データのエクスポートに失敗しました");
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">基本設定</h3>
          <p className="text-sm text-gray-600">
            テーブルの基本情報や表示設定を管理できます。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tableName">テーブル名</Label>
              <Input
                id="tableName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="テーブル名を入力"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableIcon">アイコン</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <TableIcon className="mr-2 h-4 w-4" />
                    {formData.icon}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {iconOptions.map((icon) => {
                    const IconComponent = getIconComponent(icon.value);
                    return (
                      <DropdownMenuItem
                        key={icon.value}
                        onClick={() => setFormData(prev => ({ ...prev, icon: icon.value }))}
                        className="flex items-center gap-2"
                      >
                        <IconComponent className="h-4 w-4" />
                        {icon.name}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tableDescription">説明</Label>
            <Textarea
              id="tableDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="テーブルの説明を入力"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "変更を保存"}
            </Button>
          </div>
        </form>
      </div>

      {/* Table Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">テーブル情報</h3>
          <p className="text-sm text-gray-600">
            テーブルの詳細情報と統計データです。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">テーブルID</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{initialData.id}</Badge>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">作成日時</Label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(initialData.created_at).toLocaleString('ja-JP')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">最終更新</Label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(initialData.updated_at).toLocaleString('ja-JP')}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">レコード数</Label>
              <div className="mt-1">
                <Badge variant="outline">取得中...</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">高度な操作</h3>
          <p className="text-sm text-gray-600">
            データ管理やテーブルの操作に関する機能です。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={handleExportData}
            className="justify-start"
          >
            <Download className="mr-2 h-4 w-4" />
            データをエクスポート
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            disabled
          >
            <Upload className="mr-2 h-4 w-4" />
            データをインポート
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            disabled
          >
            <Copy className="mr-2 h-4 w-4" />
            テーブルを複製
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            disabled
          >
            <Users className="mr-2 h-4 w-4" />
            共有設定
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-red-800 mb-2">危険な操作</h3>
          <p className="text-sm text-red-600">
            これらの操作は元に戻せません。実行する前に注意深く確認してください。
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-800">テーブルを削除</h4>
              <p className="text-sm text-red-600">テーブルとすべてのデータを完全に削除します</p>
            </div>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  テーブルを削除
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>テーブルの削除確認</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    「{formData.name}」テーブルを削除しようとしています。
                    この操作は元に戻せず、テーブル内のすべてのデータが永久に削除されます。
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                      disabled={isLoading}
                    >
                      キャンセル
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteTable}
                      disabled={isLoading}
                    >
                      {isLoading ? "削除中..." : "削除する"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
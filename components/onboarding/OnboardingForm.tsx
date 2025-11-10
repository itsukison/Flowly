"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

interface OnboardingFormProps {
  userId: string;
}

export default function OnboardingForm({ userId }: OnboardingFormProps) {
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call server-side API route that uses service role to bypass RLS
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationName: organizationName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "組織の作成に失敗しました");
      }

      // Success - use window.location for hard redirect to ensure fresh data
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "組織の作成に失敗しました");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="orgName" className="text-sm font-medium text-[#09090B]">
          組織名
        </label>
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717B]" />
          <input
            id="orgName"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="w-full pl-12 pr-4 py-3 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:border-transparent"
            placeholder="例: 株式会社サンプル"
          />
        </div>
        <p className="text-xs text-[#71717B]">後で変更できます</p>
      </div>

      <button
        type="submit"
        disabled={loading || !organizationName.trim()}
        className="bg-[#09090B] text-white px-6 py-3 rounded-full font-bold text-base hover:bg-[#27272A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0px_4px_20px_rgba(0,0,0,0.15)]"
      >
        {loading ? "作成中..." : "組織を作成して開始"}
      </button>
    </form>
  );
}

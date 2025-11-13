"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

const navigation = [
  { name: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse } = useSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:fixed md:inset-y-0 md:flex md:flex-col md:pt-16 transition-all duration-300 ease-in-out
          ${isCollapsed ? "md:w-16" : "md:w-64"}
        `}
      >
        <div className="flex flex-col flex-grow bg-white border-r border-[#E4E4E7] overflow-y-auto">
          {/* Toggle Button */}
          <div
            className={`px-4 py-4 ${
              isCollapsed ? "flex justify-center" : "flex justify-end"
            }`}
          >
            <button
              onClick={toggleCollapse}
              className={`hover:bg-[#F4F4F5] rounded-lg transition-colors ${
                isCollapsed ? "w-9 h-9 flex items-center justify-center" : "p-2"
              }`}
              title={
                isCollapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"
              }
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-[#71717B]" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-[#71717B]" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center rounded-xl text-base font-medium transition-all
                    ${
                      isActive
                        ? "bg-[#09090B] text-white"
                        : "text-[#71717B] hover:bg-[#F4F4F5] hover:text-[#09090B]"
                    }
                    ${
                      isCollapsed ? "w-9 h-9 justify-center" : "gap-3 px-4 py-3"
                    }
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E4E4E7] z-50">
        <div className="flex justify-around items-center h-16">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all
                  ${isActive ? "text-[#09090B]" : "text-[#71717B]"}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

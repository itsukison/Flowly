"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Database,
  Columns,
  Settings,
  User,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useEffect, useState } from "react";

const dashboardNavigation = [
  { name: "プロフィール", href: "/dashboard/settings", icon: User },
  { name: "ダッシュボード", href: "/dashboard", icon: Home },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse } = useSidebar();
  const [tableContext, setTableContext] = useState<{
    tableId: string;
    tableName: string;
    tableIcon: string;
  } | null>(null);

  useEffect(() => {
    // Check if we're on a table page
    const tableMatch = pathname.match(/\/dashboard\/tables\/([^\/]+)/);
    if (tableMatch) {
      const tableId = tableMatch[1];
      
      // Function to get table info from data attributes
      const updateTableContext = () => {
        const tableName = document.body.getAttribute('data-table-name');
        const tableIcon = document.body.getAttribute('data-table-icon');
        
        if (tableName && tableIcon) {
          setTableContext({
            tableId,
            tableName,
            tableIcon,
          });
        }
      };

      // Try immediately
      updateTableContext();

      // Watch for attribute changes on body element
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === 'attributes' &&
            (mutation.attributeName === 'data-table-name' ||
              mutation.attributeName === 'data-table-icon')
          ) {
            updateTableContext();
          }
        });
      });

      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-table-name', 'data-table-icon'],
      });

      return () => {
        observer.disconnect();
      };
    } else {
      setTableContext(null);
    }
  }, [pathname]);

  // Table navigation - always defined, but disabled when no table selected
  const tableNavigation = [
    {
      name: "概要",
      href: tableContext ? `/dashboard/tables/${tableContext.tableId}` : "#",
      icon: LayoutGrid,
    },
    {
      name: "データ",
      href: tableContext ? `/dashboard/tables/${tableContext.tableId}/data` : "#",
      icon: Database,
    },
    {
      name: "列の管理",
      href: tableContext ? `/dashboard/tables/${tableContext.tableId}/columns` : "#",
      icon: Columns,
    },
    {
      name: "設定",
      href: tableContext ? `/dashboard/tables/${tableContext.tableId}/settings` : "#",
      icon: Settings,
    },
  ];

  const isTableNavigationDisabled = !tableContext;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:fixed md:inset-y-0 md:flex md:flex-col md:pt-16
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "md:w-16" : "md:w-64"}
        `}
      >
        <div className="flex flex-col flex-grow bg-white border-r border-[#E4E4E7] overflow-y-auto">
          {/* Toggle Button */}
          <div
            className={`
              px-4 py-2 transition-all duration-300
              ${isCollapsed ? "flex justify-center" : "flex justify-end"}
            `}
          >
            <button
              onClick={toggleCollapse}
              className={`
                hover:bg-[#F4F4F5] rounded-lg transition-all duration-200 transform hover:scale-105
                ${isCollapsed ? "w-9 h-9 flex items-center justify-center" : "p-2"}
              `}
              title={
                isCollapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"
              }
            >
              <ChevronRight
                className={`w-5 h-5 text-[#71717B] transition-transform duration-200 ${
                  isCollapsed ? "rotate-0" : "rotate-180"
                }`}
              />
            </button>
          </div>

          {/* Dashboard Navigation */}
          <nav className="px-4 pt-2 pb-4 space-y-2">
            {dashboardNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center rounded-xl text-base font-medium
                    transition-all duration-200 hover:scale-[1.02]
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
                  <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200" />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Separator */}
          <div className="border-t border-[#E4E4E7]" />

          {/* Table Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {tableNavigation.map((item) => {
              const isActive = pathname === item.href && !isTableNavigationDisabled;
              const Icon = item.icon;

              if (isTableNavigationDisabled) {
                // Disabled state - not clickable
                return (
                  <div
                    key={item.name}
                    className={`
                      flex items-center rounded-xl text-base font-medium cursor-not-allowed
                      text-[#A1A1AA] transition-all duration-200
                      ${
                        isCollapsed ? "w-9 h-9 justify-center" : "gap-3 px-4 py-3"
                      }
                    `}
                    title={isCollapsed ? item.name : "テーブルを選択してください"}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 opacity-40 transition-transform duration-200" />
                    {!isCollapsed && (
                      <span className="whitespace-nowrap overflow-hidden opacity-40">
                        {item.name}
                      </span>
                    )}
                  </div>
                );
              }

              // Active state - clickable
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center rounded-xl text-base font-medium
                    transition-all duration-200 hover:scale-[1.02]
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
                  <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200" />
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E4E4E7] z-50 transition-all duration-200">
        <div className="grid grid-cols-5 items-center h-16">
          {/* Dashboard Link */}
          {dashboardNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1 px-2 py-2
                  transition-all duration-200 hover:scale-110
                  ${isActive ? "text-[#09090B]" : "text-[#71717B]"}
                `}
              >
                <Icon className="w-5 h-5 transition-transform duration-200" />
                <span className="text-xs font-medium truncate max-w-full">
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Table Navigation */}
          {tableNavigation.map((item) => {
            const isActive = pathname === item.href && !isTableNavigationDisabled;
            const Icon = item.icon;

            if (isTableNavigationDisabled) {
              return (
                <div
                  key={item.name}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-[#A1A1AA] cursor-not-allowed transition-all duration-200"
                >
                  <Icon className="w-5 h-5 opacity-40 transition-transform duration-200" />
                  <span className="text-xs font-medium opacity-40 truncate max-w-full">
                    {item.name}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1 px-2 py-2
                  transition-all duration-200 hover:scale-110
                  ${isActive ? "text-[#09090B]" : "text-[#71717B]"}
                `}
              >
                <Icon className="w-5 h-5 transition-transform duration-200" />
                <span className="text-xs font-medium truncate max-w-full">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

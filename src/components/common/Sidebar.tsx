import React from 'react';
import {
  ShoppingCart,
  Clock,
  Layers,
  ChefHat,
  UtensilsCrossed,
  Tag,
  Users,
  Package,
  Receipt,
  BarChart3,
  Database,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { UserRole } from '../../types/pos';

export type NavTab =
  | 'pos'
  | 'orders'
  | 'tables'
  | 'kot'
  | 'menu'
  | 'deals'
  | 'udhaar'
  | 'inventory'
  | 'expenses'
  | 'reports'
  | 'backup'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  role: UserRole;
  pendingOrdersCount: number;
  deal18Unconfirmed: boolean;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  role,
  pendingOrdersCount,
  deal18Unconfirmed,
  lowStockCount,
}) => {
  const navItems = [
    { id: 'pos' as NavTab, label: 'Billing POS', icon: ShoppingCart, shortcut: 'F1' },
    {
      id: 'orders' as NavTab,
      label: 'Orders',
      icon: Clock,
      shortcut: 'F2',
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { id: 'tables' as NavTab, label: 'Tables', icon: Layers, shortcut: 'F3' },
    { id: 'kot' as NavTab, label: 'Kitchen KOT', icon: ChefHat, shortcut: 'F4' },
    { id: 'menu' as NavTab, label: 'Menu & Prices', icon: UtensilsCrossed, adminOnly: true },
    {
      id: 'deals' as NavTab,
      label: 'Deals (1-26)',
      icon: Tag,
      adminOnly: true,
      alert: deal18Unconfirmed,
    },
    { id: 'udhaar' as NavTab, label: 'Udhaar / Credit', icon: Users },
    {
      id: 'inventory' as NavTab,
      label: 'Inventory',
      icon: Package,
      adminOnly: true,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    { id: 'expenses' as NavTab, label: 'Expenses', icon: Receipt },
    { id: 'reports' as NavTab, label: 'Sales Reports', icon: BarChart3, adminOnly: true },
    { id: 'backup' as NavTab, label: 'Backup & Restore', icon: Database, adminOnly: true },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings, adminOnly: true },
  ];

  return (
    <aside className="pos-no-print w-16 md:w-56 bg-[#121215] border-r border-[#27272a] flex flex-col justify-between shrink-0 select-none">
      <div className="py-2.5 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isRestricted = item.adminOnly && role !== 'ADMIN';

          return (
            <button
              key={item.id}
              onClick={() => {
                if (!isRestricted) setActiveTab(item.id);
              }}
              disabled={isRestricted}
              title={isRestricted ? 'Requires Admin Mode' : item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all relative ${
                isActive
                  ? 'bg-gradient-to-r from-[#d97706] to-[#b45309] text-white shadow-sm'
                  : isRestricted
                  ? 'text-zinc-600 cursor-not-allowed opacity-50'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1f1f23]'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
              <span className="hidden md:inline whitespace-nowrap">{item.label}</span>

              {/* F-Key Shortcut hint */}
              {item.shortcut && (
                <span className="hidden md:inline ml-auto text-[10px] font-mono text-zinc-500 bg-[#0f0f11] px-1 py-0.5 rounded border border-[#27272a]">
                  {item.shortcut}
                </span>
              )}

              {/* Numeric Badge */}
              {item.badge !== undefined && (
                <span
                  className={`ml-auto text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                    item.badgeColor || 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Alert indicator for unconfirmed Deal 18 */}
              {item.alert && (
                <span title="Deal 18 price needs admin confirmation!" className="ml-auto text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Info */}
      <div className="p-3 border-t border-[#27272a] hidden md:block text-[11px] text-zinc-500 text-center">
        <p className="font-medium text-zinc-400">DUBAI PIZZA SHOP</p>
        <p className="text-[10px] text-zinc-600 mt-0.5">Desktop POS v2.0</p>
      </div>
    </aside>
  );
};

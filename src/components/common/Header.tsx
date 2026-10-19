import React from 'react';
import { UserRole } from '../../types/pos';
import {
  Monitor,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  Printer,
  Calendar,
  Clock,
  Download,
} from 'lucide-react';
import { formatCurrency } from '../../services/calculator';

interface HeaderProps {
  shopName: string;
  role: UserRole;
  onToggleRole: () => void;
  todaySales: number;
  todayOrdersCount: number;
  onOpenDesktopModal: () => void;
  onReprintLast: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  shopName,
  role,
  onToggleRole,
  todaySales,
  todayOrdersCount,
  onOpenDesktopModal,
  onReprintLast,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formattedDate = time.toLocaleDateString('en-PK', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = time.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="pos-no-print h-14 bg-[#141417] border-b border-[#27272a] px-4 flex items-center justify-between gap-6 shrink-0 z-20">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d97706] to-[#b45309] flex items-center justify-center shadow-sm">
          <span className="font-serif font-black text-xs text-white tracking-widest">DP</span>
        </div>
        <div className="leading-tight">
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            {shopName}
            <span className="text-[11px] font-mono text-[#d97706] bg-[#d97706]/10 px-1.5 py-0.5 rounded border border-[#d97706]/20">
              OFFLINE POS
            </span>
          </h1>
          <p className="text-[11px] text-zinc-400">Sian, Jhal · 0342-2562389</p>
        </div>
      </div>

      {/* Zone 2: Essential Operational Metrics & Clock */}
      <div className="hidden lg:flex items-center gap-8 text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Today Sales:</span>
          <span className="font-mono font-bold text-[#fbbf24] text-sm tabular-nums">
            {formatCurrency(todaySales)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Orders:</span>
          <span className="font-mono font-bold text-white text-sm tabular-nums">
            {todayOrdersCount}
          </span>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 border-l border-[#27272a] pl-6 font-mono text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <span>{formattedDate}</span>
          <Clock className="w-3.5 h-3.5 text-zinc-500 ml-2" />
          <span className="tabular-nums text-zinc-300">{formattedTime}</span>
        </div>
      </div>

      {/* Zone 3: Actions & Window Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Reprint Last Bill */}
        <button
          onClick={onReprintLast}
          title="Reprint last completed bill"
          className="px-2.5 py-1.5 text-xs text-zinc-300 bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Reprint Bill</span>
        </button>

        {/* Windows Desktop Package / Installer Info */}
        <button
          onClick={onOpenDesktopModal}
          className="px-2.5 py-1.5 text-xs text-[#fbbf24] bg-[#d97706]/15 hover:bg-[#d97706]/25 border border-[#d97706]/30 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
        >
          <Download className="w-3.5 h-3.5 text-[#fbbf24]" />
          <span className="hidden sm:inline">Windows App (.exe)</span>
        </button>

        {/* Role Switcher (Admin / Cashier) */}
        <button
          onClick={onToggleRole}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
            role === 'ADMIN'
              ? 'bg-[#d97706] text-white border-[#b45309] shadow-sm'
              : 'bg-[#1f1f23] text-zinc-200 border-[#2e2e33] hover:bg-[#27272a]'
          }`}
        >
          {role === 'ADMIN' ? (
            <>
              <Unlock className="w-3.5 h-3.5" />
              <span>Admin Mode</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Cashier Mode</span>
            </>
          )}
        </button>

        {/* Fullscreen desktop mode */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen Desktop Mode"
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

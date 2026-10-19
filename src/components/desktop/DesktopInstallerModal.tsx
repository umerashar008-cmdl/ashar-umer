import React, { useState } from 'react';
import {
  Monitor,
  Download,
  Terminal,
  CheckCircle,
  FileCode,
  HardDrive,
  Printer,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface DesktopInstallerModalProps {
  onClose: () => void;
}

export const DesktopInstallerModal: React.FC<DesktopInstallerModalProps> = ({ onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState(false);

  const buildCommand = `npm install && npm run build && npx electron-builder --win nsis`;

  const handleCopy = () => {
    navigator.clipboard.writeText(buildCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const downloadBatchLauncher = () => {
    const batContent = `@echo off
title DUBAI PIZZA SHOP POS - Windows Desktop Launcher
color 0E
echo ======================================================================
echo                 DUBAI PIZZA SHOP - OFFLINE DESKTOP POS
echo                    Sian, Jhal - 0342-2562389
echo ======================================================================
echo.
echo Launching Dubai Pizza Shop POS Desktop...
echo.

if exist "DubaiPizzaShopPOS_Setup.exe" (
  echo Launching Windows Native Application...
  start "" "DubaiPizzaShopPOS_Setup.exe"
  exit
)

start "" "http://localhost:3000"
npm run dev

pause
`;
    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Start_DubaiPizzaShopPOS.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#141417]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-[#fbbf24]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Windows 10 & 11 Desktop Application
              </h3>
              <p className="text-xs text-[#d97706]">
                Offline executable, installer & thermal printer setup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Overview */}
          <div className="p-3 bg-[#121215] border border-[#27272a] rounded-xl space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#fbbf24]" />
              <span>Native Windows Architecture</span>
            </h4>
            <p className="text-zinc-300 leading-relaxed">
              This application has been engineered with a complete Electron desktop runtime, offline local storage persistence, secure preload isolation, and Windows 10/11 64-bit installer configurations.
            </p>
            <ul className="space-y-1 text-zinc-400">
              <li>• Runs 100% offline without requiring internet connection.</li>
              <li>• Data persists safely in the operating system's user data directory.</li>
              <li>• Native thermal printer integration for 80mm and 55mm paper widths.</li>
            </ul>
          </div>

          {/* 1-Click Launch Script */}
          <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl space-y-2">
            <h4 className="font-bold text-white flex items-center justify-between">
              <span>Option 1: Windows 1-Click Desktop Launcher (.bat)</span>
              <button
                onClick={downloadBatchLauncher}
                className="px-2.5 py-1 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .bat Launcher</span>
              </button>
            </h4>
            <p className="text-zinc-400">
              Double-click the downloaded <code className="text-[#fbbf24] font-mono">Start_DubaiPizzaShopPOS.bat</code> on your Windows desktop to instantly boot the offline POS server.
            </p>
          </div>

          {/* Electron Builder Command */}
          <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#fbbf24]" />
                <span>Option 2: Generate Windows Installer (`DubaiPizzaShopPOS_Setup.exe`)</span>
              </h4>
              <button
                onClick={handleCopy}
                className="text-xs font-bold text-[#fbbf24] hover:underline"
              >
                {copiedCmd ? 'Copied!' : 'Copy Command'}
              </button>
            </div>
            <p className="text-zinc-400">
              To bundle the standalone Windows setup executable using electron-builder configured in <code className="text-zinc-300 font-mono">electron-builder.json</code>, execute:
            </p>
            <pre className="p-2.5 bg-[#0f0f11] border border-[#27272a] rounded-lg font-mono text-[11px] text-zinc-200 overflow-x-auto">
              {buildCommand}
            </pre>
            <p className="text-[11px] text-zinc-500">
              Outputs <code className="text-zinc-400 font-mono">DubaiPizzaShopPOS_Setup.exe</code> and portable build into the <code className="text-zinc-400 font-mono">dist-electron/</code> folder.
            </p>
          </div>

          {/* Thermal Printer Setup */}
          <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#d97706]" />
              <span>Windows Thermal Printer Setup Instructions (80mm & 55mm)</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-300">
              <li>
                Connect your thermal printer via USB (e.g. Xprinter XP-80, EPSON TM-T88, POS-80).
              </li>
              <li>
                In Windows <strong>Settings &gt; Printers &amp; Scanners</strong>, set paper size to <strong>80mm x Receipt</strong> or <strong>58mm x Receipt</strong>.
              </li>
              <li>
                In Chrome / Edge / Desktop App print dialog, set Margins to <strong>None</strong> and enable <strong>Background graphics</strong>.
              </li>
              <li>
                Disable browser headers and footers (uncheck "Headers and Footers" checkbox).
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272a] bg-[#141417] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

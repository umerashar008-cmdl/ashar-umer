import React, { useState } from 'react';
import { ShopSettings } from '../../types/pos';
import {
  Settings,
  Printer,
  Save,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Store,
  Monitor,
  CheckCircle,
} from 'lucide-react';

interface SettingsManagerProps {
  settings: ShopSettings;
  onSaveSettings: (settings: ShopSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (fileContent: string) => void;
  onRestoreSafetySnapshot: () => void;
  onOpenDesktopModal: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  settings,
  onSaveSettings,
  onExportBackup,
  onImportBackup,
  onRestoreSafetySnapshot,
  onOpenDesktopModal,
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [phone1, setPhone1] = useState(settings.phones[0] || '0342-2562389');
  const [phone2, setPhone2] = useState(settings.phones[1] || '0347-2762389');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShopSettings = {
      ...formData,
      phones: [phone1.trim(), phone2.trim()].filter(Boolean),
    };
    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (
          window.confirm(
            'Restore database from this backup file? An automatic safety backup of current data will be saved first.'
          )
        ) {
          onImportBackup(content);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0f0f11]">
      {/* Top Banner */}
      <div className="p-3.5 bg-[#141417] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center">
            <Settings className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              System Settings & Store Preferences
            </h2>
            <p className="text-[11px] text-zinc-400">
              Thermal receipt sizing, printer assignment, backup/restore, and security PINs
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs px-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Settings saved successfully to persistent local storage.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl space-y-5">
        {/* Windows Desktop App Installer Section */}
        <div className="p-4 bg-gradient-to-r from-[#18181b] to-[#1e1913] border border-[#d97706]/40 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#fbbf24]" />
              <span>Windows 10 / 11 Native Desktop Package</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Launch standalone offline without Chrome, build installer, and run full screen
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenDesktopModal}
            className="px-3.5 py-2 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Windows Installer (.exe)</span>
          </button>
        </div>

        {/* Store Profile */}
        <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#27272a] pb-2">
            <Store className="w-4 h-4 text-[#d97706]" />
            <span>Restaurant Branding & Details</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Shop Name *</label>
              <input
                type="text"
                required
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-white"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Shop Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-white"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Footer Message</label>
              <input
                type="text"
                value={formData.footerMessage}
                onChange={(e) => setFormData({ ...formData, footerMessage: e.target.value })}
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-white"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Phone Number 1 *</label>
              <input
                type="text"
                required
                value={phone1}
                onChange={(e) => setPhone1(e.target.value)}
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Phone Number 2 *</label>
              <input
                type="text"
                required
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Thermal Printer Settings */}
        <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#27272a] pb-2">
            <Printer className="w-4 h-4 text-[#d97706]" />
            <span>Windows Thermal Printer Configuration</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Receipt Width */}
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Receipt Paper Width</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, receiptWidth: '80mm' })}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                    formData.receiptWidth === '80mm'
                      ? 'bg-[#d97706] text-white border-[#b45309]'
                      : 'bg-[#121215] text-zinc-400 border-[#2e2e33]'
                  }`}
                >
                  80mm (Standard POS)
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, receiptWidth: '55mm' })}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                    formData.receiptWidth === '55mm'
                      ? 'bg-[#d97706] text-white border-[#b45309]'
                      : 'bg-[#121215] text-zinc-400 border-[#2e2e33]'
                  }`}
                >
                  55mm (Compact / Mobile)
                </button>
              </div>
            </div>

            {/* Default Printer Name */}
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Customer Receipt Printer
              </label>
              <input
                type="text"
                value={formData.defaultPrinter}
                onChange={(e) => setFormData({ ...formData, defaultPrinter: e.target.value })}
                placeholder="e.g. POS-80 or XP-80"
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-white"
              />
            </div>

            {/* Kitchen Printer Name */}
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Kitchen KOT Printer
              </label>
              <input
                type="text"
                value={formData.kotPrinter}
                onChange={(e) => setFormData({ ...formData, kotPrinter: e.target.value })}
                placeholder="e.g. Kitchen-POS or KOT-80"
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-white"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableAutoPrintReceipt}
                  onChange={(e) =>
                    setFormData({ ...formData, enableAutoPrintReceipt: e.target.checked })
                  }
                  className="rounded border-[#2e2e33] text-[#d97706] focus:ring-0"
                />
                <span className="text-zinc-300">Auto-trigger print dialog on completing order</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableAutoPrintKOT}
                  onChange={(e) =>
                    setFormData({ ...formData, enableAutoPrintKOT: e.target.checked })
                  }
                  className="rounded border-[#2e2e33] text-[#d97706] focus:ring-0"
                />
                <span className="text-zinc-300">Auto-print Kitchen KOT ticket on order confirmation</span>
              </label>
            </div>
          </div>
        </div>

        {/* Security PINs */}
        <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#27272a] pb-2">
            <ShieldCheck className="w-4 h-4 text-[#d97706]" />
            <span>Role Authentication & Access PINs</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Admin Mode PIN (Default: 1234)
              </label>
              <input
                type="password"
                maxLength={6}
                value={formData.adminPin}
                onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Cashier Mode PIN (Default: 0000)
              </label>
              <input
                type="password"
                maxLength={6}
                value={formData.cashierPin}
                onChange={(e) => setFormData({ ...formData, cashierPin: e.target.value })}
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Backup and Restore */}
        <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#27272a] pb-2">
            <Download className="w-4 h-4 text-[#d97706]" />
            <span>Data Safety, Database Backup & Restore</span>
          </h3>

          <p className="text-xs text-zinc-400">
            Export complete verified database containing all 41 menu items, 26 deals, past orders, customer ledger, and expenses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Export */}
            <button
              type="button"
              onClick={onExportBackup}
              className="py-2.5 px-3 bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-[#d97706]" />
              <span>Export Database Backup</span>
            </button>

            {/* Import */}
            <label className="py-2.5 px-3 bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-center">
              <Upload className="w-4 h-4 text-[#fbbf24]" />
              <span>Import / Restore Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Rollback to safety snapshot */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Roll back to the automatic pre-import safety snapshot?')) {
                  onRestoreSafetySnapshot();
                }
              }}
              className="py-2.5 px-3 bg-[#1f1f23] hover:bg-amber-900/30 border border-[#2e2e33] text-amber-300 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rollback Safety Snapshot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

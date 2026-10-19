import React, { useState } from 'react';
import { Order, ShopSettings } from '../../types/pos';
import {
  generateReceiptHtml,
  generateKotHtml,
  printThermalDocument,
} from '../../services/printer';
import { Printer, ChefHat, X, Check } from 'lucide-react';

interface ThermalReceiptModalProps {
  order: Order;
  settings: ShopSettings;
  initialType?: 'BILL' | 'KOT';
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  order,
  settings,
  initialType = 'BILL',
  onClose,
}) => {
  const [printType, setPrintType] = useState<'BILL' | 'KOT'>(initialType);
  const [width, setWidth] = useState<'80mm' | '55mm'>(settings.receiptWidth || '80mm');

  const billHtml = generateReceiptHtml(order, settings, { width });
  const kotHtml = generateKotHtml(order, settings, { width });

  const activeHtml = printType === 'BILL' ? billHtml : kotHtml;

  const handlePrint = () => {
    printThermalDocument(activeHtml);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#27272a] flex items-center justify-between bg-[#141417]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Print Preview</h3>
            <span className="text-[10px] font-mono text-zinc-400">({width})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="p-2.5 bg-[#141417] border-b border-[#27272a] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 bg-[#1e1e22] p-1 rounded-lg">
            <button
              onClick={() => setPrintType('BILL')}
              className={`px-3 py-1 font-bold rounded flex items-center gap-1.5 transition-colors ${
                printType === 'BILL'
                  ? 'bg-[#d97706] text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Customer Bill</span>
            </button>
            <button
              onClick={() => setPrintType('KOT')}
              className={`px-3 py-1 font-bold rounded flex items-center gap-1.5 transition-colors ${
                printType === 'KOT'
                  ? 'bg-[#d97706] text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen KOT</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono">
            <button
              onClick={() => setWidth('80mm')}
              className={`px-2 py-1 rounded ${
                width === '80mm' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400'
              }`}
            >
              80mm
            </button>
            <button
              onClick={() => setWidth('55mm')}
              className={`px-2 py-1 rounded ${
                width === '55mm' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400'
              }`}
            >
              55mm
            </button>
          </div>
        </div>

        {/* Paper Receipt Simulation */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0c] flex justify-center">
          <div
            className="bg-white text-black p-4 shadow-2xl rounded-sm transition-all"
            style={{ width: width === '55mm' ? '220px' : '310px' }}
            dangerouslySetInnerHTML={{ __html: activeHtml }}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#27272a] bg-[#141417] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="py-2 px-3 text-xs text-zinc-400 hover:text-white font-semibold"
          >
            Close Preview
          </button>
          <button
            onClick={handlePrint}
            className="py-2 px-4 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 shadow-md active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>Print {printType === 'BILL' ? 'Receipt' : 'KOT'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

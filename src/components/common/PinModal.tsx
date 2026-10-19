import React, { useState } from 'react';
import { UserRole } from '../../types/pos';
import { Lock, X, Delete } from 'lucide-react';

interface PinModalProps {
  targetRole: UserRole;
  correctPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  targetRole,
  correctPin,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin === correctPin) {
        onSuccess();
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-xs p-5 shadow-2xl flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center mb-3">
          <Lock className="w-5 h-5 text-[#fbbf24]" />
        </div>

        <h3 className="text-sm font-bold text-white text-center">
          Enter PIN for {targetRole === 'ADMIN' ? 'Admin Access' : 'Cashier Access'}
        </h3>
        <p className="text-[11px] text-zinc-500 text-center mt-0.5">
          Default {targetRole === 'ADMIN' ? 'Admin PIN is 1234' : 'Cashier PIN is 0000'}
        </p>

        {/* PIN Dots */}
        <div className="flex gap-2.5 my-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                idx < pin.length
                  ? 'bg-[#d97706] border-[#fbbf24] scale-110'
                  : 'bg-[#121215] border-zinc-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 font-semibold mb-2">Incorrect PIN. Try again.</p>
        )}

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[220px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="h-12 rounded-lg bg-[#212124] hover:bg-[#2e2e33] text-white font-mono text-base font-bold transition-all active:scale-95"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-lg bg-[#1a1a1d] hover:bg-[#27272a] text-zinc-400 text-xs font-semibold"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-lg bg-[#212124] hover:bg-[#2e2e33] text-white font-mono text-base font-bold transition-all active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-lg bg-[#1a1a1d] hover:bg-[#27272a] text-zinc-400 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Cancel */}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-xs text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

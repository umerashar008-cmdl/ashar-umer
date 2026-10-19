import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('POS Application Error Caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    if (window.confirm('Reset local temporary state and restart the POS? Your business records in backup are safe.')) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#0f0f11] p-6 text-white font-sans">
          <div className="max-w-md w-full bg-[#18181b] border border-[#27272a] rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center">
              <span className="text-[#fbbf24] text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-bold text-white">DUBAI PIZZA SHOP POS</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              An unexpected interface error was encountered. The recovery system prevented data loss.
            </p>
            {this.state.error && (
              <div className="p-3 bg-[#121215] border border-red-500/30 rounded-lg text-left font-mono text-[11px] text-red-400 overflow-x-auto max-h-28">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold rounded-lg transition-colors"
              >
                Reload POS
              </button>
              <button
                onClick={this.handleResetState}
                className="flex-1 py-2.5 px-4 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

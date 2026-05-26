// ============================================================
// EduCore: Library Assistant Dashboard
// File: educore/client/src/pages/dashboard/LibraryDashboard.tsx
// ============================================================

import { useState, useCallback } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { useQRScanner } from '../../hooks/useQRScanner';

type TransactionType = 'CHECKOUT' | 'RETURN';

interface Transaction {
  id: string;
  studentId: string;
  bookId: string;
  type: TransactionType;
  time: string;
}

function ScannerWidget({ onScan }: { onScan: (result: string) => void }) {
  const stableScan = useCallback(onScan, []);

  useQRScanner(
    { elementId: 'library-qr-scanner', fps: 10, scanBoxDimensions: 200 },
    stableScan
  );

  return <div id="library-qr-scanner" className="w-full" />;
}

export default function LibraryDashboard() {
  const [mode, setMode]               = useState<TransactionType>('CHECKOUT');
  const [scanning, setScanning]       = useState(false);
  const [lastScan, setLastScan]       = useState<string | null>(null);
  const [bookId, setBookId]           = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [flash, setFlash]             = useState('');

  function handleScan(raw: string) {
    try {
      const parsed = JSON.parse(raw);
      setLastScan(parsed.studentId ?? raw);
    } catch {
      setLastScan(raw);
    }
    setScanning(false);
  }

  function handleLog() {
    if (!lastScan || !bookId.trim()) return;
    const tx: Transaction = {
      id: Date.now().toString(),
      studentId: lastScan,
      bookId: bookId.trim(),
      type: mode,
      time: new Date().toLocaleTimeString(),
    };
    setTransactions(t => [tx, ...t]);
    setFlash(mode === 'CHECKOUT' ? '✓ Checked out' : '✓ Returned');
    setTimeout(() => setFlash(''), 2000);
    setLastScan(null);
    setBookId('');
  }

  return (
    <DashboardShell title="Library">
      <div className="space-y-4">

        {/* Mode toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(['CHECKOUT', 'RETURN'] as TransactionType[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98]
                ${mode === m ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-500'}`}
            >
              {m === 'CHECKOUT' ? '⬆ Check Out' : '⬇ Return'}
            </button>
          ))}
        </div>

        {/* Scanner card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-indigo-950">Scan Student QR</h2>
            {lastScan && (
              <p className="text-xs text-emerald-600 mt-0.5">✓ Student ID: {lastScan}</p>
            )}
          </div>

          {scanning ? (
            <div className="p-3">
              <ScannerWidget onScan={handleScan} />
              <button
                onClick={() => setScanning(false)}
                className="w-full mt-3 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="px-4 py-4 space-y-3">
              {!lastScan ? (
                <button
                  onClick={() => setScanning(true)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <span className="text-lg">▩</span> Open Scanner
                </button>
              ) : (
                <>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Book ID or ISBN"
                    value={bookId}
                    onChange={e => setBookId(e.target.value)}
                  />
                  {flash ? (
                    <div className="w-full bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium text-center">
                      {flash}
                    </div>
                  ) : (
                    <button
                      onClick={handleLog}
                      disabled={!bookId.trim()}
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      Log {mode === 'CHECKOUT' ? 'Check-out' : 'Return'}
                    </button>
                  )}
                  <button
                    onClick={() => { setLastScan(null); setScanning(true); }}
                    className="w-full text-xs text-slate-400 py-1"
                  >
                    Scan different student
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Transaction log */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-indigo-950">Today's Log</h2>
            </div>
            <ul className="divide-y divide-slate-50">
              {transactions.map(tx => (
                <li key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-indigo-950">
                      <span className="font-medium">Book {tx.bookId}</span>
                      <span className="text-slate-400"> · Student {tx.studentId}</span>
                    </p>
                    <p className="text-xs text-slate-400">{tx.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${tx.type === 'CHECKOUT' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {tx.type}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

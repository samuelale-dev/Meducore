// ============================================================
// EduCore: Meal Recorder Dashboard
// File: educore/client/src/pages/dashboard/MealsDashboard.tsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { useAuth } from '../../context/AuthContext';
import { useQRScanner } from '../../hooks/useQRScanner';
import { studentsApi } from '../../services/api';
import { queueOfflineMutation } from '../../lib/syncQueue';
import { useOffline } from '../../hooks/useOffline';

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

interface MealLog { studentId: number; fullName: string; mealType: MealType; time: string; }

function ScannerWidget({ onScan }: { onScan: (result: string) => void }) {
  const stableScan = useCallback(onScan, []);
  useQRScanner({ elementId: 'meals-qr-scanner', fps: 15, scanBoxDimensions: 220 }, stableScan);
  return <div id="meals-qr-scanner" className="w-full" />;
}

const MEAL_COLORS: Record<MealType, string> = {
  BREAKFAST: 'bg-amber-100 text-amber-700',
  LUNCH:     'bg-indigo-100 text-indigo-700',
  DINNER:    'bg-violet-100 text-violet-700',
};

export default function MealsDashboard() {
  const { session } = useAuth();
  const isOffline = useOffline();
  const token = session?.access_token ?? '';

  const [mealType, setMealType]   = useState<MealType>('LUNCH');
  const [scanning, setScanning]   = useState(false);
  const [logs, setLogs]           = useState<MealLog[]>([]);
  const [flash, setFlash]         = useState<{ name: string; type: MealType } | null>(null);
  const [students, setStudents]   = useState<any[]>([]);

  useEffect(() => {
    studentsApi.list(token).then((s: any) => setStudents(s)).catch(() => {});
  }, [token]);

  async function handleScan(raw: string) {
    setScanning(false);
    let studentId: number | null = null;

    try {
      const parsed = JSON.parse(raw);
      studentId = parsed.studentId;
    } catch {
      studentId = parseInt(raw, 10);
    }

    if (!studentId) return;

    const student = students.find((s: any) => s.studentId === studentId);
    const fullName = student?.fullName ?? `Student ${studentId}`;

    const log: MealLog = {
      studentId,
      fullName,
      mealType,
      time: new Date().toLocaleTimeString(),
    };

    setLogs(l => [log, ...l]);
    setFlash({ name: fullName, type: mealType });
    setTimeout(() => setFlash(null), 2500);

    // Queue the API call — works offline too
    const payload = { studentId, mealType, servedAt: new Date().toISOString() };

    if (isOffline) {
      await queueOfflineMutation('/api/meals', payload);
    } else {
      fetch('/api/meals', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => queueOfflineMutation('/api/meals', payload));
    }
  }

  const counts = {
    BREAKFAST: logs.filter(l => l.mealType === 'BREAKFAST').length,
    LUNCH:     logs.filter(l => l.mealType === 'LUNCH').length,
    DINNER:    logs.filter(l => l.mealType === 'DINNER').length,
  };

  return (
    <DashboardShell title="Meal Recorder">
      <div className="space-y-4">

        {/* Flash confirmation */}
        {flash && (
          <div className="bg-emerald-500 text-white rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-semibold text-sm">{flash.name}</p>
              <p className="text-xs text-emerald-100">{flash.type} logged</p>
            </div>
          </div>
        )}

        {/* Meal type selector */}
        <div className="grid grid-cols-3 gap-2">
          {(['BREAKFAST', 'LUNCH', 'DINNER'] as MealType[]).map(m => (
            <button
              key={m}
              onClick={() => setMealType(m)}
              className={`py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-[0.98]
                ${mealType === m
                  ? 'bg-indigo-950 text-white shadow-md'
                  : 'bg-white text-slate-500 shadow-sm'
                }`}
            >
              {m === 'BREAKFAST' ? '☀' : m === 'LUNCH' ? '◑' : '☽'}
              <br />
              {m}
            </button>
          ))}
        </div>

        {/* Today's counts */}
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(counts) as [MealType, number][]).map(([m, c]) => (
            <div key={m} className="bg-white rounded-xl p-3 shadow-sm text-center">
              <p className="text-xs text-slate-400 tracking-wide">{m.slice(0, 5)}</p>
              <p className="text-2xl font-bold text-indigo-950">{c}</p>
            </div>
          ))}
        </div>

        {/* Scanner */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-indigo-950">Scan Student</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MEAL_COLORS[mealType]}`}>
              {mealType}
            </span>
          </div>

          {scanning ? (
            <div className="p-3">
              <ScannerWidget onScan={handleScan} />
              <button
                onClick={() => setScanning(false)}
                className="w-full mt-3 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="px-4 py-4">
              <button
                onClick={() => setScanning(true)}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <span className="text-xl">▩</span>
                Scan QR to Log {mealType}
              </button>
              {isOffline && (
                <p className="text-xs text-amber-600 text-center mt-2">
                  ● Offline — scans will sync when connected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Log */}
        {logs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-indigo-950">Session Log</h2>
            </div>
            <ul className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {logs.map((log, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm text-indigo-950 font-medium">{log.fullName}</p>
                    <p className="text-xs text-slate-400">{log.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MEAL_COLORS[log.mealType]}`}>
                    {log.mealType}
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

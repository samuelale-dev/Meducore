import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<any>(null);
  const scannerInstanceRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Instantiate scanning layout component target engine bind
    const scanner = new Html5QrcodeScanner(
      'qr-reader-element-target',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] // Local Camera Streams Only
      },
      /* verbose= */ false
    );

    scannerInstanceRef.current = scanner;

    scanner.render(
      (decodedText) => {
        try {
          const parsedPayload = JSON.parse(decodedText);
          setScanResult(parsedPayload);
        } catch (e) {
          // Fallback strategy if raw un-stringified data string is processed
          setScanResult({ rawText: decodedText });
        }
      },
      (error) => {
        // Continuous non-blocking capture failure logging suppressed to prevent rendering log loops
      }
    );

    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.clear().catch((err) => console.error("Scanner layout clear failure execution:", err));
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
        <h2 className="text-md font-bold">EduCore High-Density Scanner Terminal</h2>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-600 transition-all"
        >
          Return to Hub
        </button>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-center space-y-6">
        <div className="bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          {/* HTML5 Qrcode internal mounting location target element hook */}
          <div id="qr-reader-element-target" className="w-full bg-slate-900 rounded-xl overflow-hidden"></div>
        </div>

        {scanResult ? (
          <div className="bg-blue-600 p-6 rounded-2xl shadow-lg border border-blue-500 animate-fadeIn">
            <h3 className="text-lg font-bold mb-2 text-white">Identity Match Found</h3>
            {scanResult.app === 'EduCore' ? (
              <div className="space-y-1 text-sm text-blue-100">
                <p><strong className="text-white">Student Name:</strong> {scanResult.name}</p>
                <p><strong className="text-white">System Assigned ID:</strong> {scanResult.studentId}</p>
                <p className="text-xs opacity-75 font-mono"><strong className="text-white">Record UID:</strong> {scanResult.id}</p>
              </div>
            ) : (
              <p className="text-sm break-all font-mono bg-blue-700 p-3 rounded-lg text-white">
                {JSON.stringify(scanResult)}
              </p>
            )}
            <button 
              onClick={() => setScanResult(null)} 
              className="mt-4 w-full bg-white text-blue-600 font-semibold py-2 rounded-lg hover:bg-blue-50 transition-all"
            >
              Clear & Scan Next Badge
            </button>
          </div>
        ) : (
          <div className="text-center text-slate-400 p-4 border border-slate-800 rounded-xl">
            <p className="text-sm">Align student code inside matrix framing boundaries.</p>
            <p className="text-xs mt-1 opacity-75">Processes instantly locally on your device.</p>
          </div>
        )}
      </main>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<any>(null);
  const scannerInstanceRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader-element-target',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0]
      },
      false
    );
    scannerInstanceRef.current = scanner;
    scanner.render(
      (decodedText) => {
        try {
          const parsed = JSON.parse(decodedText);
          setScanResult(parsed);
        } catch (_e) {
          setScanResult({ rawText: decodedText });
        }
      },
      (_error) => {}
    );
    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
        <h2 className="text-md font-bold">EduCore Scanner</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-slate-700 px-4 py-2 rounded-lg text-sm"
        >
          Back
        </button>
      </header>
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8">
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div id="qr-reader-element-target" className="w-full"></div>
        </div>
        {scanResult ? (
          <div className="mt-4 bg-blue-600 p-4 rounded-2xl">
            <h3 className="font-bold mb-2">Result</h3>
            <p className="text-sm">{JSON.stringify(scanResult)}</p>
            <button
              onClick={() => setScanResult(null)}
              className="mt-3 w-full bg-white text-blue-600 font-semibold py-2 rounded-lg"
            >
              Scan Next
            </button>
          </div>
        ) : (
          <div className="text-center text-slate-400 p-4 border border-slate-800 rounded-xl mt-4">
            <p className="text-sm">Align student QR code in the frame.</p>
          </div>
        )}
      </main>
    </div>
  );
          }

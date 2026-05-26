// ============================================================
// EduCore: useQRScanner Hook
// File: educore/client/src/hooks/useQRScanner.ts
// Matches blueprint spec exactly (Section 5)
// ============================================================

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export interface ScannerConfiguration {
  elementId: string;
  fps: number;
  scanBoxDimensions: number;
}

export function useQRScanner(
  config: ScannerConfiguration,
  onScanSuccess: (decodedPayload: string) => void
) {
  const stabilityCallbackRef = useRef(onScanSuccess);

  useEffect(() => {
    stabilityCallbackRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    const scannerInstance = new Html5QrcodeScanner(
      config.elementId,
      {
        fps: config.fps,
        qrbox: config.scanBoxDimensions,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        supportedScanTypes: [0], // Camera-Stream Exclusive
      },
      false
    );

    scannerInstance.render(
      (text) => stabilityCallbackRef.current(text),
      (warning) => console.warn(`Scan warning: ${warning}`)
    );

    return () => {
      scannerInstance.clear().catch((error) =>
        console.error('Failed to clear QR scanner stream', error)
      );
    };
  }, [config.elementId, config.fps, config.scanBoxDimensions]);
}

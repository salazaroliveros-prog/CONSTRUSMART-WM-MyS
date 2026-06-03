import React, { useEffect, useRef, useState } from 'react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let scanner: any = null;
    let mounted = true;

    const init = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode('qr-reader');
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            if (mounted && scanning) {
              setScanning(false);
              onScan(decodedText);
              scanner.stop().catch(() => {});
            }
          },
          () => {} // ignore non-qr frames
        );
      } catch (err) {
        if (mounted) {
          setError('No se pudo acceder a la cámara. Verifica los permisos.');
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [onScan, scanning]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-sm">📷 Escanear Código QR</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
        </div>
        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <p className="text-xs text-slate-400">Puedes ingresar el código manualmente:</p>
              <input
                autoFocus
                placeholder="Código QR / ID"
                className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-blue-400"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    onScan((e.target as HTMLInputElement).value);
                  }
                }}
              />
            </div>
          ) : (
            <div id="qr-reader" className="w-full aspect-square" />
          )}
        </div>
        <div className="p-3 bg-slate-50 text-center text-[10px] text-slate-400">
          Apunta al código QR del material, orden de compra o etiqueta
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
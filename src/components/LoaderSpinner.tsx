import React from 'react';

interface LoaderSpinnerProps {
  size?: number;
  text?: string;
  fullScreen?: boolean;
}

const LoaderSpinner: React.FC<LoaderSpinnerProps> = ({ size = 80, text, fullScreen = false }) => {
  const wrapper = fullScreen ? (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-6">
        {/* Logo WM */}
        <div
          className="flex items-center justify-center rounded-xl font-extrabold text-white shadow-lg"
          style={{
            width: size * 0.6,
            height: size * 0.6,
            background: 'linear-gradient(135deg, #f97316, #0f172a)',
            fontSize: size * 0.225,
            boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
          }}
        >
          WM
        </div>

        {/* Loader 3D con 3 arcos: naranja (#f97316), azul marino (#0f172a), blanco (#ffffff) */}
        <div
          className="relative"
          style={{ width: size, height: size, transformStyle: 'preserve-3d', perspective: 400 }}
        >
          <div
            className="absolute top-0 left-0 w-full h-full rounded-full border-b-[6px] border-b-transparent"
            style={{
              borderBottomColor: '#f97316',
              animation: 'loaderRotate1 1.2s linear infinite',
            }}
          />
          <div
            className="absolute top-0 left-0 w-full h-full rounded-full border-b-[6px] border-b-transparent"
            style={{
              borderBottomColor: '#0f172a',
              animation: 'loaderRotate2 1.2s linear infinite',
            }}
          />
          <div
            className="absolute top-0 left-0 w-full h-full rounded-full border-b-[6px] border-b-transparent"
            style={{
              borderBottomColor: '#ffffff',
              animation: 'loaderRotate3 1.2s linear infinite',
            }}
          />
        </div>

        {text && (
          <div className="text-center">
            <p className="text-slate-500 text-sm font-medium animate-pulse">{text}</p>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      {/* Loader 3D pequeño */}
      <div
        className="relative"
        style={{ width: size * 0.5, height: size * 0.5, transformStyle: 'preserve-3d', perspective: 400 }}
      >
        <div
          className="absolute top-0 left-0 w-full h-full rounded-full border-b-[4px] border-b-transparent"
          style={{
            borderBottomColor: '#f97316',
            animation: 'loaderRotate1 1.2s linear infinite',
          }}
        />
        <div
          className="absolute top-0 left-0 w-full h-full rounded-full border-b-[4px] border-b-transparent"
          style={{
            borderBottomColor: '#0f172a',
            animation: 'loaderRotate2 1.2s linear infinite',
          }}
        />
        <div
          className="absolute top-0 left-0 w-full h-full rounded-full border-b-[4px] border-b-transparent"
          style={{
            borderBottomColor: '#ffffff',
            animation: 'loaderRotate3 1.2s linear infinite',
          }}
        />
      </div>
      {text && <p className="text-slate-500 text-xs font-medium animate-pulse">{text}</p>}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes loaderRotate1 {
          from { transform: rotateX(35deg) rotateY(-45deg) rotateZ(0); }
          to { transform: rotateX(35deg) rotateY(-45deg) rotateZ(1turn); }
        }
        @keyframes loaderRotate2 {
          from { transform: rotateX(50deg) rotateY(10deg) rotateZ(0); }
          to { transform: rotateX(50deg) rotateY(10deg) rotateZ(1turn); }
        }
        @keyframes loaderRotate3 {
          from { transform: rotateX(35deg) rotateY(55deg) rotateZ(0); }
          to { transform: rotateX(35deg) rotateY(55deg) rotateZ(1turn); }
        }
      `}</style>
      {wrapper}
    </>
  );
};

export default LoaderSpinner;
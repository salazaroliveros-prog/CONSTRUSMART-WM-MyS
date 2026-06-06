import React from 'react';

interface LoaderSpinnerProps {
  size?: number;
  text?: string;
  fullScreen?: boolean;
}

const LoaderSpinner: React.FC<LoaderSpinnerProps> = ({ size = 40, text, fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div
            className="rounded-full border-4 border-primary/20 border-t-primary animate-spin"
            style={{ width: size, height: size }}
          />
          {text && (
            <div className="text-center">
              <p className="text-muted-foreground text-sm font-medium animate-pulse">{text}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div
        className="rounded-full border-4 border-primary/20 border-t-primary animate-spin"
        style={{ width: size, height: size }}
      />
      {text && <p className="text-muted-foreground text-xs font-medium animate-pulse">{text}</p>}
    </div>
  );
};

export default LoaderSpinner;
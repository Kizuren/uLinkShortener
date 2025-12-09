'use client';

interface LoadingIconProps {
  size?: number;
  color?: string;
  thickness?: number;
  className?: string;
}

export default function LoadingIcon({
  size = 24,
  color = 'var(--accent)',
  thickness = 2,
  className = '',
}: LoadingIconProps) {
  return (
    <div
      className={`loading-spinner ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderWidth: `${thickness}px`,
        borderColor: `${color}20`,
        borderTopColor: color,
      }}
    >
      <style jsx>{`
        .loading-spinner {
          display: inline-block;
          border-style: solid;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

interface Props {
  sub?: string;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

export default function ComicFrame({
  sub,
  height = 300,
  className,
  children,
}: Props) {
  return (
    <div className={className ? `comic-frame ${className}` : "comic-frame"} style={{ height }}>
      {/* Halftone background */}
      <div aria-hidden className="comic-frame-dots" />
      {/* Radial gradient overlay */}
      <div aria-hidden className="comic-frame-glow" />

      {/* Content */}
      <div className="comic-frame-content">
        {children}
      </div>

      {/* Page corner fold — top-right */}
      <div aria-hidden className="comic-frame-fold" />
      <div aria-hidden className="comic-frame-fold-inner" />

      {/* Sub-caption bar — bottom-right */}
      {sub && (
        <div className="corner-tag">
          {sub}
        </div>
      )}
    </div>
  );
}

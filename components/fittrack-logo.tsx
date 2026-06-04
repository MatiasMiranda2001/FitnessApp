interface FitTrackLogoProps {
  size?: number
  showText?: boolean
  showTagline?: boolean
  className?: string
}

export function FitTrackLogo({
  size = 40,
  showText = false,
  showTagline = false,
  className = "",
}: FitTrackLogoProps) {
  const fontSize    = Math.round(size * 0.58)
  const taglineSize = Math.round(size * 0.21)

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt="Rendi"
        width={size}
        height={size}
        style={{
          flexShrink: 0,
          display: "block",
          objectFit: "contain",
          background: "transparent",
          borderRadius: Math.round(size * 0.22),
        }}
      />

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className="font-sans text-foreground"
            style={{ fontSize, letterSpacing: "-0.02em", lineHeight: 1 }}
          >
            <span style={{ fontWeight: 700 }}>Rendi</span>
          </span>
          {showTagline && (
            <span
              className="text-muted-foreground uppercase tracking-widest"
              style={{ fontSize: taglineSize, fontWeight: 400, marginTop: 3 }}
            >
              Entrenamiento inteligente
            </span>
          )}
        </div>
      )}
    </div>
  )
}

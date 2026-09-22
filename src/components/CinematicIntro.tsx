import { useEffect, useState } from 'react'

interface CinematicIntroProps {
  onComplete: () => void
}

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [exiting, setExiting] = useState(false)

  const handleSkip = () => {
    setExiting(true)
    setTimeout(onComplete, 300)
  }

  useEffect(() => {
    // Step 0: Pure black (350ms)
    const t0 = setTimeout(() => setStep(1), 350)
    // Step 1: "IDEAS INTO OBJECTS." (1600ms)
    const t1 = setTimeout(() => setStep(2), 1700)
    // Step 2: "Speak. Design. Refine." (1600ms)
    const t2 = setTimeout(() => {
      setExiting(true)
      setTimeout(onComplete, 900)
    }, 3800)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        setExiting(true)
        setTimeout(onComplete, 300)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(t0)
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={handleSkip}
      role="dialog"
      aria-label="FRYDAY Introduction"
    >
      {/* Subtle ambient light gradient at center */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(78,237,222,0.04)_0%,transparent_65%)]" />

      {/* Main typography sequence */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl select-none">
        <h1
          className={`font-display text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-[0.3em] text-[#F5F2EB] transition-all duration-1000 transform ${
            step >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
          style={{ textShadow: '0 0 40px rgba(245,242,235,0.15)' }}
        >
          Ideas Into Objects.
        </h1>

        <p
          className={`font-sans mt-6 text-sm sm:text-base md:text-lg font-light tracking-[0.4em] uppercase text-[#4EEDDE] transition-all duration-1000 delay-200 transform ${
            step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
          style={{ textShadow: '0 0 20px rgba(78,237,222,0.4)' }}
        >
          Speak. Design. Refine.
        </p>
      </div>

      {/* Understated skip prompt in corner */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleSkip()
        }}
        className="absolute bottom-8 right-8 font-mono text-[10px] tracking-[0.25em] text-[#9E9A91] hover:text-[#F5F2EB] transition-colors py-2 px-3 border border-white/5 hover:border-white/15 rounded-sm uppercase"
        aria-label="Skip intro"
      >
        Skip [ESC]
      </button>

      {/* Subtle brand tag in bottom left */}
      <div className="absolute bottom-8 left-8 font-mono text-[9px] tracking-[0.3em] text-white/20 uppercase">
        FRYDAY // LAB
      </div>
    </div>
  )
}

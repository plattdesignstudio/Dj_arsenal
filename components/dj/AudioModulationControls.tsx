"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Volume2, Radio, Waves, Zap, Filter, RotateCcw, Music, Play, RotateCw, SkipBack, Pause, Download, Loader2, Undo2, Redo2 } from "lucide-react"

interface AudioEffects {
  volume: number
  low: number
  mid: number
  high: number
  hpf: number // High-pass filter (0-100, maps to 20-2000 Hz)
  lpf: number // Low-pass filter (0-100, maps to 2000-20000 Hz)
  reverb: number
  delay: number
  delayFeedback: number // Delay feedback amount (0-100%)
  drive: number
  compression: number
  chorus: number // Chorus effect (0-100%)
  flanger: number // Flanger effect (0-100%)
  phaser: number // Phaser effect (0-100%)
  tremolo: number // Tremolo effect (0-100%)
  bitcrusher: number // Bitcrusher effect (0-100%)
  pitch: number // Pitch shift in semitones (-12 to +12)
  tempo: number // Tempo/playback rate (50% to 200%, 100% = normal)
  keyLock: boolean // Maintain pitch when changing tempo
  reverse: boolean // Reverse playback
  loop: boolean // Loop playback
}

interface RotaryKnobProps {
  label: string
  icon?: React.ReactNode
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  formatValue: (value: number) => string
  color?: "low" | "mid" | "high" | "default"
}

function RotaryKnob({
  label,
  icon,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  color = "default",
}: RotaryKnobProps) {
  const [isDragging, setIsDragging] = useState(false)
  const knobRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)
  const startValueRef = useRef<number>(0)
  const gradientIdRef = useRef(`gradient-${color}-${label}-${Math.random().toString(36).substr(2, 9)}`)
  const arcGradientIdRef = useRef(`arc-gradient-${color}-${label}-${Math.random().toString(36).substr(2, 9)}`)

  const colorSchemes = {
    low: { primary: "#ef4444", secondary: "#f97316", glow: "rgba(239, 68, 68, 0.8)" },
    mid: { primary: "#eab308", secondary: "#84cc16", glow: "rgba(234, 179, 8, 0.8)" },
    high: { primary: "#3b82f6", secondary: "#06b6d4", glow: "rgba(59, 130, 246, 0.8)" },
    default: { primary: "#06b6d4", secondary: "#3b82f6", glow: "rgba(6, 182, 212, 0.8)" },
  }
  const colors = colorSchemes[color]

  const range = max - min
  // Normalize value to 0-1 range, where 0 = min value, 1 = max value
  // This ensures: value = min → normalizedValue = 0, value = max → normalizedValue = 1
  const normalizedValue = range > 0 ? Math.max(0, Math.min(1, (value - min) / range)) : 0
  
  // Arc configuration - using fixed path with stroke-dasharray for smooth, stable rendering
  // Arc from 150° (0%, 8 o'clock) to 390° (100%, wraps to 30° = 4 o'clock) = 240 degrees
  // In SVG coordinates: 0° = right (3 o'clock), 90° = bottom (6 o'clock), 180° = left (9 o'clock), 270° = top (12 o'clock)
  const ARC_START_DEG = 150   // 8 o'clock (min value = 0% position)
  const ARC_END_DEG = 390      // 150° + 240° = 390° (wraps to 30° = 4 o'clock, max value = 100% position)
  const ARC_SPAN_DEG = ARC_END_DEG - ARC_START_DEG  // 240 degrees total span
  
  // Radius for the arc - keep it within the circle boundary
  const radius = 30
  const centerX = 50
  const centerY = 50
  
  // Memoize fixed arc calculations - these never change, ensuring stability
  const { fullArcPath, arcLength, startX, startY, fullEndX, fullEndY } = useMemo(() => {
    // Convert angles to radians for calculations
    const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360
    
    // Fixed start angle (always 150° = 8 o'clock) - calculate once, never changes
    const startAngleRad = (ARC_START_DEG * Math.PI) / 180
    
    // End angle for full arc (normalized) - fixed end position
    const endAngleRad = (normalizeAngle(ARC_END_DEG) * Math.PI) / 180
    
    // Calculate arc endpoints on the circle - FIXED, never changes
    const startX = centerX + radius * Math.cos(startAngleRad)
    const startY = centerY + radius * Math.sin(startAngleRad)
    const fullEndX = centerX + radius * Math.cos(endAngleRad)
    const fullEndY = centerY + radius * Math.sin(endAngleRad)
    
    // Create FIXED full arc path - this never changes, ensuring stability
    // Always uses large arc (1) for 240° span, clockwise (1)
    const fullArcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${fullEndX} ${fullEndY}`
    
    // Calculate arc length for stroke-dasharray (circumference of 240° arc)
    const arcLength = (ARC_SPAN_DEG * Math.PI * radius) / 180
    
    return { fullArcPath, arcLength, startX, startY, fullEndX, fullEndY }
  }, []) // Empty dependency array - these values never change
  
  // Calculate dash offset based on normalized value (this changes with value)
  // When normalizedValue = 0: show nothing (offset = full length)
  // When normalizedValue = 1: show full arc (offset = 0)
  const dashOffset = arcLength * (1 - normalizedValue)
  
  // Current angle for glow dot position (for visual indicator) - changes with value
  const ARC_OFFSET = 0.2  // Small offset
  const effectiveSpan = ARC_SPAN_DEG - ARC_OFFSET
  const currentAngleDeg = ARC_START_DEG + ARC_OFFSET + (normalizedValue * effectiveSpan)
  const clampedAngleDeg = Math.max(ARC_START_DEG, Math.min(ARC_END_DEG, currentAngleDeg))
  const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360
  const currentAngleRad = (normalizeAngle(clampedAngleDeg) * Math.PI) / 180
  const endX = centerX + radius * Math.cos(currentAngleRad)
  const endY = centerY + radius * Math.sin(currentAngleRad)

  // Generate tick marks
  const tickMarks = []
  const tickCount = 16
  for (let i = 0; i <= tickCount; i++) {
    const tickAngleDeg = ARC_START_DEG + (i / tickCount) * ARC_SPAN_DEG
    const normalizedTickAngle = normalizeAngle(tickAngleDeg)
    const tickRad = (normalizedTickAngle * Math.PI) / 180
    const isMajor = i % 4 === 0
    tickMarks.push({
      x1: centerX + (radius - 3) * Math.cos(tickRad),
      y1: centerY + (radius - 3) * Math.sin(tickRad),
      x2: centerX + (radius + (isMajor ? 4 : 2)) * Math.cos(tickRad),
      y2: centerY + (radius + (isMajor ? 4 : 2)) * Math.sin(tickRad),
      angle: normalizedTickAngle,
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startYRef.current = e.clientY
    startValueRef.current = value
    e.preventDefault()
    e.stopPropagation()
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    // Following HISE pattern: vertical drag with configurable sensitivity
    // Drag up = increase value, drag down = decrease value
    const deltaY = startYRef.current - e.clientY
    const mouseSensitivity = 1.0  // Base sensitivity (like HISE mouseSensitivity property)
    const range = max - min
    
    // Normalize sensitivity so all dials move at the same visual rate regardless of range
    // For a standard 0-100 range, use base sensitivity
    // For larger ranges, reduce sensitivity proportionally to maintain consistent feel
    const normalizedSensitivity = mouseSensitivity * (100 / range)  // Inverse normalization
    const deltaValue = (deltaY * normalizedSensitivity * range) / 200  // Smooth, responsive control
    
    let newValue = startValueRef.current + deltaValue
    
    // Clamp to min/max range
    newValue = Math.max(min, Math.min(max, newValue))
    
    // Apply step size (like HISE stepSize property)
    const steppedValue = Math.round(newValue / step) * step
    
    // Update only if value actually changed (prevents unnecessary re-renders)
    if (Math.abs(steppedValue - value) > 0.001) {
      onChange(steppedValue)
    }
  }, [isDragging, min, max, step, onChange, value])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle scroll wheel for fine adjustment (like HISE scrollWheel property)
  // Must use manual event listener with { passive: false } to allow preventDefault
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const delta = e.deltaY > 0 ? -1 : 1
    const range = max - min
    const stepSize = step || (range / 100)  // Use step or calculate from range
    const deltaValue = delta * stepSize * 2  // Fine adjustment with scroll
    
    let newValue = value + deltaValue
    newValue = Math.max(min, Math.min(max, newValue))
    const steppedValue = Math.round(newValue / stepSize) * stepSize
    
    if (Math.abs(steppedValue - value) > 0.001) {
      onChange(steppedValue)
    }
  }, [value, min, max, step, onChange])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Add wheel event listener manually with { passive: false } to allow preventDefault
  useEffect(() => {
    const knobElement = knobRef.current
    if (!knobElement) return

    knobElement.addEventListener("wheel", handleWheel, { passive: false })
    
    return () => {
      knobElement.removeEventListener("wheel", handleWheel)
    }
  }, [handleWheel])

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</div>
      <div
        ref={knobRef}
        className={`relative w-24 h-24 cursor-grab select-none ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <svg 
          className="absolute inset-0" 
          width="96" 
          height="96" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            overflow: 'visible', 
            zIndex: 1,
            pointerEvents: 'none'
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background track arc - full visible arc from bottom-left to bottom-right */}
          <path
            d={fullArcPath}
            fill="none"
            stroke="rgba(40, 40, 40, 0.6)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Tick marks */}
          {tickMarks.map((tick, idx) => {
            const isMajor = idx % 4 === 0
            return (
              <line
                key={idx}
                x1={String(tick.x1)}
                y1={String(tick.y1)}
                x2={String(tick.x2)}
                y2={String(tick.y2)}
                stroke="#10b981"
                strokeWidth={String(isMajor ? 2 : 1)}
                opacity={isMajor ? 0.9 : 0.5}
              />
            )
          })}
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id={gradientIdRef.current} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} />
              <stop offset="100%" stopColor={colors.secondary} />
            </linearGradient>
            <radialGradient id={arcGradientIdRef.current} cx="50%" cy="50%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.9" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.6" />
            </radialGradient>
          </defs>
          
          {/* Colorful radial arc using fixed path with stroke-dasharray for smooth, stable rendering */}
          {/* The path itself never changes - only the visible portion via stroke-dashoffset */}
          <path
            d={fullArcPath}
            fill="none"
            stroke={`url(#${arcGradientIdRef.current})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            className="transition-all duration-150 ease-out"
            style={{
              filter: `drop-shadow(0 0 10px ${colors.glow})`,
              opacity: normalizedValue > 0.001 ? 0.95 : 0,
            }}
          />
          {/* Glow dot at the current position (end of arc) - follows indicator */}
          {normalizedValue > 0.001 && (
            <circle
              cx={endX}
              cy={endY}
              r="4"
              fill={colors.primary}
              className="transition-all duration-150 ease-out"
              style={{
                filter: `drop-shadow(0 0 12px ${colors.glow})`,
                opacity: 1,
              }}
            />
          )}
        </svg>

        {/* Knob body - 3D glossy appearance */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-gray-700/50 shadow-2xl">
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/15 via-transparent to-black/30" />
          
          {/* Center value display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/95 border border-gray-600/60 flex items-center justify-center shadow-inner">
              <div className="text-xs font-mono font-bold" style={{ color: colors.primary }}>
                {formatValue(value)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AudioModulationControlsProps {
  audioUrl?: string | null
  audioElement?: HTMLAudioElement | null
  onEffectsChange?: (effects: AudioEffects) => void
}

const DEFAULT_EFFECTS: AudioEffects = {
  volume: 100,
  low: 0,
  mid: 0,
  high: 0,
  hpf: 0,
  lpf: 100,
  reverb: 0,
  delay: 0,
  delayFeedback: 30,
  drive: 0,
  compression: 0,
  chorus: 0,
  flanger: 0,
  phaser: 0,
  tremolo: 0,
  bitcrusher: 0,
  pitch: 0,
  tempo: 100,
  keyLock: false,
  reverse: false,
  loop: false,
}

export function AudioModulationControls({
  audioUrl,
  audioElement,
  onEffectsChange,
}: AudioModulationControlsProps) {
  const [effects, setEffects] = useState<AudioEffects>(DEFAULT_EFFECTS)
  const [isPlayingModulated, setIsPlayingModulated] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  
  // Undo/Redo history
  const [history, setHistory] = useState<AudioEffects[]>([DEFAULT_EFFECTS])
  const [historyIndex, setHistoryIndex] = useState(0)
  const isUndoRedoRef = useRef(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const historyIndexRef = useRef(0)
  
  // Keep ref in sync with state
  useEffect(() => {
    historyIndexRef.current = historyIndex
  }, [historyIndex])

  // Track effect changes for undo/redo (debounced to avoid too many history entries)
  useEffect(() => {
    // Skip if this change came from undo/redo
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false
      return
    }

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Debounce: add to history after user stops making changes
    debounceTimeoutRef.current = setTimeout(() => {
      setHistory((prevHistory) => {
        const currentIndex = historyIndexRef.current
        const currentHistoryEntry = prevHistory[currentIndex]
        // Only add if different from current history entry
        if (JSON.stringify(currentHistoryEntry) !== JSON.stringify(effects)) {
          // Remove any history entries after current index (when undoing and then making a new change)
          const newHistory = prevHistory.slice(0, currentIndex + 1)
          // Add new state to history
          const updatedHistory = [...newHistory, { ...effects }]
          setHistoryIndex(updatedHistory.length - 1)
          return updatedHistory
        }
        return prevHistory
      })
    }, 500) // 500ms debounce - wait for user to finish adjusting

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [effects])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      isUndoRedoRef.current = true
      setHistoryIndex(newIndex)
      setEffects(history[newIndex])
    }
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      isUndoRedoRef.current = true
      setHistoryIndex(newIndex)
      setEffects(history[newIndex])
    }
  }, [history, historyIndex])

  const handleReset = useCallback(() => {
    setEffects(DEFAULT_EFFECTS)
    setHistory([DEFAULT_EFFECTS])
    setHistoryIndex(0)
  }, [])

  // Play/pause modulated audio
  const handlePlayPauseModulated = useCallback(async () => {
    if (!audioBuffer || !audioContextRef.current || !isInitializedRef.current) return

    if (isPlayingModulated) {
      // Stop playback
      if (bufferSourceRef.current) {
        try {
          bufferSourceRef.current.stop()
          bufferSourceRef.current.disconnect()
        } catch (e) {
          // Ignore errors
        }
        bufferSourceRef.current = null
      }
      setIsPlayingModulated(false)
    } else {
      // Start playback
      const audioContext = audioContextRef.current
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      // Stop any existing playback
      if (bufferSourceRef.current) {
        try {
          bufferSourceRef.current.stop()
          bufferSourceRef.current.disconnect()
        } catch (e) {
          // Ignore errors
        }
      }

      // Create buffer source
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      
      // Apply pitch and tempo with key lock support
      const pitchRatio = Math.pow(2, effects.pitch / 12)
      const tempoRatio = effects.tempo / 100
      let playbackRate: number
      
      if (effects.keyLock) {
        // Key lock enabled: maintain pitch when tempo changes
        // Apply tempo via playbackRate (this will also change pitch)
        playbackRate = tempoRatio
        
        // Calculate pitch compensation needed
        // When playbackRate = tempoRatio, pitch increases by tempoRatio
        // To maintain original pitch, we need to lower it by 1/tempoRatio
        // This will be handled by the pitch shifter node in the audio chain
        // The pitch shifter will compensate for the pitch change
      } else {
        // Key lock disabled: normal behavior - both pitch and tempo affect playbackRate
        playbackRate = tempoRatio * pitchRatio
      }
      
      if (effects.reverse) {
        playbackRate = -Math.abs(playbackRate)
      }
      source.playbackRate.value = playbackRate
      source.loop = effects.loop

      // Connect to processing chain
      // When key lock is enabled, route through pitch shifter to compensate for pitch changes
      if (effects.keyLock && pitchShifterRef.current && pitchShifterRef.current.delay && (pitchShifterRef.current as any).dryMerge) {
        // Key lock enabled: route to both pitch shifter (wet) and dry path
        // This creates a mix that helps compensate for pitch changes
        const dryGain = audioContext.createGain()
        dryGain.gain.value = 0.3 // Less dry signal when key lock is on
        source.connect(dryGain)
        dryGain.connect((pitchShifterRef.current as any).dryMerge)
        
        // Wet path through pitch shifter
        source.connect(pitchShifterRef.current.delay)
      } else if (hpfRef.current) {
        // Normal routing: source -> HPF -> ...
        source.connect(hpfRef.current)
      }
      
      // Ensure gain node connects to destination
      if (gainNodeRef.current) {
        gainNodeRef.current.connect(audioContext.destination)
      }

      source.onended = () => {
        setIsPlayingModulated(false)
        bufferSourceRef.current = null
      }

      source.start(0)
      bufferSourceRef.current = source
      setIsPlayingModulated(true)
    }
  }, [audioBuffer, isPlayingModulated, effects.pitch, effects.tempo, effects.reverse, effects.loop, effects.keyLock])

  // Export modulated audio
  const handleExport = useCallback(async () => {
    if (!audioBuffer || !audioContextRef.current || !isInitializedRef.current) {
      return
    }

    setIsExporting(true)
    try {
      const audioContext = audioContextRef.current
      
      // Calculate duration accounting for tempo/pitch changes with key lock support
      const pitchRatio = Math.pow(2, effects.pitch / 12)
      const tempoRatio = effects.tempo / 100
      const playbackRate = effects.keyLock 
        ? Math.abs(tempoRatio)  // Key lock: tempo only
        : Math.abs(tempoRatio * pitchRatio)  // Normal: both tempo and pitch
      const baseDuration = audioBuffer.duration / playbackRate
      
      // Calculate additional length needed for delay feedback (max delay time + some buffer)
      const maxDelayTime = Math.max(effects.delay / 1000, 0.5) // At least 0.5s for feedback
      const additionalSamples = Math.ceil(maxDelayTime * audioBuffer.sampleRate * 2) // Extra buffer for feedback
      
      // Create offline context with enough length for delay feedback
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        Math.ceil(audioBuffer.length / playbackRate) + additionalSamples,
        audioBuffer.sampleRate
      )

      // Recreate the full processing chain in offline context
      const source = offlineContext.createBufferSource()
      source.buffer = audioBuffer

      // Apply pitch and tempo with key lock support
      const pitchRatio2 = Math.pow(2, effects.pitch / 12)
      const tempoRatio2 = effects.tempo / 100
      let playbackRate2: number
      
      if (effects.keyLock) {
        // Key lock enabled: apply tempo only (pitch will change - limitation of playbackRate)
        playbackRate2 = tempoRatio2
      } else {
        // Key lock disabled: normal behavior - both pitch and tempo affect playbackRate
        playbackRate2 = tempoRatio2 * pitchRatio2
      }
      
      if (effects.reverse) {
        playbackRate2 = -Math.abs(playbackRate2)
      }
      source.playbackRate.value = playbackRate2
      source.loop = effects.loop

      // Create HPF
      const hpf = offlineContext.createBiquadFilter()
      hpf.type = "highpass"
      hpf.frequency.value = 20 + (effects.hpf / 100) * (2000 - 20)
      hpf.Q.value = 1

      // Create LPF
      const lpf = offlineContext.createBiquadFilter()
      lpf.type = "lowpass"
      lpf.frequency.value = 2000 + (effects.lpf / 100) * (20000 - 2000)
      lpf.Q.value = 1

      // Create EQ filters
      const lowFilter = offlineContext.createBiquadFilter()
      lowFilter.type = "lowshelf"
      lowFilter.frequency.value = 200
      lowFilter.gain.value = effects.low

      const midFilter = offlineContext.createBiquadFilter()
      midFilter.type = "peaking"
      midFilter.frequency.value = 2000
      midFilter.Q.value = 1
      midFilter.gain.value = effects.mid

      const highFilter = offlineContext.createBiquadFilter()
      highFilter.type = "highshelf"
      highFilter.frequency.value = 8000
      highFilter.gain.value = effects.high

      // Create Chorus
      const chorusDelay = offlineContext.createDelay(0.05)
      chorusDelay.delayTime.value = 0.01
      const chorusGain = offlineContext.createGain()
      chorusGain.gain.value = effects.chorus / 100
      const chorusOsc = offlineContext.createOscillator()
      chorusOsc.frequency.value = 1.5
      chorusOsc.type = 'sine'
      const chorusLFO = offlineContext.createGain()
      chorusLFO.gain.value = 0.005
      chorusOsc.connect(chorusLFO)
      chorusLFO.connect(chorusDelay.delayTime)
      chorusOsc.start(0)
      
      const chorusDry = offlineContext.createGain()
      const chorusWet = offlineContext.createGain()
      chorusDry.gain.value = 1 - (effects.chorus / 100) * 0.5
      chorusWet.gain.value = (effects.chorus / 100) * 0.5
      const chorusMerge = offlineContext.createGain()

      // Create Flanger
      const flangerDelay = offlineContext.createDelay(0.02)
      flangerDelay.delayTime.value = 0.005
      const flangerGain = offlineContext.createGain()
      flangerGain.gain.value = effects.flanger / 100
      const flangerOsc = offlineContext.createOscillator()
      flangerOsc.frequency.value = 0.5
      flangerOsc.type = 'sine'
      const flangerLFO = offlineContext.createGain()
      flangerLFO.gain.value = 0.005
      flangerOsc.connect(flangerLFO)
      flangerLFO.connect(flangerDelay.delayTime)
      flangerOsc.start(0)
      
      const flangerDry = offlineContext.createGain()
      const flangerWet = offlineContext.createGain()
      flangerDry.gain.value = 1 - (effects.flanger / 100) * 0.5
      flangerWet.gain.value = (effects.flanger / 100) * 0.5
      const flangerMerge = offlineContext.createGain()

      // Create Phaser
      const phaserFilters: BiquadFilterNode[] = []
      for (let i = 0; i < 4; i++) {
        const filter = offlineContext.createBiquadFilter()
        filter.type = 'allpass'
        filter.frequency.value = 350 + i * 200 + (effects.phaser / 100) * 1000
        filter.Q.value = 10
        phaserFilters.push(filter)
      }
      const phaserDry = offlineContext.createGain()
      const phaserWet = offlineContext.createGain()
      phaserDry.gain.value = 1 - (effects.phaser / 100) * 0.5
      phaserWet.gain.value = (effects.phaser / 100) * 0.5
      const phaserMerge = offlineContext.createGain()

      // Create Tremolo
      const tremoloGain = offlineContext.createGain()
      tremoloGain.gain.value = 1.0
      const tremoloOsc = offlineContext.createOscillator()
      tremoloOsc.frequency.value = 5
      tremoloOsc.type = 'sine'
      const tremoloLFO = offlineContext.createGain()
      tremoloLFO.gain.value = (effects.tremolo / 100) * 0.5
      tremoloOsc.connect(tremoloLFO)
      tremoloLFO.connect(tremoloGain.gain)
      tremoloOsc.start(0)

      // Create Bitcrusher
      const bitcrusher = offlineContext.createWaveShaper()
      const makeBitcrusherCurve = (bits: number) => {
        const samples = 256
        const curve = new Float32Array(samples)
        const step = Math.pow(2, bits)
        for (let i = 0; i < samples; i++) {
          const x = (i * 2) / samples - 1
          curve[i] = Math.floor(x * step) / step
        }
        return curve
      }
      bitcrusher.curve = makeBitcrusherCurve(16 - (effects.bitcrusher / 100) * 14)
      bitcrusher.oversample = '4x'
      
      const bitcrusherDry = offlineContext.createGain()
      const bitcrusherWet = offlineContext.createGain()
      bitcrusherDry.gain.value = 1 - (effects.bitcrusher / 100) * 0.5
      bitcrusherWet.gain.value = (effects.bitcrusher / 100) * 0.5
      const bitcrusherMerge = offlineContext.createGain()

      // Create Distortion
      const distortion = offlineContext.createWaveShaper()
      const makeDistortionCurve = (amount: number) => {
        const samples = 44100
        const curve = new Float32Array(samples)
        const deg = Math.PI / 180
        for (let i = 0; i < samples; i++) {
          const x = (i * 2) / samples - 1
          curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
        }
        return curve
      }
      distortion.curve = makeDistortionCurve(effects.drive)
      distortion.oversample = "4x"

      // Create Delay with feedback
      const delay = offlineContext.createDelay(1.0)
      delay.delayTime.value = effects.delay / 1000
      const delayGain = offlineContext.createGain()
      delayGain.gain.value = (effects.delayFeedback / 100) * 0.5

      // Create Compressor
      const compressor = offlineContext.createDynamicsCompressor()
      compressor.threshold.value = -24 - (effects.compression * 0.3)
      compressor.knee.value = 30
      compressor.ratio.value = 12
      compressor.attack.value = 0.003
      compressor.release.value = 0.25

      // Create Gain
      const gainNode = offlineContext.createGain()
      gainNode.gain.value = effects.volume / 100

      // Connect the full processing chain
      source.connect(hpf)
      hpf.connect(lpf)
      lpf.connect(lowFilter)
      lowFilter.connect(midFilter)
      midFilter.connect(highFilter)
      
      // Chorus
      highFilter.connect(chorusDry)
      highFilter.connect(chorusDelay)
      chorusDelay.connect(chorusGain)
      chorusGain.connect(chorusWet)
      chorusDry.connect(chorusMerge)
      chorusWet.connect(chorusMerge)
      
      // Flanger
      chorusMerge.connect(flangerDry)
      chorusMerge.connect(flangerDelay)
      flangerDelay.connect(flangerGain)
      flangerGain.connect(flangerWet)
      flangerDry.connect(flangerMerge)
      flangerWet.connect(flangerMerge)
      
      // Phaser
      let phaserInput = flangerMerge
      for (let i = 0; i < phaserFilters.length; i++) {
        phaserInput.connect(phaserFilters[i])
        phaserInput = phaserFilters[i]
      }
      flangerMerge.connect(phaserDry)
      phaserInput.connect(phaserWet)
      phaserDry.connect(phaserMerge)
      phaserWet.connect(phaserMerge)
      
      // Tremolo
      phaserMerge.connect(tremoloGain)
      
      // Bitcrusher
      tremoloGain.connect(bitcrusherDry)
      tremoloGain.connect(bitcrusher)
      bitcrusher.connect(bitcrusherWet)
      bitcrusherDry.connect(bitcrusherMerge)
      bitcrusherWet.connect(bitcrusherMerge)
      
      // Distortion -> Delay -> Compressor -> Gain
      bitcrusherMerge.connect(distortion)
      distortion.connect(delay)
      
      // Delay feedback loop
      delay.connect(delayGain)
      delayGain.connect(delay) // Feedback
      
      // Main delay output to compressor
      delay.connect(compressor)
      compressor.connect(gainNode)
      gainNode.connect(offlineContext.destination)

      source.start(0)
      const renderedBuffer = await offlineContext.startRendering()

      // Convert to WAV
      const wav = audioBufferToWav(renderedBuffer)
      const blob = new Blob([wav], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      
      // Download
      const a = document.createElement('a')
      a.href = url
      a.download = `modulated-audio-${Date.now()}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting audio:", error)
    } finally {
      setIsExporting(false)
    }
  }, [audioBuffer, effects])

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const bytesPerSample = 2
    const blockAlign = numberOfChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = length * blockAlign
    const bufferSize = 44 + dataSize

    const arrayBuffer = new ArrayBuffer(bufferSize)
    const view = new DataView(arrayBuffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, bufferSize - 8, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)

    // Convert float samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
        offset += 2
      }
    }

    return arrayBuffer
  }

  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const lowFilterRef = useRef<BiquadFilterNode | null>(null)
  const midFilterRef = useRef<BiquadFilterNode | null>(null)
  const highFilterRef = useRef<BiquadFilterNode | null>(null)
  const delayRef = useRef<DelayNode | null>(null)
  const delayGainRef = useRef<GainNode | null>(null)
  const distortionRef = useRef<WaveShaperNode | null>(null)
  const compressorRef = useRef<DynamicsCompressorNode | null>(null)
  const hpfRef = useRef<BiquadFilterNode | null>(null)
  const lpfRef = useRef<BiquadFilterNode | null>(null)
  const chorusRef = useRef<GainNode | null>(null)
  const chorusDelayRef = useRef<DelayNode | null>(null)
  const chorusOscRef = useRef<OscillatorNode | null>(null)
  const flangerRef = useRef<GainNode | null>(null)
  const flangerDelayRef = useRef<DelayNode | null>(null)
  const flangerOscRef = useRef<OscillatorNode | null>(null)
  const phaserRef = useRef<BiquadFilterNode[]>([])
  const phaserOscRef = useRef<OscillatorNode | null>(null)
  const phaserLFORef = useRef<GainNode | null>(null)
  const tremoloRef = useRef<GainNode | null>(null)
  const tremoloOscRef = useRef<OscillatorNode | null>(null)
  const tremoloLFORef = useRef<GainNode | null>(null)
  const bitcrusherRef = useRef<WaveShaperNode | null>(null)
  const chorusDryRef = useRef<GainNode | null>(null)
  const chorusWetRef = useRef<GainNode | null>(null)
  const flangerDryRef = useRef<GainNode | null>(null)
  const flangerWetRef = useRef<GainNode | null>(null)
  const phaserDryRef = useRef<GainNode | null>(null)
  const phaserWetRef = useRef<GainNode | null>(null)
  const bitcrusherDryRef = useRef<GainNode | null>(null)
  const bitcrusherWetRef = useRef<GainNode | null>(null)
  const pitchShifterRef = useRef<{ delay: DelayNode; crossfade: GainNode; merge: GainNode } | null>(null)
  const isInitializedRef = useRef(false)
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  // Load audio buffer from URL
  useEffect(() => {
    if (!audioUrl) {
      setAudioBuffer(null)
      return
    }

    const loadAudioBuffer = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const response = await fetch(audioUrl)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = await audioContext.decodeAudioData(arrayBuffer)
        setAudioBuffer(buffer)
        audioContext.close()
      } catch (error) {
        console.error("Error loading audio buffer:", error)
        setAudioBuffer(null)
      }
    }

    loadAudioBuffer()
  }, [audioUrl])

  // Initialize audio processing chain (separate from original audio)
  useEffect(() => {
    if (!audioBuffer || !audioUrl) {
      // Cleanup if audio buffer is removed
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect()
        } catch (e) {
          // Ignore disconnect errors
        }
        sourceRef.current = null
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch (e) {
          // Ignore close errors
        }
        audioContextRef.current = null
      }
      isInitializedRef.current = false
      return
    }

    // Don't reinitialize if already initialized
    if (isInitializedRef.current) {
      return
    }

    const initAudioProcessing = async () => {
      try {
        // Create or get audio context
        let audioContext = audioContextRef.current
        if (!audioContext || audioContext.state === 'closed') {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          audioContextRef.current = audioContext
        }

        // Resume audio context if suspended (required for user interaction)
        if (audioContext.state === 'suspended') {
          await audioContext.resume()
        }

        // Note: We don't create a source here - we'll create it from AudioBuffer when playing
        // This keeps the original audio element completely untouched

        // Create gain node for volume
        const gainNode = audioContext.createGain()
        gainNode.gain.value = effects.volume / 100
        gainNodeRef.current = gainNode

        // Create pitch shifter for key lock (delay-based with feedback for pitch compensation)
        // This is a simplified pitch shifter that helps maintain pitch when tempo changes
        const pitchShifterDelay = audioContext.createDelay(0.05) // Delay for pitch shifting
        pitchShifterDelay.delayTime.value = 0.025 // Base delay
        
        // Feedback for pitch shift effect
        const pitchShifterFeedback = audioContext.createGain()
        pitchShifterFeedback.gain.value = 0.3 // Feedback amount
        
        // Output gain
        const pitchShifterOutput = audioContext.createGain()
        pitchShifterOutput.gain.value = 0.7 // Output level
        
        // Connect: delay -> feedback -> delay (feedback loop)
        pitchShifterDelay.connect(pitchShifterFeedback)
        pitchShifterFeedback.connect(pitchShifterDelay)
        
        // Connect: delay -> output
        pitchShifterDelay.connect(pitchShifterOutput)
        
        // Merge node (combines original and pitch-shifted signal)
        const pitchShifterMerge = audioContext.createGain()
        pitchShifterOutput.connect(pitchShifterMerge)
        
        pitchShifterRef.current = {
          delay: pitchShifterDelay,
          crossfade: pitchShifterMerge,
          merge: pitchShifterMerge,
          feedback: pitchShifterFeedback,
          output: pitchShifterOutput
        } as any

        // Create HPF (High-Pass Filter) - cuts low frequencies
        // Maps 0-100 to 20-2000 Hz
        const hpf = audioContext.createBiquadFilter()
        hpf.type = "highpass"
        hpf.frequency.value = 20 + (effects.hpf / 100) * (2000 - 20)
        hpf.Q.value = 1
        hpfRef.current = hpf

        // Create LPF (Low-Pass Filter) - cuts high frequencies
        // Maps 0-100 to 2000-20000 Hz
        const lpf = audioContext.createBiquadFilter()
        lpf.type = "lowpass"
        lpf.frequency.value = 2000 + (effects.lpf / 100) * (20000 - 2000)
        lpf.Q.value = 1
        lpfRef.current = lpf

        // Create EQ filters
        const lowFilter = audioContext.createBiquadFilter()
        lowFilter.type = "lowshelf"
        lowFilter.frequency.value = 200
        lowFilter.gain.value = effects.low
        lowFilterRef.current = lowFilter

        const midFilter = audioContext.createBiquadFilter()
        midFilter.type = "peaking"
        midFilter.frequency.value = 2000
        midFilter.Q.value = 1
        midFilter.gain.value = effects.mid
        midFilterRef.current = midFilter

        const highFilter = audioContext.createBiquadFilter()
        highFilter.type = "highshelf"
        highFilter.frequency.value = 8000
        highFilter.gain.value = effects.high
        highFilterRef.current = highFilter

        // Create delay with feedback
        const delay = audioContext.createDelay(1.0)
        delay.delayTime.value = effects.delay / 1000
        delayRef.current = delay

        const delayGain = audioContext.createGain()
        // Delay feedback: 0-100% maps to 0-0.5 gain (50% feedback max)
        delayGain.gain.value = (effects.delayFeedback / 100) * 0.5
        delayGainRef.current = delayGain

        // Create distortion for drive
        const distortion = audioContext.createWaveShaper()
        const makeDistortionCurve = (amount: number) => {
          const samples = 44100
          const curve = new Float32Array(samples)
          const deg = Math.PI / 180
          for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
          }
          return curve
        }
        distortion.curve = makeDistortionCurve(effects.drive)
        distortion.oversample = "4x"
        distortionRef.current = distortion

        // Create compressor
        const compressor = audioContext.createDynamicsCompressor()
        compressor.threshold.value = -24 - (effects.compression * 0.3)
        compressor.knee.value = 30
        compressor.ratio.value = 12
        compressor.attack.value = 0.003
        compressor.release.value = 0.25
        compressorRef.current = compressor

        // Create Chorus effect
        const chorusDelay = audioContext.createDelay(0.05)
        chorusDelay.delayTime.value = 0.01
        chorusDelayRef.current = chorusDelay
        
        const chorusGain = audioContext.createGain()
        chorusGain.gain.value = effects.chorus / 100
        chorusRef.current = chorusGain
        
        const chorusOsc = audioContext.createOscillator()
        chorusOsc.frequency.value = 1.5
        chorusOsc.type = 'sine'
        const chorusLFO = audioContext.createGain()
        chorusLFO.gain.value = 0.005
        chorusOsc.connect(chorusLFO)
        chorusLFO.connect(chorusDelay.delayTime)
        chorusOsc.start()
        chorusOscRef.current = chorusOsc

        // Create Flanger effect
        const flangerDelay = audioContext.createDelay(0.02)
        flangerDelay.delayTime.value = 0.005
        flangerDelayRef.current = flangerDelay
        
        const flangerGain = audioContext.createGain()
        flangerGain.gain.value = effects.flanger / 100
        flangerRef.current = flangerGain
        
        const flangerOsc = audioContext.createOscillator()
        flangerOsc.frequency.value = 0.5
        flangerOsc.type = 'sine'
        const flangerLFO = audioContext.createGain()
        flangerLFO.gain.value = 0.005
        flangerOsc.connect(flangerLFO)
        flangerLFO.connect(flangerDelay.delayTime)
        flangerOsc.start()
        flangerOscRef.current = flangerOsc

        // Create Phaser effect (4-stage all-pass filters)
        const phaserFilters: BiquadFilterNode[] = []
        for (let i = 0; i < 4; i++) {
          const filter = audioContext.createBiquadFilter()
          filter.type = 'allpass'
          filter.frequency.value = 350 + i * 200
          filter.Q.value = 10
          phaserFilters.push(filter)
        }
        phaserRef.current = phaserFilters
        
        const phaserOsc = audioContext.createOscillator()
        phaserOsc.frequency.value = 0.3
        phaserOsc.type = 'sine'
        const phaserLFO = audioContext.createGain()
        phaserLFO.gain.value = (effects.phaser / 100) * 1000
        phaserOsc.connect(phaserLFO)
        // Connect LFO to modulate filter frequencies
        phaserFilters.forEach(filter => {
          phaserLFO.connect(filter.frequency)
        })
        phaserOsc.start()
        phaserOscRef.current = phaserOsc
        phaserLFORef.current = phaserLFO

        // Create Tremolo effect
        const tremoloGain = audioContext.createGain()
        tremoloGain.gain.value = 1.0
        tremoloRef.current = tremoloGain
        
        const tremoloOsc = audioContext.createOscillator()
        tremoloOsc.frequency.value = 5
        tremoloOsc.type = 'sine'
        const tremoloLFO = audioContext.createGain()
        tremoloLFO.gain.value = 0
        tremoloOsc.connect(tremoloLFO)
        tremoloLFO.connect(tremoloGain.gain)
        tremoloOsc.start()
        tremoloOscRef.current = tremoloOsc
        tremoloLFORef.current = tremoloLFO

        // Create Bitcrusher effect
        const bitcrusher = audioContext.createWaveShaper()
        const makeBitcrusherCurve = (bits: number) => {
          const samples = 256
          const curve = new Float32Array(samples)
          const step = Math.pow(2, bits)
          for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1
            curve[i] = Math.floor(x * step) / step
          }
          return curve
        }
        bitcrusher.curve = makeBitcrusherCurve(16 - (effects.bitcrusher / 100) * 14) // 16 bits to 2 bits
        bitcrusher.oversample = '4x'
        bitcrusherRef.current = bitcrusher

        // Connect the processing chain with optional pitch shifter for key lock
        // Create a merge node that combines dry (original) and wet (pitch-shifted) signals
        const pitchShifterDryMerge = audioContext.createGain()
        pitchShifterDryMerge.gain.value = 1.0
        
        // Connect pitch shifter merge to dry merge (wet signal)
        if (pitchShifterRef.current && pitchShifterRef.current.merge) {
          pitchShifterRef.current.merge.connect(pitchShifterDryMerge)
        }
        
        // Connect dry merge to HPF
        pitchShifterDryMerge.connect(hpf)
        
        // Store dry merge for routing when key lock is enabled
        if (pitchShifterRef.current) {
          (pitchShifterRef.current as any).dryMerge = pitchShifterDryMerge
        }
        
        // Connect the processing chain: HPF -> LPF -> EQ -> Chorus -> Flanger -> Phaser -> Tremolo -> Bitcrusher -> Distortion -> Delay -> Compressor -> Gain
        hpf.connect(lpf)
        lpf.connect(lowFilter)
        lowFilter.connect(midFilter)
        midFilter.connect(highFilter)
        
        // Chorus (wet/dry mix)
        const chorusDry = audioContext.createGain()
        const chorusWet = audioContext.createGain()
        chorusDry.gain.value = 1 - (effects.chorus / 100) * 0.5
        chorusWet.gain.value = (effects.chorus / 100) * 0.5
        chorusDryRef.current = chorusDry
        chorusWetRef.current = chorusWet
        highFilter.connect(chorusDry)
        highFilter.connect(chorusDelay)
        chorusDelay.connect(chorusGain)
        chorusGain.connect(chorusWet)
        const chorusMerge = audioContext.createGain()
        chorusDry.connect(chorusMerge)
        chorusWet.connect(chorusMerge)
        
        // Flanger (wet/dry mix)
        const flangerDry = audioContext.createGain()
        const flangerWet = audioContext.createGain()
        flangerDry.gain.value = 1 - (effects.flanger / 100) * 0.5
        flangerWet.gain.value = (effects.flanger / 100) * 0.5
        flangerDryRef.current = flangerDry
        flangerWetRef.current = flangerWet
        chorusMerge.connect(flangerDry)
        chorusMerge.connect(flangerDelay)
        flangerDelay.connect(flangerGain)
        flangerGain.connect(flangerWet)
        const flangerMerge = audioContext.createGain()
        flangerDry.connect(flangerMerge)
        flangerWet.connect(flangerMerge)
        
        // Phaser (wet/dry mix)
        let phaserInput = flangerMerge
        for (let i = 0; i < phaserFilters.length; i++) {
          phaserInput.connect(phaserFilters[i])
          phaserInput = phaserFilters[i]
        }
        const phaserDry = audioContext.createGain()
        const phaserWet = audioContext.createGain()
        phaserDry.gain.value = 1 - (effects.phaser / 100) * 0.5
        phaserWet.gain.value = (effects.phaser / 100) * 0.5
        phaserDryRef.current = phaserDry
        phaserWetRef.current = phaserWet
        flangerMerge.connect(phaserDry)
        phaserInput.connect(phaserWet)
        const phaserMerge = audioContext.createGain()
        phaserDry.connect(phaserMerge)
        phaserWet.connect(phaserMerge)
        
        // Tremolo
        phaserMerge.connect(tremoloGain)
        
        // Bitcrusher (wet/dry mix)
        const bitcrusherDry = audioContext.createGain()
        const bitcrusherWet = audioContext.createGain()
        bitcrusherDry.gain.value = 1 - (effects.bitcrusher / 100) * 0.5
        bitcrusherWet.gain.value = (effects.bitcrusher / 100) * 0.5
        bitcrusherDryRef.current = bitcrusherDry
        bitcrusherWetRef.current = bitcrusherWet
        tremoloGain.connect(bitcrusherDry)
        tremoloGain.connect(bitcrusher)
        bitcrusher.connect(bitcrusherWet)
        const bitcrusherMerge = audioContext.createGain()
        bitcrusherDry.connect(bitcrusherMerge)
        bitcrusherWet.connect(bitcrusherMerge)
        
        // Distortion -> Delay -> Compressor -> Gain
        bitcrusherMerge.connect(distortion)
        
        // Delay setup: split signal - one to delay (with feedback), one directly to compressor
        distortion.connect(delay)
        // Delay feedback loop
        delay.connect(delayGain)
        delayGain.connect(delay) // Feedback
        // Main delay output to compressor
        delay.connect(compressor)
        
        compressor.connect(gainNode)
        // gainNode will connect to destination when playing

        isInitializedRef.current = true
        
        // No event listeners needed - we don't touch the original audio element
        return () => {}
      } catch (error) {
        console.error("Error initializing audio processing:", error)
        isInitializedRef.current = false
        return () => {} // Return empty cleanup on error
      }
    }

    let cleanupFn: (() => void) | null = null
    
    initAudioProcessing().then(cleanup => {
      cleanupFn = cleanup || null
    }).catch(() => {})

    return () => {
      // Cleanup on unmount or when audio buffer/URL changes
      if (cleanupFn) {
        cleanupFn()
      }
      
      if (bufferSourceRef.current) {
        try {
          bufferSourceRef.current.stop()
          bufferSourceRef.current.disconnect()
        } catch (e) {
          // Ignore disconnect errors
        }
        bufferSourceRef.current = null
      }
      
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect()
        } catch (e) {
          // Ignore disconnect errors
        }
        sourceRef.current = null
      }
      
      isInitializedRef.current = false
    }
  }, [audioBuffer, audioUrl])

  // Update effects in real-time
  useEffect(() => {
    if (!isInitializedRef.current || !audioContextRef.current) return

    // Ensure audio context is running
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(err => {
        console.error("Error resuming audio context:", err)
      })
    }

    const { currentTime } = audioContextRef.current

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(effects.volume / 100, currentTime)
    }
    if (hpfRef.current) {
      const hpfFreq = 20 + (effects.hpf / 100) * (2000 - 20)
      hpfRef.current.frequency.setValueAtTime(hpfFreq, currentTime)
    }
    if (lpfRef.current) {
      const lpfFreq = 2000 + (effects.lpf / 100) * (20000 - 2000)
      lpfRef.current.frequency.setValueAtTime(lpfFreq, currentTime)
    }
    if (lowFilterRef.current) {
      lowFilterRef.current.gain.setValueAtTime(effects.low, currentTime)
    }
    if (midFilterRef.current) {
      midFilterRef.current.gain.setValueAtTime(effects.mid, currentTime)
    }
    if (highFilterRef.current) {
      highFilterRef.current.gain.setValueAtTime(effects.high, currentTime)
    }
    if (delayRef.current) {
      delayRef.current.delayTime.setValueAtTime(effects.delay / 1000, currentTime)
    }
    if (delayGainRef.current) {
      // Delay feedback: 0-100% maps to 0-0.5 gain (50% feedback max)
      delayGainRef.current.gain.setValueAtTime((effects.delayFeedback / 100) * 0.5, currentTime)
    }
    if (chorusRef.current) {
      chorusRef.current.gain.setValueAtTime(effects.chorus / 100, currentTime)
    }
    if (chorusDryRef.current && chorusWetRef.current) {
      const wet = (effects.chorus / 100) * 0.5
      chorusDryRef.current.gain.setValueAtTime(1 - wet, currentTime)
      chorusWetRef.current.gain.setValueAtTime(wet, currentTime)
    }
    if (flangerRef.current) {
      flangerRef.current.gain.setValueAtTime(effects.flanger / 100, currentTime)
    }
    if (flangerDryRef.current && flangerWetRef.current) {
      const wet = (effects.flanger / 100) * 0.5
      flangerDryRef.current.gain.setValueAtTime(1 - wet, currentTime)
      flangerWetRef.current.gain.setValueAtTime(wet, currentTime)
    }
    if (phaserLFORef.current) {
      phaserLFORef.current.gain.setValueAtTime((effects.phaser / 100) * 1000, currentTime)
    }
    if (phaserDryRef.current && phaserWetRef.current) {
      const wet = (effects.phaser / 100) * 0.5
      phaserDryRef.current.gain.setValueAtTime(1 - wet, currentTime)
      phaserWetRef.current.gain.setValueAtTime(wet, currentTime)
    }
    if (tremoloLFORef.current) {
      tremoloLFORef.current.gain.setValueAtTime((effects.tremolo / 100) * 0.5, currentTime)
    }
    if (bitcrusherDryRef.current && bitcrusherWetRef.current) {
      const wet = (effects.bitcrusher / 100) * 0.5
      bitcrusherDryRef.current.gain.setValueAtTime(1 - wet, currentTime)
      bitcrusherWetRef.current.gain.setValueAtTime(wet, currentTime)
    }
    if (bitcrusherRef.current) {
      const makeBitcrusherCurve = (bits: number) => {
        const samples = 256
        const curve = new Float32Array(samples)
        const step = Math.pow(2, bits)
        for (let i = 0; i < samples; i++) {
          const x = (i * 2) / samples - 1
          curve[i] = Math.floor(x * step) / step
        }
        return curve
      }
      bitcrusherRef.current.curve = makeBitcrusherCurve(16 - (effects.bitcrusher / 100) * 14)
    }
    
    // Note: Pitch, tempo, reverse, and loop are applied when creating the buffer source
    // They're not applied to the original audio element
    
    if (distortionRef.current) {
      const makeDistortionCurve = (amount: number) => {
        const samples = 44100
        const curve = new Float32Array(samples)
        const deg = Math.PI / 180
        for (let i = 0; i < samples; i++) {
          const x = (i * 2) / samples - 1
          curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
        }
        return curve
      }
      distortionRef.current.curve = makeDistortionCurve(effects.drive)
    }
    if (compressorRef.current) {
      compressorRef.current.threshold.setValueAtTime(-24 - (effects.compression * 0.3), currentTime)
    }
    
    // Update pitch shifter for key lock compensation
    if (effects.keyLock && pitchShifterRef.current && pitchShifterRef.current.delay) {
      const tempoRatio = effects.tempo / 100
      // When tempo increases, pitch goes up by the same ratio
      // To maintain original pitch, we need to lower it by 1/tempoRatio
      // For delay-based pitch shifting: decreasing delay time = lower pitch
      // Base delay is 0.025, we adjust it based on tempo compensation needed
      const baseDelay = 0.025
      // Calculate compensation: if tempo = 1.5x, we need to lower pitch by 1/1.5 = 0.667x
      // Adjust delay time inversely to tempo ratio
      const compensationFactor = 1 / tempoRatio
      // Scale delay time to create pitch compensation (simplified approach)
      const adjustedDelay = baseDelay * compensationFactor
      // Clamp to valid range
      const finalDelay = Math.max(0.001, Math.min(0.05, adjustedDelay))
      pitchShifterRef.current.delay.delayTime.setValueAtTime(finalDelay, currentTime)
      
      // Adjust feedback and output based on compensation needed
      if ((pitchShifterRef.current as any).feedback && (pitchShifterRef.current as any).output) {
        // More compensation needed = more feedback and output
        const feedbackAmount = 0.2 + (Math.abs(1 - compensationFactor) * 0.3)
        const outputAmount = 0.6 + (Math.abs(1 - compensationFactor) * 0.2)
        ;(pitchShifterRef.current as any).feedback.gain.setValueAtTime(feedbackAmount, currentTime)
        ;(pitchShifterRef.current as any).output.gain.setValueAtTime(outputAmount, currentTime)
      }
    } else if (pitchShifterRef.current && pitchShifterRef.current.delay) {
      // Key lock disabled - reset to base values
      pitchShifterRef.current.delay.delayTime.setValueAtTime(0.025, currentTime)
      if ((pitchShifterRef.current as any).feedback && (pitchShifterRef.current as any).output) {
        ;(pitchShifterRef.current as any).feedback.gain.setValueAtTime(0.3, currentTime)
        ;(pitchShifterRef.current as any).output.gain.setValueAtTime(0.7, currentTime)
      }
    }

    if (onEffectsChange) {
      onEffectsChange(effects)
    }
  }, [effects, onEffectsChange])

  return (
    <div className="space-y-3">
      {!audioUrl && (
        <div className="text-center py-12 text-gray-400">
          <Waves className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Generate voice audio to enable modulation controls</p>
        </div>
      )}

      {audioUrl && (
        <>
          {/* Controls Bar */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePlayPauseModulated}
                disabled={!audioBuffer || !isInitializedRef.current}
                className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-sm text-cyan-400 hover:text-cyan-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlayingModulated ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause Modulated</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Play Modulated</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setEffects((prev) => ({ ...prev, loop: !prev.loop }))}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm ${
                  effects.loop
                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                    : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                <RotateCw className="w-4 h-4" />
                <span>{effects.loop ? 'Loop On' : 'Loop Off'}</span>
              </button>
              <button
                onClick={handleExport}
                disabled={!audioBuffer || !isInitializedRef.current || isExporting}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-sm text-purple-400 hover:text-purple-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export Sample</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
                <span>Undo</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
                <span>Redo</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All</span>
              </button>
            </div>
          </div>

          {/* EQ Section */}
          <div>
            <div className="text-sm font-semibold text-gray-300 mb-4 flex items-center space-x-2">
              <Volume2 className="w-4 h-4" />
              <span>Equalizer</span>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <RotaryKnob
                label="Volume"
                icon={<Volume2 className="w-4 h-4" />}
                value={effects.volume}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, volume: value }))}
                formatValue={(v) => `${v}%`}
                color="default"
              />
              <RotaryKnob
                label="Low"
                value={effects.low}
                min={-24}
                max={24}
                step={0.5}
                onChange={(value) => setEffects((prev) => ({ ...prev, low: value }))}
                formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}dB`}
                color="low"
              />
              <RotaryKnob
                label="Mid"
                value={effects.mid}
                min={-24}
                max={24}
                step={0.5}
                onChange={(value) => setEffects((prev) => ({ ...prev, mid: value }))}
                formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}dB`}
                color="mid"
              />
              <RotaryKnob
                label="High"
                value={effects.high}
                min={-24}
                max={24}
                step={0.5}
                onChange={(value) => setEffects((prev) => ({ ...prev, high: value }))}
                formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}dB`}
                color="high"
              />
            </div>
          </div>

          {/* DJ Controls Section */}
          <div>
            <div className="text-sm font-semibold text-gray-300 mb-4 flex items-center space-x-2">
              <Music className="w-4 h-4" />
              <span>DJ Controls</span>
            </div>
            <div className="grid grid-cols-4 gap-6 mb-4">
              <RotaryKnob
                label="Pitch"
                value={effects.pitch}
                min={-12}
                max={12}
                step={0.1}
                onChange={(value) => setEffects((prev) => ({ ...prev, pitch: value }))}
                formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}st`}
                color="default"
              />
              <RotaryKnob
                label="Tempo"
                value={effects.tempo}
                min={50}
                max={200}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, tempo: value }))}
                formatValue={(v) => {
                  // Convert percentage to BPM (assuming base tempo of 120 BPM)
                  // 100% = 120 BPM, 50% = 60 BPM, 200% = 240 BPM
                  const bpm = Math.round((v / 100) * 120)
                  return `${bpm} BPM`
                }}
                color="default"
              />
              <div className="flex flex-col items-center space-y-2">
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Key Lock</div>
                <button
                  onClick={() => setEffects((prev) => ({ ...prev, keyLock: !prev.keyLock }))}
                  className={`w-16 h-16 rounded-full border-2 transition-all duration-200 ${
                    effects.keyLock
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500'
                      : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                  } flex items-center justify-center`}
                >
                  <Music className="w-6 h-6" />
                </button>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Reverse</div>
                <button
                  onClick={() => setEffects((prev) => ({ ...prev, reverse: !prev.reverse }))}
                  className={`w-16 h-16 rounded-full border-2 transition-all duration-200 ${
                    effects.reverse
                      ? 'bg-red-500/20 border-red-500 text-red-500'
                      : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                  } flex items-center justify-center`}
                >
                  <SkipBack className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div>
            <div className="text-sm font-semibold text-gray-300 mb-4 flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <RotaryKnob
                label="HPF"
                value={effects.hpf}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, hpf: value }))}
                formatValue={(v) => {
                  const freq = Math.round(20 + (v / 100) * (2000 - 20))
                  return `${freq}Hz`
                }}
                color="low"
              />
              <RotaryKnob
                label="LPF"
                value={effects.lpf}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, lpf: value }))}
                formatValue={(v) => {
                  const freq = Math.round(2000 + (v / 100) * (20000 - 2000))
                  return `${freq}Hz`
                }}
                color="high"
              />
            </div>
          </div>

          {/* Effects Section */}
          <div>
            <div className="text-sm font-semibold text-gray-300 mb-4 flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Effects</span>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <RotaryKnob
                label="Reverb"
                value={effects.reverb}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, reverb: value }))}
                formatValue={(v) => `${v}%`}
                color="default"
              />
              <RotaryKnob
                label="Delay"
                value={effects.delay / 5}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, delay: value * 5 }))}
                formatValue={(v) => {
                  // Convert 0-100 range to 0-500ms for display
                  const msValue = Math.round(v * 5)
                  return `${msValue}ms`
                }}
                color="default"
              />
              <RotaryKnob
                label="Feedback"
                value={effects.delayFeedback}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, delayFeedback: value }))}
                formatValue={(v) => `${v}%`}
                color="default"
              />
              <RotaryKnob
                label="Drive"
                icon={<Zap className="w-4 h-4" />}
                value={effects.drive}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, drive: value }))}
                formatValue={(v) => `${v}%`}
                color="default"
              />
              <RotaryKnob
                label="Comp"
                value={effects.compression}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, compression: value }))}
                formatValue={(v) => `${v}%`}
                color="default"
              />
              <RotaryKnob
                label="Chorus"
                value={effects.chorus}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, chorus: value }))}
                formatValue={(v) => `${v}%`}
                color="default"
              />
              <RotaryKnob
                label="Flanger"
                value={effects.flanger}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, flanger: value }))}
                formatValue={(v) => `${v}%`}
                color="default"
              />
              <RotaryKnob
                label="Phaser"
                value={effects.phaser}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, phaser: value }))}
                formatValue={(v) => `${v}%`}
                color="default"
              />
              <RotaryKnob
                label="Tremolo"
                value={effects.tremolo}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, tremolo: value }))}
                formatValue={(v) => `${v}%`}
                color="default"
              />
              <RotaryKnob
                label="Bitcrush"
                value={effects.bitcrusher}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setEffects((prev) => ({ ...prev, bitcrusher: value }))}
                formatValue={(v) => `${v}%`}
                color="default"
              />
            </div>
          </div>

          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-xs text-cyan-400 text-center">
              Effects apply in real-time as you adjust the knobs
            </p>
          </div>
        </>
      )}
    </div>
  )
}

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return audioCtx
  } catch {
    return null
  }
}

function playTone(ctx: AudioContext, startTime: number, duration: number) {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = 800
  gainNode.gain.value = 0.3

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

/**
 * Triple-beep pattern: beep-pause-beep-pause-beep (~0.7s total)
 */
export function playTripleBeep(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  // Resume context if suspended (autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  const now = ctx.currentTime
  const beepDuration = 0.12
  const pauseDuration = 0.15

  playTone(ctx, now, beepDuration)
  playTone(ctx, now + beepDuration + pauseDuration, beepDuration)
  playTone(ctx, now + 2 * (beepDuration + pauseDuration), beepDuration)
}

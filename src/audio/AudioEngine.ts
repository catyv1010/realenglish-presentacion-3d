export interface AudioAnalysisData {
  bass: number
  mid: number
  high: number
  average: number
}

export class AudioEngine {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private nextNoteTime = 0
  private beatIndex = 0
  private tempo = 110
  private isPlaying = false
  private lookahead = 25
  private scheduleAheadTime = 0.1
  private timerID: number | null = null
  private frequencyData: Uint8Array | null = null

  constructor() {
    if (typeof window === 'undefined') return
    this.context = new AudioContext()
    this.masterGain = this.context.createGain()
    this.masterGain.gain.value = 0.4

    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.8

    this.masterGain.connect(this.analyser)
    this.analyser.connect(this.context.destination)

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
  }

  async resume() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume()
    }
  }

  play() {
    if (!this.context || this.isPlaying) return
    this.isPlaying = true
    this.nextNoteTime = this.context.currentTime + 0.1
    this.beatIndex = 0
    this.scheduler()
  }

  pause() {
    this.isPlaying = false
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID)
      this.timerID = null
    }
  }

  stop() {
    this.pause()
    if (this.context) {
      this.context.suspend()
    }
  }

  setVolume(value: number) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(value, this.context?.currentTime ?? 0, 0.1)
    }
  }

  getAnalysis(): AudioAnalysisData {
    if (!this.analyser || !this.frequencyData) {
      return { bass: 0, mid: 0, high: 0, average: 0 }
    }

    this.analyser.getByteFrequencyData(
      this.frequencyData as unknown as Uint8Array<ArrayBuffer>
    )

    const data = this.frequencyData
    const sampleRate = this.context?.sampleRate ?? 44100
    const binSize = sampleRate / 2 / data.length

    const bassEnd = Math.floor(150 / binSize)
    const midEnd = Math.floor(2000 / binSize)

    const bass = this.getAverage(data, 0, Math.min(bassEnd, data.length))
    const mid = this.getAverage(data, bassEnd, Math.min(midEnd, data.length))
    const high = this.getAverage(data, midEnd, data.length)
    const average = this.getAverage(data, 0, data.length)

    return {
      bass: bass / 255,
      mid: mid / 255,
      high: high / 255,
      average: average / 255,
    }
  }

  private getAverage(data: Uint8Array, start: number, end: number): number {
    let sum = 0
    let count = 0
    for (let i = start; i < end; i++) {
      sum += data[i]
      count++
    }
    return count > 0 ? sum / count : 0
  }

  private scheduler() {
    if (!this.isPlaying || !this.context) return

    while (this.nextNoteTime < this.context.currentTime + this.scheduleAheadTime) {
      this.scheduleBeat(this.nextNoteTime, this.beatIndex)
      this.nextNoteTime += 60 / this.tempo / 2
      this.beatIndex = (this.beatIndex + 1) % 16
    }

    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead)
  }

  private scheduleBeat(time: number, beatIndex: number) {
    if (!this.context || !this.masterGain) return

    // Kick on beats 0, 4, 8, 12
    if (beatIndex % 4 === 0) {
      this.playKick(time)
    }

    // Snare on beats 4, 12
    if (beatIndex % 8 === 4) {
      this.playSnare(time)
    }

    // Hi-hats on off-beats
    if (beatIndex % 2 === 1) {
      this.playHiHat(time)
    }

    // Bass line
    if (beatIndex % 2 === 0) {
      const bassNotes = [55, 55, 65, 73, 55, 55, 49, 49]
      const noteIndex = Math.floor(beatIndex / 2) % bassNotes.length
      this.playBass(time, bassNotes[noteIndex])
    }

    // Arpeggio melody
    if (beatIndex % 4 === 0) {
      const arpNotes = [220, 261.63, 329.63, 392]
      const noteIndex = (beatIndex / 4) % arpNotes.length
      this.playArp(time, arpNotes[noteIndex])
    }

    // Ambient pad
    if (beatIndex === 0) {
      this.playPad(time)
    }
  }

  private playKick(time: number) {
    if (!this.context || !this.masterGain) return

    const osc = this.context.createOscillator()
    const gain = this.context.createGain()

    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.15)

    gain.gain.setValueAtTime(0.8, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(time)
    osc.stop(time + 0.2)
  }

  private playSnare(time: number) {
    if (!this.context || !this.masterGain) return

    const noise = this.context.createBufferSource()
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 0.2, this.context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1
    }
    noise.buffer = buffer

    const filter = this.context.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 800

    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0.4, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start(time)
    noise.stop(time + 0.2)
  }

  private playHiHat(time: number) {
    if (!this.context || !this.masterGain) return

    const noise = this.context.createBufferSource()
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 0.05, this.context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1
    }
    noise.buffer = buffer

    const filter = this.context.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 8000

    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0.15, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start(time)
    noise.stop(time + 0.05)
  }

  private playBass(time: number, frequency: number) {
    if (!this.context || !this.masterGain) return

    const osc = this.context.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(frequency, time)

    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(200, time)
    filter.frequency.exponentialRampToValueAtTime(80, time + 0.2)

    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0.25, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    osc.start(time)
    osc.stop(time + 0.3)
  }

  private playArp(time: number, frequency: number) {
    if (!this.context || !this.masterGain) return

    const osc = this.context.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, time)

    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0.15, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(time)
    osc.stop(time + 0.3)
  }

  private playPad(time: number) {
    if (!this.context || !this.masterGain) return

    const frequencies = [110, 164.81, 196]
    frequencies.forEach((freq) => {
      const osc = this.context!.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, time)

      const gain = this.context!.createGain()
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.08, time + 0.5)
      gain.gain.exponentialRampToValueAtTime(0.01, time + 3)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(time)
      osc.stop(time + 3)
    })
  }
}

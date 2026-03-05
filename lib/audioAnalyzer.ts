import { AudioData } from './types'

export class AudioAnalyzer {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaElementAudioSourceNode | null = null
  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(0)
  private prevBassEnergy = 0
  private bassHistory: number[] = []

  async connect(audio: HTMLAudioElement) {
    this.ctx = new AudioContext()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.85
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)

    this.source = this.ctx.createMediaElementSource(audio)
    this.source.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
  }

  getData(): AudioData {
    if (!this.analyser) {
      return { frequencyData: new Uint8Array(1024), volume: 0, bass: 0, mid: 0, high: 0, beat: false }
    }

    this.analyser.getByteFrequencyData(this.frequencyData)

    // Band energies
    const bins = this.frequencyData.length
    let bassSum = 0, midSum = 0, highSum = 0, totalSum = 0
    const bassEnd = Math.floor(bins * 0.1)   // ~0-200Hz
    const midEnd = Math.floor(bins * 0.5)    // ~200-2000Hz

    for (let i = 0; i < bins; i++) {
      const v = this.frequencyData[i]
      totalSum += v
      if (i < bassEnd) bassSum += v
      else if (i < midEnd) midSum += v
      else highSum += v
    }

    const bass = bassSum / (bassEnd * 255)
    const mid = midSum / ((midEnd - bassEnd) * 255)
    const high = highSum / ((bins - midEnd) * 255)
    const volume = totalSum / (bins * 255)

    // Beat detection
    this.bassHistory.push(bass)
    if (this.bassHistory.length > 30) this.bassHistory.shift()
    const avgBass = this.bassHistory.reduce((a, b) => a + b, 0) / this.bassHistory.length
    const beat = bass > avgBass * 1.4 && bass > 0.15

    return { frequencyData: this.frequencyData, volume, bass, mid, high, beat }
  }

  disconnect() {
    this.source?.disconnect()
    this.analyser?.disconnect()
    this.ctx?.close()
    this.ctx = null
    this.analyser = null
    this.source = null
  }
}

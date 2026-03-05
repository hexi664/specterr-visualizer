'use client'

import { useRef, useEffect } from 'react'
import { AudioData, TemplateId } from '@/lib/types'
import { createDrawState, drawFrame } from '@/lib/drawVisualizer'

interface VisualizerProps {
  audioData: AudioData | null
  artistName?: string
  songTitle?: string
  template?: TemplateId
}

export default function Visualizer({
  audioData,
  artistName = 'Artist Name',
  songTitle = 'Counting Stars',
  template = 'counting-stars',
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createDrawState())
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef(0)
  const audioDataRef = useRef<AudioData | null>(null)
  const propsRef = useRef({ artistName, songTitle, template })

  // Keep refs updated without restarting RAF
  audioDataRef.current = audioData
  propsRef.current = { artistName, songTitle, template }

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const time = (timestamp - startTimeRef.current) / 1000

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.scale(dpr, dpr)
      }

      const p = propsRef.current
      drawFrame(ctx, w, h, audioDataRef.current, stateRef.current, time, p.artistName, p.songTitle, p.template)

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ imageRendering: 'auto' }}
    />
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AudioAnalyzer } from '@/lib/audioAnalyzer'
import { AudioData, TemplateId } from '@/lib/types'

const Visualizer = dynamic(() => import('@/components/Visualizer'), { ssr: false })
const AudioUploader = dynamic(() => import('@/components/AudioUploader'), { ssr: false })

const templateOptions: { id: TemplateId; name: string; subtitle: string }[] = [
  { id: 'counting-stars', name: 'Counting Stars', subtitle: '柔和粉色圆形频谱' },
  { id: 'pinky-pop', name: 'Pinky Pop', subtitle: '多层霓虹波形环' },
  { id: 'lucky-clover', name: 'Lucky Clover', subtitle: '荧光四叶草反应体' },
]

export default function Home() {
  const [audioData, setAudioData] = useState<AudioData | null>(null)
  const [hasAudio, setHasAudio] = useState(false)
  const [template, setTemplate] = useState<TemplateId>('counting-stars')
  const analyzerRef = useRef<AudioAnalyzer | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('template') as TemplateId | null
    if (q && templateOptions.some(t => t.id === q)) setTemplate(q)
  }, [])

  const startAnalysis = useCallback(() => {
    const tick = () => {
      if (analyzerRef.current) {
        setAudioData(analyzerRef.current.getData())
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const handleAudioReady = useCallback(async (audio: HTMLAudioElement) => {
    const analyzer = new AudioAnalyzer()
    await analyzer.connect(audio)
    analyzerRef.current = analyzer
    setHasAudio(true)
    audio.play()
    startAnalysis()
  }, [startAnalysis])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      analyzerRef.current?.disconnect()
    }
  }, [])

  const current = templateOptions.find(t => t.id === template)

  return (
    <main className="w-screen h-screen bg-black relative overflow-hidden">
      <Visualizer
        audioData={audioData}
        artistName="Artist Name"
        songTitle={current?.name || 'Counting Stars'}
        template={template}
      />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/35 backdrop-blur-md rounded-xl px-3 py-2 border border-white/15">
        <div className="flex gap-2">
          {templateOptions.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`px-3 py-2 rounded-lg text-left transition ${template === t.id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              <div className="text-xs font-semibold">{t.name}</div>
              <div className="text-[10px] opacity-80">{t.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      {!hasAudio && <AudioUploader onAudioReady={handleAudioReady} />}
    </main>
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AudioAnalyzer } from '@/lib/audioAnalyzer'
import { AudioData, TemplateId } from '@/lib/types'

const Visualizer = dynamic(() => import('@/components/Visualizer'), { ssr: false })
const AudioUploader = dynamic(() => import('@/components/AudioUploader'), { ssr: false })

const templateOptions: { id: TemplateId; name: string; subtitle: string; referenceVideo?: string }[] = [
  { id: 'counting-stars', name: 'Counting Stars', subtitle: '柔和粉色圆点频谱', referenceVideo: '/videos/counting-stars.mp4' },
  { id: 'lucky-clover', name: 'Lucky Clover', subtitle: '绿色光晕有机脉动', referenceVideo: '/videos/lucky-clover.mp4' },
  { id: 'range-of-fire', name: 'Range of Fire', subtitle: '火焰频谱山脉', referenceVideo: '/videos/range-of-fire.mp4' },
  { id: 'snowflake', name: 'Snowflake', subtitle: '梦幻蓝天星光', referenceVideo: '/videos/snowflake.mp4' },
  { id: 'pinky-pop', name: 'Pinky Pop', subtitle: '樱花飘落粉色梦', referenceVideo: '/videos/pinky-pop.mp4' },
  { id: 'seven-suns', name: 'Seven Suns', subtitle: '城市灯火光点', referenceVideo: '/videos/seven-suns.mp4' },
  { id: 'chromatic', name: 'Chromatic', subtitle: '彩虹光环频谱', referenceVideo: '/videos/chromatic.mp4' },
  { id: 'jungle-cat', name: 'Jungle Cat', subtitle: '暗绿条形频谱', referenceVideo: '/videos/jungle-cat.mp4' },
  { id: 'prismatic', name: 'Prismatic', subtitle: '万花筒棱镜', referenceVideo: '/videos/prismatic.mp4' },
  { id: 'datascape', name: 'Datascape', subtitle: '赛博朋克网格', referenceVideo: '/videos/datascape.mp4' },
]

export default function Home() {
  const [audioData, setAudioData] = useState<AudioData | null>(null)
  const [hasAudio, setHasAudio] = useState(false)
  const [template, setTemplate] = useState<TemplateId>('counting-stars')
  const [showRefVideo, setShowRefVideo] = useState(false)
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

      {/* Reference Video Button - bottom right */}
      {current?.referenceVideo && (
        <button
          onClick={() => setShowRefVideo(true)}
          className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white/90 hover:bg-white/20 hover:text-white transition-all group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span className="text-sm font-medium">参考视频</span>
        </button>
      )}

      {/* Reference Video Modal */}
      {showRefVideo && current?.referenceVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowRefVideo(false)}
        >
          <div
            className="relative w-[90vw] max-w-4xl bg-black/90 rounded-2xl border border-white/20 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <span className="text-white/90 text-sm font-medium">参考视频 — {current.name}</span>
              <button
                onClick={() => setShowRefVideo(false)}
                className="text-white/60 hover:text-white transition p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <video
              src={current.referenceVideo}
              controls
              autoPlay
              className="w-full aspect-video"
            />
          </div>
        </div>
      )}
    </main>
  )
}

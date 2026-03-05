'use client'

import { useRef, useState } from 'react'

interface AudioUploaderProps {
  onAudioReady: (audio: HTMLAudioElement) => void
}

export default function AudioUploader({ onAudioReady }: AudioUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const prevUrlRef = useRef<string | null>(null)

  const handleFile = (file: File) => {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    const url = URL.createObjectURL(file)
    prevUrlRef.current = url
    const audio = new Audio(url)
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio
    setFileName(file.name)

    audio.addEventListener('play', () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))
    audio.addEventListener('ended', () => setIsPlaying(false))

    onAudioReady(audio)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSample = async () => {
    const audio = new Audio('/sample.mp3')
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio
    setFileName('Sample Audio')
    onAudioReady(audio)
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play()
    } else {
      audioRef.current.pause()
    }
  }

  if (fileName) {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-5 py-2.5 z-10">
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          {isPlaying ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <span className="text-white/80 text-sm">{fileName}</span>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div
        className="bg-black/30 backdrop-blur-md rounded-2xl p-8 text-center max-w-sm mx-4 cursor-pointer border border-white/10 hover:border-white/20 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
        </div>
        <p className="text-white/90 font-medium mb-1">Upload Audio</p>
        <p className="text-white/50 text-sm mb-4">MP3, WAV, FLAC, OGG · Max 50MB</p>

        <button
          onClick={(e) => { e.stopPropagation(); handleSample() }}
          className="text-white/60 text-sm hover:text-white/80 underline underline-offset-2 transition-colors"
        >
          Use sample audio
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>
    </div>
  )
}

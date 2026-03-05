import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Specterr Visualizer',
  description: 'Music visualizer - Counting Stars template',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black">{children}</body>
    </html>
  )
}

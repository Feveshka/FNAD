import { useEffect, useRef } from 'react'
import { startGame, stopGame } from '@/game/boot'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    startGame(canvas)
    return () => stopGame()
  }, [])
  return <div id="game-root"><canvas id="game-canvas" ref={canvasRef} aria-label="Five Nights at Dibil Daddy — 3D game" /><div id="ui-overlay" /></div>
}

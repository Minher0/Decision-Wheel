'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, RotateCcw, Share2, Sparkles, Play, Coffee } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// Couleurs vibrantes pour la roue
const WHEEL_COLORS = [
  '#FF6B6B', // Rouge corail
  '#4ECDC4', // Turquoise
  '#45B7D1', // Bleu ciel
  '#96CEB4', // Vert menthe
  '#FFEAA7', // Jaune pâle
  '#DDA0DD', // Prune
  '#98D8C8', // Vert d'eau
  '#F7DC6F', // Jaune or
  '#BB8FCE', // Violet
  '#85C1E9', // Bleu clair
  '#F8B500', // Orange
  '#00CED1', // Turquoise foncé
]

// Générer les confettis une seule fois
const CONFETTI_PIECES = Array.from({ length: 80 }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  color: WHEEL_COLORS[Math.floor(Math.random() * WHEEL_COLORS.length)],
  size: 6 + Math.random() * 8,
  delay: Math.random() * 0.5,
  duration: 2 + Math.random() * 2,
  isCircle: Math.random() > 0.5,
}))

// Composant Confetti (défini en dehors du composant principal)
function Confetti({ show }: { show: boolean }) {
  if (!show) return null
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {CONFETTI_PIECES.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: piece.isCircle ? '50%' : '2px',
            animation: `confetti ${piece.duration}s linear ${piece.delay}s forwards`,
          }}
        />
      ))}
    </div>
  )
}

// Hook personnalisé pour localStorage avec SSR safe
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // État pour stocker la valeur
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  // Fonction pour mettre à jour la valeur
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch {
      // Ignore errors
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

interface DecisionWheelProps {
  initialOptions?: string[]
}

export default function DecisionWheel({ initialOptions = [] }: DecisionWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // État des options avec localStorage
  const [options, setOptions] = useLocalStorage<string[]>(
    'decisionWheelOptions',
    initialOptions.length > 0 ? initialOptions : ['Pizza', 'Sushi', 'Burger', 'Tacos']
  )

  // Lire les options depuis l'URL au montage et les appliquer
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const optionsParam = params.get('options')
    if (optionsParam) {
      const urlOptions = optionsParam.split(',').map(o => {
        try {
          return decodeURIComponent(o.trim())
        } catch {
          return o.trim()
        }
      }).filter(o => o)
      if (urlOptions.length > 0) {
        setOptions(urlOptions)
      }
    }
  }, [setOptions])
  
  const [inputValue, setInputValue] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const animationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Dessiner la roue
  const drawWheel = useCallback((currentRotation: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 10

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    if (options.length === 0) {
      // Dessiner un cercle vide
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fillStyle = '#e5e7eb'
      ctx.fill()
      ctx.strokeStyle = '#9ca3af'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.fillStyle = '#6b7280'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Ajoutez des options!', centerX, centerY)
      return
    }

    const sliceAngle = (2 * Math.PI) / options.length

    // Dessiner chaque segment
    options.forEach((option, index) => {
      const startAngle = index * sliceAngle + currentRotation
      const endAngle = startAngle + sliceAngle

      // Dessiner le segment
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      ctx.fillStyle = WHEEL_COLORS[index % WHEEL_COLORS.length]
      ctx.fill()

      // Bordure du segment
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Dessiner le texte
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + sliceAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      
      // Adapter la taille de police
      const fontSize = options.length > 8 ? 12 : options.length > 5 ? 14 : 16
      ctx.font = `bold ${fontSize}px sans-serif`
      
      // Tronquer le texte si nécessaire
      let displayText = option
      const maxWidth = radius - 30
      if (ctx.measureText(displayText).width > maxWidth) {
        while (ctx.measureText(displayText + '...').width > maxWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1)
        }
        displayText += '...'
      }
      
      ctx.fillText(displayText, radius - 15, 5)
      ctx.restore()
    })

    // Dessiner le cercle central
    ctx.beginPath()
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 3
    ctx.stroke()

    // Cercle intérieur décoratif
    ctx.beginPath()
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI)
    ctx.fillStyle = '#f3f4f6'
    ctx.fill()
  }, [options])

  // Redessiner quand les options changent
  useEffect(() => {
    drawWheel(rotation)
  }, [options, rotation, drawWheel])

  // Jouer un son
  const playSound = useCallback((frequency: number, duration: number = 100) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration / 1000)
    } catch {
      // Audio not supported
    }
  }, [])

  // Animation de rotation
  const spinWheel = useCallback(() => {
    if (isSpinning || options.length === 0) return

    setIsSpinning(true)
    setResult(null)
    setShowConfetti(false)

    const totalRotation = Math.random() * Math.PI * 2 + Math.PI * 8 // 4 tours minimum + aléatoire
    const duration = 5000 // 5 secondes
    const startTime = Date.now()
    const startRotation = rotation

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing: easeOutCubic pour un ralentissement progressif
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      const currentRotation = startRotation + totalRotation * easeOut
      setRotation(currentRotation)
      drawWheel(currentRotation)

      // Son de tick
      if (progress < 0.8) {
        const tickInterval = Math.max(50, 200 * progress)
        if (elapsed % tickInterval < 20) {
          playSound(400 + Math.random() * 200, 50)
        }
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsSpinning(false)
        
        // Calculer le résultat
        // Le pointeur est en haut de la roue (à -PI/2 ou 3PI/2)
        // On calcule l'angle relatif du pointeur par rapport à la rotation de la roue
        const sliceAngle = (2 * Math.PI) / options.length
        const pointerAngle = -Math.PI / 2 // Pointeur en haut
        const relativeAngle = pointerAngle - currentRotation
        // Normaliser entre 0 et 2*PI
        const normalizedAngle = ((relativeAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
        const winningIndex = Math.floor(normalizedAngle / sliceAngle) % options.length
        
        setResult(options[winningIndex])
        setShowConfetti(true)
        
        // Son de victoire
        playSound(523.25, 150) // C5
        setTimeout(() => playSound(659.25, 150), 100) // E5
        setTimeout(() => playSound(783.99, 300), 200) // G5

        // Masquer les confettis après 3 secondes
        setTimeout(() => setShowConfetti(false), 3000)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [isSpinning, options, rotation, drawWheel, playSound])

  // Ajouter une option
  const addOption = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    // Support pour plusieurs options séparées par des virgules
    const newOptions = trimmed.split(',').map(o => o.trim()).filter(o => o && !options.includes(o))
    
    if (newOptions.length === 0) {
      toast({
        title: 'Option déjà existante',
        description: 'Cette option existe déjà dans la liste.',
        variant: 'destructive'
      })
      return
    }

    setOptions(prev => [...prev, ...newOptions])
    setInputValue('')
    toast({
      title: 'Option(s) ajoutée(s)',
      description: `${newOptions.length} option(s) ajoutée(s) à la roue.`
    })
  }, [inputValue, options, setOptions])

  // Supprimer une option
  const removeOption = useCallback((index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index))
  }, [setOptions])

  // Réinitialiser
  const resetOptions = useCallback(() => {
    setOptions([])
    setResult(null)
    setRotation(0)
    toast({
      title: 'Réinitialisé',
      description: 'Toutes les options ont été supprimées.'
    })
  }, [setOptions])

  // Partager
  const shareWheel = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}?options=${encodeURIComponent(options.join(','))}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Decision Wheel',
          text: 'Regardez ma roue de décision!',
          url: url
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        toast({
          title: 'Lien copié!',
          description: 'Le lien a été copié dans le presse-papier.'
        })
      } else {
        // Fallback pour les navigateurs plus anciens
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          toast({
            title: 'Lien copié!',
            description: 'Le lien a été copié dans le presse-papier.'
          })
        } catch {
          toast({
            title: 'Lien à copier',
            description: url,
          })
        }
        document.body.removeChild(textArea)
      }
    } catch (error) {
      // L'utilisateur a annulé ou erreur - ne pas afficher de toast pour l'annulation
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: 'Erreur',
          description: 'Impossible de partager le lien.',
          variant: 'destructive'
        })
      }
    }
  }, [options])

  // Mémoriser les options pour l'affichage
  const optionsDisplay = useMemo(() => options.map((option, index) => ({
    option,
    color: WHEEL_COLORS[index % WHEEL_COLORS.length]
  })), [options])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      <Confetti show={showConfetti} />
      
      {/* Header */}
      <header className="p-4 sm:p-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-500" />
          Decision Wheel
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Laissez le hasard décider pour vous!</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Wheel Section */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-slate-800 dark:border-t-slate-200 drop-shadow-lg" />
            </div>
            
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={350}
              height={350}
              className="max-w-full h-auto drop-shadow-2xl cursor-pointer"
              onClick={spinWheel}
            />
          </div>

          {/* Spin Button */}
          <Button
            onClick={spinWheel}
            disabled={isSpinning || options.length === 0}
            size="lg"
            className="mt-8 text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
          >
            <Play className="w-5 h-5 mr-2" />
            {isSpinning ? 'Tournage...' : 'TOURNER!'}
          </Button>

          {/* Result */}
          {result && (
            <div className="mt-8 text-center animate-bounce-in">
              <p className="text-slate-600 dark:text-slate-400 text-lg">Le résultat est:</p>
              <div className="mt-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl sm:text-3xl font-bold rounded-2xl shadow-2xl animate-pulse-soft">
                {result}
              </div>
            </div>
          )}
        </div>

        {/* Options Panel */}
        <div className="lg:w-80 flex flex-col gap-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Ajouter des options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Option ou option1, option2..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addOption()}
                  className="flex-1"
                />
                <Button onClick={addOption} variant="default">Ajouter</Button>
              </div>
              <p className="text-xs text-slate-500">Séparez plusieurs options par des virgules</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg flex-1">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Options ({options.length})</CardTitle>
              <div className="flex gap-2">
                <Button onClick={shareWheel} variant="outline" size="sm" disabled={options.length === 0}>
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button onClick={resetOptions} variant="outline" size="sm" disabled={options.length === 0}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {options.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">Aucune option. Ajoutez-en!</p>
                ) : (
                  optionsDisplay.map(({ option, color }, index) => (
                    <div
                      key={`${option}-${index}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="flex-1 truncate">{option}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-slate-500 text-sm">
        Fait avec amour pour vous aider à décider
      </footer>

      {/* Buy Me a Coffee Button */}
      <a
        href="https://buymeacoffee.com/minhero"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        <Coffee className="w-4 h-4" />
        <span className="hidden sm:inline">Buy me a coffee</span>
      </a>
    </div>
  )
}

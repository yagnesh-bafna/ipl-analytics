import Lottie from 'lottie-react'
import { useState, useEffect } from 'react'
import { Spinner } from './Spinner'

export default function LottieAnimation({ url, className }) {
  const [animationData, setAnimationData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(() => setError(true))
  }, [url])

  if (error) return null
  if (!animationData) return <div className={className}><Spinner /></div>

  // React 19 / ESM Interop fix: ensure we have a valid component
  const LottieComponent = Lottie?.default || Lottie

  if (typeof LottieComponent !== 'function' && typeof LottieComponent !== 'object') {
    console.warn('Lottie component not loaded correctly')
    return null
  }

  // Basic validation that it looks like Lottie data (has layers)
  if (!animationData.layers) {
    console.warn('Invalid Lottie data received')
    return null
  }

  return (
    <div className={className}>
      <LottieComponent animationData={animationData} loop={true} />
    </div>
  )
}

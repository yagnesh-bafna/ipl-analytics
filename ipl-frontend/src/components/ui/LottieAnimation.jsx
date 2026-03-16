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

  // Defensive check for Lottie component and data
  if (typeof Lottie !== 'function' && typeof Lottie !== 'object') {
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
      <Lottie animationData={animationData} loop={true} />
    </div>
  )
}

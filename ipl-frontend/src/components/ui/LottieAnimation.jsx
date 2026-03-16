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

  return (
    <div className={className}>
      <Lottie animationData={animationData} loop={true} />
    </div>
  )
}

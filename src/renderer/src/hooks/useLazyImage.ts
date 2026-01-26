import { useState, useEffect, useRef } from 'react'

interface UseLazyImageOptions {
  threshold?: number
  rootMargin?: string
}

export function useLazyImage(
  imagePath: string | null,
  options: UseLazyImageOptions = {}
): { ref: React.RefObject<HTMLDivElement>; src: string | null; isLoading: boolean } {
  const { threshold = 0.1, rootMargin = '50px' } = options
  const [src, setSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 监听元素是否进入可视区域
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.unobserve(element)
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin])

  // 当元素进入可视区域时加载图片
  useEffect(() => {
    if (!isInView || !imagePath) {
      setSrc(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    window.api
      .readImageAsBase64(imagePath)
      .then((base64) => {
        if (!cancelled) {
          setSrc(base64)
        }
      })
      .catch((error) => {
        console.error('Error loading image:', error)
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isInView, imagePath])

  return { ref, src, isLoading }
}

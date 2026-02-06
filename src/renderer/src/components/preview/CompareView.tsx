import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { ImageIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { PromptPanel } from './PromptPanel'

export function CompareView() {
  const { selectedImage } = useAppStore()
  const [originalSrc, setOriginalSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 缩放和平移状态
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // 加载选中的图片
  useEffect(() => {
    if (!selectedImage) {
      setOriginalSrc(null)
      return
    }

    setIsLoading(true)
    setScale(1)
    setPosition({ x: 0, y: 0 })

    window.api
      .readImageAsBase64(selectedImage.path)
      .then((base64) => {
        setOriginalSrc(base64)
      })
      .catch((error) => {
        console.error('Error loading image:', error)
        setOriginalSrc(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [selectedImage])

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((prev) => Math.min(Math.max(prev * delta, 0.1), 10))
  }, [])

  // 开始拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }, [position])

  // 拖拽中
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      })
    },
    [isDragging]
  )

  // 结束拖拽
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 重置视图
  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // 缩放控制
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.25, 10))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev * 0.8, 0.1))
  }, [])

  if (!selectedImage) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">选择一张图片查看详细对比</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-content-bg border-b border-border">
        <span className="text-sm text-text-primary truncate max-w-[300px]" title={selectedImage.name}>
          {selectedImage.name}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-hover rounded transition-colors"
            title="缩小"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-text-secondary w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-hover rounded transition-colors"
            title="放大"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-hover rounded transition-colors"
            title="重置"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* 对比区域 - 40% */}
      <div className="flex-[2] flex overflow-hidden">
        {/* 原始图 */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative bg-black/20 border-r border-border"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="absolute top-2 left-2 text-xs text-text-secondary bg-black/50 px-2 py-1 rounded">
            原始图
          </div>
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center'
            }}
          >
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
            ) : originalSrc ? (
              <img
                src={originalSrc}
                alt={selectedImage.name}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            ) : (
              <ImageIcon size={48} className="text-text-secondary opacity-30" />
            )}
          </div>
        </div>

        {/* 生成图（占位） */}
        <div className="flex-1 overflow-hidden relative bg-black/20">
          <div className="absolute top-2 left-2 text-xs text-text-secondary bg-black/50 px-2 py-1 rounded">
            生成图
          </div>
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-text-secondary">
              <ImageIcon size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs opacity-50">暂无生成图</p>
            </div>
          </div>
        </div>
      </div>

      {/* 提示词面板 - 60% */}
      <div className="flex-[3] overflow-hidden min-h-0">
        <PromptPanel image={selectedImage} />
      </div>
    </div>
  )
}

import { useLazyImage } from '@/hooks/useLazyImage'
import { ImageIcon, Tag, Check } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import type { ImageFile } from '@/types'

interface FileItemProps {
  image: ImageFile
  isSelected: boolean
  onClick: () => void
  onContextMenu?: (e: React.MouseEvent, image: ImageFile) => void
}

export function FileItem({ image, isSelected, onClick, onContextMenu }: FileItemProps) {
  const { ref, src, isLoading } = useLazyImage(image.path)
  const { projectConfig } = useAppStore()

  const metadata = projectConfig?.imageMetadata[image.path]
  const tagType = metadata?.tagType
  const isCompleted = metadata?.isCompleted || false

  return (
    <div
      ref={ref}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu?.(e, image)}
      className={`cursor-pointer rounded-lg overflow-hidden transition-all relative ${
        isSelected
          ? 'ring-2 ring-accent bg-accent/20'
          : 'hover:bg-hover border border-border'
      }`}
    >
      {/* 标签和状态标识 */}
      <div className="absolute top-1 left-1 flex gap-1 z-10">
        {tagType && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-accent/80 text-white text-[10px] rounded backdrop-blur-sm">
            <Tag size={8} />
            {tagType}
          </div>
        )}
        {isCompleted && (
          <div className="flex items-center px-1 py-0.5 bg-green-500/80 text-white rounded backdrop-blur-sm">
            <Check size={10} />
          </div>
        )}
      </div>

      {/* 小图对比区域 */}
      <div className="flex gap-1 p-2">
        {/* 原始图 */}
        <div className="flex-1 aspect-square bg-black/30 rounded overflow-hidden flex items-center justify-center">
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
          ) : src ? (
            <img
              src={src}
              alt={image.name}
              className="w-full h-full object-contain"
              draggable={false}
            />
          ) : (
            <ImageIcon size={24} className="text-text-secondary opacity-50" />
          )}
        </div>

        {/* 生成图（占位） */}
        <div className="flex-1 aspect-square bg-black/30 rounded overflow-hidden flex items-center justify-center">
          <div className="text-text-secondary opacity-30">
            <ImageIcon size={24} />
          </div>
        </div>
      </div>

      {/* 文件名 */}
      <div className="px-2 pb-2">
        <p className="text-xs text-text-primary truncate text-center" title={image.name}>
          {image.name}
        </p>
      </div>
    </div>
  )
}

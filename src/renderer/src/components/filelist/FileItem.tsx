import { useLazyImage } from '@/hooks/useLazyImage'
import { ImageIcon } from 'lucide-react'
import type { ImageFile } from '@/types'

interface FileItemProps {
  image: ImageFile
  isSelected: boolean
  onClick: () => void
}

export function FileItem({ image, isSelected, onClick }: FileItemProps) {
  const { ref, src, isLoading } = useLazyImage(image.path)

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`cursor-pointer rounded-lg overflow-hidden transition-all ${
        isSelected
          ? 'ring-2 ring-accent bg-accent/20'
          : 'hover:bg-hover border border-border'
      }`}
    >
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

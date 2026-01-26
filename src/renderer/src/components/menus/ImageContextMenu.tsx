import { Tag, Edit3, Copy, FolderOpen, Check, X } from 'lucide-react'
import type { MenuItem } from '@/components/common/ContextMenu'
import type { ImageFile } from '@/types'
import { useAppStore } from '@/stores/useAppStore'

interface ImageContextMenuProps {
  image: ImageFile | null
  onClose: () => void
}

export function useImageContextMenu({ image, onClose }: ImageContextMenuProps): MenuItem[] {
  const { projectConfig, rootPath, updateImageMetadata } = useAppStore()

  const customTagTypes = projectConfig?.globalSettings.customTagTypes || ['UI类', 'Icon类', '普通类']

  // 如果 image 为 null，返回空数组
  if (!image) {
    return []
  }

  const currentMetadata = projectConfig?.imageMetadata[image.path]
  const isCompleted = currentMetadata?.isCompleted || false

  const handleSetTag = async (tagType: string) => {
    if (!rootPath || !image) return

    try {
      await window.api.updateImageMetadata(rootPath, image.path, { tagType })
      updateImageMetadata(image.path, { tagType })
      onClose()
    } catch (error) {
      console.error('Failed to set tag:', error)
    }
  }

  const handleToggleComplete = async () => {
    if (!rootPath || !image) return

    try {
      await window.api.updateImageMetadata(rootPath, image.path, { isCompleted: !isCompleted })
      updateImageMetadata(image.path, { isCompleted: !isCompleted })
      onClose()
    } catch (error) {
      console.error('Failed to toggle complete:', error)
    }
  }

  const handleCopyPath = () => {
    if (!image) return
    navigator.clipboard.writeText(image.path)
    onClose()
  }

  const handleShowInExplorer = async () => {
    if (!image) return
    await window.api.openInExplorer(image.path)
    onClose()
  }

  return [
    {
      id: 'set-tag',
      label: '设置类型标签',
      icon: <Tag size={16} />,
      submenu: customTagTypes.map((tag) => ({
        id: `tag-${tag}`,
        label: tag,
        onClick: () => handleSetTag(tag)
      }))
    },
    {
      id: 'divider-1',
      label: '',
      divider: true
    },
    {
      id: 'copy-path',
      label: '复制图片路径',
      icon: <Copy size={16} />,
      onClick: handleCopyPath
    },
    {
      id: 'show-in-explorer',
      label: '在文件管理器中显示',
      icon: <FolderOpen size={16} />,
      onClick: handleShowInExplorer
    },
    {
      id: 'divider-2',
      label: '',
      divider: true
    },
    {
      id: 'toggle-complete',
      label: isCompleted ? '取消完成' : '标记为已完成',
      icon: isCompleted ? <X size={16} /> : <Check size={16} />,
      onClick: handleToggleComplete
    }
  ]
}

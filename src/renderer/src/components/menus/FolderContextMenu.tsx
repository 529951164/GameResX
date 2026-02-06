import { Tag, Copy, FolderOpen, RefreshCw, Shield } from 'lucide-react'
import type { MenuItem } from '@/components/common/ContextMenu'
import type { TreeNode } from '@/types'
import { useAppStore } from '@/stores/useAppStore'

interface FolderContextMenuProps {
  folder: TreeNode | null
  onClose: () => void
  onRefresh?: () => void
}

export function useFolderContextMenu({
  folder,
  onClose,
  onRefresh
}: FolderContextMenuProps): MenuItem[] {
  const { projectConfig, rootPath } = useAppStore()

  const customTagTypes = projectConfig?.globalSettings.customTagTypes || ['UI类', 'Icon类', '普通类']

  // 如果 folder 为 null，返回空数组
  if (!folder) {
    return []
  }

  const handleBatchSetTag = async (tagType: string) => {
    if (!rootPath || !folder) return

    try {
      const count = await window.api.batchUpdateFolderImages(rootPath, folder.path, tagType)
      console.log(`Updated ${count} images with tag: ${tagType}`)
      onRefresh?.()
      onClose()
    } catch (error) {
      console.error('Failed to batch set tag:', error)
    }
  }

  const handleCopyPath = () => {
    if (!folder) return
    navigator.clipboard.writeText(folder.path)
    onClose()
  }

  const handleOpenInExplorer = async () => {
    if (!folder) return
    await window.api.openInExplorer(folder.path)
    onClose()
  }

  const handleRefresh = () => {
    onRefresh?.()
    onClose()
  }

  const handleBackupFolder = async () => {
    if (!folder) return

    if (!confirm(`确定要备份文件夹 "${folder.name}" 下的所有图片吗？`)) {
      return
    }

    try {
      const result = await window.api.backupFolderImages(folder.path)

      alert(
        `备份完成！\n\n` +
          `总计: ${result.total} 张\n` +
          `成功: ${result.success} 张\n` +
          `跳过: ${result.skipped} 张 (已有备份)\n` +
          `失败: ${result.failed} 张`
      )

      onRefresh?.()
    } catch (error: any) {
      alert(`备份失败：${error.message}`)
    } finally {
      onClose()
    }
  }

  return [
    {
      id: 'batch-set-tag',
      label: '批量设置类型标签',
      icon: <Tag size={16} />,
      disabled: !folder.hasImages,
      submenu: customTagTypes.map((tag) => ({
        id: `tag-${tag}`,
        label: tag,
        onClick: () => handleBatchSetTag(tag)
      }))
    },
    {
      id: 'divider-1',
      label: '',
      divider: true
    },
    {
      id: 'backup-folder',
      label: '备份文件夹图片',
      icon: <Shield size={16} />,
      disabled: !folder.hasImages,
      onClick: handleBackupFolder
    },
    {
      id: 'divider-2',
      label: '',
      divider: true
    },
    {
      id: 'copy-path',
      label: '复制文件夹路径',
      icon: <Copy size={16} />,
      onClick: handleCopyPath
    },
    {
      id: 'open-in-explorer',
      label: '在文件管理器中打开',
      icon: <FolderOpen size={16} />,
      onClick: handleOpenInExplorer
    },
    {
      id: 'divider-3',
      label: '',
      divider: true
    },
    {
      id: 'refresh',
      label: '刷新文件夹',
      icon: <RefreshCw size={16} />,
      onClick: handleRefresh
    }
  ]
}

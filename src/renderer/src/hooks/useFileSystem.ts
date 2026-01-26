import { useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useProjectConfig } from './useProjectConfig'

export function useFileSystem() {
  const {
    setRootPath,
    setDirectoryTree,
    setSelectedFolderPath,
    setImageList,
    setSelectedImage,
    setIsLoading,
    reset
  } = useAppStore()

  const { loadConfig } = useProjectConfig()

  // 选择根目录
  const selectRootDirectory = useCallback(async () => {
    try {
      console.log('[Frontend] selectRootDirectory called')
      const selectedPath = await window.api.selectDirectory()
      console.log('[Frontend] selected path:', selectedPath)
      if (!selectedPath) return

      setIsLoading(true)
      console.log('[Frontend] resetting state...')
      reset()
      console.log('[Frontend] setting root path:', selectedPath)
      setRootPath(selectedPath)

      // 扫描目录结构
      console.log('[Frontend] scanning directory...')
      const tree = await window.api.scanDirectory(selectedPath)
      console.log('[Frontend] directory scanned, tree nodes:', tree.length)
      setDirectoryTree(tree)
      console.log('[Frontend] directory tree set in store')

      // 加载项目配置（放在目录扫描之后，避免阻塞）
      console.log('[Frontend] loading project config...')
      loadConfig(selectedPath)
        .then(() => {
          console.log('[Frontend] project config loaded')
        })
        .catch((error) => {
          console.error('[Frontend] Failed to load project config:', error)
        })
    } catch (error) {
      console.error('[Frontend] Error selecting directory:', error)
    } finally {
      console.log('[Frontend] setting isLoading to false')
      setIsLoading(false)
    }
  }, [setRootPath, setDirectoryTree, setIsLoading, reset, loadConfig])

  // 选择文件夹，加载图片列表
  const selectFolder = useCallback(
    async (folderPath: string) => {
      try {
        setSelectedFolderPath(folderPath)
        setSelectedImage(null)

        // 获取图片列表
        const images = await window.api.getImagesInFolder(folderPath)
        setImageList(images)
      } catch (error) {
        console.error('Error loading folder:', error)
      }
    },
    [setSelectedFolderPath, setImageList, setSelectedImage]
  )

  return {
    selectRootDirectory,
    selectFolder
  }
}

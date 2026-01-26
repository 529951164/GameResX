import { useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'

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

  // 选择根目录
  const selectRootDirectory = useCallback(async () => {
    try {
      const selectedPath = await window.api.selectDirectory()
      if (!selectedPath) return

      setIsLoading(true)
      reset()
      setRootPath(selectedPath)

      // 扫描目录结构
      const tree = await window.api.scanDirectory(selectedPath)
      setDirectoryTree(tree)
    } catch (error) {
      console.error('Error selecting directory:', error)
    } finally {
      setIsLoading(false)
    }
  }, [setRootPath, setDirectoryTree, setIsLoading, reset])

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

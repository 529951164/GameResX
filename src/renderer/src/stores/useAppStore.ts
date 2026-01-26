import { create } from 'zustand'
import type { TreeNode, ImageFile } from '@/types'

interface AppState {
  // 根目录路径
  rootPath: string | null
  // 目录树
  directoryTree: TreeNode[]
  // 当前选中的文件夹路径
  selectedFolderPath: string | null
  // 当前文件夹的图片列表
  imageList: ImageFile[]
  // 当前选中的图片
  selectedImage: ImageFile | null
  // 展开的文件夹 ID 集合
  expandedFolders: Set<string>
  // 加载状态
  isLoading: boolean

  // Actions
  setRootPath: (path: string | null) => void
  setDirectoryTree: (tree: TreeNode[]) => void
  setSelectedFolderPath: (path: string | null) => void
  setImageList: (images: ImageFile[]) => void
  setSelectedImage: (image: ImageFile | null) => void
  toggleFolderExpanded: (folderId: string) => void
  setIsLoading: (loading: boolean) => void
  reset: () => void
}

const initialState = {
  rootPath: null,
  directoryTree: [],
  selectedFolderPath: null,
  imageList: [],
  selectedImage: null,
  expandedFolders: new Set<string>(),
  isLoading: false
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setRootPath: (path) => set({ rootPath: path }),

  setDirectoryTree: (tree) => set({ directoryTree: tree }),

  setSelectedFolderPath: (path) => set({ selectedFolderPath: path }),

  setImageList: (images) => set({ imageList: images }),

  setSelectedImage: (image) => set({ selectedImage: image }),

  toggleFolderExpanded: (folderId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders)
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId)
      } else {
        newExpanded.add(folderId)
      }
      return { expandedFolders: newExpanded }
    }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  reset: () => set(initialState)
}))

import { contextBridge, ipcRenderer } from 'electron'

export interface TreeNode {
  id: string
  name: string
  path: string
  children: TreeNode[]
  hasImages: boolean
  isEmpty: boolean
  imageCount: number
}

export interface ImageFile {
  id: string
  name: string
  path: string
  extension: string
}

export interface ProjectConfig {
  version: string
  projectName: string
  rootPath: string
  createdAt: string
  updatedAt: string
  globalSettings: {
    globalPrompt: string
    customTagTypes: string[]
  }
  aiSettings: {
    provider: string
    apiKey: string
    model: string
  }
  statistics: {
    totalImages: number
    completedImages: number
    emptyFolders: string[]
  }
  imageMetadata: Record<string, ImageMetadata>
  folderMetadata: Record<string, FolderMetadata>
}

export interface ImageMetadata {
  tagType: string | null
  customPrompt: string
  isCompleted: boolean
  generatedImagePath: string | null
}

export interface FolderMetadata {
  defaultTagType: string | null
}

export interface Statistics {
  totalImages: number
  completedImages: number
  emptyFolders: string[]
}

const api = {
  // 选择目录
  selectDirectory: (): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:selectDirectory')
  },

  // 扫描目录结构
  scanDirectory: (rootPath: string): Promise<TreeNode[]> => {
    return ipcRenderer.invoke('fs:scanDirectory', rootPath)
  },

  // 获取文件夹中的图片列表
  getImagesInFolder: (folderPath: string): Promise<ImageFile[]> => {
    return ipcRenderer.invoke('fs:getImagesInFolder', folderPath)
  },

  // 读取图片为 base64
  readImageAsBase64: (imagePath: string): Promise<string> => {
    return ipcRenderer.invoke('fs:readImageAsBase64', imagePath)
  },

  // 项目配置
  loadProjectConfig: (rootPath: string): Promise<ProjectConfig> => {
    return ipcRenderer.invoke('project:load', rootPath)
  },

  saveProjectConfig: (config: ProjectConfig): Promise<void> => {
    return ipcRenderer.invoke('project:save', config)
  },

  refreshStatistics: (rootPath: string): Promise<Statistics> => {
    return ipcRenderer.invoke('project:refreshStats', rootPath)
  },

  // 元数据管理
  updateImageMetadata: (
    rootPath: string,
    imagePath: string,
    metadata: Partial<ImageMetadata>
  ): Promise<void> => {
    return ipcRenderer.invoke('project:updateImageMetadata', rootPath, imagePath, metadata)
  },

  batchUpdateFolderImages: (rootPath: string, folderPath: string, tagType: string): Promise<number> => {
    return ipcRenderer.invoke('project:batchUpdateFolder', rootPath, folderPath, tagType)
  },

  updateFolderMetadata: (
    rootPath: string,
    folderPath: string,
    metadata: Partial<FolderMetadata>
  ): Promise<void> => {
    return ipcRenderer.invoke('project:updateFolderMetadata', rootPath, folderPath, metadata)
  },

  // 系统操作
  openInExplorer: (path: string): Promise<void> => {
    return ipcRenderer.invoke('system:openInExplorer', path)
  },

  // GitIgnore 管理
  checkGitignore: (projectPath: string): Promise<{ needsConfig: boolean; gitignorePath: string | null }> => {
    return ipcRenderer.invoke('gitignore:check', projectPath)
  },

  addGitignoreRules: (gitignorePath: string): Promise<void> => {
    return ipcRenderer.invoke('gitignore:add', gitignorePath)
  },

  // AI 生图
  generateImage: (projectRootPath: string, imagePath: string, customPrompt?: string, modelOverride?: string): Promise<{ success: boolean; message: string; dimensionInfo?: any }> => {
    return ipcRenderer.invoke('ai:generateImage', projectRootPath, imagePath, customPrompt, modelOverride)
  },

  testApiKey: (provider: string, apiKey: string): Promise<boolean> => {
    return ipcRenderer.invoke('ai:testApiKey', provider, apiKey)
  },

  listAvailableModels: (apiKey: string): Promise<string[]> => {
    return ipcRenderer.invoke('ai:listModels', apiKey)
  },

  // 图片备份
  restoreImage: (imagePath: string): Promise<boolean> => {
    return ipcRenderer.invoke('image:restore', imagePath)
  },

  hasBackup: (imagePath: string): Promise<boolean> => {
    return ipcRenderer.invoke('image:hasBackup', imagePath)
  },

  getImageDimensions: (imagePath: string): Promise<{ width: number; height: number; format: string; size: number }> => {
    return ipcRenderer.invoke('image:getDimensions', imagePath)
  },

  getOriginalImageDimensions: (imagePath: string): Promise<{ width: number; height: number; format: string; size: number }> => {
    return ipcRenderer.invoke('image:getOriginalDimensions', imagePath)
  },

  resizeImageToOriginal: (imagePath: string, targetWidth: number, targetHeight: number): Promise<{ success: boolean; message: string }> => {
    return ipcRenderer.invoke('image:resizeToOriginal', imagePath, targetWidth, targetHeight)
  },

  // 备份管理
  backupImage: (imagePath: string): Promise<boolean> => {
    return ipcRenderer.invoke('image:backup', imagePath)
  },

  backupAllImages: (rootPath: string): Promise<{ total: number; success: number; skipped: number; failed: number }> => {
    return ipcRenderer.invoke('backup:all', rootPath)
  },

  backupFolderImages: (folderPath: string): Promise<{ total: number; success: number; skipped: number; failed: number }> => {
    return ipcRenderer.invoke('backup:folder', folderPath)
  }
}

contextBridge.exposeInMainWorld('api', api)

// TypeScript 类型声明
declare global {
  interface Window {
    api: typeof api
  }
}

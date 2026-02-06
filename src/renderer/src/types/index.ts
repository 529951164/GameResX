export interface TreeNode {
  id: string
  name: string
  path: string
  children: TreeNode[]
  hasImages: boolean
  isExpanded?: boolean
  isEmpty: boolean
  imageCount: number
}

export interface ImageFile {
  id: string
  name: string
  path: string
  extension: string
  metadata?: ImageMetadata
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

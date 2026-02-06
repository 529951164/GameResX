import { readFile, writeFile, mkdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

const CONFIG_DIR = '.gameresx'
const CONFIG_FILE = 'Project.json'
const CONFIG_VERSION = '1.0.0'

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
    provider: string // 'google-imagen' | 'openai' | 'claude' | 'aliyun-tongyi'
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

// 创建默认配置
function createDefaultConfig(rootPath: string): ProjectConfig {
  const now = new Date().toISOString()
  return {
    version: CONFIG_VERSION,
    projectName: rootPath.split('/').pop() || 'Untitled Project',
    rootPath,
    createdAt: now,
    updatedAt: now,
    globalSettings: {
      globalPrompt: '',
      customTagTypes: ['UI类', 'Icon类', '普通类']
    },
    aiSettings: {
      provider: 'google-imagen',
      apiKey: 'AIzaSyCXMn1JrOgE3UdHIXhpcj2LPO3kMGeD8KA',
      model: 'gemini-2.5-flash-image'
    },
    statistics: {
      totalImages: 0,
      completedImages: 0,
      emptyFolders: []
    },
    imageMetadata: {},
    folderMetadata: {}
  }
}

// 获取配置文件路径
function getConfigPath(rootPath: string): string {
  return join(rootPath, CONFIG_DIR, CONFIG_FILE)
}

// 获取配置目录路径
function getConfigDir(rootPath: string): string {
  return join(rootPath, CONFIG_DIR)
}

// 加载或创建项目配置
export async function loadProjectConfig(rootPath: string): Promise<ProjectConfig> {
  const configPath = getConfigPath(rootPath)
  const configDir = getConfigDir(rootPath)

  try {
    // 检查配置文件是否存在
    if (existsSync(configPath)) {
      // 读取现有配置
      const content = await readFile(configPath, 'utf-8')
      const config = JSON.parse(content) as ProjectConfig

      // 验证版本并升级配置
      if (config.version !== CONFIG_VERSION || !config.aiSettings) {
        console.log('Config version mismatch or missing fields, upgrading...')
        // 简单升级：保留用户数据，更新结构
        const defaultConfig = createDefaultConfig(rootPath)
        const upgraded = {
          ...defaultConfig,
          ...config,
          version: CONFIG_VERSION,
          updatedAt: new Date().toISOString(),
          // 确保 aiSettings 存在
          aiSettings: config.aiSettings || defaultConfig.aiSettings
        }
        await saveProjectConfig(upgraded)
        return upgraded
      }

      // 更新 rootPath（可能移动了项目）
      if (config.rootPath !== rootPath) {
        config.rootPath = rootPath
        config.updatedAt = new Date().toISOString()
        await saveProjectConfig(config)
      }

      return config
    } else {
      // 创建新配置
      console.log('Creating new project config...')

      // 确保配置目录存在
      if (!existsSync(configDir)) {
        await mkdir(configDir, { recursive: true })
      }

      const newConfig = createDefaultConfig(rootPath)

      // 立即保存配置并返回，不等待统计信息扫描
      await saveProjectConfig(newConfig)
      console.log('Project config created, returning immediately')

      // 在后台异步扫描统计信息（真正的后台，不阻塞返回）
      // 使用 setImmediate 确保在下一个事件循环中执行
      setImmediate(() => {
        console.log('Starting background statistics scan...')
        scanProjectStatistics(rootPath)
          .then(async (stats) => {
            try {
              // 直接读取并更新配置文件，避免递归调用 loadProjectConfig
              const content = await readFile(configPath, 'utf-8')
              const currentConfig = JSON.parse(content) as ProjectConfig
              currentConfig.statistics = stats
              await saveProjectConfig(currentConfig)
              console.log('Background statistics scan completed:', stats)
            } catch (error) {
              console.error('Error updating statistics:', error)
            }
          })
          .catch((error) => {
            console.error('Error in background statistics scan:', error)
          })
      })

      return newConfig
    }
  } catch (error) {
    console.error('Error loading project config:', error)
    
    // 如果读取失败，创建备份并返回默认配置
    if (existsSync(configPath)) {
      const backupPath = configPath + '.backup.' + Date.now()
      try {
        const content = await readFile(configPath, 'utf-8')
        await writeFile(backupPath, content, 'utf-8')
        console.log('Backup created at:', backupPath)
      } catch (backupError) {
        console.error('Failed to create backup:', backupError)
      }
    }

    const defaultConfig = createDefaultConfig(rootPath)
    await saveProjectConfig(defaultConfig)
    return defaultConfig
  }
}

// 保存项目配置
export async function saveProjectConfig(config: ProjectConfig): Promise<void> {
  const configPath = getConfigPath(config.rootPath)
  const configDir = getConfigDir(config.rootPath)

  try {
    // 确保目录存在
    if (!existsSync(configDir)) {
      await mkdir(configDir, { recursive: true })
    }

    // 更新时间戳
    config.updatedAt = new Date().toISOString()

    // 写入文件（格式化 JSON）
    const content = JSON.stringify(config, null, 2)
    await writeFile(configPath, content, 'utf-8')
    
    console.log('Project config saved successfully')
  } catch (error) {
    console.error('Error saving project config:', error)
    throw error
  }
}

// 扫描项目统计信息（不包含完成数量，避免循环依赖）
export async function scanProjectStatistics(rootPath: string): Promise<{
  totalImages: number
  completedImages: number
  emptyFolders: string[]
}> {
  const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']
  let totalImages = 0
  const emptyFolders: string[] = []

  // 递归扫描目录
  async function scanDir(dirPath: string): Promise<boolean> {
    try {
      const { readdir } = await import('fs/promises')
      const entries = await readdir(dirPath, { withFileTypes: true })
      
      let hasImages = false
      let hasSubFolders = false

      for (const entry of entries) {
        // 跳过隐藏文件和配置目录
        if (entry.name.startsWith('.')) continue

        const fullPath = join(dirPath, entry.name)

        if (entry.isDirectory()) {
          hasSubFolders = true
          const subHasImages = await scanDir(fullPath)
          if (subHasImages) {
            hasImages = true
          }
        } else if (entry.isFile()) {
          const ext = entry.name.substring(entry.name.lastIndexOf('.')).toLowerCase()
          if (IMAGE_EXTENSIONS.includes(ext)) {
            totalImages++
            hasImages = true
          }
        }
      }

      // 如果是文件夹但没有图片（包括子文件夹）
      if (hasSubFolders && !hasImages && dirPath !== rootPath) {
        emptyFolders.push(dirPath)
      }

      return hasImages
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error)
      return false
    }
  }

  await scanDir(rootPath)

  // 初始化时 completedImages 为 0，由 refreshStatistics 更新
  return {
    totalImages,
    completedImages: 0,
    emptyFolders
  }
}

// 刷新统计信息（包含完成数量）
export async function refreshStatistics(rootPath: string): Promise<{
  totalImages: number
  completedImages: number
  emptyFolders: string[]
}> {
  // 先扫描文件系统
  const stats = await scanProjectStatistics(rootPath)
  
  // 读取配置文件获取完成数量
  const configPath = getConfigPath(rootPath)
  if (existsSync(configPath)) {
    try {
      const content = await readFile(configPath, 'utf-8')
      const config = JSON.parse(content) as ProjectConfig
      stats.completedImages = Object.values(config.imageMetadata).filter(
        (meta) => meta.isCompleted
      ).length
    } catch (error) {
      console.error('Error reading config for statistics:', error)
    }
  }
  
  return stats
}

// 更新单张图片元数据
export async function updateImageMetadata(
  rootPath: string,
  imagePath: string,
  metadata: Partial<ImageMetadata>
): Promise<void> {
  try {
    const config = await loadProjectConfig(rootPath)

    // 获取或创建图片元数据
    const currentMeta = config.imageMetadata[imagePath] || {
      tagType: null,
      customPrompt: '',
      isCompleted: false,
      generatedImagePath: null
    }

    // 合并更新
    config.imageMetadata[imagePath] = {
      ...currentMeta,
      ...metadata
    }

    // 更新已完成统计
    config.statistics.completedImages = Object.values(config.imageMetadata).filter(
      (meta) => meta.isCompleted
    ).length

    await saveProjectConfig(config)
  } catch (error) {
    console.error('Error updating image metadata:', error)
    throw error
  }
}

// 批量更新文件夹下的图片
export async function batchUpdateFolderImages(
  rootPath: string,
  folderPath: string,
  tagType: string
): Promise<number> {
  try {
    const { readdir } = await import('fs/promises')
    const config = await loadProjectConfig(rootPath)
    const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

    // 获取文件夹中的所有图片
    const entries = await readdir(folderPath, { withFileTypes: true })
    let updatedCount = 0

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = entry.name.substring(entry.name.lastIndexOf('.')).toLowerCase()
        if (IMAGE_EXTENSIONS.includes(ext)) {
          const imagePath = join(folderPath, entry.name)
          
          // 获取或创建元数据
          const currentMeta = config.imageMetadata[imagePath] || {
            tagType: null,
            customPrompt: '',
            isCompleted: false,
            generatedImagePath: null
          }

          // 更新标签
          config.imageMetadata[imagePath] = {
            ...currentMeta,
            tagType
          }
          
          updatedCount++
        }
      }
    }

    // 保存文件夹默认标签
    config.folderMetadata[folderPath] = {
      defaultTagType: tagType
    }

    await saveProjectConfig(config)
    return updatedCount
  } catch (error) {
    console.error('Error batch updating folder:', error)
    throw error
  }
}

// 更新文件夹元数据
export async function updateFolderMetadata(
  rootPath: string,
  folderPath: string,
  metadata: Partial<FolderMetadata>
): Promise<void> {
  try {
    const config = await loadProjectConfig(rootPath)

    const currentMeta = config.folderMetadata[folderPath] || {
      defaultTagType: null
    }

    config.folderMetadata[folderPath] = {
      ...currentMeta,
      ...metadata
    }

    await saveProjectConfig(config)
  } catch (error) {
    console.error('Error updating folder metadata:', error)
    throw error
  }
}

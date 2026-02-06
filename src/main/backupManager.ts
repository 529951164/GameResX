/**
 * 备份管理模块
 * 处理批量备份和扫描逻辑
 */

import { readdir } from 'fs/promises'
import { join } from 'path'
import { backupImages } from './imageReplace'

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

/**
 * 扫描文件夹获取所有图片路径
 */
async function scanImagesRecursive(dirPath: string): Promise<string[]> {
  const images: string[] = []

  try {
    const entries = await readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      // 跳过隐藏文件和配置目录
      if (entry.name.startsWith('.')) continue

      const fullPath = join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // 递归扫描子目录
        const subImages = await scanImagesRecursive(fullPath)
        images.push(...subImages)
      } else if (entry.isFile()) {
        const ext = entry.name.substring(entry.name.lastIndexOf('.')).toLowerCase()
        if (IMAGE_EXTENSIONS.includes(ext)) {
          images.push(fullPath)
        }
      }
    }
  } catch (error) {
    console.error(`[BackupManager] 扫描目录失败 ${dirPath}:`, error)
  }

  return images
}

/**
 * 备份整个项目的所有图片
 */
export async function backupAllImages(
  rootPath: string,
  onProgress?: (current: number, total: number, imagePath: string) => void
): Promise<{
  total: number
  success: number
  skipped: number
  failed: number
}> {
  console.log('[BackupManager] 开始扫描所有图片...')

  // 1. 扫描所有图片
  const allImages = await scanImagesRecursive(rootPath)

  console.log(`[BackupManager] 扫描完成，共找到 ${allImages.length} 张图片`)

  // 2. 批量备份
  const result = await backupImages(allImages)

  return result
}

/**
 * 备份指定文件夹下的所有图片
 */
export async function backupFolderImages(
  folderPath: string
): Promise<{
  total: number
  success: number
  skipped: number
  failed: number
}> {
  console.log('[BackupManager] 开始备份文件夹:', folderPath)

  // 扫描文件夹中的所有图片（递归）
  const images = await scanImagesRecursive(folderPath)

  console.log(`[BackupManager] 找到 ${images.length} 张图片`)

  // 批量备份
  const result = await backupImages(images)

  return result
}

/**
 * 备份单张图片
 */
export { backupImage } from './imageReplace'

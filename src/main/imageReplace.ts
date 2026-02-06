/**
 * 图片替换和备份管理模块
 * 使用 .back 文件方式保存原图
 */

import { rename, copyFile, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'

const BACKUP_SUFFIX = '.back'

/**
 * 检查图片是否已被替换（是否存在备份文件）
 */
export function hasBackup(imagePath: string): boolean {
  return existsSync(imagePath + BACKUP_SUFFIX)
}

/**
 * 替换图片（自动备份原图）
 * @param imagePath 原图路径
 * @param newImagePath 新图路径
 * @returns 是否成功
 */
export async function replaceImage(imagePath: string, newImagePath: string): Promise<boolean> {
  try {
    const backupPath = imagePath + BACKUP_SUFFIX

    // 如果是首次替换，备份原图
    if (!existsSync(backupPath)) {
      console.log('[ImageReplace] 首次替换，备份原图:', imagePath)
      await rename(imagePath, backupPath)
    } else {
      console.log('[ImageReplace] 已有备份，直接覆盖:', imagePath)
      // 删除当前的图片（之前的生成图）
      await unlink(imagePath)
    }

    // 复制新图到原图位置
    await copyFile(newImagePath, imagePath)

    console.log('[ImageReplace] 替换成功:', imagePath)
    return true
  } catch (error) {
    console.error('[ImageReplace] 替换失败:', error)
    return false
  }
}

/**
 * 恢复原图（从备份恢复）
 * @param imagePath 图片路径
 * @returns 是否成功
 */
export async function restoreImage(imagePath: string): Promise<boolean> {
  try {
    const backupPath = imagePath + BACKUP_SUFFIX

    if (!existsSync(backupPath)) {
      console.log('[ImageReplace] 没有备份文件，无法恢复:', imagePath)
      return false
    }

    // 删除当前图片
    if (existsSync(imagePath)) {
      await unlink(imagePath)
    }

    // 从备份恢复
    await rename(backupPath, imagePath)

    console.log('[ImageReplace] 恢复成功:', imagePath)
    return true
  } catch (error) {
    console.error('[ImageReplace] 恢复失败:', error)
    return false
  }
}

/**
 * 获取原图路径（如果已替换，返回备份文件路径；否则返回原路径）
 * @param imagePath 图片路径
 * @returns 原图的实际路径
 */
export function getOriginalImagePath(imagePath: string): string {
  const backupPath = imagePath + BACKUP_SUFFIX
  return existsSync(backupPath) ? backupPath : imagePath
}

/**
 * 获取图片信息（尺寸、大小等）
 */
export async function getImageInfo(imagePath: string): Promise<{
  size: number
  exists: boolean
}> {
  try {
    const stats = await stat(imagePath)
    return {
      size: stats.size,
      exists: true
    }
  } catch (error) {
    return {
      size: 0,
      exists: false
    }
  }
}

/**
 * 批量恢复文件夹下的所有图片
 */
export async function restoreFolder(folderPath: string, imageFiles: string[]): Promise<number> {
  let restoredCount = 0

  for (const imagePath of imageFiles) {
    const success = await restoreImage(imagePath)
    if (success) {
      restoredCount++
    }
  }

  console.log(`[ImageReplace] 文件夹恢复完成: ${restoredCount}/${imageFiles.length}`)
  return restoredCount
}

/**
 * 备份单张图片（创建 .back 文件）
 * @param imagePath 图片路径
 * @returns 是否成功
 */
export async function backupImage(imagePath: string): Promise<boolean> {
  try {
    const backupPath = imagePath + BACKUP_SUFFIX

    // 如果已有备份，跳过
    if (existsSync(backupPath)) {
      console.log('[ImageBackup] 备份已存在，跳过:', imagePath)
      return true
    }

    // 复制原图为备份
    await copyFile(imagePath, backupPath)

    console.log('[ImageBackup] 备份成功:', imagePath)
    return true
  } catch (error) {
    console.error('[ImageBackup] 备份失败:', error)
    return false
  }
}

/**
 * 批量备份图片列表
 */
export async function backupImages(imagePaths: string[]): Promise<{
  total: number
  success: number
  skipped: number
  failed: number
}> {
  const total = imagePaths.length
  let success = 0
  let skipped = 0
  let failed = 0

  for (const imagePath of imagePaths) {
    const backupPath = imagePath + BACKUP_SUFFIX

    if (existsSync(backupPath)) {
      skipped++
      continue
    }

    const result = await backupImage(imagePath)
    if (result) {
      success++
    } else {
      failed++
    }
  }

  console.log(`[ImageBackup] 批量备份完成: 成功=${success}, 跳过=${skipped}, 失败=${failed}, 总数=${total}`)

  return { total, success, skipped, failed }
}

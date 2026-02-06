/**
 * 图片生成业务逻辑
 * 整合 AI 模型调用和图片替换
 */

import { join } from 'path'
import { replaceImage, hasBackup, getOriginalImagePath } from './imageReplace'
import { loadProjectConfig, updateImageMetadata } from './projectConfig'
import { getImageDimensions, resizeImage, compareImageDimensions } from './imageProcessor'
import * as googleImagen from './aiModels/googleImagen'
import * as geminiFlash from './aiModels/geminiFlash'

/**
 * 为单张图片生成新图并替换
 */
export async function generateAndReplace(
  projectRootPath: string,
  imagePath: string,
  customPrompt?: string,
  modelOverride?: string
): Promise<{
  success: boolean
  message: string
  dimensionInfo?: {
    original: { width: number; height: number }
    generated: { width: number; height: number }
    needsResize: boolean
  }
}> {
  try {
    console.log('[ImageGenerate] 开始生图并替换:', imagePath)

    // 1. 加载项目配置
    const config = await loadProjectConfig(projectRootPath)
    const metadata = config.imageMetadata[imagePath]

    // 2. 构建完整提示词
    let fullPrompt = config.globalSettings.globalPrompt || ''

    // 添加自定义提示词
    if (customPrompt) {
      fullPrompt += (fullPrompt ? '，' : '') + customPrompt
    } else if (metadata?.customPrompt) {
      fullPrompt += (fullPrompt ? '，' : '') + metadata.customPrompt
    }

    if (!fullPrompt) {
      return {
        success: false,
        message: '请先设置提示词'
      }
    }

    // 3. 生成临时输出路径
    const tempOutputPath = imagePath + '.temp'

    // 4. 确定使用的模型（优先使用传入的模型，否则使用配置中的模型）
    const useModel = modelOverride || config.aiSettings.model

    // 5. 根据模型选择对应的 API
    let result: { success: boolean; message: string; outputPath?: string }

    if (useModel === 'gemini-2.5-flash-image' || useModel.includes('gemini')) {
      // 使用 Gemini Flash Image 模型
      result = await geminiFlash.generateImage({
        apiKey: config.aiSettings.apiKey,
        model: useModel,
        imagePath, // 图生图模式
        prompt: fullPrompt,
        outputPath: tempOutputPath
      })
    } else if (useModel === 'imagen-4' || useModel.includes('imagen')) {
      // 使用 Imagen 模型
      result = await googleImagen.generateImage({
        apiKey: config.aiSettings.apiKey,
        model: useModel,
        imagePath,
        prompt: fullPrompt,
        outputPath: tempOutputPath
      })
    } else {
      return { success: false, message: `不支持的模型: ${useModel}` }
    }

    // 5. 如果生成成功，检查尺寸并替换图片
    if (result.success && result.outputPath) {
      // 获取原图路径（可能是 .back 文件）
      const originalPath = getOriginalImagePath(imagePath)

      // 比较尺寸
      const comparison = await compareImageDimensions(originalPath, result.outputPath)

      let finalOutputPath = result.outputPath
      let needsResize = false

      // 如果尺寸不一致，自动缩放
      if (!comparison.isSame) {
        needsResize = true
        console.log('[ImageGenerate] 尺寸不一致，需要缩放')
        console.log(`[ImageGenerate] 原图: ${comparison.original.width}x${comparison.original.height}`)
        console.log(
          `[ImageGenerate] 生成图: ${comparison.generated.width}x${comparison.generated.height}`
        )

        // 创建缩放后的临时文件
        const resizedPath = result.outputPath + '.resized'
        await resizeImage(
          result.outputPath,
          resizedPath,
          comparison.original.width,
          comparison.original.height
        )

        finalOutputPath = resizedPath
      }

      // 替换图片
      const replaceSuccess = await replaceImage(imagePath, finalOutputPath)

      if (replaceSuccess) {
        // 更新元数据
        await updateImageMetadata(projectRootPath, imagePath, {
          isCompleted: true,
          generatedImagePath: imagePath
        })

        return {
          success: true,
          message: needsResize
            ? `图片生成成功并已自动缩放到原图尺寸 (${comparison.original.width}x${comparison.original.height})`
            : '图片生成并替换成功',
          dimensionInfo: {
            original: {
              width: comparison.original.width,
              height: comparison.original.height
            },
            generated: {
              width: comparison.generated.width,
              height: comparison.generated.height
            },
            needsResize
          }
        }
      } else {
        return {
          success: false,
          message: '图片生成成功但替换失败'
        }
      }
    } else {
      return result
    }
  } catch (error: any) {
    console.error('[ImageGenerate] 生图失败:', error)
    return {
      success: false,
      message: error.message || '未知错误'
    }
  }
}

/**
 * 批量生成文件夹下的所有图片
 */
export async function generateFolderImages(
  projectRootPath: string,
  imagePaths: string[],
  onProgress?: (current: number, total: number, imagePath: string) => void
): Promise<{ success: number; failed: number; messages: string[] }> {
  const total = imagePaths.length
  let success = 0
  let failed = 0
  const messages: string[] = []

  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i]

    if (onProgress) {
      onProgress(i + 1, total, imagePath)
    }

    const result = await generateAndReplace(projectRootPath, imagePath)

    if (result.success) {
      success++
      messages.push(`✓ ${imagePath}: 成功`)
    } else {
      failed++
      messages.push(`✗ ${imagePath}: ${result.message}`)
    }
  }

  return { success, failed, messages }
}

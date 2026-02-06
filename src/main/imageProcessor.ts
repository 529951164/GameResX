/**
 * 图片处理模块
 * 使用 sharp 库处理图片尺寸、缩放等操作
 */

import sharp from 'sharp'

export interface ImageDimensions {
  width: number
  height: number
  format: string
  size: number // 文件大小（字节）
}

/**
 * 获取图片尺寸信息
 */
export async function getImageDimensions(imagePath: string): Promise<ImageDimensions> {
  try {
    const image = sharp(imagePath)
    const metadata = await image.metadata()
    const stats = await image.stats()

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: stats.size || 0
    }
  } catch (error) {
    console.error('[ImageProcessor] 获取图片尺寸失败:', error)
    throw error
  }
}

/**
 * 比较两张图片的尺寸
 */
export async function compareImageDimensions(
  imagePath1: string,
  imagePath2: string
): Promise<{
  isSame: boolean
  original: ImageDimensions
  generated: ImageDimensions
}> {
  const original = await getImageDimensions(imagePath1)
  const generated = await getImageDimensions(imagePath2)

  const isSame = original.width === generated.width && original.height === generated.height

  return {
    isSame,
    original,
    generated
  }
}

/**
 * 等比缩放图片到指定尺寸
 * @param inputPath 输入图片路径
 * @param outputPath 输出图片路径
 * @param targetWidth 目标宽度
 * @param targetHeight 目标高度
 */
export async function resizeImage(
  inputPath: string,
  outputPath: string,
  targetWidth: number,
  targetHeight: number
): Promise<void> {
  try {
    console.log(
      `[ImageProcessor] 开始缩放图片: ${inputPath} -> ${targetWidth}x${targetHeight}`
    )

    await sharp(inputPath)
      .resize(targetWidth, targetHeight, {
        fit: 'fill', // 填充整个目标尺寸
        kernel: sharp.kernel.lanczos3 // 使用高质量的 Lanczos3 算法
      })
      .toFile(outputPath)

    console.log(`[ImageProcessor] 缩放完成: ${outputPath}`)
  } catch (error) {
    console.error('[ImageProcessor] 缩放失败:', error)
    throw error
  }
}

/**
 * 获取图片的 base64 和尺寸信息
 */
export async function getImageInfoWithBase64(imagePath: string): Promise<{
  dimensions: ImageDimensions
  base64: string
}> {
  const dimensions = await getImageDimensions(imagePath)
  const buffer = await sharp(imagePath).toBuffer()
  const base64 = `data:image/${dimensions.format};base64,${buffer.toString('base64')}`

  return {
    dimensions,
    base64
  }
}

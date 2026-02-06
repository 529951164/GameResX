/**
 * Google Gemini 2.5 Flash Image 生图模块
 * 免费额度高，适合生成简单的UI图片
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFile, writeFile } from 'fs/promises'

// 生图参数
export interface GenerateImageParams {
  apiKey: string
  model: string // 'gemini-2.5-flash-image'
  imagePath?: string // 原图路径（可选，用于图生图）
  prompt: string // 提示词
  outputPath: string // 输出路径
}

/**
 * 使用 Gemini Flash 生成图片
 * 支持纯文本生图和图生图两种模式
 */
export async function generateImage(params: GenerateImageParams): Promise<{
  success: boolean
  message: string
  outputPath?: string
}> {
  try {
    console.log('[GeminiFlash] 开始生成图片...')
    console.log('[GeminiFlash] 模型:', params.model)
    console.log('[GeminiFlash] 提示词:', params.prompt)

    // 1. 初始化 API
    const genAI = new GoogleGenerativeAI(params.apiKey)
    const model = genAI.getGenerativeModel({ model: params.model })

    let result

    // 2. 判断是纯文本生图还是图生图
    if (params.imagePath) {
      console.log('[GeminiFlash] 模式: 图生图')
      console.log('[GeminiFlash] 原图:', params.imagePath)

      // 读取原图并转为 base64
      const imageBuffer = await readFile(params.imagePath)
      const imageBase64 = imageBuffer.toString('base64')

      // 确定 MIME 类型
      let mimeType = 'image/png'
      if (params.imagePath.endsWith('.jpg') || params.imagePath.endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      } else if (params.imagePath.endsWith('.webp')) {
        mimeType = 'image/webp'
      }

      console.log('[GeminiFlash] 图片大小:', imageBuffer.length, 'bytes')

      // 图生图模式：传入图片和提示词
      result = await model.generateContent([
        params.prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        }
      ])
    } else {
      console.log('[GeminiFlash] 模式: 文本生图')

      // 纯文本生图
      result = await model.generateContent(params.prompt)
    }

    // 3. 获取返回的图片数据
    const response = await result.response

    // Gemini Flash Image 会在 parts 中返回 inlineData
    const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)

    if (!imagePart || !imagePart.inlineData) {
      throw new Error('API 没有返回图片数据，可能是提示词违反了安全策略')
    }

    // 4. 保存生成的图片
    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64')
    await writeFile(params.outputPath, imageBuffer)

    console.log('[GeminiFlash] 生成成功！保存到:', params.outputPath)
    console.log('[GeminiFlash] 图片大小:', imageBuffer.length, 'bytes')

    return {
      success: true,
      message: '图片生成成功',
      outputPath: params.outputPath
    }
  } catch (error: any) {
    console.error('[GeminiFlash] 生成失败:', error)
    return {
      success: false,
      message: error.message || '未知错误'
    }
  }
}

/**
 * 测试 API Key 是否有效
 */
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' })
    return true
  } catch (error) {
    console.error('[GeminiFlash] API Key 无效:', error)
    return false
  }
}

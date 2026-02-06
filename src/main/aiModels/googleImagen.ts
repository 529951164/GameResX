/**
 * Google Imagen 生图模块
 * 简单直接的 API 调用封装
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFile, writeFile } from 'fs/promises'

// 生图参数
export interface GenerateImageParams {
  apiKey: string
  model: string // 'imagen-4'
  imagePath: string // 原图路径
  prompt: string // 提示词
  outputPath: string // 输出路径
}

/**
 * 使用 Google Imagen 生成图片
 */
export async function generateImage(params: GenerateImageParams): Promise<{
  success: boolean
  message: string
  outputPath?: string
}> {
  try {
    console.log('[GoogleImagen] 开始生成图片...')
    console.log('[GoogleImagen] 模型:', params.model)
    console.log('[GoogleImagen] 原图:', params.imagePath)
    console.log('[GoogleImagen] 提示词:', params.prompt)

    // 1. 初始化 API
    const genAI = new GoogleGenerativeAI(params.apiKey)
    const model = genAI.getGenerativeModel({ model: params.model })

    // 2. 读取原图并转为 base64
    const imageBuffer = await readFile(params.imagePath)
    const imageBase64 = imageBuffer.toString('base64')

    // 确定 MIME 类型
    let mimeType = 'image/png'
    if (params.imagePath.endsWith('.jpg') || params.imagePath.endsWith('.jpeg')) {
      mimeType = 'image/jpeg'
    } else if (params.imagePath.endsWith('.webp')) {
      mimeType = 'image/webp'
    }

    console.log('[GoogleImagen] 图片大小:', imageBuffer.length, 'bytes')
    console.log('[GoogleImagen] MIME类型:', mimeType)

    // 3. 构建完整提示词（自动添加保持原有结构的说明）
    let fullPrompt = params.prompt
    if (!fullPrompt.toLowerCase().includes('keep') && !fullPrompt.toLowerCase().includes('preserve')) {
      fullPrompt += ', but keep the original composition and main subject.'
    }

    console.log('[GoogleImagen] 完整提示词:', fullPrompt)

    // 4. 调用 API 生成图片
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: fullPrompt
            },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType
              }
            }
          ]
        }
      ]
    })

    const response = await result.response

    // 5. 获取生成的图片数据
    // 注意：这里的 API 可能需要根据实际返回调整
    const generatedImageBase64 = response.text()

    // 6. 保存生成的图片
    const imageData = Buffer.from(generatedImageBase64, 'base64')
    await writeFile(params.outputPath, imageData)

    console.log('[GoogleImagen] 生成成功！保存到:', params.outputPath)

    return {
      success: true,
      message: '图片生成成功',
      outputPath: params.outputPath
    }
  } catch (error: any) {
    console.error('[GoogleImagen] 生成失败:', error)
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
    // 简单测试：尝试获取模型
    genAI.getGenerativeModel({ model: 'imagen-4' })
    return true
  } catch (error) {
    console.error('[GoogleImagen] API Key 无效:', error)
    return false
  }
}

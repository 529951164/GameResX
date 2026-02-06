/**
 * 列出 Google AI 可用的模型
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export async function listAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    // 获取可用模型列表
    const models = await genAI.listModels()

    const modelNames = models.map((model: any) => model.name)

    console.log('[ListModels] 可用模型:', modelNames)

    return modelNames
  } catch (error) {
    console.error('[ListModels] 获取模型列表失败:', error)
    return []
  }
}

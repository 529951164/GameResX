import { useState, useEffect, useCallback } from 'react'
import { Tag, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import type { ImageFile } from '@/types'

interface PromptPanelProps {
  image: ImageFile | null
}

const PRESET_PROMPTS = [
  '保持原有构图和主体内容',
  '改为卡通风格，色彩鲜艳',
  '改为写实风格，细节丰富',
  '改为扁平化设计',
  '增强光影效果',
  '去除背景，保留主体',
  '改为赛博朋克风格',
  '改为中国风水墨画风格'
]

export function PromptPanel({ image }: PromptPanelProps) {
  const { projectConfig, rootPath, updateImageMetadata } = useAppStore()
  const [prompt, setPrompt] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('')
  const [showPresets, setShowPresets] = useState(false)

  const metadata = image && projectConfig ? projectConfig.imageMetadata[image.path] : null
  const tagType = metadata?.tagType || null

  // 加载图片提示词
  useEffect(() => {
    if (image && metadata) {
      setPrompt(metadata.customPrompt || '')
    } else {
      setPrompt('')
    }
  }, [image, metadata])

  // 防抖保存
  useEffect(() => {
    if (!image || !rootPath) return

    const timer = setTimeout(() => {
      if (metadata && prompt !== metadata.customPrompt) {
        window.api
          .updateImageMetadata(rootPath, image.path, { customPrompt: prompt })
          .then(() => {
            updateImageMetadata(image.path, { customPrompt: prompt })
          })
          .catch((error) => {
            console.error('Failed to save prompt:', error)
          })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [prompt, image, rootPath, metadata, updateImageMetadata])

  const handleInsertPreset = useCallback((preset: string) => {
    setPrompt((prev) => {
      if (!prev) return preset
      return prev + (prev.endsWith('，') || prev.endsWith('。') ? '' : '，') + preset
    })
    setSelectedPreset('')
    setShowPresets(false)
  }, [])

  const handleTagClick = async () => {
    if (!image || !rootPath || !projectConfig) return

    // 显示标签选择（简单实现：循环切换）
    const tagTypes = projectConfig.globalSettings.customTagTypes
    const currentIndex = tagTypes.indexOf(tagType || '')
    const nextIndex = (currentIndex + 1) % tagTypes.length
    const nextTag = tagTypes[nextIndex]

    try {
      await window.api.updateImageMetadata(rootPath, image.path, { tagType: nextTag })
      updateImageMetadata(image.path, { tagType: nextTag })
    } catch (error) {
      console.error('Failed to update tag:', error)
    }
  }

  if (!image) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-text-secondary">请选择一张图片</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-content-bg border-t border-border">
      {/* 标签栏 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <span className="text-xs text-text-secondary">类型标签:</span>
        <button
          onClick={handleTagClick}
          className="flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent text-xs rounded border border-accent/30 hover:bg-accent/30 transition-colors"
        >
          <Tag size={12} />
          {tagType || '未设置'}
        </button>
      </div>

      {/* 提示词输入 */}
      <div className="flex-1 p-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入换皮修改提示词..."
          className="w-full h-full px-3 py-2 bg-app-bg text-text-primary text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent resize-none"
        />
      </div>

      {/* 预设提示词选择 */}
      <div className="px-3 pb-3">
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="w-full flex items-center justify-between px-3 py-2 bg-app-bg text-text-primary text-sm border border-border rounded hover:bg-hover transition-colors"
          >
            <span className="text-text-secondary">
              {selectedPreset || '常用提示词...'}
            </span>
            <ChevronDown size={16} className={showPresets ? 'rotate-180' : ''} />
          </button>

          {showPresets && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-content-bg border border-border rounded shadow-lg max-h-48 overflow-y-auto">
              {PRESET_PROMPTS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleInsertPreset(preset)}
                  className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-hover transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

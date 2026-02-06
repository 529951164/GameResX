import { useState, useEffect, useCallback } from 'react'
import { Tag, ChevronDown, Sparkles, RotateCcw, Terminal, Trash2, Maximize2, Copy } from 'lucide-react'
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasBackup, setHasBackup] = useState(false)
  const [logs, setLogs] = useState<Array<{ type: 'info' | 'success' | 'error'; message: string; time: string }>>([])
  const [dimensions, setDimensions] = useState<{
    current: { width: number; height: number } | null
    original: { width: number; height: number } | null
  }>({ current: null, original: null })
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-image') // 默认使用免费额度高的模型

  // 添加日志
  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    const time = new Date().toLocaleTimeString('zh-CN')
    setLogs((prev) => [...prev, { type, message, time }])
  }

  // 清空日志
  const clearLogs = () => {
    setLogs([])
  }

  // 拷贝日志
  const copyLogs = () => {
    if (logs.length === 0) return

    const logText = logs.map((log) => `[${log.time}] ${log.message}`).join('\n')
    navigator.clipboard.writeText(logText).then(() => {
      addLog('info', '✓ 日志已复制到剪贴板')
    })
  }

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

  // 检查是否有备份文件并获取尺寸信息
  useEffect(() => {
    if (image) {
      // 检查备份
      window.api.hasBackup(image.path).then(setHasBackup)

      // 获取当前图片尺寸
      window.api.getImageDimensions(image.path).then((dims) => {
        setDimensions((prev) => ({ ...prev, current: dims }))
      })

      // 获取原图尺寸
      window.api.getOriginalImageDimensions(image.path).then((dims) => {
        setDimensions((prev) => ({ ...prev, original: dims }))
      })
    } else {
      setHasBackup(false)
      setDimensions({ current: null, original: null })
    }
  }, [image])

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

  // 生成图片
  const handleGenerate = async () => {
    if (!image || !rootPath) {
      addLog('error', '请先选择图片')
      return
    }

    if (!projectConfig) {
      addLog('error', '项目配置未加载，请稍候重试')
      return
    }

    // 检查 API Key
    if (!projectConfig.aiSettings?.apiKey) {
      addLog('error', '请先在项目配置中设置 API Key')
      return
    }

    // 检查提示词
    const globalPrompt = projectConfig.globalSettings?.globalPrompt || ''
    if (!globalPrompt && !prompt) {
      addLog('error', '请先设置全局提示词或自定义提示词')
      return
    }

    setIsGenerating(true)
    addLog('info', `开始生成图片: ${image.name}`)
    addLog('info', `使用模型: ${selectedModel}`)

    const fullPrompt = (globalPrompt ? globalPrompt + '，' : '') + (prompt || '')
    addLog('info', `提示词: ${fullPrompt}`)

    try {
      const result = await window.api.generateImage(rootPath, image.path, prompt, selectedModel)

      if (result.success) {
        addLog('success', `✓ ${result.message}`)

        // 如果有尺寸信息，显示
        if (result.dimensionInfo) {
          const { original, generated, needsResize } = result.dimensionInfo
          if (needsResize) {
            addLog(
              'info',
              `原图尺寸: ${original.width}x${original.height}, 生成图: ${generated.width}x${generated.height}`
            )
            addLog('info', '已自动缩放到原图尺寸')
          }
        }

        // 刷新备份状态和尺寸信息
        const backup = await window.api.hasBackup(image.path)
        setHasBackup(backup)

        // 刷新尺寸信息
        const currentDims = await window.api.getImageDimensions(image.path)
        setDimensions((prev) => ({ ...prev, current: currentDims }))

        // 更新完成状态
        updateImageMetadata(image.path, { isCompleted: true })
      } else {
        addLog('error', `✗ 生成失败: ${result.message}`)
      }
    } catch (error: any) {
      addLog('error', `✗ 发生异常: ${error.message || error}`)
      console.error('Generate image error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 恢复原图
  const handleRestore = async () => {
    if (!image || !rootPath) return

    if (!confirm('确定要恢复原图吗？当前的生成图将被删除。')) {
      return
    }

    addLog('info', `开始恢复原图: ${image.name}`)

    try {
      const success = await window.api.restoreImage(image.path)

      if (success) {
        addLog('success', '✓ 原图恢复成功！')
        // 刷新备份状态
        setHasBackup(false)
        // 刷新尺寸信息
        const currentDims = await window.api.getImageDimensions(image.path)
        setDimensions((prev) => ({ ...prev, current: currentDims }))
        // 更新完成状态
        updateImageMetadata(image.path, { isCompleted: false })
      } else {
        addLog('error', '✗ 恢复失败：没有找到备份文件')
      }
    } catch (error: any) {
      addLog('error', `✗ 恢复失败: ${error.message}`)
    }
  }

  // 手动缩放到原图尺寸
  const handleResize = async () => {
    if (!image || !dimensions.original) return

    if (!confirm(`确定要将当前图片缩放到原图尺寸 (${dimensions.original.width}x${dimensions.original.height}) 吗？`)) {
      return
    }

    addLog('info', `开始缩放图片: ${image.name}`)
    addLog('info', `目标尺寸: ${dimensions.original.width}x${dimensions.original.height}`)

    try {
      const result = await window.api.resizeImageToOriginal(
        image.path,
        dimensions.original.width,
        dimensions.original.height
      )

      if (result.success) {
        addLog('success', '✓ 图片缩放成功！')
        // 刷新尺寸信息
        const currentDims = await window.api.getImageDimensions(image.path)
        setDimensions((prev) => ({ ...prev, current: currentDims }))
      } else {
        addLog('error', `✗ 缩放失败: ${result.message}`)
      }
    } catch (error: any) {
      addLog('error', `✗ 缩放失败: ${error.message}`)
    }
  }

  if (!image) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-text-secondary">请选择一张图片</p>
      </div>
    )
  }

  // 检查尺寸是否匹配
  const dimensionsMatch =
    dimensions.current &&
    dimensions.original &&
    dimensions.current.width === dimensions.original.width &&
    dimensions.current.height === dimensions.original.height

  return (
    <div className="h-full flex flex-col bg-content-bg border-t border-border">
      {/* 标签栏和模型选择 */}
      <div className="px-3 py-2 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">类型标签:</span>
          <button
            onClick={handleTagClick}
            className="flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent text-xs rounded border border-accent/30 hover:bg-accent/30 transition-colors"
          >
            <Tag size={12} />
            {tagType || '未设置'}
          </button>
        </div>

        {/* 模型选择 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">生图模型:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="flex-1 px-2 py-1 bg-app-bg text-text-primary text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="gemini-2.5-flash-image">Gemini Flash (免费额度高 ⭐)</option>
            <option value="imagen-4">Imagen-4 (质量更高)</option>
          </select>
        </div>
      </div>

      {/* 尺寸信息 */}
      {dimensions.current && dimensions.original && (
        <div className={`px-3 py-2 border-b border-border ${dimensionsMatch ? 'bg-green-500/5' : 'bg-yellow-500/10'}`}>
          <div className="flex items-center justify-between">
            <div className="text-xs space-y-1">
              <div className="text-text-secondary">
                当前: <span className="text-text-primary font-mono">{dimensions.current.width}x{dimensions.current.height}</span>
              </div>
              <div className="text-text-secondary">
                原图: <span className="text-text-primary font-mono">{dimensions.original.width}x{dimensions.original.height}</span>
              </div>
            </div>
            {!dimensionsMatch && (
              <button
                onClick={handleResize}
                className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-600 text-xs rounded border border-yellow-500/30 transition-colors"
              >
                <Maximize2 size={12} />
                缩放
              </button>
            )}
          </div>
          {!dimensionsMatch && (
            <div className="mt-1 text-[10px] text-yellow-600">
              ⚠️ 尺寸不匹配，建议缩放到原图尺寸
            </div>
          )}
        </div>
      )}

      {/* 提示词输入 - 固定高度 */}
      <div className="p-3 border-b border-border flex-shrink-0">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入换皮修改提示词..."
          rows={3}
          className="w-full px-3 py-2 bg-app-bg text-text-primary text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent resize-none"
        />
      </div>

      {/* 预设提示词选择 - 固定高度 */}
      <div className="px-3 py-2 border-b border-border flex-shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="w-full flex items-center justify-between px-3 py-2 bg-app-bg text-text-primary text-sm border border-border rounded hover:bg-hover transition-colors"
          >
            <span className="text-text-secondary text-xs">{selectedPreset || '常用提示词...'}</span>
            <ChevronDown size={14} className={showPresets ? 'rotate-180' : ''} />
          </button>

          {showPresets && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-content-bg border border-border rounded shadow-lg max-h-48 overflow-y-auto z-10">
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

      {/* 操作按钮 - 固定高度 */}
      <div className="px-3 py-2 space-y-2 border-b border-border flex-shrink-0">
        {/* 生成按钮 */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent hover:bg-blue-600 text-white text-sm rounded transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              生成图片
            </>
          )}
        </button>

        {/* 恢复原图按钮 */}
        {hasBackup && (
          <button
            onClick={handleRestore}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-app-bg hover:bg-hover text-text-primary text-sm border border-border rounded transition-colors disabled:opacity-50"
          >
            <RotateCcw size={14} />
            恢复原图
          </button>
        )}
      </div>

      {/* 日志输出区域 - 自动扩展剩余空间 */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* 日志标题栏 */}
        <div className="flex items-center justify-between px-3 py-2 bg-sidebar-bg">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-text-secondary" />
            <span className="text-xs font-medium text-text-primary">操作日志</span>
            {logs.length > 0 && (
              <span className="text-xs text-text-secondary">({logs.length})</span>
            )}
          </div>
          {logs.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={copyLogs}
                className="p-1 hover:bg-green-500/20 rounded transition-colors"
                title="复制日志"
              >
                <Copy size={12} className="text-green-500" />
              </button>
              <button
                onClick={clearLogs}
                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                title="清空日志"
              >
                <Trash2 size={12} className="text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* 日志内容 */}
        <div className="flex-1 overflow-y-auto px-3 py-2 bg-app-bg/50">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-text-secondary">暂无日志</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-xs font-mono leading-relaxed ${
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'success'
                      ? 'text-green-400'
                      : 'text-text-secondary'
                  }`}
                >
                  <span className="opacity-50">[{log.time}]</span> {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

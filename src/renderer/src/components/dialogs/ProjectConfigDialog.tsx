import { useState, useEffect } from 'react'
import { X, RefreshCw, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import type { ProjectConfig } from '@/types'

interface ProjectConfigDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectConfigDialog({ isOpen, onClose }: ProjectConfigDialogProps) {
  const { projectConfig, rootPath, setProjectConfig } = useAppStore()
  const [localConfig, setLocalConfig] = useState<ProjectConfig | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showEmptyFolders, setShowEmptyFolders] = useState(false)
  const [newTagType, setNewTagType] = useState('')

  useEffect(() => {
    if (isOpen && projectConfig) {
      setLocalConfig(JSON.parse(JSON.stringify(projectConfig)))
    }
  }, [isOpen, projectConfig])

  if (!isOpen || !localConfig || !rootPath) return null

  const handleRefreshStats = async () => {
    setIsRefreshing(true)
    try {
      const stats = await window.api.refreshStatistics(rootPath)
      setLocalConfig({
        ...localConfig,
        statistics: stats
      })
    } catch (error) {
      console.error('Failed to refresh statistics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSave = async () => {
    try {
      await window.api.saveProjectConfig(localConfig)
      setProjectConfig(localConfig)
      onClose()
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  const handleAddTagType = () => {
    if (!newTagType.trim()) return
    if (localConfig.globalSettings.customTagTypes.includes(newTagType.trim())) return

    setLocalConfig({
      ...localConfig,
      globalSettings: {
        ...localConfig.globalSettings,
        customTagTypes: [...localConfig.globalSettings.customTagTypes, newTagType.trim()]
      }
    })
    setNewTagType('')
  }

  const handleRemoveTagType = (tag: string) => {
    setLocalConfig({
      ...localConfig,
      globalSettings: {
        ...localConfig.globalSettings,
        customTagTypes: localConfig.globalSettings.customTagTypes.filter((t) => t !== tag)
      }
    })
  }

  const completionRate =
    localConfig.statistics.totalImages > 0
      ? ((localConfig.statistics.completedImages / localConfig.statistics.totalImages) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-content-bg border border-border rounded-lg shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-medium text-text-primary">项目配置</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-hover rounded transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* 项目信息 */}
          <section>
            <h3 className="text-sm font-medium text-text-primary mb-3">项目信息</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">项目名称</label>
                <input
                  type="text"
                  value={localConfig.projectName}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, projectName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-app-bg text-text-primary text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">项目路径</label>
                <div className="px-3 py-2 bg-app-bg text-text-secondary text-sm border border-border rounded">
                  {localConfig.rootPath}
                </div>
              </div>
              <div className="text-xs text-text-secondary">
                创建时间: {new Date(localConfig.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </section>

          {/* 统计信息 */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-primary">统计信息</h3>
              <button
                onClick={handleRefreshStats}
                disabled={isRefreshing}
                className="flex items-center gap-1 px-2 py-1 text-xs text-text-primary bg-app-bg hover:bg-hover border border-border rounded transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                刷新统计
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">总图片数:</span>
                <span className="text-text-primary font-medium">
                  {localConfig.statistics.totalImages}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">已换皮:</span>
                <span className="text-text-primary font-medium">
                  {localConfig.statistics.completedImages} / {localConfig.statistics.totalImages} (
                  {completionRate}%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">空文件夹:</span>
                <button
                  onClick={() => setShowEmptyFolders(!showEmptyFolders)}
                  className="text-accent hover:underline text-sm"
                >
                  {localConfig.statistics.emptyFolders.length}个{' '}
                  {showEmptyFolders ? '隐藏' : '查看详情'}
                </button>
              </div>
              {showEmptyFolders && localConfig.statistics.emptyFolders.length > 0 && (
                <div className="mt-2 p-2 bg-app-bg border border-border rounded max-h-32 overflow-y-auto">
                  {localConfig.statistics.emptyFolders.map((folder, index) => (
                    <div key={index} className="text-xs text-text-secondary py-1">
                      {folder}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 全局提示词 */}
          <section>
            <h3 className="text-sm font-medium text-text-primary mb-3">全局提示词</h3>
            <textarea
              value={localConfig.globalSettings.globalPrompt}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  globalSettings: {
                    ...localConfig.globalSettings,
                    globalPrompt: e.target.value
                  }
                })
              }
              placeholder="例如: 赛博朋克风格，霓虹色调，高对比度..."
              rows={3}
              className="w-full px-3 py-2 bg-app-bg text-text-primary text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </section>

          {/* 图片类型标签 */}
          <section>
            <h3 className="text-sm font-medium text-text-primary mb-3">图片类型标签</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {localConfig.globalSettings.customTagTypes.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent text-sm rounded border border-accent/30"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTagType(tag)}
                    className="hover:bg-accent/30 rounded p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagType}
                onChange={(e) => setNewTagType(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTagType()}
                placeholder="输入新标签类型..."
                className="flex-1 px-3 py-2 bg-app-bg text-text-primary text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                onClick={handleAddTagType}
                className="flex items-center gap-1 px-3 py-2 bg-accent hover:bg-blue-600 text-white text-sm rounded transition-colors"
              >
                <Plus size={14} />
                添加
              </button>
            </div>
          </section>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-primary bg-app-bg hover:bg-hover border border-border rounded transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-accent hover:bg-blue-600 rounded transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

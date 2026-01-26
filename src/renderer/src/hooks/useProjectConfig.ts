import { useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'

export function useProjectConfig() {
  const { setProjectConfig, rootPath } = useAppStore()

  // 加载项目配置
  const loadConfig = useCallback(
    async (projectRootPath: string) => {
      try {
        const config = await window.api.loadProjectConfig(projectRootPath)
        setProjectConfig(config)
        return config
      } catch (error) {
        console.error('Failed to load project config:', error)
        return null
      }
    },
    [setProjectConfig]
  )

  // 保存项目配置
  const saveConfig = useCallback(async () => {
    const config = useAppStore.getState().projectConfig
    if (!config) return

    try {
      await window.api.saveProjectConfig(config)
    } catch (error) {
      console.error('Failed to save project config:', error)
    }
  }, [])

  // 刷新统计信息
  const refreshStats = useCallback(async () => {
    if (!rootPath) return

    try {
      const stats = await window.api.refreshStatistics(rootPath)
      const config = useAppStore.getState().projectConfig
      if (config) {
        setProjectConfig({
          ...config,
          statistics: stats
        })
      }
      return stats
    } catch (error) {
      console.error('Failed to refresh statistics:', error)
      return null
    }
  }, [rootPath, setProjectConfig])

  // 更新全局提示词
  const updateGlobalPrompt = useCallback(
    async (prompt: string) => {
      const config = useAppStore.getState().projectConfig
      if (!config) return

      const updatedConfig = {
        ...config,
        globalSettings: {
          ...config.globalSettings,
          globalPrompt: prompt
        }
      }

      setProjectConfig(updatedConfig)
      await window.api.saveProjectConfig(updatedConfig)
    },
    [setProjectConfig]
  )

  return {
    loadConfig,
    saveConfig,
    refreshStats,
    updateGlobalPrompt
  }
}

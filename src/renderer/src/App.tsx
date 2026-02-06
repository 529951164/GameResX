import { useState, useEffect } from 'react'
import { ThreeColumnLayout } from '@/components/layout/ThreeColumnLayout'
import { FolderTree } from '@/components/sidebar/FolderTree'
import { FileList } from '@/components/filelist/FileList'
import { CompareView } from '@/components/preview/CompareView'
import { ProjectConfigDialog } from '@/components/dialogs/ProjectConfigDialog'
import { GitIgnoreDialog } from '@/components/dialogs/GitIgnoreDialog'
import { useAppStore } from '@/stores/useAppStore'
import { useFileSystem } from '@/hooks/useFileSystem'
import { FolderOpen, Settings, Shield } from 'lucide-react'

function App() {
  const { rootPath, isLoading, projectConfig } = useAppStore()
  const { selectRootDirectory } = useFileSystem()
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [gitignoreDialog, setGitignoreDialog] = useState<{
    isOpen: boolean
    gitignorePath: string | null
  }>({ isOpen: false, gitignorePath: null })

  // 检查 .gitignore 配置
  useEffect(() => {
    if (rootPath) {
      checkGitignoreConfig(rootPath)
    }
  }, [rootPath])

  const checkGitignoreConfig = async (projectPath: string) => {
    try {
      const result = await window.api.checkGitignore(projectPath)
      if (result.needsConfig && result.gitignorePath) {
        setGitignoreDialog({
          isOpen: true,
          gitignorePath: result.gitignorePath
        })
      }
    } catch (error) {
      console.error('Failed to check gitignore:', error)
    }
  }

  const handleAddGitignoreRules = async () => {
    if (!gitignoreDialog.gitignorePath) return

    try {
      await window.api.addGitignoreRules(gitignoreDialog.gitignorePath)
      setGitignoreDialog({ isOpen: false, gitignorePath: null })
    } catch (error) {
      console.error('Failed to add gitignore rules:', error)
      alert('添加 .gitignore 规则失败，请检查文件权限')
    }
  }

  const handleCancelGitignore = () => {
    setGitignoreDialog({ isOpen: false, gitignorePath: null })
  }

  // 一键备份所有图片
  const handleBackupAll = async () => {
    if (!rootPath) return

    if (!confirm('确定要备份所有图片吗？这将为所有图片创建 .back 备份文件。已有备份的图片会被跳过。')) {
      return
    }

    try {
      const result = await window.api.backupAllImages(rootPath)

      alert(
        `备份完成！\n\n` +
          `总计: ${result.total} 张\n` +
          `成功: ${result.success} 张\n` +
          `跳过: ${result.skipped} 张 (已有备份)\n` +
          `失败: ${result.failed} 张`
      )
    } catch (error: any) {
      alert(`备份失败：${error.message}`)
    }
  }

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* 标题栏区域 - macOS 拖拽区域 */}
      <div className="h-12 flex items-center px-4 bg-sidebar-bg border-b border-border titlebar-drag">
        <div className="w-20" /> {/* macOS 红绿灯按钮占位 */}
        <h1 className="text-sm font-medium text-text-primary">GameResX</h1>
        <div className="flex-1" />
        
        {/* 右侧按钮组 */}
        <div className="titlebar-no-drag flex items-center gap-2">
          {rootPath && projectConfig && (
            <>
              <button
                onClick={handleBackupAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                title="一键备份所有图片"
              >
                <Shield size={16} />
                一键备份
              </button>
              <button
                onClick={() => setShowConfigDialog(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-primary bg-content-bg hover:bg-hover rounded border border-border transition-colors"
              >
                <Settings size={16} />
                项目配置
              </button>
            </>
          )}
          <button
            onClick={selectRootDirectory}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-primary bg-content-bg hover:bg-hover rounded border border-border transition-colors disabled:opacity-50"
          >
            <FolderOpen size={16} />
            {rootPath ? '切换目录' : '选择目录'}
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {!rootPath ? (
          <WelcomeScreen onSelectDirectory={selectRootDirectory} isLoading={isLoading} />
        ) : (
          <ThreeColumnLayout
            left={<FolderTree />}
            middle={<FileList />}
            right={<CompareView />}
          />
        )}
      </div>

      {/* 项目配置弹窗 */}
      <ProjectConfigDialog isOpen={showConfigDialog} onClose={() => setShowConfigDialog(false)} />

      {/* GitIgnore 配置弹窗 */}
      <GitIgnoreDialog
        isOpen={gitignoreDialog.isOpen}
        gitignorePath={gitignoreDialog.gitignorePath || ''}
        onConfirm={handleAddGitignoreRules}
        onCancel={handleCancelGitignore}
      />
    </div>
  )
}

function WelcomeScreen({
  onSelectDirectory,
  isLoading
}: {
  onSelectDirectory: () => void
  isLoading: boolean
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-content-bg flex items-center justify-center">
          <FolderOpen size={48} className="text-text-secondary" />
        </div>
        <h2 className="text-xl font-medium text-text-primary mb-2">欢迎使用 GameResX</h2>
        <p className="text-text-secondary mb-6">请选择游戏项目的美术资源目录开始浏览</p>
        <button
          onClick={onSelectDirectory}
          disabled={isLoading}
          className="px-6 py-2.5 bg-accent hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? '加载中...' : '选择目录'}
        </button>
      </div>
    </div>
  )
}

export default App

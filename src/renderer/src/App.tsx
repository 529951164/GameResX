import { ThreeColumnLayout } from '@/components/layout/ThreeColumnLayout'
import { FolderTree } from '@/components/sidebar/FolderTree'
import { FileList } from '@/components/filelist/FileList'
import { CompareView } from '@/components/preview/CompareView'
import { useAppStore } from '@/stores/useAppStore'
import { useFileSystem } from '@/hooks/useFileSystem'
import { FolderOpen } from 'lucide-react'

function App() {
  const { rootPath, isLoading } = useAppStore()
  const { selectRootDirectory } = useFileSystem()

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* 标题栏区域 - macOS 拖拽区域 */}
      <div className="h-12 flex items-center px-4 bg-sidebar-bg border-b border-border titlebar-drag">
        <div className="w-20" /> {/* macOS 红绿灯按钮占位 */}
        <h1 className="text-sm font-medium text-text-primary">GameResX</h1>
        <div className="flex-1" />
        <button
          onClick={selectRootDirectory}
          disabled={isLoading}
          className="titlebar-no-drag flex items-center gap-2 px-3 py-1.5 text-sm text-text-primary bg-content-bg hover:bg-hover rounded border border-border transition-colors disabled:opacity-50"
        >
          <FolderOpen size={16} />
          {rootPath ? '切换目录' : '选择目录'}
        </button>
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

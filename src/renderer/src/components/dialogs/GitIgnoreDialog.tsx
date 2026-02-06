import { useState } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'

interface GitIgnoreDialogProps {
  isOpen: boolean
  gitignorePath: string
  onConfirm: () => void
  onCancel: () => void
}

export function GitIgnoreDialog({ isOpen, gitignorePath, onConfirm, onCancel }: GitIgnoreDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-content-bg border border-border rounded-lg shadow-2xl w-[500px] overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-yellow-500/10">
          <AlertTriangle size={24} className="text-yellow-500" />
          <h2 className="text-lg font-medium text-text-primary">配置 Git 忽略规则</h2>
        </div>

        {/* 内容区域 */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-text-primary leading-relaxed">
            检测到项目使用了 Git 版本控制，建议在 <code className="px-1.5 py-0.5 bg-app-bg text-accent rounded text-xs">.gitignore</code> 中添加以下规则，避免提交备份文件和配置文件：
          </p>

          {/* 规则展示 */}
          <div className="bg-app-bg border border-border rounded p-4">
            <div className="text-xs text-text-secondary mb-2">将添加到：</div>
            <div className="text-sm text-accent mb-3 truncate">{gitignorePath}</div>

            <div className="text-xs text-text-secondary mb-2">添加的规则：</div>
            <pre className="text-xs text-text-primary font-mono">
              <div className="opacity-50"># GameResX - 图片备份文件和配置</div>
              <div className="text-green-400">*.back</div>
              <div className="text-green-400">.gameresx/</div>
            </pre>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
            </div>
            <div className="text-xs text-text-secondary">
              <div className="font-medium text-text-primary mb-1">说明：</div>
              <ul className="space-y-1 list-disc list-inside">
                <li><code className="text-accent">*.back</code> - 原始图片的备份文件</li>
                <li><code className="text-accent">.gameresx/</code> - 项目配置和元数据</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-sidebar-bg">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary bg-app-bg hover:bg-hover border border-border rounded transition-colors disabled:opacity-50"
          >
            <X size={16} />
            跳过
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-accent hover:bg-blue-600 rounded transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                添加中...
              </>
            ) : (
              <>
                <Check size={16} />
                确认添加
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

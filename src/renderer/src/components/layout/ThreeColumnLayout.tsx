import React from 'react'

interface ThreeColumnLayoutProps {
  left: React.ReactNode
  middle: React.ReactNode
  right: React.ReactNode
}

export function ThreeColumnLayout({ left, middle, right }: ThreeColumnLayoutProps) {
  return (
    <div className="h-full flex">
      {/* 左侧栏 - 目录树 */}
      <div className="w-64 min-w-[200px] max-w-[320px] h-full bg-sidebar-bg border-r border-border overflow-hidden flex flex-col">
        <div className="px-3 py-2 text-xs font-medium text-text-secondary uppercase tracking-wide border-b border-border">
          目录
        </div>
        <div className="flex-1 overflow-auto">{left}</div>
      </div>

      {/* 中间栏 - 文件列表 */}
      <div className="w-80 min-w-[280px] max-w-[400px] h-full bg-content-bg border-r border-border overflow-hidden flex flex-col">
        <div className="px-3 py-2 text-xs font-medium text-text-secondary uppercase tracking-wide border-b border-border">
          文件列表
        </div>
        <div className="flex-1 overflow-auto">{middle}</div>
      </div>

      {/* 右侧栏 - 大图对比 */}
      <div className="flex-1 h-full bg-app-bg overflow-hidden flex flex-col">
        <div className="px-3 py-2 text-xs font-medium text-text-secondary uppercase tracking-wide border-b border-border">
          图片对比
        </div>
        <div className="flex-1 overflow-hidden">{right}</div>
      </div>
    </div>
  )
}

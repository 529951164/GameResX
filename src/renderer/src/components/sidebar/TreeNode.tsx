import { ChevronRight, ChevronDown, Folder, FolderOpen, Image } from 'lucide-react'
import type { TreeNode as TreeNodeType } from '@/types'

interface TreeNodeProps {
  node: TreeNodeType
  level: number
  selectedPath: string | null
  expandedFolders: Set<string>
  onSelect: (node: TreeNodeType) => void
  onToggle: (nodeId: string) => void
  onContextMenu?: (e: React.MouseEvent, node: TreeNodeType) => void
}

export function TreeNode({
  node,
  level,
  selectedPath,
  expandedFolders,
  onSelect,
  onToggle,
  onContextMenu
}: TreeNodeProps) {
  const isExpanded = expandedFolders.has(node.id)
  const isSelected = selectedPath === node.path
  const hasChildren = node.children.length > 0

  // 确定文件夹颜色和样式
  const folderColor = node.isEmpty
    ? 'text-text-secondary opacity-50'
    : node.hasImages
    ? 'text-yellow-400'
    : 'text-text-secondary'

  const handleClick = () => {
    onSelect(node)
    if (hasChildren) {
      onToggle(node.id)
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle(node.id)
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors ${
          isSelected ? 'bg-accent text-white' : 'hover:bg-hover text-text-primary'
        } ${node.isEmpty ? 'opacity-60' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu?.(e, node)}
      >
        {/* 展开/折叠图标 */}
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {hasChildren ? (
            <button
              onClick={handleToggle}
              className="w-4 h-4 flex items-center justify-center hover:bg-white/10 rounded"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : null}
        </div>

        {/* 文件夹图标 */}
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {isExpanded ? (
            <FolderOpen size={14} className={folderColor} />
          ) : (
            <Folder size={14} className={folderColor} />
          )}
        </div>

        {/* 文件夹名称 */}
        <span className="text-sm truncate flex-1">{node.name}</span>

        {/* 图片数量 */}
        {node.imageCount > 0 && (
          <span className={`text-xs flex-shrink-0 ${isSelected ? 'text-white/70' : 'text-text-secondary'}`}>
            ({node.imageCount})
          </span>
        )}

        {/* 含有图片标识 */}
        {node.hasImages && !node.isEmpty && (
          <Image size={12} className={isSelected ? 'text-white/70' : 'text-text-secondary'} />
        )}
      </div>

      {/* 子节点 */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              expandedFolders={expandedFolders}
              onSelect={onSelect}
              onToggle={onToggle}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  )
}

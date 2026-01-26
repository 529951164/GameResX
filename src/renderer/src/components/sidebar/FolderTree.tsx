import { useAppStore } from '@/stores/useAppStore'
import { useFileSystem } from '@/hooks/useFileSystem'
import { TreeNode } from './TreeNode'
import type { TreeNode as TreeNodeType } from '@/types'

export function FolderTree() {
  const { directoryTree, selectedFolderPath, expandedFolders, toggleFolderExpanded } = useAppStore()
  const { selectFolder } = useFileSystem()

  const handleSelectFolder = (node: TreeNodeType) => {
    selectFolder(node.path)
  }

  const handleToggleExpand = (nodeId: string) => {
    toggleFolderExpanded(nodeId)
  }

  if (directoryTree.length === 0) {
    return (
      <div className="p-4 text-center text-text-secondary text-sm">
        正在加载目录结构...
      </div>
    )
  }

  return (
    <div className="py-1">
      {directoryTree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          selectedPath={selectedFolderPath}
          expandedFolders={expandedFolders}
          onSelect={handleSelectFolder}
          onToggle={handleToggleExpand}
        />
      ))}
    </div>
  )
}

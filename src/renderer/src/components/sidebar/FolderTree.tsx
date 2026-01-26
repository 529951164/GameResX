import { useAppStore } from '@/stores/useAppStore'
import { useFileSystem } from '@/hooks/useFileSystem'
import { useContextMenu } from '@/hooks/useContextMenu'
import { ContextMenu } from '@/components/common/ContextMenu'
import { useFolderContextMenu } from '@/components/menus/FolderContextMenu'
import { TreeNode } from './TreeNode'
import type { TreeNode as TreeNodeType } from '@/types'

export function FolderTree() {
  const { directoryTree, selectedFolderPath, expandedFolders, toggleFolderExpanded } = useAppStore()
  const { selectFolder } = useFileSystem()
  const { menuPosition, menuType, menuData, showMenu, hideMenu } = useContextMenu()

  const handleSelectFolder = (node: TreeNodeType) => {
    selectFolder(node.path)
  }

  const handleToggleExpand = (nodeId: string) => {
    toggleFolderExpanded(nodeId)
  }

  const handleContextMenu = (e: React.MouseEvent, node: TreeNodeType) => {
    showMenu(e, 'folder', node)
  }

  const handleRefresh = () => {
    // 刷新当前选中的文件夹
    if (menuData) {
      selectFolder(menuData.path)
    }
  }

  // useFolderContextMenu 是一个 hook，必须无条件调用（符合 hooks 规则）
  const folderMenuItems = useFolderContextMenu({
    folder: menuData,
    onClose: hideMenu,
    onRefresh: handleRefresh
  })

  if (directoryTree.length === 0) {
    return (
      <div className="p-4 text-center text-text-secondary text-sm">
        正在加载目录结构...
      </div>
    )
  }

  return (
    <>
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
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {menuPosition && menuType === 'folder' && menuData && (
        <ContextMenu position={menuPosition} items={folderMenuItems} onClose={hideMenu} />
      )}
    </>
  )
}

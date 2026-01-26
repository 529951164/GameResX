export interface TreeNode {
  id: string
  name: string
  path: string
  children: TreeNode[]
  hasImages: boolean
  isExpanded?: boolean
}

export interface ImageFile {
  id: string
  name: string
  path: string
  extension: string
}

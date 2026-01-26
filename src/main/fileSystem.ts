import { readdir, stat, readFile } from 'fs/promises'
import { join, extname, basename } from 'path'

// 支持的图片格式
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

function isImageFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase()
  return IMAGE_EXTENSIONS.includes(ext)
}

export interface TreeNode {
  id: string
  name: string
  path: string
  children: TreeNode[]
  hasImages: boolean
}

export interface ImageFile {
  id: string
  name: string
  path: string
  extension: string
}

// 扫描目录，构建树状结构
export async function scanDirectory(rootPath: string): Promise<TreeNode[]> {
  async function buildTree(dirPath: string): Promise<TreeNode | null> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true })
      const children: TreeNode[] = []
      let hasImages = false

      for (const entry of entries) {
        // 跳过隐藏文件和文件夹
        if (entry.name.startsWith('.')) continue

        const fullPath = join(dirPath, entry.name)

        if (entry.isDirectory()) {
          const childNode = await buildTree(fullPath)
          if (childNode && (childNode.hasImages || childNode.children.length > 0)) {
            children.push(childNode)
            if (childNode.hasImages) hasImages = true
          }
        } else if (entry.isFile() && isImageFile(entry.name)) {
          hasImages = true
        }
      }

      // 按名称排序
      children.sort((a, b) => a.name.localeCompare(b.name))

      return {
        id: dirPath,
        name: basename(dirPath),
        path: dirPath,
        children,
        hasImages
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error)
      return null
    }
  }

  const rootNode = await buildTree(rootPath)
  return rootNode ? [rootNode] : []
}

// 获取指定目录下的图片文件列表
export async function getImagesInFolder(folderPath: string): Promise<ImageFile[]> {
  try {
    const entries = await readdir(folderPath, { withFileTypes: true })
    const images: ImageFile[] = []

    for (const entry of entries) {
      if (entry.isFile() && isImageFile(entry.name)) {
        const fullPath = join(folderPath, entry.name)
        images.push({
          id: fullPath,
          name: entry.name,
          path: fullPath,
          extension: extname(entry.name).toLowerCase()
        })
      }
    }

    // 按名称排序
    images.sort((a, b) => a.name.localeCompare(b.name))
    return images
  } catch (error) {
    console.error(`Error reading folder ${folderPath}:`, error)
    return []
  }
}

// 读取图片为 base64
export async function readImageAsBase64(imagePath: string): Promise<string> {
  try {
    const buffer = await readFile(imagePath)
    const ext = extname(imagePath).toLowerCase()
    let mimeType = 'image/png'
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg'
        break
      case '.png':
        mimeType = 'image/png'
        break
      case '.webp':
        mimeType = 'image/webp'
        break
    }

    return `data:${mimeType};base64,${buffer.toString('base64')}`
  } catch (error) {
    console.error(`Error reading image ${imagePath}:`, error)
    return ''
  }
}

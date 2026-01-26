import { contextBridge, ipcRenderer } from 'electron'

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

const api = {
  // 选择目录
  selectDirectory: (): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:selectDirectory')
  },

  // 扫描目录结构
  scanDirectory: (rootPath: string): Promise<TreeNode[]> => {
    return ipcRenderer.invoke('fs:scanDirectory', rootPath)
  },

  // 获取文件夹中的图片列表
  getImagesInFolder: (folderPath: string): Promise<ImageFile[]> => {
    return ipcRenderer.invoke('fs:getImagesInFolder', folderPath)
  },

  // 读取图片为 base64
  readImageAsBase64: (imagePath: string): Promise<string> => {
    return ipcRenderer.invoke('fs:readImageAsBase64', imagePath)
  }
}

contextBridge.exposeInMainWorld('api', api)

// TypeScript 类型声明
declare global {
  interface Window {
    api: typeof api
  }
}

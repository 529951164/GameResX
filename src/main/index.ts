import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { scanDirectory, getImagesInFolder, readImageAsBase64 } from './fileSystem'
import {
  loadProjectConfig,
  saveProjectConfig,
  scanProjectStatistics,
  refreshStatistics,
  updateImageMetadata,
  batchUpdateFolderImages,
  updateFolderMetadata,
  type ProjectConfig,
  type ImageMetadata,
  type FolderMetadata
} from './projectConfig'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.gameresx')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC 处理器 - 文件系统
  ipcMain.handle('dialog:selectDirectory', async () => {
    console.log('[IPC] dialog:selectDirectory called')
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      console.log('[IPC] dialog:selectDirectory - user cancelled')
      return null
    }
    console.log('[IPC] dialog:selectDirectory - selected:', result.filePaths[0])
    return result.filePaths[0]
  })

  ipcMain.handle('fs:scanDirectory', async (_, rootPath: string) => {
    console.log('[IPC] fs:scanDirectory called for:', rootPath)
    const startTime = Date.now()
    const result = await scanDirectory(rootPath)
    const elapsed = Date.now() - startTime
    console.log(`[IPC] fs:scanDirectory completed in ${elapsed}ms, found ${result.length} nodes`)
    return result
  })

  ipcMain.handle('fs:getImagesInFolder', async (_, folderPath: string) => {
    console.log('[IPC] fs:getImagesInFolder called for:', folderPath)
    return await getImagesInFolder(folderPath)
  })

  ipcMain.handle('fs:readImageAsBase64', async (_, imagePath: string) => {
    console.log('[IPC] fs:readImageAsBase64 called for:', imagePath)
    return await readImageAsBase64(imagePath)
  })

  // IPC 处理器 - 项目配置
  ipcMain.handle('project:load', async (_, rootPath: string) => {
    console.log('[IPC] project:load called for:', rootPath)
    const result = await loadProjectConfig(rootPath)
    console.log('[IPC] project:load completed')
    return result
  })

  ipcMain.handle('project:save', async (_, config: ProjectConfig) => {
    return await saveProjectConfig(config)
  })

  ipcMain.handle('project:refreshStats', async (_, rootPath: string) => {
    return await refreshStatistics(rootPath)
  })

  // IPC 处理器 - 元数据管理
  ipcMain.handle(
    'project:updateImageMetadata',
    async (_, rootPath: string, imagePath: string, metadata: Partial<ImageMetadata>) => {
      return await updateImageMetadata(rootPath, imagePath, metadata)
    }
  )

  ipcMain.handle(
    'project:batchUpdateFolder',
    async (_, rootPath: string, folderPath: string, tagType: string) => {
      return await batchUpdateFolderImages(rootPath, folderPath, tagType)
    }
  )

  ipcMain.handle(
    'project:updateFolderMetadata',
    async (_, rootPath: string, folderPath: string, metadata: Partial<FolderMetadata>) => {
      return await updateFolderMetadata(rootPath, folderPath, metadata)
    }
  )

  // IPC 处理器 - 系统操作
  ipcMain.handle('system:openInExplorer', async (_, path: string) => {
    shell.showItemInFolder(path)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

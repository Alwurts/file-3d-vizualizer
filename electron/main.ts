import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import type { FileSystemItem, FolderContent } from '../src/types/fileSystem'
import { dialog } from 'electron'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Add this function to get folder content
async function getFolderContent(folderPath: string): Promise<FolderContent> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const items: FileSystemItem[] = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(folderPath, entry.name);
      const stats = await fs.stat(fullPath);
      const baseItem = {
        name: entry.name,
        path: fullPath,
        modifiedAt: stats.mtime,
      };

      if (entry.isDirectory()) {
        const folderEntries = await fs.readdir(fullPath);
        return {
          ...baseItem,
          type: 'folder' as const,
          itemCount: folderEntries.length,
        };
      } else {
        return {
          ...baseItem,
          type: 'file' as const,
          size: stats.size,
          extension: path.extname(entry.name).slice(1),
        };
      }
    })
  );

  return { items };
}

// Add this IPC handler
ipcMain.handle('get-folder-content', async (_, folderPath: string) => {
  try {
    return await getFolderContent(folderPath);
  } catch (error) {
    console.error('Error getting folder content:', error);
    throw error;
  }
});

// Add this IPC handler
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

import { ipcRenderer, contextBridge } from 'electron'
import type { FolderContent } from '../src/types/fileSystem'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  getFolderContent: (folderPath: string): Promise<FolderContent> => ipcRenderer.invoke('get-folder-content', folderPath),
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('select-folder'),
  getParentDirectory: (currentPath: string): Promise<string> => ipcRenderer.invoke('get-parent-directory', currentPath),
})

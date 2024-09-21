import { ipcMain, dialog, app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
async function getFolderContent(folderPath) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const items = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(folderPath, entry.name);
      const stats = await fs.stat(fullPath);
      const baseItem = {
        name: entry.name,
        path: fullPath,
        modifiedAt: stats.mtime
      };
      if (entry.isDirectory()) {
        const folderEntries = await fs.readdir(fullPath);
        return {
          ...baseItem,
          type: "folder",
          itemCount: folderEntries.length
        };
      } else {
        return {
          ...baseItem,
          type: "file",
          size: stats.size,
          extension: path.extname(entry.name).slice(1)
        };
      }
    })
  );
  return { items };
}
ipcMain.handle("get-folder-content", async (_, folderPath) => {
  try {
    return await getFolderContent(folderPath);
  } catch (error) {
    console.error("Error getting folder content:", error);
    throw error;
  }
});
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});
ipcMain.handle("get-parent-directory", (_, currentPath) => {
  return path.dirname(currentPath);
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};

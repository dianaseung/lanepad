import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import Store from 'electron-store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const store = new Store()

let win

function createWindow() {
    win = new BrowserWindow({
        width: 1400,
        height: 900,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 12, y: 12 },
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    win.webContents.on('before-input-event', (event, input) => {
        if (input.meta && input.key === 'n') {
            event.preventDefault()
            win.webContents.send('menu-new-page')
        }
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'))
    }
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// ── Folder handling ──────────────────────────────────────────────

ipcMain.handle('get-last-folder', () => {
    return store.get('lastFolder', null)
})

ipcMain.handle('get-recent-folders', () => {
    return store.get('recentFolders', [])
})

ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
    })
    if (result.canceled) return null
    const folderPath = result.filePaths[0]
    store.set('lastFolder', folderPath)

    // Update recent folders — keep last 3, no duplicates
    const recent = store.get('recentFolders', [])
    const updated = [folderPath, ...recent.filter(f => f !== folderPath)].slice(0, 3)
    store.set('recentFolders', updated)

    return folderPath
})

ipcMain.handle('set-last-folder', (_, folderPath) => {
    store.set('lastFolder', folderPath)

    // Update recent folders
    const recent = store.get('recentFolders', [])
    const updated = [folderPath, ...recent.filter(f => f !== folderPath)].slice(0, 3)
    store.set('recentFolders', updated)
})

// ── File system ──────────────────────────────────────────────────

ipcMain.handle('list-pages', (_, folderPath) => {
    try {
        const files = fs.readdirSync(folderPath)
        return files.filter(f => f.endsWith('.lanepad'))
    } catch {
        return []
    }
})

ipcMain.handle('read-page', (_, folderPath, fileName) => {
    const filePath = path.join(folderPath, fileName)
    try {
        const raw = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(raw)
    } catch {
        return null
    }
})

ipcMain.handle('write-page', (_, folderPath, fileName, data) => {
    const filePath = path.join(folderPath, fileName)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
})

ipcMain.handle('delete-page', (_, folderPath, fileName) => {
    const filePath = path.join(folderPath, fileName)
    try {
        fs.unlinkSync(filePath)
        return true
    } catch {
        return false
    }
})

ipcMain.handle('rename-page', (_, folderPath, oldName, newName) => {
    const oldPath = path.join(folderPath, oldName)
    const newPath = path.join(folderPath, newName)
    try {
        fs.renameSync(oldPath, newPath)
        return true
    } catch {
        return false
    }
})
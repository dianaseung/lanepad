const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('lanepad', {
    getLastFolder: () => ipcRenderer.invoke('get-last-folder'),
    getRecentFolders: () => ipcRenderer.invoke('get-recent-folders'),
    openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
    setLastFolder: (p) => ipcRenderer.invoke('set-last-folder', p),
    listPages: (folder) => ipcRenderer.invoke('list-pages', folder),
    readPage: (folder, file) => ipcRenderer.invoke('read-page', folder, file),
    writePage: (folder, file, data) => ipcRenderer.invoke('write-page', folder, file, data),
    deletePage: (folder, file) => ipcRenderer.invoke('delete-page', folder, file),
    renamePage: (folder, oldName, newName) => ipcRenderer.invoke('rename-page', folder, oldName, newName),
    onNewPage: (callback) => ipcRenderer.on('menu-new-page', callback),
})
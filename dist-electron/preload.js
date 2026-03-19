//#region \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, { get: (a, b) => (typeof require !== "undefined" ? require : a)[b] }) : x)(function(x) {
	if (typeof require !== "undefined") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + x + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
});
//#endregion
//#region electron/preload.cjs
var require_preload = /* @__PURE__ */ __commonJSMin((() => {
	var { contextBridge, ipcRenderer } = __require("electron");
	contextBridge.exposeInMainWorld("lanepad", {
		getLastFolder: () => ipcRenderer.invoke("get-last-folder"),
		openFolderDialog: () => ipcRenderer.invoke("open-folder-dialog"),
		setLastFolder: (p) => ipcRenderer.invoke("set-last-folder", p),
		listPages: (folder) => ipcRenderer.invoke("list-pages", folder),
		readPage: (folder, file) => ipcRenderer.invoke("read-page", folder, file),
		writePage: (folder, file, data) => ipcRenderer.invoke("write-page", folder, file, data),
		deletePage: (folder, file) => ipcRenderer.invoke("delete-page", folder, file),
		renamePage: (folder, oldName, newName) => ipcRenderer.invoke("rename-page", folder, oldName, newName),
		onNewPage: (callback) => ipcRenderer.on("menu-new-page", callback)
	});
}));
//#endregion
export default require_preload();

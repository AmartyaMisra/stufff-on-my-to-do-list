// preload.cjs - CommonJS preload
const { contextBridge, ipcRenderer } = require('electron')

try {
	contextBridge.exposeInMainWorld('native', {
		proxyFetchJson: async (url, headers) => {
			const res = await ipcRenderer.invoke('proxyFetchJson', { url, headers })
			return res
		}
	})
} catch {}

console.log('FlightRadar preload (CJS) loaded')

// main.js (ESM) - Enhanced for better desktop performance and reliability

import { app, BrowserWindow, shell } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { ipcMain } from 'electron'

// ---------- Performance optimizations ----------
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-oop-rasterization");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("disable-web-security");
app.commandLine.appendSwitch("allow-running-insecure-content");
app.commandLine.appendSwitch("disable-features", "VizDisplayCompositor");

// ---------- __dirname for ESM ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Enhanced Logger ----------
const logPath = path.join(app.getPath("userData"), "flightradar-electron.log");
let logStream;
try { 
  logStream = fs.createWriteStream(logPath, { flags: "a" }); 
} catch (e) {
  console.error("Failed to create log file:", e);
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { 
    logStream?.write(line); 
  } catch {}
  console.log(line.trim());
}

// ---------- Single instance ----------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  log("Another instance is already running");
  app.quit();
}

app.on("second-instance", () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// ---------- Enhanced path resolution ----------
function preloadPath() {
  const cjs = path.join(__dirname, "preload.cjs");
  if (fs.existsSync(cjs)) {
    log("✅ preload.cjs found: " + cjs);
    return cjs;
  }
  const js = path.join(__dirname, "preload.js");
  if (fs.existsSync(js)) {
    log("✅ preload.js found: " + js);
    return js;
  }
  log("⚠️ preload not found, continuing without preload");
  return undefined;
}

function entryTarget() {
  const prodIndex = path.join(__dirname, "dist", "index.html");
  if (fs.existsSync(prodIndex)) {
    log("📦 Using production build: " + prodIndex);
    return { type: "file", value: prodIndex };
  }
  const isDev = process.env.NODE_ENV === 'development' || !fs.existsSync(path.join(__dirname, "dist"));
  if (isDev) {
    const devURL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    log("🌐 Using dev server: " + devURL);
    return { type: "url", value: devURL };
  }
  const rootIndex = path.join(__dirname, "index.html");
  if (fs.existsSync(rootIndex)) {
    log("🛠️ Using root index.html (fallback): " + rootIndex);
    return { type: "file", value: rootIndex };
  }
  log("❌ No valid entry point found");
  return null;
}

let mainWindow;

function createWindow() {
  try {
    log("🚀 Creating main window...");
    
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      backgroundColor: "#0b1020",
      show: false,
      title: "FlightRadar • 24×7",
      webPreferences: {
        preload: preloadPath(),
        contextIsolation: true,
        nodeIntegration: false,
        webviewTag: true,
        backgroundThrottling: false,
        enableRemoteModule: false,
        webSecurity: false,
        allowRunningInsecureContent: true,
        experimentalFeatures: true,
        enableBlinkFeatures: "OverlayScrollbars"
      },
    });

    const target = entryTarget();
    if (!target) {
      showErrorPage(mainWindow, "No valid entry point found. Please run 'npm run build' first.");
      return;
    }

    mainWindow.webContents.on("did-fail-load", (e, code, desc, url) => {
      log(`❌ did-fail-load code=${code} desc=${desc} url=${url || ""}`);
      if (code === -6) {
        showErrorPage(mainWindow, "Application files not found. Please run 'npm run build' first.");
      }
    });

    mainWindow.webContents.on("render-process-gone", (_, details) => {
      log(`💥 render-process-gone: ${JSON.stringify(details)}`);
    });

    mainWindow.webContents.on("console-message", (e, level, message, line, source) => {
      log(`🖥️ Renderer [${level}]: ${message} (${source}:${line})`);
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      log("🔗 External URL requested: " + url);
      shell.openExternal(url);
      return { action: "deny" };
    });

    if (target.type === "file") {
      mainWindow.loadFile(target.value)
        .then(() => {
          log("✅ Successfully loaded file: " + target.value);
          setTimeout(() => { try { mainWindow.webContents.reloadIgnoringCache(); } catch {} }, 800);
        })
        .catch(err => {
          log("❌ Failed to load file: " + err);
          showErrorPage(mainWindow, "Failed to load application files. Please rebuild the app.");
        });
    } else {
      mainWindow.loadURL(target.value)
        .then(() => log("✅ Successfully loaded URL: " + target.value))
        .catch(err => {
          log("❌ Failed to load URL: " + err);
          showErrorPage(mainWindow, "Failed to load development server. Please run 'npm run dev' first.");
        });
    }

    mainWindow.once("ready-to-show", () => {
      log("🟢 Window ready to show");
      mainWindow.show();
      if (!mainWindow.isFocused()) mainWindow.focus();
    });

    mainWindow.webContents.on("did-navigate", (_, url) => { log("🧭 Navigated to: " + url); });
    mainWindow.webContents.on("did-navigate-in-page", (_, url) => { log("🧭 In-page navigation to: " + url); });

  } catch (err) {
    log("💀 Fatal error in createWindow: " + (err?.stack || err));
  }
}

app.on("ready", () => { log("🚀 Electron app ready"); createWindow(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) { log("🔁 App activated, creating window"); createWindow(); } });
app.on("window-all-closed", () => { log("🔴 All windows closed"); if (process.platform !== "darwin") { app.quit(); } });

process.on("uncaughtException", (e) => { log("🔥 uncaughtException: " + (e?.stack || e)); });
process.on("unhandledRejection", (e) => { log("🔥 unhandledRejection: " + (e?.stack || e)); });

app.on("web-contents-created", (_, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// IPC: proxy JSON fetch through main process (bypasses CORS)
ipcMain.handle('proxyFetchJson', async (_evt, req) => {
	try {
		const res = await fetch(req?.url, { headers: req?.headers || {} })
		const text = await res.text()
		return { ok: res.ok, status: res.status, body: text }
	} catch (e) {
		return { ok: false, status: 0, body: '', error: e?.message || String(e) }
	}
})

function showErrorPage(window, message) {
  const errorHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>FlightRadar - Error</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1020; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
        .error-container { max-width: 400px; padding: 2rem; }
        .error-icon { font-size: 3rem; margin-bottom: 1rem; }
        .error-title { font-size: 1.5rem; margin-bottom: 1rem; color: #ff6b6b; }
        .error-message { color: #ccc; margin-bottom: 2rem; line-height: 1.5; }
        .retry-button { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .retry-button:hover { background: #45a049; }
      </style>
    </head>
    <body>
      <div class="error-container">
        <div class="error-icon">✈️</div>
        <div class="error-title">FlightRadar</div>
        <div class="error-message">${message}</div>
        <button class="retry-button" onclick="location.reload()">Retry</button>
      </div>
    </body>
    </html>
  `;
  window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHTML)}`);
}

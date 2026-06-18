const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    frame: false,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Dynamic import wrapper for node-fetch (ESM)
const fetchModule = (...args) => 
  import('node-fetch').then(m => m.default(...args));

// Fetch stations from RadioBrowser API
ipcMain.handle('fetch-stations', async (event, tag) => {
  const endpoints = [
    `https://de1.api.radio-browser.info/json/stations/bytag/${tag}`,
    `https://nl1.api.radio-browser.info/json/stations/bytag/${tag}`
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetchModule(endpoint, {
        headers: { 'User-Agent': 'BlackOpsRadioGlobe/1.0' }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      // Map to our format
      const stations = data
        .filter(s => s.url_resolved && s.geo_lat && s.geo_long)
        .slice(0, 100) // Limit to 100 stations
        .map(s => ({
          name: s.name,
          url: s.url_resolved,
          country: s.country,
          lat: parseFloat(s.geo_lat),
          lon: parseFloat(s.geo_long),
          tags: tag
        }));
      
      return stations;
    } catch (error) {
      console.error(`Failed to fetch from ${endpoint}:`, error);
    }
  }

  // Fallback to seeds.json
  try {
    const seedsPath = path.join(__dirname, 'seeds.json');
    const seedsData = fs.readFileSync(seedsPath, 'utf8');
    const seeds = JSON.parse(seedsData);
    return seeds.filter(s => s.tags.includes(tag));
  } catch (error) {
    console.error('Failed to load seeds.json:', error);
    return [];
  }
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.on('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  mainWindow.close();
});
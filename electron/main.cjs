const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0f0f11',
    icon: path.join(__dirname, '../public/icon.ico'),
    autoHideMenuBar: true,
    title: 'DUBAI PIZZA SHOP POS',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Load from local build dist or dev server
  const distPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for safe desktop printing, backup saving, and dialogs
ipcMain.handle('get-app-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('print-thermal-receipt', async (event, content) => {
  // Silent print or print to specified printer
  if (!mainWindow) return { success: false, error: 'No active window' };
  return new Promise((resolve) => {
    mainWindow.webContents.print(
      {
        silent: false,
        printBackground: true,
        margins: { marginType: 'none' },
      },
      (success, failureReason) => {
        resolve({ success, failureReason });
      }
    );
  });
});

ipcMain.handle('show-save-backup-dialog', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Dubai Pizza Shop POS Backup',
    defaultPath: defaultName || `DubaiPizzaShop_Backup_${Date.now()}.json`,
    filters: [{ name: 'JSON Backup (*.json)', extensions: ['json'] }],
  });
  return result;
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronPOS', {
  isDesktop: true,
  platform: process.platform,
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  printThermalReceipt: (content) => ipcRenderer.invoke('print-thermal-receipt', content),
  showSaveBackupDialog: (defaultName) => ipcRenderer.invoke('show-save-backup-dialog', defaultName),
});

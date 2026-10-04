const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');

// Only these actions can ever be launched. No arbitrary commands.
const ACTIONS = {
  wifi:      { label: 'Wi-Fi settings',      uri: 'ms-settings:network-wifi' },
  bluetooth: { label: 'Bluetooth settings',  uri: 'ms-settings:bluetooth' },
  display:   { label: 'Display settings',    uri: 'ms-settings:display' },
  sound:     { label: 'Sound settings',      uri: 'ms-settings:sound' },
  update:    { label: 'Windows Update',      uri: 'ms-settings:windowsupdate' },
  downloads: { label: 'Downloads folder',    folder: 'downloads' }
};

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 980, height: 680, minWidth: 760, minHeight: 560,
    backgroundColor: '#2a0a14', title: 'CozyDesk', autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, backgroundThrottling: true
    }
  });
  win.loadFile('index.html');
}

ipcMain.handle('system-action', async (_e, key) => {
  const a = ACTIONS[key];
  if (!a) return false;
  const { response } = await dialog.showMessageBox(win, {
    type: 'question', buttons: ['Yes', 'Cancel'], defaultId: 1, cancelId: 1,
    message: `Open ${a.label}?`
  });
  if (response !== 0) return false;
  if (a.uri) await shell.openExternal(a.uri);
  else await shell.openPath(app.getPath(a.folder));
  return true;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

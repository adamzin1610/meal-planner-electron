const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let plannerWindow;

const dataFile = path.join(__dirname, 'meals.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('renderer/index.html');
}

app.whenReady().then(createWindow);

/* OPEN PLANNER */
ipcMain.on('open-planner', (event, meal = null) => {
  if (plannerWindow && !plannerWindow.isDestroyed()) {
    plannerWindow.show();
    if (meal) plannerWindow.webContents.send('meal-data', meal);
    return;
  }

  plannerWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  plannerWindow.loadFile('renderer/planner.html');

  plannerWindow.webContents.once('did-finish-load', () => {
    if (meal) plannerWindow.webContents.send('meal-data', meal);
  });

  plannerWindow.on('closed', () => {
    plannerWindow = null;
  });
});

/* SAVE MEAL */
ipcMain.on('save-meal', (e, meal) => {
  let meals = [];
  if (fs.existsSync(dataFile)) {
    meals = JSON.parse(fs.readFileSync(dataFile));
  }
  meals.push(meal);
  fs.writeFileSync(dataFile, JSON.stringify(meals, null, 2));
});

/* LOAD MEAL */
ipcMain.handle('load-meals', () => {
  if (!fs.existsSync(dataFile)) return [];
  return JSON.parse(fs.readFileSync(dataFile));
});

/* DELETE MEAL */
ipcMain.on('delete-meal', (e, index) => {
  let meals = JSON.parse(fs.readFileSync(dataFile));
  meals.splice(index, 1);
  fs.writeFileSync(dataFile, JSON.stringify(meals, null, 2));
});

/* UPDATE MEAL */
ipcMain.on('update-meal', (e, payload) => {
  let meals = JSON.parse(fs.readFileSync(dataFile));
  meals[payload.index] = payload.data;
  fs.writeFileSync(dataFile, JSON.stringify(meals, null, 2));
});
"use strict";

const path = require("node:path");
const { app, BrowserWindow } = require("electron");

const APP_ID = "com.louis776.ironbreakout";

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    title: "钢铁突围",
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#05070a",
    autoHideMenuBar: true,
    fullscreenable: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.maximize();

  mainWindow.once("ready-to-show", function () {
    mainWindow.show();
    mainWindow.focus();
  });

  // 禁止游戏页面打开任意新窗口，外部 CDN 只负责加载 Three.js 脚本。
  mainWindow.webContents.setWindowOpenHandler(function () {
    return { action: "deny" };
  });

  // F11 可以在无边框全屏与普通最大化窗口之间切换。
  mainWindow.webContents.on("before-input-event", function (event, input) {
    if (input.type === "keyDown" && input.key === "F11") {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));
}

app.setAppUserModelId(APP_ID);

app.whenReady().then(function () {
  createMainWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

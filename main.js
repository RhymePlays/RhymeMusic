const {app, BrowserWindow, Menu} = require("electron")

// Main Window
function createMainWin(){
    win = new BrowserWindow({
        "width": 800,
        "height": 500,
        "frame": false,
        "webPreferences": {
            "nodeIntegration": true,
            "enableRemoteModule": true
        }
    })

    win.loadFile("Pages/Global.html")
    win.webContents.openDevTools()
}

// Start App
app.on("ready", createMainWin)

// Stop App (Not necessary)
app.on("window-all-closed", () => {app.quit()}) //On Close Tasks
const {app, BrowserWindow, screen} = require("electron")

// Main Window
function createMainWin(){
    const {width, height} = screen.getPrimaryDisplay().workAreaSize
    console.log(width, height)

    win = new BrowserWindow({
        "width": width > 900 ? (width - 50) : 900,
        "height": height > 500 ? (height - 50) : 500,
        "minHeight":500,
        "minWidth":900,
        "frame": false,
        "webPreferences": {
            "nodeIntegration": true,
            "enableRemoteModule": true
        }
    })

    win.loadFile("Pages/MainPage.html")
}

// Start App
app.on("ready", createMainWin)

// Stop App (Not necessary)
app.on("window-all-closed", () => {app.quit()}) //On Close Tasks
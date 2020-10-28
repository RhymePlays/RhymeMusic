const {app, BrowserWindow, screen, ipcMain} = require("electron")

// Main Window
function createMainWin(){
    const {width, height} = screen.getPrimaryDisplay().workAreaSize

    var win = new BrowserWindow({
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
    win.webContents.openDevTools()
}

// Add Window
function createAddWin(){
    var addWin = new BrowserWindow({
        "width": 400,
        "height": 600,
        "minHeight": 500,
        "minWidth": 300,
        "frame": false,
        "webPreferences": {
            "nodeIntegration": true,
            "enableRemoteModule": true
        }
    })
    
    addWin.loadFile("Pages/CreateRhymemusicPage/CreateRhymemusicPage.html")
    addWin.webContents.openDevTools()
}

ipcMain.on("createAddWindow", (event, arg)=>{
    createAddWin()
    ipcMain.on("getAddWin", (event)=>{
        event.sender.send("addWinMusicRawPath", arg)
    })
})

// Start App
app.on("ready", createMainWin)

// Stop App (Not necessary)
app.on("window-all-closed", () => {app.quit()}) //On Close Tasks
const {getCurrentWindow, dialog} = require('electron').remote
const {ipcRenderer} = require('electron')
const path = require("path")
const fs = require("fs")
const JSZip = require('jszip')

// Variables
var win = getCurrentWindow()

var vars = {
    "musicFileLoc": null,
    "musicDataInBin": null,
    "musicPath": null,

    "imageDataInBin": null,
    "imagePath": null
}

ipcRenderer.send("getAddWin", "ready")
ipcRenderer.on("addWinMusicRawPath", (event, arg)=>{
    vars.musicFileLoc = arg
    vars.musicDataInBin = fs.readFileSync(arg)
    vars.musicPath = path.parse(arg)
})

// Functions
function closeWindow(){win.close()}

function selectImageButton(){
    try{
        var imageRawPath = dialog.showOpenDialogSync({filters: [{"name": 'Image', "extensions": ['jpg', "jpeg", "png", "tiff", "bmp", "gif", "webp"]}]})[0]
    
        vars.imagePath = path.parse(imageRawPath)
        vars.imageDataInBin = fs.readFileSync(imageRawPath)

        document.getElementById("ImageView").style.backgroundImage = "url(data:image/gif;base64,"+vars.imageDataInBin.toString("base64")+")"
    }
    catch(e){null}
}

async function createButton(){
    if(document.getElementById("MusicNameEntry").value!=""){
        const zipMaker = new JSZip();
        var songData={
            "displayName": document.getElementById("MusicNameEntry").value,
            "artist": document.getElementById("ArtistEntry").value==""? null: document.getElementById("ArtistEntry").value,
            "url": document.getElementById("URLEntry").value==""? null: document.getElementById("URLEntry").value,
            "tags": document.getElementById("TagsEntry").value==""? null: document.getElementById("TagsEntry").value.split(" "),
            "lyrics": document.getElementById("LyricsEntry").value==""? null: document.getElementById("LyricsEntry").value.replaceAll("\n", "<br>"),
            "musicFormat": vars.musicPath.ext.split(".")[1],
            "imageFormat": vars.imagePath? vars.imagePath.ext.split(".")[1]: null,
        }
    
        zipMaker.file("data.json", JSON.stringify(songData))
        vars.imageDataInBin==null? null: zipMaker.file("image."+songData.imageFormat, vars.imageDataInBin)
        zipMaker.file("music."+songData.musicFormat, vars.musicDataInBin)
    
        var NewZipData = await zipMaker.generateAsync({"type": "nodebuffer"})
        fs.writeFileSync(vars.musicPath.dir+"/"+songData.displayName+".rhymemusic", NewZipData)
    
        ipcRenderer.send("requestedFileReady", vars.musicPath.dir+"/"+songData.displayName+".rhymemusic")
        closeWindow()
    }else{
        document.getElementById("CreateButton").style.background = "#FB1E46"
        document.getElementById("CreateButton").style.color = "#F3F3F3"
        setTimeout(()=>{
            document.getElementById("CreateButton").style.background = "#25FFB1"
            document.getElementById("CreateButton").style.color = "#303030"
        }, 2500)
    }
}
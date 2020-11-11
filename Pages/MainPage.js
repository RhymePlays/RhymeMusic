const {BrowserWindow, getCurrentWindow, dialog, app} = require('electron').remote
const {ipcRenderer} = require('electron')
const fs = require('fs')
const path = require('path')
const decompress = require('decompress')
const JSZip = require('jszip')

// Variables
var win = getCurrentWindow()
var variables = {
    "currentSaveRhymeMusicFileID": 0,
    "audioPlayer": new Audio,
    "audioPlaying": false,
    "controlsEnabled": false,
    "suffleLoop": 0,
    "currentSongName": "",
    "currentSongUrl": "",
    "currentSongLength": "",
    "currentSongLyrics": null,
    "prePlayList": "",
    "preSongId": "",
    "allMusics": [],
    "appdataLoc": app.getPath("documents")+"\\RhymeMusic.json",
    "musicLoadFolder": app.getPath('userData')+"\\MusicLoadFolder\\",
    "rhymeMusicsFolder": app.getPath("music")+"\\RhymeMusic\\",
    "cacheFolder": app.getPath("userData")+"\\Cache\\",
    "musicsImageFolder": (app.getPath("userData")+"\\MusicImages\\").replace(/\\/g, "/"),
    "PlaylistItemContainer": document.getElementById("PlaylistItems"),
    "SongItemContainer": document.getElementById("MainBody"),
};

// TitleBarLogic
win.on("maximize", () => {document.getElementById("MaximizeButton").innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M6 16h2v2c0 .55.45 1 1 1s1-.45 1-1v-3c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1s.45 1 1 1zm2-8H6c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1s-1 .45-1 1v2zm7 11c.55 0 1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1h-3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1zm1-11V6c0-.55-.45-1-1-1s-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1h-2z"/></svg>'})
win.on("unmaximize", () => {document.getElementById("MaximizeButton").innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M6 14c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1H7v-2c0-.55-.45-1-1-1zm0-4c.55 0 1-.45 1-1V7h2c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1zm11 7h-2c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1s-1 .45-1 1v2zM14 6c0 .55.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1z"/></svg>'})
function closeWindow(){win.close()}
function maximizeWindow(){win.isMaximized() ? win.unmaximize() : win.maximize()}
function minimizeWindow(){win.minimize()}
function addMusic(){
    try{
        var musicRawPath = dialog.showOpenDialogSync({filters: [{"name": 'RhymeMusic', "extensions": ['rhymemusic', "mp3", "wav", "m4a", "aac", "ogg", "webm"]}]})[0]
        var musicPath = path.parse(musicRawPath)

        if (musicPath.ext == ".rhymemusic"){
            saveRhymeMusicFile(musicRawPath)
        }
        else if ([".mp3", ".wav", ".m4a", ".aac", ".ogg", ".webm"].includes(musicPath.ext)){
            ipcRenderer.send("createAddWindow", musicRawPath)
            ipcRenderer.on("getAddWinReturnedFile", (event, arg)=>{saveRhymeMusicFile(arg)})
        }
    }catch(e){null}
}






/* ipc Side Start */
function openCurrentSongInMiniPlayer(){
    if(variables.controlsEnabled){
        ipcRenderer.send("createMiniWindow", {"data":"here"})
    }
}
/* ipc Side Start */






/* dataControl BackEnd Side Start */
// save .rhymemusic
async function saveRhymeMusicFile(musicRawPath){
    if (fs.existsSync(variables.rhymeMusicsFolder)){
        if (fs.existsSync(variables.rhymeMusicsFolder+variables.currentSaveRhymeMusicFileID.toString()+".rhymemusic")){variables.currentSaveRhymeMusicFileID=variables.currentSaveRhymeMusicFileID+1;saveRhymeMusicFile(musicRawPath)}
        else{
            // Clearing File
            clearCache()
            
            // Extracting given file
            await extractRhymeMusicFile(musicRawPath)
            
            // Editing Song Data
            var songData = JSON.parse(fs.readFileSync(variables.cacheFolder+"data.json", "utf-8"))
            songData.id=variables.currentSaveRhymeMusicFileID
            songData.songLength= await getSongLength(variables.cacheFolder+"music."+songData.musicFormat)
            fs.writeFileSync(variables.cacheFolder+"data.json", JSON.stringify(songData))

            // Saving .rhymemusic File
            zipMaker = new JSZip()
            var cacheFolder = fs.readdirSync(variables.cacheFolder)
            for (fileIndex in cacheFolder){zipMaker.file(cacheFolder[fileIndex], fs.readFileSync(variables.cacheFolder+cacheFolder[fileIndex]))}
            var NewZipData = await zipMaker.generateAsync({"type": "nodebuffer"})
            fs.writeFileSync(variables.rhymeMusicsFolder+variables.currentSaveRhymeMusicFileID.toString()+".rhymemusic", NewZipData)

            // Reseting currentSaveRhymeMusicFileID
            variables.currentSaveRhymeMusicFileID=0

            // Fetching All Musics
            fetchAllMusic()
        }
    }
    else{fs.mkdirSync(variables.rhymeMusicsFolder);saveRhymeMusicFile(musicRawPath)}
}

// clearCache
function clearCache(){
    if(fs.existsSync(variables.cacheFolder)){
        try{
            var folderFiles = fs.readdirSync(variables.cacheFolder)
            for (fileIndex in folderFiles){fs.unlinkSync(variables.cacheFolder+folderFiles[fileIndex])}
        }catch(e){null}
    }
}
function clearMusicLoadFolder(){
    if(fs.existsSync(variables.musicLoadFolder)){
        try{
            var folderFiles = fs.readdirSync(variables.musicLoadFolder)
            for (fileIndex in folderFiles){fs.unlinkSync(variables.musicLoadFolder+folderFiles[fileIndex])}
        }catch(e){null}
    }
}
function clearMusicsImageFolder(){
    if(fs.existsSync(variables.musicsImageFolder)){
        try{
            var folderFiles = fs.readdirSync(variables.musicsImageFolder)
            for (fileIndex in folderFiles){fs.unlinkSync(variables.musicsImageFolder+folderFiles[fileIndex])}
        }catch(e){null}
    }
}

// .rhymemusicExtract
async function extractRhymeMusicFile(fileLocation){
    if (fs.existsSync(variables.cacheFolder)){await decompress(fileLocation, variables.cacheFolder)}
    else{fs.mkdirSync(variables.cacheFolder);await extractRhymeMusicFile(fileLocation)}
}

// Load Songs To Cache
async function loadSong(id){
    if(fs.existsSync(variables.musicLoadFolder)){
        clearCache()
        await extractRhymeMusicFile(variables.rhymeMusicsFolder+id.toString()+".rhymemusic")
        
        var songData = JSON.parse(fs.readFileSync(variables.cacheFolder+"data.json", "utf-8"))
        variables.currentSongUrl= songData.url? songData.url : ""
        variables.currentSongLength= songData.songLength
        variables.currentSongLyrics= songData.lyrics
        variables.currentSongName= songData.displayName
        
        try{
            document.getElementById("Song"+variables.preSongId.toString()).getElementsByClassName("SongItemInfo")[0].style.background = "#1BADFF"
            document.getElementById("Song"+variables.preSongId.toString()).getElementsByClassName("SongItemPlay")[0].style.fill = "#1BADFF"
        }catch(e){null}
        document.getElementById("Song"+songData.id.toString()).getElementsByClassName("SongItemInfo")[0].style.background = "#25FFB1"
        document.getElementById("Song"+songData.id.toString()).getElementsByClassName("SongItemPlay")[0].style.fill = "#25FFB1"
        variables.preSongId=songData.id
        
        try{clearMusicLoadFolder()}catch(e){null}
        var songBinary = fs.readFileSync(variables.cacheFolder+"music."+songData.musicFormat)
        fs.writeFileSync(variables.musicLoadFolder+songData.id.toString()+"."+songData.musicFormat, songBinary)
        
        variables.audioPlayer.src=variables.musicLoadFolder+songData.id.toString()+"."+songData.musicFormat;
        ToggleButtons(true)
    }else{fs.mkdirSync(variables.musicLoadFolder);loadSong(id)}
}
async function loadAndPlaySong(id){await loadSong(id);variables.audioPlayer.play();refreshSongInfo()}

// FormatedMusicLength
function formatSongLength(durationRaw){return Math.floor(durationRaw/60).toString()+":"+Math.floor(durationRaw-(Math.floor(durationRaw/60)*60)).toString()}
function getSongLength(songLoc){
    return new Promise((resolve)=>{
        var localAudioPlayer = new Audio()
        localAudioPlayer.src = songLoc
        localAudioPlayer.addEventListener("loadedmetadata", function(){
            var durationRaw = localAudioPlayer.duration
            resolve(formatSongLength(durationRaw))
        })
    })
}

// onMusicEnd
variables.audioPlayer.addEventListener("ended", ()=>{
    variables.audioPlayer.pause();
    if(variables.suffleLoop==1){
        playNextSong()
    }else if(variables.suffleLoop==2){
        loadAndPlaySong(variables.preSongId)
    }else{null}
})

// Export Song
function exportSong(id){
    try{
        var songDataInBin=fs.readFileSync(variables.rhymeMusicsFolder+id.toString()+".rhymemusic")
        var saveDir = dialog.showSaveDialogSync({
            title: "Export RhymeMusic",
            buttonLabel: "Export",
            defaultPath: "Music",
            filters: [{"name": 'RhymeMusic', "extensions": ['rhymemusic']}],
        })

        saveDir? fs.writeFileSync(saveDir, songDataInBin): null
    }catch(e){null}
}

// Delete Song
function deleteSong(songId){
    try{
        fs.unlinkSync(variables.rhymeMusicsFolder+songId.toString()+".rhymemusic")
        closeOverPage()
        fetchAllMusic()
    }catch(e){null}
}

// Create Playlists
function createPlaylist(songId){
    var playlistName = document.getElementById("CreatePlaylistEntry").value

    var appdata = JSON.parse(fs.readFileSync(variables.appdataLoc, "utf-8"))
    try{
        appdata.playlists.push({"PlaylistItemName": playlistName, "songsIDs": []})
    }catch(e){
        appdata["playlists"]=[]
        appdata.playlists.push({"PlaylistItemName": playlistName, "songsIDs": []})
    }
    
    fs.writeFileSync(variables.appdataLoc, JSON.stringify(appdata))
    showSongMorePlaylistOverPage(songId)
    PopulatePlaylist()
}

// Add To Platlist
function addToPlaylist(songId, playlistId){
    var appdata = JSON.parse(fs.readFileSync(variables.appdataLoc, "utf-8"))
    if (appdata.playlists[playlistId].songsIDs.includes(songId)==false){
        appdata.playlists[playlistId].songsIDs.push(songId)
    }
    fs.writeFileSync(variables.appdataLoc, JSON.stringify(appdata))
    showSongMorePlaylistOverPage(songId)
}

// Remove From Playlist
function removeFromPlaylist(songId, playlistId){
    var appdata = JSON.parse(fs.readFileSync(variables.appdataLoc, "utf-8"))
    if (appdata.playlists[playlistId].songsIDs.includes(songId)){
        var removeIndex = appdata.playlists[playlistId].songsIDs.indexOf(songId)
        appdata.playlists[playlistId].songsIDs.splice(removeIndex, 1);
    }
    fs.writeFileSync(variables.appdataLoc, JSON.stringify(appdata))
    showSongMorePlaylistOverPage(songId)
}

// Get Song lyrics
async function getSongLyricsById(id){
    await extractRhymeMusicFile(variables.rhymeMusicsFolder+id.toString()+".rhymemusic")
    var songData = JSON.parse(fs.readFileSync(variables.cacheFolder+"data.json"))

    if(songData.lyrics==undefined){
        return [songData.displayName, null]
    }else{
        return [songData.displayName, songData.lyrics]
    }
}
/* dataControl BackEnd Side End */






/* Media Control Side Start */
// openSongUrl
function openSongUrl(){if (variables.currentSongUrl!=""){require("electron").shell.openExternal(variables.currentSongUrl);}}

// SetSongInfo
function refreshSongInfo(){
    try{
        var songData = JSON.parse(fs.readFileSync(variables.cacheFolder+"data.json", "utf-8"))
        // try{var songImageData=fs.readFileSync(variables.cacheFolder+"image."+songData.imageFormat)}catch(e){null}
        if(fs.existsSync(variables.musicsImageFolder+songData.id+'.'+songData.imageFormat)){
            document.getElementById("SongInfoPicture").style.backgroundImage='url('+variables.musicsImageFolder+songData.id+'.'+songData.imageFormat+')'
        }else{
            document.getElementById("SongInfoPicture").style.backgroundImage="none"
        }
        document.getElementById("SongInfoName").innerHTML=songData.displayName
        document.getElementById("SongInfoArtist").innerHTML=songData.artist
        document.getElementById("SongInfoGenre").innerHTML=songData.tags
    }catch(e){
        setTimeout(refreshSongInfo, 500)
    }
}

// VolumeProgress
function refreshVolume(){
    var SoundSliderValue = document.getElementById("SoundSlider").value
    variables.audioPlayer.volume=parseInt(SoundSliderValue)/100
    document.getElementById("SoundSlider").style.background = "linear-gradient(to right, #FB1E46 "+(SoundSliderValue).toString()+"%, #606060 "+(SoundSliderValue).toString()+"%)"
}

// MusicTimeLength
function updateMusicTimeLength(){document.getElementById("SongLength").innerHTML=formatSongLength(variables.audioPlayer.currentTime)+"</br>"+variables.currentSongLength}

// MusicProgress
function refreshMusicProgress(){
    var MusicProgressValue = document.getElementById("MusicProgressBar").value
    
    document.getElementById("MusicProgressBar").style.background = "linear-gradient(to right, #FB1E46 "+(MusicProgressValue/5).toString()+"%, #505050 "+(MusicProgressValue/5).toString()+"%)"
    document.getElementById("MainActionProgress").style.background = "conic-gradient(#FB1E46 "+(MusicProgressValue/5).toString()+"%, #505050 "+(MusicProgressValue/5).toString()+"%)"
    updateMusicTimeLength()
}

function updateMusicProgressController(){
    var MusicProgressValue = document.getElementById("MusicProgressBarControl").value
    variables.audioPlayer.currentTime=((variables.audioPlayer.duration/500)*MusicProgressValue)
    refreshMusicProgress()
}
variables.audioPlayer.addEventListener("timeupdate", function() {
    document.getElementById("MusicProgressBar").value=(variables.audioPlayer.currentTime/variables.audioPlayer.duration)*500;
    refreshMusicProgress()
})

// MainAction, Next, Previous
function mainAction(){
    if(variables.controlsEnabled){
        if(variables.audioPlaying){variables.audioPlayer.pause()}
        else{variables.audioPlayer.play()}
    }
}
function playNextSong(){
    let nextSongId=variables.preSongId+1
    if(variables.controlsEnabled){
        if(variables.allMusics.length > nextSongId){
            loadAndPlaySong(nextSongId)
        }else{
            loadAndPlaySong(0)
        }
    }
}
function playPreviousSong(){
    let preSongId=variables.preSongId-1
    if(variables.controlsEnabled){
        if(0 <= preSongId){
            loadAndPlaySong(preSongId)
        }else{
            loadAndPlaySong(variables.allMusics.length-1)
        }
    }
}
/* Media Control Side End */






/* FrontBackEnd Side Start */
// PopulateMusics
async function PopulateMusics(){
    variables.SongItemContainer.innerHTML='<div id="MainBodySongInfoSpacer"></div>'

    if (fs.existsSync(variables.rhymeMusicsFolder)){
        if(fs.existsSync(variables.cacheFolder)){
            if(fs.existsSync(variables.musicsImageFolder)){
                for(MusicIndex in variables.allMusics){
                    clearCache()
                    var rhymeMusic = fs.readFileSync(variables.rhymeMusicsFolder+variables.allMusics[MusicIndex])
                    await extractRhymeMusicFile(rhymeMusic)

                    var songData = JSON.parse(fs.readFileSync(variables.cacheFolder+"data.json", "utf-8"))
                    try{
                        var songImageData=fs.readFileSync(variables.cacheFolder+"image."+songData.imageFormat)
                        fs.writeFileSync(variables.musicsImageFolder+songData.id+'.'+songData.imageFormat, songImageData)
                    }catch(e){null}

                    variables.SongItemContainer.innerHTML = variables.SongItemContainer.innerHTML + '<div id="Song'+songData.id.toString()+'" class="SongItem"><div  onclick="loadAndPlaySong('+songData.id.toString()+')" class="SongItemAction"><svg class="SongItemPlay" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/></svg></div><svg class="SongItemMore" onclick="showSongMoreOverPage('+songData.id.toString()+')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg><div class="SongItemLength">'+(songData.songLength? songData.songLength : "0:00")+'</div><div class="SongItemDisplay"></div><div class="SongItemInfo"><SongName>'+songData.displayName+'</SongName><br><OtherInfo>'+songData.artist+'<br>'+(songData.tags? songData.tags : 'N/A') +'</OtherInfo></div></div>'
                    songData.imageFormat==null? null:document.getElementById("Song"+songData.id.toString()).getElementsByClassName("SongItemDisplay")[0].style.backgroundImage='url('+variables.musicsImageFolder+songData.id+'.'+songData.imageFormat+')'
                }
            }else{fs.mkdirSync(variables.musicsImageFolder);PopulateMusics()}
        }else{fs.mkdirSync(variables.cacheFolder);PopulateMusics()}
    }else{fs.mkdirSync(variables.rhymeMusicsFolder);PopulateMusics()}
}
function fetchAllMusic(){
    try{
        variables.allMusics=[]
        var allMusicsFetch = fs.readdirSync(variables.rhymeMusicsFolder)
        for(MusicIndex in allMusicsFetch){variables.allMusics.push(allMusicsFetch[MusicIndex])}
        PopulateMusics()
    }catch(e){null}
}

// PopulatePlaylist
function PopulatePlaylist(){
    if (fs.existsSync(variables.appdataLoc)){
        variables.PlaylistItemContainer.innerHTML=""
        var appdata = JSON.parse(fs.readFileSync(variables.appdataLoc, "utf-8"))
        
        variables.PlaylistItemContainer.innerHTML=variables.PlaylistItemContainer.innerHTML+'<div id="PlaylistAll" onclick="playPlaylist(\'All\')" class="DrawerSectionItem">All</div>'
        for(Item in appdata.playlists){
            variables.PlaylistItemContainer.innerHTML=variables.PlaylistItemContainer.innerHTML+'<div id="Playlist'+Item.toString()+'" onclick="playPlaylist('+Item.toString()+')" class="DrawerSectionItem">'+appdata.playlists[Item].PlaylistItemName+'</div>'
        }
    }else{fs.writeFileSync(variables.appdataLoc, "{}");PopulatePlaylist()}
}
PopulatePlaylist()

// PlaylistControl
function setPlaylistActive(id){
    try{
        document.getElementById("Playlist"+variables.prePlayList.toString()).style.background="#606060"
        document.getElementById("Playlist"+variables.prePlayList.toString()).style.color="#F3F3F3"
    }catch(e){null}
    document.getElementById("Playlist"+id.toString()).style.background="#25FFB1"
    document.getElementById("Playlist"+id.toString()).style.color="#303030"

    variables.prePlayList=id
}
function playPlaylist(id){
    var appdata = JSON.parse(fs.readFileSync(variables.appdataLoc, "utf-8"))
    if (id=="All"){
        setPlaylistActive(id)
        fetchAllMusic()
    }else{
        var playlistSongs = appdata.playlists[id].songsIDs
        playlistSongs.sort();
        if(playlistSongs.length!=0){
            variables.allMusics=[]
            for (Items in playlistSongs){
                if(fs.existsSync(variables.rhymeMusicsFolder+playlistSongs[Items].toString()+".rhymemusic")){variables.allMusics.push(playlistSongs[Items].toString()+".rhymemusic")}
            }
            setPlaylistActive(id)
            PopulateMusics()
        }
    }
}
playPlaylist("All")
/* FrontBackEnd Side End */






/* OverPage Side Start */
function closeOverPage(){
    document.getElementById("OverPage").innerHTML=""
    document.getElementById("OverPage").style.display = "none"
}

async function showSongMoreOverPage(id){
    var rhymeMusic = fs.readFileSync(variables.rhymeMusicsFolder+id.toString()+".rhymemusic")
    await extractRhymeMusicFile(rhymeMusic)
    var songData = JSON.parse(fs.readFileSync(variables.cacheFolder+"data.json", "utf-8"))

    document.getElementById("OverPage").innerHTML=`
    <div id="SongMoreOverlay">
        <div id="SongMoreOverlayLeft">
            <div id="SongMoreOverlayDisplay"></div>
            <div id="SongMoreOverlayInfo">
                `+songData.displayName+`<br>
                `+(songData.artist || "N/A")+`<br><br>
                Tags: `+(songData.tags || "N/A")+`<br>
                URL: `+(songData.url==null? "N/A" : songData.url.split("https://")[1])+`<br>
                Length: `+songData.songLength+`<br>
                ID: `+songData.id+`
            </div>
        </div>
        <div id="SongMoreOverlayRight">
            <div id="SongMoreOverlaySplitter"></div>
            <div id="CloseSongMoreOverlay" onclick="closeOverPage()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg></div>
            <div id="SongMoreOverlayItemContainer">
                <div class="SongMoreOverlayItem" id="SongMoreOverlayItemAddtoPlaylist" onclick="showSongMorePlaylistOverPage(`+id+`)">Edit Playlists<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z"></path></svg></div>
                <div class="SongMoreOverlayItem" onclick="openSongLyricsById(`+id+`)">Open Lyrics</div>
                <div class="SongMoreOverlayItem" onclick="exportSong(`+id+`)">Export Song</div>
                
                <div class="SongMoreOverlayItem" id="SongMoreOverlayItemDeleteSong" onclick="deleteSong(`+id+`)">Delete Song<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 13H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1s-.45 1-1 1z"/></svg></div>
            </div>
        </div>
    </div>`

    songData.imageFormat==null? null : document.getElementById("SongMoreOverlayDisplay").style.backgroundImage = "url("+variables.musicsImageFolder+id.toString()+"."+songData.imageFormat+")"
    document.getElementById("OverPage").style.display = "flex"
}

function showSongMorePlaylistOverPage(songId){
    var appdata = JSON.parse(fs.readFileSync(variables.appdataLoc, "utf-8"))

    var playlistItemsTag = ""

    for(playlist in appdata.playlists){
        var playlistName = appdata.playlists[playlist].PlaylistItemName
        var playlistSongs = appdata.playlists[playlist].songsIDs
        if(playlistSongs.includes(songId)){
            playlistItemsTag = playlistItemsTag + '<div class="PlaylistItem" onclick="removeFromPlaylist('+songId.toString()+','+playlist.toString()+')">'+playlistName+'<svg class="PlaylistItemRemove" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 13H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1s-.45 1-1 1z"/></svg></div>'
        }else{
            playlistItemsTag = playlistItemsTag + '<div class="PlaylistItem" onclick="addToPlaylist('+songId.toString()+','+playlist.toString()+')">'+playlistName+'<svg class="PlaylistItemAdd" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z"></path></svg></div>'
        }
    }

    var pageData = `<div id="TextOverPage">
        <div id="CloseTextOverlay" onclick="closeOverPage()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg></div>
        <div id="TextOverPageTitle">Add to Playlist.</div><br>

        <div class="CreatePlaylistContainer">
            <input id="CreatePlaylistEntry" placeholder="Playlist Name">
            <div class="CreatePlaylistButton" onclick="createPlaylist(`+songId+`)">Create Playlist</div>
        </div>
        <hr>
        <div class="PlaylistItemContainer">`+playlistItemsTag+`</div>
    </div>`

    document.getElementById("OverPage").innerHTML=pageData
    document.getElementById("OverPage").style.display = "flex"
}

function showSettingsOverPage(){
    document.getElementById("OverPage").innerHTML=`
    <div id="TextOverPage">
        <div id="CloseTextOverlay" onclick="closeOverPage()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg></div>
        <div id="TextOverPageTitle">Settings.</div><br>

        This is supposed to be the Settings page. I haven't finished the settings page yet. (And i dont know what to put here) Sooo, enjoy reading the docs and learn how to use RhymeMusic.<br><br>
        
        <b>(1) This is a music player, to listen to music using this program, first you gotta import them. (RhymeMusic uses a custom music format [.rhymemusic], hence the importing process is important)<br>
        How to import music:</b>
        1. Click the <b>Plus(+) button</b> located at the very top-left corner of the program.<br>
        2. Select the music file that you wanna import. If the file is ".rhymemusic" format, it will import without any additional steps. But if the file format is any other audio format, you'll have to set it up.
        You have to add a title. You can also add a picture, artist, tags, source url and lyrics as shown at the picture below.<br>
        <img src="Assets/CreateRhymemusicDemo.png" alt="" style="min-width: 50px;max-width: 200px;"><br><br>

        <b>(2) When you've got some musics imported, select the "All" playlist if it isn't selected already. Click the play icon on the song item, it will start playing.</b> You can control the song from the bottom controller.<br>
        Try out each option (E.G.: Loop/Suffle, Closed Captions/Lyrics, Play/Pause, The seekbar, Clicking the song name to redirect to source, etc), there's noting to worry about and it doesn't save your preference.<br><br>

        <b>(3) To view more info about a song press the three dot on a song item.</b> It will show you all info about the song. And it will also allow you delete, export, view lyrics and add it to Playlists.

        <h3>Disclamer: <b>This is just a developer preview!</b> The above mentioned functions work properly, but some features like the search and miniplayer currently just dont work. A lot of work needs to be done. The release version of the app will be a lot more polished.</h3> 
        
    </div>`
    document.getElementById("OverPage").style.display = "flex"
}

function showAbout(){
    document.getElementById("OverPage").innerHTML=`
    <div id="TextOverPage">
        <div id="CloseTextOverlay" onclick="closeOverPage()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg></div>
        <div id="TextOverPageTitle">About.</div><br>

        RhymeMusic is a product of Isfar Tausif Rhyme.<br><br>
        RhymeMusic is a simple music player program. The RhymeMusic Project, was first started in "<b>Thu Oct 15 12:38:18 2020 +0600</b>". ElectronJS framework used in the making of this program
        Third-Party resources like <b>Material.io</b> icons and others used.<br>
        
        <b><h3>Notable features of RhymeMusic:</h3></b>
        <ul>
            <li>Basic music player features like; <b>Play</b>, <b>Pause</b>.</li>
            <li><b>Loop, Suffle.</b></li>
            <li><b>Previous & Next.</b></li>
            <li><b>Volume Control.</b></li>
            <li><b>Subtitle/Lyrics.</b></li>
            <li><b>Miniplayer</b></li>
            <li><b>Robust Playlist System</b></li>
        </ul>
        RhymeMusic uses a custom file format, "<b>.rhymemusic</b>". Song Data, Image, Lyrics and other data are saved in one file, so sharing is very easy.<br><br>

        For more information contact <a href="mailto:isfartousif2@gmail.com">isfartousif2@gmail.com</a>.<br><br>

        No one but you are responsible for the usage of this program.<br>
        Bug fixes and new stuff are being added frequently.<br><br>

        RhymeMusic V_0.1.0 (DevBuild)<br>
        Copyright © 2019 Isfar Tausif Rhyme. All rights reserved.
    </div>`
    document.getElementById("OverPage").style.display = "flex"
}
function showCredits(){
    document.getElementById("OverPage").innerHTML=`
    <div id="TextOverPage">
        <div id="CloseTextOverlay" onclick="closeOverPage()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg></div>
        <div id="TextOverPageTitle">Credits.</div><br>

        Isfar Tausif Rhyme is the sole developer behind RhymeMusic
        ElectronJS Framework and Material.io icons used.

        <h4>Follow my Social Medias.</h4>
        Instagram: <a target="blank" href="https://www.instagram.com/isfar_tausif_">https://www.instagram.com/isfar_tausif_<br></a>
        Twitter: <a target="blank" href="https://twitter.com/IsfarTousif">https://twitter.com/IsfarTousif<br></a>
        Youtube: <a target="blank" href="https://www.youtube.com/channel/UC6w168vbcWnU5WE_mHj2RiQ?sub_confirmation=1">https://www.youtube.com/channel/UC6w168vbcWnU5WE_mHj2RiQ?sub_confirmation=1<br></a>
        GitHub: <a target="blank" href="https://github.com/RhymePlays">https://github.com/RhymePlays<br></a>
        Twitch: <a target="blank" href="https://www.twitch.tv/isfar_tausif">https://www.twitch.tv/isfar_tausif<br></a>
    </div>`

    document.getElementById("OverPage").style.display = "flex"
}
function showBugReport(){
    document.getElementById("OverPage").innerHTML=`
    <div id="TextOverPage">
        <div id="CloseTextOverlay" onclick="closeOverPage()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg></div>
        <div id="TextOverPageTitle">Report Bug.</div><br>

        Describe the bug.<br>
        Take screenshots if possible.<br>
        Report to <a href="mailto:isfartousif2@gmail.com">isfartousif2@gmail.com</a><br><br>

        We'll try our best to fix the bug.
    </div>`
    
    document.getElementById("OverPage").style.display = "flex"
}
function openCurrentSongLyrics(){
    var lyrics=variables.currentSongLyrics
    if (lyrics!=null){
        document.getElementById("OverPage").innerHTML=`
        <div id="TextOverPage">
            <div id="CloseTextOverlay" onclick="closeOverPage()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg></div>
            <div id="TextOverPageTitle">Lyrics.</div><br>
            <div style="text-align: center;">`+'<h2>'+variables.currentSongName+'</h2>'+lyrics+`</div>
        </div>`
        document.getElementById("OverPage").style.display = "flex"
    }
}
async function openSongLyricsById(id){
    var returnedSongData= await getSongLyricsById(id)
    var songName= returnedSongData[0]
    var lyrics= returnedSongData[1]

    document.getElementById("OverPage").innerHTML=`
    <div id="TextOverPage">
        <div id="CloseTextOverlay" onclick="closeOverPage()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg></div>
        <div id="TextOverPageTitle">Lyrics.</div><br>
        <div style="text-align: center;">`+'<h2>'+songName+'</h2>'+(lyrics? lyrics:"No Lyrics Found!")+`</div>
    </div>`
    document.getElementById("OverPage").style.display = "flex"
}
/* OverPage Side Start */






/* FrontEndSide Start */
// ToggleDrawer
function ToggleDrawer(){
    var drawerDisplay=document.getElementById("Drawer").style.display
    if(drawerDisplay=="block" || !drawerDisplay){
        document.getElementById("Drawer").style.display="none"
        document.getElementById("PlaybackControls").style.marginLeft="0px"
        document.getElementById("MainBody").style.marginLeft="0px"
    }else{
        document.getElementById("Drawer").style.display="block"
        document.getElementById("PlaybackControls").style.marginLeft="230px"
        document.getElementById("MainBody").style.marginLeft="230px"
    }
}

// ToggleDrawerSection
function ToggleDrawerSection(id){
    try{
        if(document.getElementById(id).getElementsByTagName("svg")[0].style.transform=="rotate(180deg)"){
            document.getElementById(id).getElementsByClassName("DrawerSectionItemContainer")[0].style.display="none"
            document.getElementById(id).getElementsByTagName("svg")[0].style.transform="rotate(0deg)"
        }else{
            document.getElementById(id).getElementsByClassName("DrawerSectionItemContainer")[0].style.display="block"
            document.getElementById(id).getElementsByTagName("svg")[0].style.transform="rotate(180deg)"
        }
    }catch(e){null}
}

// ToggleButtons
function ToggleButtons(enable){
    if(enable){
        document.getElementById("PreviousButton").style.fill="#25FFB1"
        document.getElementById("NextButton").style.fill="#25FFB1"
        document.getElementById("MainActionButton").style.fill="#25FFB1"
        document.getElementById("Sound").style.fill="#25FFB1"
        document.getElementById("ClosedCaptionsToggle").style.fill="#25FFB1"
        document.getElementById("MiniPlayerButton").style.fill="#25FFB1"
        document.getElementById("SongLength").style.display="block"
        
        variables.controlsEnabled=true
    }else{
        document.getElementById("PreviousButton").style.fill="#303030"
        document.getElementById("NextButton").style.fill="#303030"
        document.getElementById("MainActionButton").style.fill="#505050"
        document.getElementById("Sound").style.fill="#606060"
        document.getElementById("ClosedCaptionsToggle").style.fill="#303030"
        document.getElementById("MiniPlayerButton").style.fill="#303030"
        document.getElementById("SongLength").style.display="none"
        
        variables.controlsEnabled=false
    }
}

// ToggleSuffleLoop
function toggleSuffleLoop(){
    if(variables.suffleLoop==1){
        variables.suffleLoop=2
        document.getElementById("LoopButton").style.fill="#25FFB1"
        document.getElementById("SuffleButton").style.fill="#606060"
    }else if(variables.suffleLoop==2){
        variables.suffleLoop=0
        document.getElementById("LoopButton").style.fill="#606060"
        document.getElementById("SuffleButton").style.fill="#606060"

    }else{
        variables.suffleLoop=1
        document.getElementById("SuffleButton").style.fill="#25FFB1"
        document.getElementById("LoopButton").style.fill="#606060"
    }
}

// Audio on Pause and Play
variables.audioPlayer.addEventListener("pause", ()=>{
    variables.audioPlaying=false
    document.getElementById("MainActionButton").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/></svg>'
})
variables.audioPlayer.addEventListener("play", ()=>{
    variables.audioPlaying=true
    document.getElementById("MainActionButton").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z"/></svg>'
})
/* FrontEndSide End */
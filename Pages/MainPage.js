const {BrowserWindow, getCurrentWindow, dialog} = require('electron').remote
const fs = require('fs')
const path = require('path')
const decompress = require('decompress')
const JSZip = require('jszip')
// const { promises } = require('dns')
// const { noAsar } = require('process')
// const { file } = require('jszip')

// Variables
var win = getCurrentWindow()
var variables = {
    "audioPlayer": new Audio,
    "audioPlaying": false,
    "controlsEnabled": false,
    "currentSongUrl": "",
    "currentSongLength": "",
    "preSongId": "",
    "allMusics": [],
    "appdataLoc": "Pages/appdata.json",
    "musicLoadFolder": "Pages/MusicLoadFolder/",
    "rhymeMusicsFolder": "Pages/Musics/",
    "cacheFolder": "Pages/Cache/",
    "musicsImageFolder": "Pages/MusicImages/",
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
    var musicRawPath = dialog.showOpenDialogSync({filters: [{"name": 'RhymeMusic', "extensions": ['rhymemusic', "mp3", "wav", "m4a", "aac", "ogg", "webm"]}]})[0]
    var musicPath = path.parse(musicRawPath)

    if (musicPath.ext == ".rhymemusic"){
        var makeFileSetting = {"currentMakeNum": 0}
        async function makeFile(add_Num){
            if (fs.existsSync(variables.rhymeMusicsFolder+add_Num.toString()+".rhymemusic")){
                makeFileSetting.currentMakeNum=makeFileSetting.currentMakeNum+1
                makeFile(makeFileSetting.currentMakeNum)
            }else{
                if(!fs.existsSync(variables.rhymeMusicsFolder)){fs.mkdirSync(variables.rhymeMusicsFolder);makeFile(makeFileSetting.currentMakeNum)}
                else{
                    if(!fs.existsSync(variables.cacheFolder)){fs.mkdirSync(variables.cacheFolder);makeFile(makeFileSetting.currentMakeNum)}
                    else{
                        clearCache()

                        zipMaker = new JSZip()
                        await decompress(fs.readFileSync(musicRawPath), variables.cacheFolder).then()

                        var songData = JSON.parse(fs.readFileSync(variables.cacheFolder+"data.json", "utf-8"))
                        songData.id=makeFileSetting.currentMakeNum
                        songData.songLength= await getSongLength("Cache/music."+songData.musicFormat)
                        fs.writeFileSync(variables.cacheFolder+"data.json", JSON.stringify(songData))
                        
                        var cacheFolderFiles = fs.readdirSync(variables.cacheFolder)
                        for (file in cacheFolderFiles){zipMaker.file(cacheFolderFiles[file], fs.readFileSync(variables.cacheFolder+cacheFolderFiles[file]))}
                        var NewZipBuffer = await zipMaker.generateAsync({"type": "nodebuffer"})
                        fs.writeFileSync(variables.rhymeMusicsFolder+add_Num.toString()+".rhymemusic", NewZipBuffer)

                        PopulateAllMusics()
                    }
                }
            }
        }
        makeFile(makeFileSetting.currentMakeNum)
    }
    else if ([".mp3", ".wav", ".m4a", ".aac", ".ogg", ".webm"].includes(musicPath.ext)){null}
}

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

// PopulateSection
function PopulatePlaylist(){
    if (fs.existsSync(variables.appdataLoc)){
        var appdata = JSON.parse(fs.readFileSync(variables.appdataLoc, "utf-8"))
        
        variables.PlaylistItemContainer.innerHTML=variables.PlaylistItemContainer.innerHTML+'<div id="Playlist0" class="DrawerSectionItem">All<div class="Spacer"></div><svg class="DrawerSectionPlay" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/></svg></div>'
        for(Item in appdata.playlists){
            variables.PlaylistItemContainer.innerHTML=variables.PlaylistItemContainer.innerHTML+'<div id="Playlist'+appdata.playlists[Item].PlaylistItemID.toString()+'" class="DrawerSectionItem">'+appdata.playlists[Item].PlaylistItemName+'<div class="Spacer"></div><svg class="DrawerSectionPlay" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/></svg></div>'
        }
    }else{fs.writeFileSync(variables.appdataLoc, "{}");PopulatePlaylist()}
}
PopulatePlaylist()

// PopulateAllMusics
async function PopulateAllMusics(){
    variables.SongItemContainer.innerHTML='<div id="MainBodySongInfoSpacer"></div>'
    variables.allMusics=[]

    if (fs.existsSync(variables.rhymeMusicsFolder)){
        if(fs.existsSync(variables.cacheFolder)){
            if(fs.existsSync(variables.musicsImageFolder)){
                var allMusicsFetch = fs.readdirSync(variables.rhymeMusicsFolder)
                for(MusicIndex in allMusicsFetch){variables.allMusics.push(allMusicsFetch[MusicIndex])}
                for(MusicIndex in variables.allMusics){
                    var rhymeMusic = fs.readFileSync(variables.rhymeMusicsFolder+variables.allMusics[MusicIndex])
                    await decompress(rhymeMusic, variables.cacheFolder)

                    var songData = JSON.parse(fs.readFileSync(variables.cacheFolder+"data.json", "utf-8"))
                    var songImageData=fs.readFileSync(variables.cacheFolder+"image."+songData.imageFormat)
                    fs.writeFileSync(variables.musicsImageFolder+songData.id+'.'+songData.imageFormat, songImageData)

                    variables.SongItemContainer.innerHTML = variables.SongItemContainer.innerHTML + '<div id="Song'+songData.id.toString()+'" class="SongItem"><div  onclick="loadAndPlaySong('+songData.id.toString()+')" class="SongItemAction"><svg class="SongItemPlay" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/></svg></div><svg class="SongItemMore" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg><div class="SongItemLength">'+(songData.songLength? songData.songLength : "0:00")+'</div><div class="SongItemDisplay"></div><div class="SongItemInfo"><SongName>'+songData.displayName+'</SongName><br><OtherInfo>'+songData.artist+'<br>'+(songData.tags? songData.tags : 'N/A') +'</OtherInfo></div></div>'
                    document.getElementById("Song"+songData.id.toString()).getElementsByClassName("SongItemDisplay")[0].style.backgroundImage='url("MusicImages/'+songData.id+'.'+songData.imageFormat+'")'
                }
            }else{fs.mkdirSync(variables.musicsImageFolder);PopulateAllMusics()}
        }else{fs.mkdirSync(variables.cacheFolder);PopulateAllMusics()}
    }else{fs.mkdirSync(variables.rhymeMusicsFolder);PopulateAllMusics()}
}

PopulateAllMusics()

// VolumeProgress
function refreshVolume(){
    var SoundSliderValue = document.getElementById("SoundSlider").value
    variables.audioPlayer.volume=parseInt(SoundSliderValue)/100
    document.getElementById("SoundSlider").style.background = "linear-gradient(to right, #FB1E46 "+(SoundSliderValue).toString()+"%, #606060 "+(SoundSliderValue).toString()+"%)"
}

// MusicTimeLength
function updateMusicTimeLength(){
    document.getElementById("SongLength").innerHTML=formatSongLength(variables.audioPlayer.currentTime)+"</br>"+variables.currentSongLength
}

// MusicProgress
function refreshMusicProgressController(){
    var MusicProgressValue = document.getElementById("MusicProgressBar").value
    
    document.getElementById("MusicProgressBar").style.background = "linear-gradient(to right, #FB1E46 "+(MusicProgressValue/5).toString()+"%, #505050 "+(MusicProgressValue/5).toString()+"%)"
    document.getElementById("MainActionProgress").style.background = "conic-gradient(#FB1E46 "+(MusicProgressValue/5).toString()+"%, #505050 "+(MusicProgressValue/5).toString()+"%)"
    updateMusicTimeLength()
}

function updateMusicProgress(){
    var MusicProgressValue = document.getElementById("MusicProgressBar").value
    variables.audioPlayer.currentTime=((variables.audioPlayer.duration/500)*MusicProgressValue)
    refreshMusicProgressController()
}
variables.audioPlayer.addEventListener("timeupdate", function() {
    document.getElementById("MusicProgressBar").value=(variables.audioPlayer.currentTime/variables.audioPlayer.duration)*500;
    refreshMusicProgressController()
})

// ToggleButtons
function ToggleButtons(enable){
    if(enable){
        document.getElementById("PreviousButton").style.fill="#25FFB1"
        document.getElementById("NextButton").style.fill="#25FFB1"
        document.getElementById("MainActionButton").style.fill="#25FFB1"
        document.getElementById("Sound").style.fill="#25FFB1"
        document.getElementById("SuffleButton").style.fill="#25FFB1"
        document.getElementById("LoopButton").style.fill="#25FFB1"
        document.getElementById("ClosedCaptionsToggle").style.fill="#25FFB1"
        document.getElementById("MiniPlayerButton").style.fill="#25FFB1"
        document.getElementById("SongLength").style.display="block"

        variables.controlsEnabled=true
    }else{
        document.getElementById("PreviousButton").style.fill="#303030"
        document.getElementById("NextButton").style.fill="#303030"
        document.getElementById("MainActionButton").style.fill="#505050"
        document.getElementById("Sound").style.fill="#606060"
        document.getElementById("SuffleButton").style.fill="#606060"
        document.getElementById("LoopButton").style.fill="#606060"
        document.getElementById("ClosedCaptionsToggle").style.fill="#303030"
        document.getElementById("MiniPlayerButton").style.fill="#303030"
        document.getElementById("SongLength").style.display="none"

        variables.controlsEnabled=false
    }
}

// clearCache And clearMusicLoadFolder
function clearCache(){
    var folderFiles = fs.readdirSync(variables.cacheFolder)
    for (fileIndex in folderFiles){fs.unlinkSync(variables.cacheFolder+folderFiles[fileIndex])}
}
function clearMusicLoadFolder(){
    var musicLoadFolderFiles = fs.readdirSync(variables.musicLoadFolder)
    for (fileIndex in musicLoadFolderFiles){fs.unlinkSync(variables.musicLoadFolder+musicLoadFolderFiles[fileIndex])}
}

// openSongUrl
function openSongUrl(){if (variables.currentSongUrl!=""){require("electron").shell.openExternal(variables.currentSongUrl);}}

// SetSongInfo
function refreshSongInfo(){
    var songData = JSON.parse(fs.readFileSync(variables.cacheFolder+"data.json", "utf-8"))
    var songImageData=fs.readFileSync(variables.cacheFolder+"image."+songData.imageFormat)
    document.getElementById("SongInfoPicture").style.backgroundImage='url("MusicImages/'+songData.id+'.'+songData.imageFormat+'")'
    document.getElementById("SongInfoName").innerHTML=songData.displayName
    document.getElementById("SongInfoArtist").innerHTML=songData.artist
    document.getElementById("SongInfoGenre").innerHTML=songData.tags
}

// SongControl
async function loadSong(id){
    if(fs.existsSync(variables.musicLoadFolder)){
        await decompress(variables.rhymeMusicsFolder+variables.allMusics[id], variables.cacheFolder)

        var songData = JSON.parse(fs.readFileSync(variables.cacheFolder+"data.json", "utf-8"))
        variables.currentSongUrl= songData.url? songData.url : ""
        variables.currentSongLength= songData.songLength
        
        try{
            document.getElementById("Song"+variables.preSongId.toString()).getElementsByClassName("SongItemInfo")[0].style.background = "#1BADFF"
            document.getElementById("Song"+variables.preSongId.toString()).getElementsByClassName("SongItemPlay")[0].style.fill = "#1BADFF"
        }catch(e){}
        document.getElementById("Song"+songData.id.toString()).getElementsByClassName("SongItemInfo")[0].style.background = "#25FFB1"
        document.getElementById("Song"+songData.id.toString()).getElementsByClassName("SongItemPlay")[0].style.fill = "#25FFB1"
        document.getElementById("MainActionButton").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z"/></svg>'
        variables.preSongId=songData.id
        ToggleButtons(true)

        clearMusicLoadFolder()

        var songBinary = fs.readFileSync(variables.cacheFolder+"music."+songData.musicFormat)
        fs.writeFileSync(variables.musicLoadFolder+songData.id.toString()+"."+songData.musicFormat, songBinary)

        variables.audioPlayer.src="MusicLoadFolder/"+songData.id.toString()+"."+songData.musicFormat;
    }else{fs.mkdirSync(variables.musicLoadFolder);loadSong(id)}
}
async function loadAndPlaySong(id){await loadSong(id);playSong();refreshSongInfo()}
function playSong(){variables.audioPlayer.play();variables.audioPlaying=true}
function pauseSong(){variables.audioPlayer.pause();variables.audioPlaying=false}
function mainAction(){
    if(variables.controlsEnabled){
        if(variables.audioPlaying){
            pauseSong()
            document.getElementById("MainActionButton").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/></svg>'
        }else{
            playSong()
            document.getElementById("MainActionButton").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z"/></svg>'
        }
    }
}

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
const {BrowserWindow, getCurrentWindow} = require('electron').remote

// Variables
var win = getCurrentWindow()

// TitleBarLogic
win.on("maximize", () => {document.getElementById("MaximizeButton").innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M6 16h2v2c0 .55.45 1 1 1s1-.45 1-1v-3c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1s.45 1 1 1zm2-8H6c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1s-1 .45-1 1v2zm7 11c.55 0 1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1h-3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1zm1-11V6c0-.55-.45-1-1-1s-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1h-2z"/></svg>'})
win.on("unmaximize", () => {document.getElementById("MaximizeButton").innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M6 14c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1H7v-2c0-.55-.45-1-1-1zm0-4c.55 0 1-.45 1-1V7h2c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1zm11 7h-2c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1s-1 .45-1 1v2zM14 6c0 .55.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1z"/></svg>'})
function closeWindow(){win.close()}
function maximizeWindow(){win.isMaximized() ? win.unmaximize() : win.maximize()}
function minimizeWindow(){win.minimize()}

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

// VolumeProgress
function refreshVolume(){
    SoundSliderValue = document.getElementById("SoundSlider").value
    document.getElementById("SoundSlider").style.background = "linear-gradient(to right, #FB1E46 "+(SoundSliderValue).toString()+"%, #606060 "+(SoundSliderValue).toString()+"%)"
}

// MusicProgress
function refreshMusicProgressController(){
    MusicProgressValue = document.getElementById("MusicProgressBar").value
    document.getElementById("MusicProgressBar").style.background = "linear-gradient(to right, #FB1E46 "+(MusicProgressValue/5).toString()+"%, #505050 "+(MusicProgressValue/5).toString()+"%)"
    document.getElementById("MainActionProgress").style.background = "conic-gradient(#FB1E46 "+(MusicProgressValue/5).toString()+"%, #505050 "+(MusicProgressValue/5).toString()+"%)"
}
function MusicProgressIncrement(addValue, jump){
    MusicProgressValue = document.getElementById("MusicProgressBar").value
    MusicProgressNewValue = parseInt(MusicProgressValue) + addValue
    if (jump && MusicProgressNewValue<=500 && MusicProgressNewValue>=0){
        document.getElementById("MusicProgressBar").value = (MusicProgressNewValue).toString()
        refreshMusicProgressController()
    }
    else{
        refreshMusicProgressController()
    }
}
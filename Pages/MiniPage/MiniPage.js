const {getCurrentWindow} = require('electron').remote

// Variables
var win = getCurrentWindow()

// Functions
function MaximizePlayer(){win.close()}

function refreshMusicProgressController(){
    MusicProgressValue = document.getElementById("MiniMusicProgressBar").value
    document.getElementById("MiniMusicProgressBar").style.background = "linear-gradient(to right, #FB1E46 "+(MusicProgressValue/5).toString()+"%, #505050 "+(MusicProgressValue/5).toString()+"%)"
    document.getElementById("MiniMainActionProgress").style.background = "conic-gradient(#FB1E46 "+(MusicProgressValue/5).toString()+"%, #505050 "+(MusicProgressValue/5).toString()+"%)"
}

function refreshVolume(){
    SoundSliderValue = document.getElementById("MiniSoundSlider").value
    document.getElementById("MiniSoundSlider").style.background = "linear-gradient(to right, #FB1E46 "+(SoundSliderValue).toString()+"%, #606060 "+(SoundSliderValue).toString()+"%)"
}

function toggleButtons(enable){
    if(enable){
        document.getElementById("MiniPreviousButton").style.fill="#25FFB1"
        document.getElementById("MiniNextButton").style.fill="#25FFB1"
        document.getElementById("MiniMainActionButton").style.fill="#25FFB1"

        document.getElementById("MiniSound").style.fill="#25FFB1"
        document.getElementById("MiniSuffleButton").style.fill="#25FFB1"
        document.getElementById("MiniClosedCaptionsToggle").style.fill="#25FFB1"
    }
    else{
        document.getElementById("MiniPreviousButton").style.fill="#303030"
        document.getElementById("MiniNextButton").style.fill="#303030"
        document.getElementById("MiniMainActionButton").style.fill="#505050"

        document.getElementById("MiniSound").style.fill="#303030"
        document.getElementById("MiniSuffleButton").style.fill="#303030"
        document.getElementById("MiniClosedCaptionsToggle").style.fill="#303030"
    }
}

function setImage(imageSrc){
    if(imageSrc=="reset"){
        document.getElementById("MiniDisplay").style.backgroundImage="url('../Assets/BackLogo.png')";
        document.getElementById("MiniDisplay").style.backgroundSize="contain";
    }
    else{
        document.getElementById("MiniDisplay").style.backgroundImage="url('"+imageSrc+"')";
        document.getElementById("MiniDisplay").style.backgroundSize="cover";
    }
}
//to do:  maybe memorize song and let user pick song while current still playing aka reload after
//next visualizer a wave that moves fast freq to the left and writes new ones from right to left

import { drawBars, drawCircle, drawLines, drawSquares, initXTracker } from "/visualizers.js";

//function calls
initColors();
initMode();
initCanvas();
connectTime();
updateMode();
main();

//functions
function initCanvas(){
    const canvas = document.getElementById("canvas1");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function initMode(){
    if (!("visMode" in sessionStorage)) {
        sessionStorage.setItem("visMode", 0);
    }
}

function initColors(){
    const redSlider = document.getElementById("redSlider");
    const greenSlider = document.getElementById("greenSlider");
    const blueSlider = document.getElementById("blueSlider");
    if ("red" in sessionStorage) {
        redSlider.value = sessionStorage.getItem("red");
    }
    if ("green" in sessionStorage) {
        greenSlider.value = sessionStorage.getItem("green");
    }
    if ("blue" in sessionStorage) {
        blueSlider.value = sessionStorage.getItem("blue");
    }
    if (!("red" in sessionStorage)){
        sessionStorage.setItem("red", 255);
        sessionStorage.setItem("green", 255);
        sessionStorage.setItem("blue", 255);
    }

    redSlider.addEventListener("input", function(){
        sessionStorage.setItem("red", redSlider.valueAsNumber);
        changeColor(sessionStorage.getItem("red"), sessionStorage.getItem("green"), sessionStorage.getItem("blue"));
    });
    greenSlider.addEventListener("input", function(){
        sessionStorage.setItem("green", greenSlider.valueAsNumber);
        changeColor(sessionStorage.getItem("red"), sessionStorage.getItem("green"), sessionStorage.getItem("blue"));
    });
    blueSlider.addEventListener("input", function(){
        sessionStorage.setItem("blue", blueSlider.valueAsNumber);
        changeColor(sessionStorage.getItem("red"), sessionStorage.getItem("green"), sessionStorage.getItem("blue"));
    });

    changeColor(sessionStorage.getItem("red"), sessionStorage.getItem("green"), sessionStorage.getItem("blue"));
}

function connectTime() {
    const audio = document.getElementById("audio1")
    document.getElementById("timeSlider").addEventListener("input", function(){
        audio.currentTime = document.getElementById("timeSlider").valueAsNumber;
    });
    document.getElementById("pauseButton").addEventListener("click", function() {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    });
    
}

//file uplaoded
function main() {
    const audio = document.getElementById("audio1");
    const canvas = document.getElementById("canvas1");
    const ctx = canvas.getContext("2d");

    document.getElementById("fileUpload").addEventListener("change", function(){
        //playing audio from file
        const files = this.files;
        audio.src = URL.createObjectURL(files[0]);
        audio.load();
        audio.onloadedmetadata = function(){ //setting timeSlider max
            document.getElementById("timeSlider").max = audio.duration;
        }
        audio.play();
    
        const audioCtx = new AudioContext(); //object with context about audio
        let audioSource = audioCtx.createMediaElementSource(audio); //makes a media object with audio1
        let analyzer = audioCtx.createAnalyser(); //makes an object to analyze sound data
        audioSource.connect(analyzer); // connects our analyzer and media object
        analyzer.connect(audioCtx.destination); //connects our audio back from analyzer to sound output
        analyzer.fftSize = 1024; // number of sample
    
        //only want 20 out of 24 hz freq since that is human hearing range
        const bufferLength = Math.round(analyzer.frequencyBinCount * (20/24)); // always half of fft size
        const dataArray = new Uint8Array(bufferLength);
        initXTracker(bufferLength);
    
        //saving song name and removing files
        const songName = getSongName(files[0].name);
        const text = document.createTextNode(songName);
        document.getElementById("titleText").appendChild(text);
        document.getElementById("fileLabel").remove(); //removing file choice
        //making elements appear
        document.getElementById("titleText").style.display = "inline-block";
        document.getElementById("changeButton").style.display = "inline-block"
        document.getElementById("timeSlider").style.display = "inline-block";
        document.getElementById("timeDisplay").style.display = "inline-block";
        document.getElementById("pauseButton").style.display = "inline-block";
    
        document.getElementById("changeButton").addEventListener("click", function(){
            document.location.reload();
        });
    
        //animation loop
        function animate(){
            const timeSlider = document.getElementById("timeSlider");
            let red = sessionStorage.getItem("red");
            let green = sessionStorage.getItem("green");
            let blue = sessionStorage.getItem("blue");

            changeColor(red, green, blue);
            analyzer.getByteFrequencyData(dataArray); // sets each element in our array to a freq
            ctx.clearRect(0, 0, canvas.width, canvas.height); //clears the entire canvas
            drawData(dataArray, bufferLength, canvas, ctx, red, green, blue);
            timeSlider.valueAsNumber = audio.currentTime;
            document.getElementById("timeDisplay").innerHTML = getMinutes(timeSlider.valueAsNumber) + "/" + getMinutes(timeSlider.max);
            updatePauseButton(document.getElementById("pauseButton"));
            requestAnimationFrame(animate);
        }
        animate();
    });
}

function updateMode() {
    document.getElementById("barButton").addEventListener("click", function(){
        sessionStorage.setItem("visMode", 0);
    });
    document.getElementById("circleButton").addEventListener("click", function(){
        sessionStorage.setItem("visMode", 1);
    });
    document.getElementById("lineButton").addEventListener("click", function(){
        sessionStorage.setItem("visMode", 2);
    });
    document.getElementById("squareButton").addEventListener("click", function(){
        sessionStorage.setItem("visMode", 3)
    });
}

function changeColor(red, green, blue){
    let color = "rgb(" + red + ", " + green + ", " + blue + ")";
    document.getElementById("barButton").style = "border-color: " + color + ";"
    document.getElementById("circleButton").style = "border-color: " + color + ";";
    document.getElementById("lineButton").style = "border-color: " + color + ";";
    document.getElementById("squareButton").style = "border-color: " + color + ";";
    if (document.getElementById("changeButton").style.display == "inline-block") {
        document.getElementById("changeButton").style = "display: inline-block; border-color: " + color + ";";
        document.getElementById("titleText").style = "display: inline-block; text-decoration: underline " + color + "; text-shadow: 3px 2px 4px " + color + ";";
        document.getElementById("pauseButton").style = "display: inline-block; border-color: " + color + ";";
        document.getElementById("timeSlider").style = "display: inline-block; accent-color: " + color + "; filter: drop-shadow(0px 0px 4px " + color + ");";
    } else {
        document.getElementById("fileLabel").style = "text-decoration: underline " + color + "; text-shadow: 3px 2px 4px " + color + ";";
    }
}

//draw algorithms
function drawData(dataArray, bufferLength, canvas, ctx, red, green, blue){
    let visMode = sessionStorage.getItem("visMode");
    if (visMode == 0) {
        drawBars(dataArray, bufferLength, canvas, ctx, red, green, blue);
    } else if (visMode == 1) {
        drawCircle(dataArray, bufferLength, canvas, ctx, red, green, blue);
    } else if (visMode == 2) {
        drawLines(dataArray, bufferLength, canvas, ctx, red, green, blue);
    } else {
        drawSquares(dataArray, bufferLength, canvas, ctx, red, green, blue);
    }
}

//edits file name to be 25 letters so fits
function getSongName(name){
    if (name.length > 25) {
        name = name.slice(0, 25) + "...";
    }
    return name;
}

//takes in seconds and returns string of min:sec
function getMinutes(seconds){
    let mins = (seconds / 60);
    mins = mins.toString().split(".")[0];
    let remainder = seconds % 60;
    remainder = remainder.toString().split(".")[0]
    if (remainder.length < 2) {
        remainder = "0" + remainder;
    }
    return mins + ":" + remainder;
}

//changes pause button
function updatePauseButton(pauseButton){
    if (document.getElementById("audio1").paused) {
        pauseButton.innerHTML = "&#9658;";
    } else {
        pauseButton.innerHTML = "| |";
    }
}

import { drawBars, drawCircle, drawLines, drawSquares, drawPulse, getAverage } from "/visualizers.js";

//to do:

//volume slider
//mobile functionality
//defaulted songs that you can test without uploading one

//main function with animation loop inside
function main() {
    const audio = document.getElementById("audio1");
    const canvas = document.getElementById("canvas1");
    const ctx = canvas.getContext("2d");
    let audioCtx;
    let audioSource;
    let analyzer;
    let bufferLength;
    let dataArray;
    //initial values
    let animationPaused = true;
    let colorDisplay = 0; //swap thru r g and b
    let autoColorOn = false;
    let visMode = 0; //visualizer button var
    let red = 255, green = 255, blue = 255;

    changeColor(red, green, blue);
    initCanvas();
    connectTime();
    
    //event listeners for vis buttons
    document.getElementById("barButton").addEventListener("click", function(){
        visMode = 0;
    });
    document.getElementById("circleButton").addEventListener("click", function(){
        visMode = 1;
    });
    document.getElementById("lineButton").addEventListener("click", function(){
        visMode = 2;
    });
    document.getElementById("squareButton").addEventListener("click", function(){
        visMode = 3;
    });
    document.getElementById("pulseButton").addEventListener("click", function(){
        visMode = 4;
    });

    //event listeners for colors
    document.getElementById("autoColor").addEventListener("click", function(){
        if (autoColorOn) {
            autoColorOn = false;
        } else {
            autoColorOn = true;
        }
    });
    document.getElementById("redSlider").addEventListener("input", function(){
        red = document.getElementById("redSlider").valueAsNumber;
    });
    document.getElementById("greenSlider").addEventListener("input", function(){
        green = document.getElementById("greenSlider").valueAsNumber;
    });
    document.getElementById("blueSlider").addEventListener("input", function(){
        blue = document.getElementById("blueSlider").valueAsNumber;
    });

    //file uploaded
    document.getElementById("fileUpload").addEventListener("change", function(){
        //playing audio from file
        const files = this.files;
        audio.src = URL.createObjectURL(files[0]);
        document.getElementById("fileLabel").innerHTML = getSongName(files[0].name);
        audio.load();
        audio.currentTime = 0;
        audio.play();
        if (!(dataArray)) {
            audioCtx = new AudioContext(); //object with context about audio
            audioSource = audioCtx.createMediaElementSource(audio); //makes a media object with audio1
            analyzer = audioCtx.createAnalyser(); //makes an object to analyze sound data
            audioSource.connect(analyzer); // connects our analyzer and media object
            analyzer.connect(audioCtx.destination); //connects our audio back from analyzer to sound output
            analyzer.fftSize = 1024; // number of sample
        
            //only want 20 out of 24 hz freq since that is human hearing range
            bufferLength = Math.round(analyzer.frequencyBinCount * (20/24)); // always half of fft size
            dataArray = new Uint8Array(bufferLength);
        }
    
    
    audio.onloadedmetadata = function(){
        const timeSlider = document.getElementById("timeSlider");
        let xTracker = new Array(bufferLength);
        let radiusTracker = [0, (-1/3) * (canvas.width / 2 + 1024), (-2/3) * (canvas.width / 2 + 1024)];
        let prevVol;
        let currentVol = 0;
        let cooldown = 0;
        let volCounter = 0;

        timeSlider.max = audio.duration;
        for (let i = 0; i < bufferLength; i++) {
            xTracker[i] = 0;
        }
        //draw algorithms
        function drawData(dataArray){
            if (visMode == 0) {
                drawBars(dataArray, bufferLength, canvas, ctx, red, green, blue);
            } else if (visMode == 1) {
                drawCircle(dataArray, bufferLength, canvas, ctx, red, green, blue);
            } else if (visMode == 2) {
                xTracker = drawLines(dataArray, bufferLength, canvas, ctx, red, green, blue, xTracker);
            } else if (visMode == 3) {
                drawSquares(dataArray, bufferLength, canvas, ctx, red, green, blue);
            } else {
                radiusTracker = drawPulse(dataArray, bufferLength, canvas, ctx, red, green, blue, radiusTracker);
            }
        }
        //change colors using freq data
        function colorResponse(dataArray){
            let colorList;
            if ((currentVol - prevVol) >= 0 && cooldown >= 25) {
                volCounter += currentVol - prevVol;
            } else {
                volCounter = 0;
            }
            if (volCounter >= 20) {
                colorDisplay += 1 //change color
                cooldown = 0; //reset cooldown so no flickering
                volCounter = 0; //reset accumulative change in vol
            }
            if (colorDisplay > 2) {
                colorDisplay = 0;
            }
            cooldown += 1;

            colorList = setColor(dataArray, colorDisplay);
            red = colorList[0];
            green = colorList[1];
            blue = colorList[2];
        }

        //animation loop
        function animate(){
            analyzer.getByteFrequencyData(dataArray); // sets each element in our array to a freq
            prevVol = currentVol;
            currentVol = getAverage(dataArray);
            if (autoColorOn) {
                colorResponse(dataArray, bufferLength)
            }
            changeColor(red, green, blue, autoColorOn, visMode);
            ctx.clearRect(0, 0, canvas.width, canvas.height); //clears the entire canvas
            drawData(dataArray);
            timeSlider.valueAsNumber = audio.currentTime;
            document.getElementById("timeDisplay").innerHTML = getMinutes(timeSlider.valueAsNumber) + "/" + getMinutes(timeSlider.max);
            updatePauseButton(document.getElementById("pauseButton"));
            updateSliders(red, green, blue);
            requestAnimationFrame(animate);
        }

        if (animationPaused) {
            animate();
            animationPaused = false;
        }
    }
    });
}

//changes front end color
function changeColor(red, green, blue, autoColorOn, visMode){ //make function for button change repetitive code
    let color = "rgb(" + red + ", " + green + ", " + blue + ")";

    document.getElementById("barButton").style = "border-color: black;";
    document.getElementById("circleButton").style = "border-color: black;";
    document.getElementById("lineButton").style = "border-color: black;";
    document.getElementById("squareButton").style = "border-color: black;";
    document.getElementById("pulseButton").style = "border-color: black;";
    document.getElementById("autoColor").style = "border-color: black;";

    if (autoColorOn) {
        document.getElementById("autoColor").style = "border-color: " + color + ";";
    }
    if (visMode == 0) {
        document.getElementById("barButton").style = "border-color: " + color + ";"
    } else if (visMode == 1) {
        document.getElementById("circleButton").style = "border-color: " + color + ";";
    } else if (visMode == 2) {
        document.getElementById("lineButton").style = "border-color: " + color + ";";
    } else if (visMode == 3) {
        document.getElementById("squareButton").style = "border-color: " + color + ";";
    } else if (visMode == 4) {
        document.getElementById("pulseButton").style = "border-color: " + color + ";";
    }

    document.getElementById("pauseButton").style = "border-color: " + color + ";";
    document.getElementById("timeSlider").style = "filter: drop-shadow(0px 0px 4px " + color + ");";
    document.getElementById("fileLabel").style = "text-decoration: underline " + color + "; text-shadow: 3px 2px 4px " + color + ";";
}

//set canvas width and height
function initCanvas(){
    updateWindowSize();

    window.addEventListener("resize", function(){
        updateWindowSize();
    })
}

//makes sure window is right size for program to work
function updateWindowSize(){
    const canvas = document.getElementById("canvas1");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

//event listeners for timeSlider and pauseButton
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

//changes pause button
function updatePauseButton(pauseButton){
    if (document.getElementById("audio1").paused) {
        pauseButton.innerHTML = "&#9658;";
    } else {
        pauseButton.innerHTML = "| |";
    }
}

function updateSliders(red, green, blue){
    document.getElementById("redSlider").value = red;
    document.getElementById("greenSlider").value = green;
    document.getElementById("blueSlider").value = blue;
}

//edits file name to be 30 letters so fits
function getSongName(name){
    if (name.length > 35) {
        name = name.slice(0, 35) + "...";
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

//takes in freq array and colorDisplay to check what color to return
function setColor(dataArray, colorDisplay){
    let vol = 2 * getAverage(dataArray);
    if (colorDisplay == 0) {
        return [vol, 0, 0];
    } else if (colorDisplay == 1) {
        return [0, vol, 0];
    } else {
        return [0, 0, vol];
    }
}

main();
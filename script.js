import { drawBars, drawCircle, drawLines, drawSquares, drawPulse, getAverage } from "/visualizers.js";

//to do: fix color updater button and sliders
//maybe remove bufferlength and just use dataArray.length

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
    let colorDisplay = 0;
    let colorCount = 0;
    let colorMode = 1;
    let visMode = 0;
    let red = 255, green = 255, blue = 255;
    changeColor(red, green, blue);

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
        if (colorMode == 1) {
            colorMode = 0;
        } else {
            colorMode = 1;
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
            let bass = getAverage(dataArray.slice(0, 3));;
            let colorList;
            let cooldown = 25;
            if (colorDisplay > 2) {
                colorDisplay = 0;
            }
            if (bass == 255 && colorCount >= cooldown) {
                colorCount = 0; //reset counter
                colorDisplay += 1; //display setting, 0 - red, 1 - green, 2 - blue
            }
            colorCount += 1

            colorList = setColor(dataArray, colorDisplay);
            red = colorList[0];
            blue = colorList[1];
            green = colorList[2];
        }

        //animation loop
        function animate(){
            analyzer.getByteFrequencyData(dataArray); // sets each element in our array to a freq
            if (colorMode == 1) {
                colorResponse(dataArray, bufferLength)
            }
            changeColor(red, green, blue);
            ctx.clearRect(0, 0, canvas.width, canvas.height); //clears the entire canvas
            drawData(dataArray);
            timeSlider.valueAsNumber = audio.currentTime;
            document.getElementById("timeDisplay").innerHTML = getMinutes(timeSlider.valueAsNumber) + "/" + getMinutes(timeSlider.max);
            updatePauseButton(document.getElementById("pauseButton"));
            requestAnimationFrame(animate);
        }
        animate();
    }
    });
}

//changes front end color
function changeColor(red, green, blue){ //make function for button change repetitive code
    let color = "rgb(" + red + ", " + green + ", " + blue + ")";
    document.getElementById("barButton").style = "border-color: " + color + ";"
    document.getElementById("circleButton").style = "border-color: " + color + ";";
    document.getElementById("lineButton").style = "border-color: " + color + ";";
    document.getElementById("squareButton").style = "border-color: " + color + ";";
    document.getElementById("pulseButton").style = "border-color: " + color + ";";
    document.getElementById("pauseButton").style = "border-color: " + color + ";";
    document.getElementById("timeSlider").style = "accent-color: " + color + "; filter: drop-shadow(0px 0px 4px " + color + ");";
    document.getElementById("fileLabel").style = "text-decoration: underline " + color + "; text-shadow: 3px 2px 4px " + color + ";";
    document.getElementById("autoColor").style = "border-color: " + color + ";";
}

//set canvas width and height
function initCanvas(){
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

//edits file name to be 30 letters so fits
function getSongName(name){
    if (name.length > 30) {
        name = name.slice(0, 30) + "...";
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
function setColor(dataArray, mode){
    let vol = 2 * getAverage(dataArray);
    if (mode == 0) {
        return [vol, 0, 0];
    } else if (mode == 1) {
        return [0, vol, 0];
    } else {
        return [0, 0, vol];
    }
}

//function calls
initCanvas();
connectTime();
main();
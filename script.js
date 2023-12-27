//to do: more visualizers, make module

const canvas = document.getElementById("canvas1");
const container = document.getElementById("container");
const file = document.getElementById("fileupload");
const ctx = canvas.getContext("2d"); //gets a canvas context object and sets the context to 2d
let audioSource;
let analyzer;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let bufferLength;
const audio1 = document.getElementById("audio1");

//buttons
const barButton = document.getElementById("barButton");
const circleButton = document.getElementById("circleButton");
const lineButton = document.getElementById("lineButton");

//sliders
const redSlider = document.getElementById("redSlider");
const greenSlider = document.getElementById("greenSlider");
const blueSlider = document.getElementById("blueSlider");

//coloring and memorization
let visMode = 0;
if ("visMode" in sessionStorage){
    visMode = sessionStorage.getItem("visMode");
}
let red = parseInt(redSlider.value);
if ("red" in sessionStorage){
    red = sessionStorage.getItem("red");
    redSlider.value = sessionStorage.getItem("red");
}
let green = parseInt(greenSlider.value);
if ("green" in sessionStorage){
    green = sessionStorage.getItem("green");
    greenSlider.value = sessionStorage.getItem("green");
}
let blue = parseInt(blueSlider.value);
if ("blue" in sessionStorage){
    blue = sessionStorage.getItem("blue");
    blueSlider.value = sessionStorage.getItem("blue");
}

//change song button creation and song name
const head = document.createElement("h1");
const but = document.createElement("button");
const butText = document.createTextNode("Change");
but.appendChild(butText);

//applying previous colors
changeColor();
document.getElementById("fileLabel").style = "text-decoration: underline rgb(" + red + ", " + green + ", " + blue + "); text-shadow: 3px 2px 4px rgb(" + red + ", " + green + ", " + blue + ");";

file.addEventListener("change", function(){
    //playing audio from file
    const files = this.files;
    audio1.src = URL.createObjectURL(files[0]);
    audio1.load();
    audio1.play();

    //below uses the built into browser web audio api

    const audioCtx = new AudioContext(); //context, just like with canvas, relates to an object with all relevant information regarding audio
    audioSource = audioCtx.createMediaElementSource(audio1); //sets audio 1 to source
    analyzer = audioCtx.createAnalyser(); //makes an object to analyze sound data
    audioSource.connect(analyzer); // connects our analyzer object and audio source object
    analyzer.connect(audioCtx.destination); //connects our audio back from analyzer to out speakers
    analyzer.fftSize = 1024; // number of sample

    //only want 20 out of 24 hz freq since that is human hearing range
    bufferLength = Math.round(analyzer.frequencyBinCount * (20/24)); // always half of fft size and number of bars
    const dataArray = new Uint8Array(bufferLength); // array of unsigned integers up to 2^8, will be of length bufferLength

    //for drawLines()
    xTracker = new Array(bufferLength);
    initXTracker();

    //saving song name and removing files
    const songName = getSongName(files[0].name);
    const text = document.createTextNode(songName);
    head.appendChild(text);
    const element = document.getElementById("songData");
    element.appendChild(head);

    element.appendChild(but);
    document.getElementById("fileLabel").remove(); //must remove or drawLine bug

    but.addEventListener("click", function(){
        document.location.reload();
    });

    //animation loop
    function animate(){
        analyzer.getByteFrequencyData(dataArray); // sets each element in our array to a freq
        ctx.clearRect(0, 0, canvas.width, canvas.height); //clears the entire canvas
        drawData(dataArray);
        requestAnimationFrame(animate);
    }
    animate();
});

//modes
barButton.addEventListener("click", function(){
    visMode = 0;
    sessionStorage.setItem("visMode", 0);
});
circleButton.addEventListener("click", function(){
    visMode = 1;
    sessionStorage.setItem("visMode", 1);
});
lineButton.addEventListener("click", function(){
    visMode = 2;
    sessionStorage.setItem("visMode", 2);
});

//sliders and coloring
redSlider.addEventListener("input", function(){
    red = parseInt(redSlider.value);
    changeColor();
});
greenSlider.addEventListener("input", function(){
    green = parseInt(greenSlider.value);
    changeColor();
});
blueSlider.addEventListener("input", function(){
    blue = parseInt(blueSlider.value);
    changeColor();
});

function changeColor(){
    barButton.style = "border-color: rgb(" + red + ", " + green + ", " + blue + ");";
    circleButton.style = "border-color: rgb(" + red + ", " + green + ", " + blue + ");";
    lineButton.style = "border-color: rgb(" + red + ", " + green + ", " + blue + ");";
    but.style = "border-color: rgb(" + red + ", " + green + ", " + blue + ");";
    head.style = "text-decoration: underline rgb(" + red + ", " + green + ", " + blue + "); text-shadow: 3px 2px 4px rgb(" + red + ", " + green + ", " + blue + ");";
    audio1.style = "filter: drop-shadow(0px 0px 10px rgb(" + red + ", " + green + ", " + blue + "))";
    sessionStorage.setItem("red", red);
    sessionStorage.setItem("green", green);
    sessionStorage.setItem("blue", blue);
}

//draw algorithms
function drawData(dataArray){
    if (visMode == 0){
        drawBars(dataArray);
    } else if(visMode == 1){
        drawCircle(dataArray);
    } else{
        drawLines(dataArray);
    }
}

function drawCircle(dataArray){
    const rotations = 10; //not exactly ten since bufferLength equation is irrational number
    const barWidth = 5;
    ctx.save(); //saves canvas
    ctx.translate(canvas.width / 2, canvas.height / 2); //setting origin to middle for rotation
    for(let i = 0; i < bufferLength; i++){
        let heightScale = (1.75 - (0.003 * i));
        let darkScale = 0.5 * i; //make color slowly darker
        ctx.fillStyle = "black";
        ctx.fillRect(0, dataArray[i] * heightScale, barWidth, 5);
        ctx.fillStyle = "rgb(" + (red - darkScale) + "," + (green - darkScale) + "," + (blue - darkScale) + ")";
        ctx.fillRect(0, 0, barWidth, dataArray[i] * heightScale); // making the scale smaller as i gets bigger
        ctx.rotate(rotations * (2 * Math.PI / bufferLength));
    }
    ctx.restore(); //loads origin back so can clear
}

function drawBars(dataArray){
    const barWidth = ((canvas.width/2) / bufferLength); //divided by 2 for mirrored image
    let x = 0;
    for(let i = 0; i < bufferLength; i++){
        barHeight = dataArray[i] * 2;
        if (barHeight > 0){
            ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
            ctx.fillRect((canvas.width / 2) - x, canvas.height - barHeight - 15, barWidth, 15);
            ctx.fillStyle = "rgb(" + red*0.5 + "," + green*0.5 + "," + blue*0.5 + ")";
            ctx.fillRect((canvas.width / 2) - x, canvas.height - barHeight, barWidth, barHeight);
        }
        x += barWidth;
    }
    for(let i = 0; i < bufferLength; i++){
        barHeight = dataArray[i] * 2;
        if (barHeight > 0){
            ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
            ctx.fillRect(x, canvas.height - barHeight - 15, barWidth, 15);
            ctx.fillStyle = "rgb(" + red*0.5 + "," + green*0.5 + "," + blue*0.5 + ")";
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        }
        x += barWidth;
    }
}

function initXTracker(){
    for(let i = 0; i < bufferLength; i++){
        xTracker[i] = 0;
    }
}

function drawLines(dataArray){
    const scale = 0.035; //scale of speed
    const barHeight = canvas.height / bufferLength;
    let y = 115;
    let avg = getAverage(dataArray);
    for(let i = 0; i < bufferLength; i++){ //to put back on screen
        let barWidth = scale * avg * dataArray[i]; //width of trail and value used for speed increment
        if (xTracker[i] - barWidth > canvas.width){ //once edge of trail is off screen reset
            xTracker[i] = 0;
        }
        if (barWidth > 0){ //remove non moving lines
            ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
            ctx.fillRect(xTracker[i], y, barHeight, barHeight); //square in front
            ctx.fillStyle = "rgb(" + red*0.5 + "," + green*0.5 + "," + blue*0.5 + ")";
            ctx.fillRect(xTracker[i], y, -1 * barWidth, barHeight); //trail
            xTracker[i] += barWidth; //movement
        }
        y += barHeight;
    }
}

function getAverage(array){
    let sum = 0;
    let length = array.length;
    for(let i = 0; i < length; i++){
        sum += array[i];
    }
    return sum / length;
}

function getSongName(name){
    if (name.length > 20){
        name = name.slice(0, 21) + "...";
    }
    return name;
}
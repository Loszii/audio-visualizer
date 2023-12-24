const canvas = document.getElementById("canvas1");
const container = document.getElementById("container");
const file = document.getElementById("fileupload");
const ctx = canvas.getContext("2d"); //gets a canvas context object and sets the context to 2d
let audioSource;
let analyzer;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let tempVar = 0;
let bufferLength;
let xTracker;
let newData;
let simplificationFactor = 4;

//colors
let red = 255;
let green = 255;
let blue = 255;

//buttons
const barButton = document.getElementById("barButton");
const circleButton = document.getElementById("circleButton");
const lineButton = document.getElementById("lineButton");
const redButton = document.getElementById("red");
const greenButton = document.getElementById("green");
const blueButton = document.getElementById("blue");
const whiteButton = document.getElementById("white");

//fix error when picking new song
file.addEventListener("change", function(){
    //playing audio from file
    const audio1 = document.getElementById("audio1");
    const files = this.files;
    audio1.src = URL.createObjectURL(files[0]);
    audio1.load();
    audio1.play();

    //below uses the built into browser web audio api
    if(tempVar == 0){
        const audioCtx = new AudioContext(); //context, just like with canvas, relates to an object with all relevant information regarding audio
        audioSource = audioCtx.createMediaElementSource(audio1); //sets audio 1 to source
        analyzer = audioCtx.createAnalyser(); //makes an object to analyze sound data
        audioSource.connect(analyzer); // connects our analyzer object and audio source object
        analyzer.connect(audioCtx.destination) //connects our audio back from analyzer to out speakers
        analyzer.fftSize = 1024; // number of sample
        tempVar = 1;
    }

    //only want 20 out of 24 hz freq since that is human hearing range
    bufferLength = Math.round(analyzer.frequencyBinCount * (20/24)); // always half of fft size and number of bars
    const dataArray = new Uint8Array(bufferLength); // array of unsigned integers up to 2^8, will be of length bufferLength

    //for drawLines()
    xTracker = new Array(Math.round(bufferLength / simplificationFactor));
    newData = new Array(Math.round(bufferLength / simplificationFactor));
    initXTracker();

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
let choice = 0 
barButton.addEventListener("click", function(){
    choice = 0;
});
circleButton.addEventListener("click", function(){
    choice = 1;
});
lineButton.addEventListener("click", function(){
    choice = 2;
});

//colors
redButton.addEventListener("click", function(){
    red = 255;
    blue = 0;
    green = 0;
});
blueButton.addEventListener("click", function(){
    red = 0;
    blue = 255;
    green = 0;
});
greenButton.addEventListener("click", function(){
    red = 0;
    blue = 0;
    green = 255;
});
whiteButton.addEventListener("click", function(){
    red = 255;
    blue = 255;
    green = 255;
});

//draw algorithms
function drawData(dataArray){
    if (choice == 0){
        drawBars(dataArray);
    } else if(choice == 1){
        drawCircle(dataArray);
    } else{
        drawLines(dataArray);
    }
}

function drawCircle(dataArray){
    const rotations = 10; //not exactly ten since bufferLength equation is irrational number
    const barWidth = 5
    ctx.save(); //saves canvas
    ctx.translate(canvas.width / 2, canvas.height / 2); //setting origin to middle for rotation
    for(let i = 0; i < bufferLength; i++){
        let heightScale = (1.75 - (0.003 * i))
        let darkScale = (0.75 *i); //make color slowly darker
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
        ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
        ctx.fillRect((canvas.width / 2) - x, canvas.height - barHeight - 15, barWidth, 15);
        ctx.fillStyle = "rgb(" + red*0.5 + "," + green*0.5 + "," + blue*0.5 + ")";
        ctx.fillRect((canvas.width / 2) - x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth;
    }
    for(let i = 0; i < bufferLength; i++){
        barHeight = dataArray[i] * 2;
        ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
        ctx.fillRect(x, canvas.height - barHeight - 15, barWidth, 15);
        ctx.fillStyle = "rgb(" + red*0.5 + "," + green*0.5 + "," + blue*0.5 + ")";
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth;
    }
}



function initXTracker(){
    for(let i = 0; i < xTracker.length; i++){
        xTracker[i] = 0;
    }
}

function sampleSimplifier(dataArray){
    let prevIndex = 0;
    let dataIndex = 0
    for(let i = 1; i < Math.round(bufferLength / simplificationFactor) + 1; i ++){
        newData[dataIndex] = getAverage(dataArray.slice(prevIndex, i * simplificationFactor));
        prevIndex = i * simplificationFactor;
        dataIndex += 1;
    }
    return newData;
}

function drawLines(dataArray){
    const scale = 0.035; //scale of speed
    let y = 110;
    newData = sampleSimplifier(dataArray);
    newDataLength = newData.length;
    const barHeight = canvas.height / newDataLength;
    for(let i = 0; i < newDataLength; i++){ //to put back on screen
        if (xTracker[i] - 1000 > canvas.width){
            xTracker[i] = 0;
        }
        let barWidth = scale * getAverage(newData) * newData[i]; //width of trail and value used for speed
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
    let length = array.length
    for(let i = 0; i < length; i++){
        sum += array[i];
    }
    return sum / length;
}

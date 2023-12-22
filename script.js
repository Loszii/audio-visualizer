const canvas = document.getElementById("canvas1");
const container = document.getElementById("container");
const file = document.getElementById("fileupload");
const ctx = canvas.getContext("2d"); //gets a canvas context object and sets the context to 2d
let audioSource;
let analyzer;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const barButton = document.getElementById("button1");
const circleButton = document.getElementById("button2");

//clean up code and further personalize, change the audio control settings and front-end


file.addEventListener("change", function(){
    const audio1 = document.getElementById("audio1");
    const files = this.files;
    audio1.src = URL.createObjectURL(files[0]);
    audio1.load();
    audio1.play();

    //below uses the built into browser web audio api
    const audioCtx = new AudioContext(); //context, just like with canvas, relates to an object with all relevant information regarding audio
    audioSource = audioCtx.createMediaElementSource(audio1); //sets audio 1 to source
    analyzer = audioCtx.createAnalyser(); //makes an object to analyze sound data
    audioSource.connect(analyzer); // connects our analyzer object and audio source object
    analyzer.connect(audioCtx.destination) //connects our audio back from analyzer to out speakers
    analyzer.fftSize = 1024; // number of sample

    //only want 20 out of 24 hz freq since that is human hearing range
    const bufferLength = analyzer.frequencyBinCount * (20/24); // always half of fft size and number of bars
    const dataArray = new Uint8Array(bufferLength); // array of unsigned integers up to 2^8, will be of length bufferLength
    const barWidth = ((canvas.width/2) / bufferLength); //divided by 2 for mirrored image

    let x = 0 //changes draw mode
    barButton.addEventListener("click", function(){
        x = 0;
    });
    circleButton.addEventListener("click", function(){
        x = 1;
    });

    function animate(){
        analyzer.getByteFrequencyData(dataArray); // sets each element in our array to a freq
        ctx.clearRect(0, 0, canvas.width, canvas.height); //clears the entire canvas
        drawData(dataArray, bufferLength, barWidth, x)
        requestAnimationFrame(animate);
    }
    animate();
});

function drawData(dataArray, bufferLength, barWidth, x){
    if (x == 0){
        drawBars(barWidth, dataArray, bufferLength);
    } else {
        drawCircle(dataArray, bufferLength);
    }
}

function drawCircle(dataArray, bufferLength){
    let rotations = 10;
    let barWidth = 5
    ctx.save(); //saves canvas
    ctx.translate(canvas.width / 2, canvas.height / 2); //setting origin to middle for rotation
    for(let i = 0; i < bufferLength; i++){
        let heightScale = (1.75 - (0.003 * i))
        let color = 255 - (0.75 *i); //make red slowly darker
        ctx.fillStyle = "black";
        ctx.fillRect(0, dataArray[i] * heightScale, barWidth, 5);
        ctx.fillStyle = "rgb(" + color + ", 0, 0)";
        ctx.fillRect(0, 0, barWidth, dataArray[i] * heightScale); // making the scale smaller as i gets bigger
        ctx.rotate(rotations * (2 * Math.PI / bufferLength));
    }
    ctx.restore(); //loads origin back so can clear
}

function drawBars(barWidth, dataArray, bufferLength){
    let x = 0;
    for(let i = 0; i < bufferLength; i++){
        barHeight = dataArray[i] * 2;
        ctx.fillStyle = "red";
        ctx.fillRect((canvas.width / 2) - x, canvas.height - barHeight - 15, barWidth, 15);
        ctx.fillStyle = "darkred";
        ctx.fillRect((canvas.width / 2) - x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth;
    }
    for(let i = 0; i < bufferLength; i++){
        barHeight = dataArray[i] * 2;
        ctx.fillStyle = "red";
        ctx.fillRect(x, canvas.height - barHeight - 15, barWidth, 15);
        ctx.fillStyle = "darkred";
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth;
    }
}
const canvas = document.getElementById("canvas1");
const container = document.getElementById("container");
const file = document.getElementById("fileupload");
const ctx = canvas.getContext("2d");
let audioSource;
let analyzer;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

file.addEventListener("change", function(){
    const files = this.files;
    const audio1 = document.getElementById("audio1");
    audio1.src = URL.createObjectURL(files[0]);
    audio1.load();
    audio1.play();

    const audioCtx = new AudioContext();
    audioSource = audioCtx.createMediaElementSource(audio1);
    analyzer = audioCtx.createAnalyser();
    audioSource.connect(analyzer);
    analyzer.connect(audioCtx.destination)
    analyzer.fftSize = 1024; // number of sample
    const bufferLength = analyzer.frequencyBinCount; // always half of fft size and number of bars
    const dataArray = new Uint8Array(bufferLength); // array of unsigned integers up to 2^8, will be of length buggerLength

    const barWidth = ((canvas.width/2) / bufferLength) * 1/0.75; //divided by 2 for mirrored image and only showing 0.75 of data array
    let barHeight;
    let x;

    function animate(){
        x = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height); //clears the entire canvas
        analyzer.getByteFrequencyData(dataArray); // sets each element in our array to a freq
        draw(barWidth, dataArray, bufferLength * 0.75, x);
        requestAnimationFrame(animate);
    }
    animate();
});

function draw(barWidth, dataArray, bufferLength, x){
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
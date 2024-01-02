function drawBars(dataArray, bufferLength, canvas, ctx, red, green, blue){
    const barWidth = ((canvas.width/2) / bufferLength); //divided by 2 for mirrored image
    let x = 0;
    let barHeight;
    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * 2;
        if (barHeight > 0) {
            ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
            ctx.fillRect((canvas.width / 2) - x, canvas.height - barHeight - 15, barWidth, 15);
            ctx.fillStyle = "rgb(" + red*0.5 + "," + green*0.5 + "," + blue*0.5 + ")";
            ctx.fillRect((canvas.width / 2) - x, canvas.height - barHeight, barWidth, barHeight);
        }
        x += barWidth;
    }
    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * 2;
        if (barHeight > 0) {
            ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
            ctx.fillRect(x, canvas.height - barHeight - 15, barWidth, 15);
            ctx.fillStyle = "rgb(" + red*0.5 + "," + green*0.5 + "," + blue*0.5 + ")";
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        }
        x += barWidth;
    }
}

function drawCircle(dataArray, bufferLength, canvas, ctx, red, green, blue){
    const rotations = 10; //not exactly ten since bufferLength equation is irrational number
    const barWidth = 5;
    ctx.save(); //saves canvas
    ctx.translate(canvas.width / 2, canvas.height / 2); //setting origin to middle for rotation
    for (let i = 0; i < bufferLength; i++) {
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

function drawLines(dataArray, bufferLength, canvas, ctx, red, green, blue, xTracker){
    const scale = 0.025; //scale of speed
    const barHeight = canvas.height / bufferLength;
    let y = 115;
    let avg = getAverage(dataArray);
    ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
    for (let i = 0; i < bufferLength; i++) { //to put back on screen
        let velocity = scale * avg * dataArray[i]; //width of trail and value used for speed increment
        if (xTracker[i] - velocity > canvas.width) { //once edge of trail is off screen reset
            xTracker[i] = -0.25 * velocity; //reset based on trail length
        }
        if (velocity > 0) { //remove non moving lines
            ctx.fillRect(xTracker[i], y, -0.75 * velocity, barHeight); //trail 3/4 of velocity
            xTracker[i] += velocity; //movement
        }
        y += barHeight;
    }
    return xTracker;
}

function drawSquares(dataArray, bufferLength, canvas, ctx, red, green, blue){
    const scale = 0.015;
    const y = 30;
    let avg = getAverage(dataArray);
    ctx.lineWidth = 0.035;
    ctx.strokeStyle = "rgb(" + red + "," + green + "," + blue + ")";
    for (let i = 0.5; i < 10; i++) {
        drawSquare(dataArray, i/10, 4/10,scale, y, avg, canvas, ctx, bufferLength);
        drawSquare(dataArray, i/10, 6/10,scale, y, avg, canvas, ctx, bufferLength);
    }
}
function drawSquare(dataArray, xPos, yPos, scale, y, avg, canvas, ctx, bufferLength){
    ctx.save();
    ctx.translate(canvas.width * xPos, canvas.height *yPos + y);
    ctx.beginPath();
    for (let i = 0; i < bufferLength; i++) {
        let squareLength = avg * scale * dataArray[i];
        ctx.strokeRect(-1 * squareLength / 2, -1 * squareLength / 2, squareLength, squareLength);
    }
    ctx.closePath();
    ctx.restore();
}

function drawPulse(dataArray, bufferLength, canvas, ctx, red, green, blue, radiusTracker){ //draw one more 
    const scale = 0.01;
    let avg = getAverage(dataArray);
    ctx.strokeStyle = "rgb(" + red + "," + green + "," + blue + ")";
    ctx.lineWidth = 0.25;

    for (let j = 0; j < radiusTracker.length; j++) {
        for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] != 0) {
                let increment = scale * dataArray[i] * avg;
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2)
                if (radiusTracker[j] + increment > 0) { 
                    ctx.beginPath();
                    ctx.arc(0, 0, radiusTracker[j] + increment, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.stroke();
                }
                if (radiusTracker[j] - increment > 0) {
                    ctx.beginPath();
                    ctx.arc(0, 0, radiusTracker[j] - increment, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
        radiusTracker[j] += 1;
        if (radiusTracker[j] > canvas.width / 2 + 512) {
            radiusTracker[j] = -512;
        }
    }
    return radiusTracker
}

function getAverage(array){
    let sum = 0;
    let length = array.length;
    for (let i = 0; i < length; i++) {
        sum += array[i];
    }
    return sum / length;
}

export { drawBars, drawCircle, drawLines, drawSquares, drawPulse };
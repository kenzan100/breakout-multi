var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

var x = canvas.width/2;
var y = canvas.height-30;
var dx = 2;
var dy = -2;

function keyDownHandler(e) {
    let val = e.key.replace('Arrow', '');
    const actions = {
        'Left': () =>  { ( dx > 0 ) ? dx = -dx : dx },
        'Right': () => { ( dx < 0 ) ? dx = -dx : dx },
        'Up':    () => { ( dy > 0 ) ? dy = -dy : dy },
        'Down':  () => { ( dy < 0 ) ? dy = -dy : dy },
    };
    actions[val]();
    console.log(val);
}

function keyUpHandler() {
}

function draw_recg() {
    ctx.beginPath();
    ctx.rect(10, 40, 50, 50);
    ctx.fillStyle = "#FFFFFFF";
    ctx.fill();
    ctx.closePath();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_ball(x, y);
    change_direction(x, y);
    x += dx;
    y += dy;
}

function draw_ball(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI*2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function change_direction(x, y) {
    if (x + dx > canvas.width || x + dx < 0 ) {
        dx = -dx;
    }
    if (y + dy > canvas.height || y + dy < 0) {
        dy = -dy;
    }
}

setInterval(draw, 10);

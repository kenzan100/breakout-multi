import io from 'socket.io-client';
import { throttle } from 'throttle-debounce';

const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
const socket = io(`${socketProtocol}://${window.location.host}`, { reconnection: false });

const connectedPromise = new Promise(resolve => {
    socket.on('connect', () => {
        console.log('client connected to server');
        resolve();
    });
});

connectedPromise.then(() => {
    socket.on('update', processGameUpdate);
});

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

var x = canvas.width/2;
var y = canvas.height-30;
var dx = 0;
var dy = 0;

function keyDownHandler(e) {
    let val = e.key.replace('Arrow', '');
    const actions = {
        'Left':  () => { dx = -2; dy = 0; },
        'Right': () => { dx =  2; dy = 0; },
        'Up':    () => { dy = -2; dx = 0; },
        'Down':  () => { dy =  2; dx = 0; },
    };
    const fn = actions[val];
    if (typeof fn == 'function') { fn(); };
    updateInput(dx, dy);
}

const updateInput = throttle(20, (dx, dy) => {
    console.log('update');
    socket.emit('input', { dx: dx, dy: dy });
});

function keyUpHandler() {
}

function draw_recg() {
    ctx.beginPath();
    ctx.rect(10, 40, 50, 50);
    ctx.fillStyle = "#FFFFFFF";
    ctx.fill();
    ctx.closePath();
}

let gameUpdates = [];

function processGameUpdate(update) {
    gameUpdates = [update];
}

function getCurrentState() {
    if (gameUpdates.length > 0) {
        return gameUpdates[gameUpdates.length - 1];
    } else {
        return { };
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const updates = getCurrentState();

    Object.keys(updates).forEach(playerID => {
        const { x, y } = updates[playerID];
        console.log(playerID, x, y);
        draw_ball(x, y);
    });
    change_direction(x, y);
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

setInterval(render, 10);

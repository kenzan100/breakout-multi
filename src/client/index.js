import io from 'socket.io-client';
import { throttle } from 'throttle-debounce';

// render

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var x = canvas.width/2;
var y = canvas.height-30;
var dx = 0;
var dy = 0;

// input

const inputs = {
    keyDownHandler(e) {
        let val = e.key.replace('Arrow', '');
        const actions = {
            'Left':  () => { dx = -3; dy = 0; },
            'Right': () => { dx =  3; dy = 0; },
            'Up':    () => { dy = -3; dx = 0; },
            'Down':  () => { dy =  3; dx = 0; },
        };
        const fn = actions[val];
        if (typeof fn == 'function') { fn(); };
        updateInput(dx, dy);
    },
};

const updateInput = throttle(20, (dx, dy) => {
    console.log('update');
    socket.emit('input', { dx: dx, dy: dy });
});

document.addEventListener("keydown", inputs.keyDownHandler, false);

const renderer = {
    gameUpdates: [],
    start() {
        setInterval(this.render.bind(this), 1000/60);
    },
    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const updates = this.getCurrentState();

        Object.keys(updates).forEach(playerID => {
            const { x, y } = updates[playerID];
            this.draw_ball(x, y);
        });
        this.change_direction(x, y);
    },
    draw_ball(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI*2);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    },
    getCurrentState() {
        if (this.gameUpdates.length > 0) {
            return this.gameUpdates[this.gameUpdates.length - 1];
        } else {
            return { };
        }
    },
    change_direction(x, y) {
        if (x + dx > canvas.width || x + dx < 0 ) {
            dx = -dx;
        }
        if (y + dy > canvas.height || y + dy < 0) {
            dy = -dy;
        }
    }
};

// Socket io client
const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
const socket = io(`${socketProtocol}://${window.location.host}`, { reconnection: false });

const connectedPromise = new Promise(resolve => {
    socket.on('connect', () => {
        console.log('client connected to server');
        resolve();
    });
});

connectedPromise.then(() => { socket.on('update', processGameUpdate); });
function processGameUpdate(update) { renderer.gameUpdates = [update]; };

renderer.start();

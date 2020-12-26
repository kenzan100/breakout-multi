import io from 'socket.io-client';
import { throttle } from 'throttle-debounce';

// render

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var global_x = canvas.width/2;
var global_y = canvas.height-30;
var dx = 0;
var dy = 0;

// input

const inputs = {
    downActions: {
        'Left':  () => { dx = -3; dy = 0; },
        'Right': () => { dx =  3; dy = 0; },
        'Up':    () => { dy = -3; dx = 0; },
        'Down':  () => { dy =  3; dx = 0; },
    },
    keyDownHandler(e) {
        let val = e.key.replace('Arrow', '');
        const fn = this.downActions[val];
        if (typeof fn == 'function') {
            fn();
            updateInput(dx, dy);
        };
    },
    keyUpHandler(e) {
        let val = e.key;
        console.log(val);
        const kind = { r: 'Rock', p: 'Paper', s: 'Scissor' };
        if (typeof kind[val] == 'string') { coinInput(kind[val], global_x, global_y); }
    }
};

const updateInput = throttle(20, (dx, dy) => {
    console.log('update');
    socket.emit('input', { dx: dx, dy: dy });
});

const coinInput = throttle(20, (kind, x, y) => {
    console.log(kind, x, y);
    socket.emit('coinPlace', { kind, x, y, parentID: socket.id });
});

document.addEventListener("keydown", inputs.keyDownHandler.bind(inputs), false);
document.addEventListener("keyup", inputs.keyUpHandler.bind(inputs), false);

const renderer = {
    gameUpdates: [],
    matches: [],
    fillStyle: {
        Rock: "black",
        Paper: "yellow",
        Scissor: "red",
    },

    start() {
        setInterval(this.render.bind(this), 1000/60);
    },
    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const updates = this.getCurrentState();

        updates.coins.forEach(coin => {
            this.draw_coin(coin.x, coin.y, coin.kind);
        });

        console.log(this.matches);

        Object.keys(updates.players).forEach(playerID => {
            const { x, y, Rock, Paper, Scissor, state } = updates.players[playerID];
            global_x = x;
            global_y = y;
            this.draw_ball(x, y, state);
        });
    },
    draw_ball(x, y, state) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI*2);
        ctx.fillStyle = !!state ? this.fillStyle[state] : "#0095DD";
        ctx.fill();
        ctx.closePath();
    },
    draw_coin(x, y, kind) {
        ctx.beginPath();
        ctx.fillStyle = this.fillStyle[kind],
        ctx.fillRect(x - 10, y - 10, 20, 20);
        ctx.closePath();
    },
    getCurrentState() {
        if (this.gameUpdates.length > 0) {
            return this.gameUpdates[this.gameUpdates.length - 1];
        } else {
            return { players: {}, coins: {} };
        }
    },
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

connectedPromise.then(() => {
    socket.on('update', processGameUpdate);
    socket.on('lost', processWinLose);
});
function processGameUpdate(update) { renderer.gameUpdates = [update]; };
function processWinLose(matches) { renderer.matches = [matches]; };

renderer.start();

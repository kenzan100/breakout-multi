import io from 'socket.io-client';
import { throttle } from 'throttle-debounce';

// render

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var global_x = canvas.width/2;
var global_y = canvas.height-30;
var dx = 0;
var dy = 0;

const winLoseMenu = document.getElementById('win-lose-menu');
const yourState = document.getElementById('your-state');
const opponentState = document.getElementById('opponent-state');
const winLoseResult = document.getElementById('win-lose-result');

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
        const kind = { r: 'Rock', p: 'Paper', s: 'Scissor' };
        if (typeof kind[val] == 'string') { coinInput(kind[val], global_x, global_y); }
    }
};

const updateInput = throttle(20, (dx, dy) => {
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
    match: {},
    fillStyle: { Rock: "black", Paper: "yellow", Scissor: "red", },

    start() {
        setInterval(this.render.bind(this), 1000/60);
    },

    fillInfoToWinLoseMenu(match) {
        const updates = this.getCurrentState();
        yourState.textContent = updates.players[socket.id].state;
        const opponent = match.winner.ID == socket.id ? match.loser : match.winner;
        opponentState.textContent = opponent.state;

        if (opponent.ID === match.winner.ID) {
            winLoseResult.textContent = "You Lost...";
        } else {
            winLoseResult.textContent = "You Win!";
        }
    },

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const updates = this.getCurrentState();

        console.log(this.match);
        if (this.match.loser && this.match.winner) {
            if (this.match.loser.ID == socket.id || this.match.winner.ID == socket.id ) {
                this.fillInfoToWinLoseMenu(this.match);
                winLoseMenu.classList.remove('hidden');
            }
        }

        updates.coins.forEach(coin => {
            this.draw_coin(coin.x, coin.y, coin.kind);
        });

        Object.keys(updates.players).forEach(playerID => {
            const { x, y, Rock, Paper, Scissor, state } = updates.players[playerID];
            if (socket.id === playerID ) {
                global_x = x;
                global_y = y;
            }
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
            return { players: {}, coins: [] };
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
    socket.on('lose', processWinLose);
    socket.on('win', processWinLose);
});
function processGameUpdate(update) { renderer.gameUpdates = [update]; };
function processWinLose(match) { renderer.match = match; };

renderer.start();

import io from 'socket.io-client';
import { throttle } from 'throttle-debounce';

// render

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var global_x = canvas.width/2;
var global_y = canvas.height-30;
var global_dir = 0;
var dx = 0;
var dy = 0;

const TO_RADIANS = Math.PI/180;

const winLoseMenu = document.getElementById('win-lose-menu');
const yourState = document.getElementById('your-state');
const opponentState = document.getElementById('opponent-state');
const winLoseResult = document.getElementById('win-lose-result');

const rockImage = document.getElementById('rock_img');
const paperImage = document.getElementById('paper_img');
const scissorImage = document.getElementById('scissor_img');

const coinRockImage = document.getElementById('coin_rock_img');
const coinPaperImage = document.getElementById('coin_paper_img');
const coinScissorImage = document.getElementById('coin_scissor_img');

const yourShapeStatus = document.getElementById('your-shape-status');
const yourShapeNow = document.getElementById('your-shape-now');

// input

const inputs = {
    downActions: {
        'Left':  () => { dx = -2; dy = 0; global_dir = 270; },
        'Right': () => { dx =  2; dy = 0; global_dir =  90; },
        'Up':    () => { dy = -2; dx = 0; global_dir =   0; },
        'Down':  () => { dy =  2; dx = 0; global_dir = 180; },
    },
    moveAction(e) {
        let val = e.key.replace('Arrow', '');
        const fn = this.downActions[val];
        if (typeof fn == 'function') { fn(); updateInput(dx, dy); };
    },
    coinAction(e) {
        let val = e.key;
        const kind = { r: 'Rock', p: 'Paper', s: 'Scissor' };
        if (typeof kind[val] == 'string') { coinInput(kind[val], global_x, global_y); }
    },
    keyDownHandler(e) {
        this.moveAction(e);
    },
    keyUpHandler(e) {
        this.coinAction(e);
    },
};

const updateInput = throttle(20, (dx, dy) => {
    socket.emit('input', { dx: dx, dy: dy, dir: global_dir });
});

const coinInput = throttle(20, (kind, x, y) => {
    socket.emit('coinPlace', { kind, x, y });
});

document.addEventListener("keydown", inputs.keyDownHandler.bind(inputs), false);
document.addEventListener("keyup", inputs.keyUpHandler.bind(inputs), false);

const renderer = {
    gameUpdates: [],
    match: {},
    fillStyle: { Rock: "black", Paper: "yellow", Scissor: "red", },
    imageMap:  { Rock: rockImage, Paper: paperImage, Scissor: scissorImage },
    coinImageMap:  { Rock: coinRockImage, Paper: coinPaperImage, Scissor: coinScissorImage },
    currentInterval: null,

    start() {
        this.currentInterval = setInterval(this.render.bind(this), 1000/60);
    },

    fillInfoToWinLoseMenu(match) {
        const updates = this.getCurrentState();
        yourState.textContent = updates.players[socket.id].state;
        const opponent = match.winner.ID == socket.id ? match.loser : match.winner;
        opponentState.textContent = opponent.state;

        if (opponent.ID === match.winner.ID) {
            winLoseResult.textContent = "You Lost...";
            socket.disconnect();
            clearInterval(this.currentInterval);
        } else {
            winLoseResult.textContent = "You Beat another player! Keep going!";
            setTimeout(() => winLoseMenu.classList.add('hidden'), 2000);
        }
    },

    fillPlayerStatusHud(updates) {
        const player = updates.players[socket.id];
        yourShapeNow.textContent = player.state;
        yourShapeStatus.textContent = `Rock: ${player.Rock} | Paper: ${player.Paper} | Scissor: ${player.Scissor}`;
    },

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const updates = this.getCurrentState();

        if (this.match.loser && this.match.winner) {
            if (this.match.loser.ID == socket.id || this.match.winner.ID == socket.id ) {
                this.fillInfoToWinLoseMenu(this.match);
                winLoseMenu.classList.remove('hidden');
                this.match = {};
            }
        }

        this.fillPlayerStatusHud(updates);

        updates.coins.forEach(coin => {
            this.draw_coin(coin.x, coin.y, coin.kind);
        });

        Object.keys(updates.players).forEach(playerID => {
            const { x, y, Rock, Paper, Scissor, state, dir } = updates.players[playerID];
            if (socket.id === playerID ) {
                global_x = x;
                global_y = y;
            }
            this.draw_rps(x, y, state, dir);
        });
    },
    draw_rps(x, y, state, dir) {
        // https://stackoverflow.com/questions/46134651/rotating-single-image-in-canvas-for-game
        ctx.setTransform(1,0,0,1,x,y);

        ctx.rotate(TO_RADIANS*dir);

        const img = this.imageMap[state];
        ctx.drawImage(img, -img.width/4, -img.height/2);

        ctx.setTransform(1,0,0,1,0,0);
    },
    draw_coin(x, y, kind) {
        ctx.setTransform(1,0,0,1,x,y);

        const img = this.coinImageMap[kind];
        ctx.drawImage(img, -img.width/2, -img.height/2);

        ctx.setTransform(1,0,0,1,0,0);
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

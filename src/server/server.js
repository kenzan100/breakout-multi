const express = require('express');
const socketio = require('socket.io');

const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('../../webpack.config.js');

const app = express();
app.use(express.static('dist'));

const compiler = webpack(webpackConfig);
app.use(webpackDevMiddleware(compiler));

const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`server listening on port ${port}`);

let players = {};
let sockets = {};

const io = socketio(server);
io.on('connection', socket => {
    console.log('player connected', socket.id);
    sockets[socket.id] = socket;
    players[socket.id] = { x: 10, y: 10 };
    socket.on('input', handleInput);
});

function handleInput(input) {
    if (players[this.id]) {
        players[this.id]['x'] += input.dx;
        players[this.id]['y'] += input.dy;
    }
}

function update() {
    Object.keys(players).forEach(socketID => {
        const socket = sockets[socketID];
        socket.emit('update', players);
    });
}

setInterval(update, 1000 / 10);

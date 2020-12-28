const express = require('express');
const socketio = require('socket.io');
const helmet = require('helmet');

const createGame = require('./game');

// Spin up server
const app = express();
app.use(helmet());
app.use(express.static('dist'));

if (process.env.NODE_ENV === 'development') {
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackConfig = require('../../webpack.dev.js');
    // Setup Webpack for development
    const compiler = webpack(webpackConfig);
    app.use(webpackDevMiddleware(compiler));
}

const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`server listening on port ${port}`);

// Game setup
const game = createGame();
game.start();

// Socket
const io = socketio(server);
io.on('connection', socket => {
    console.log('player connected', socket.id);
    game.joinGame(socket);
    socket.on('input', handleInput);
    socket.on('coinPlace', handleCoinPlacement);
    socket.on('disconnect', onDisconnect);
});
function handleInput(input) { game.handleInput(this, input); }
function handleCoinPlacement(input) { game.handleCoinPlacement(this, input); }
function onDisconnect() { game.removePlayer(this.id); }

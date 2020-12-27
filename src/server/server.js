const express = require('express');
const socketio = require('socket.io');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const helmet = require('helmet');

const webpackConfig = require('../../webpack.config.js');
const createGame = require('./game');

// Spin up server
const app = express();
const compiler = webpack(webpackConfig);
app.use(helmet());
app.use(express.static('dist'));
app.use(webpackDevMiddleware(compiler));

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
});
function handleInput(input) { game.handleInput(this, input); }
function handleCoinPlacement(input) { game.handleCoinPlacement(this, input); }

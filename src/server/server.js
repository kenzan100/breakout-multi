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

const io = socketio(server);
console.log('a');
io.on('connection', socket => {
    console.log('player connected', socket.id);
});
console.log('a');

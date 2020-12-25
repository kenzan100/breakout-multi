const createGame = () => ({
    players: {},
    sockets: {},

    start () {
        setInterval(this.update.bind(this), 1000 / 60);
    },

    joinGame(socket) {
        console.log('aaa');
        this.sockets[socket.id] = socket;
        this.players[socket.id] = { x: 10, y: 10 };
    },

    handleInput(socket, input) {
        if (this.players[socket.id]) {
            this.players[socket.id]['x'] += input.dx;
            this.players[socket.id]['y'] += input.dy;
        }
    },

    update() {
        Object.keys(this.players).forEach(socketID => {
            const socket = this.sockets[socketID];
            socket.emit('update', this.players);
        });
    },
});

module.exports = createGame;

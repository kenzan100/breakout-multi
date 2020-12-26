const createGame = () => ({
    players: {},
    sockets: {},
    coins: [],

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
        const coinsToRemove = {};

        this.coins = this.coins.filter(coin => !coinsToRemove[coin]);

        Object.values(this.sockets).forEach(socket => {
            socket.emit('update', this.players);
        });
    },
});

module.exports = createGame;

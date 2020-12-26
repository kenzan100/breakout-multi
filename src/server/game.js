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
        this.players[socket.id] = { x: 10, y: 10, Rock: 0, Paper: 0, Scissor: 0 };
    },

    handleInput(socket, input) {
        if (this.players[socket.id]) {
            this.players[socket.id]['x'] += input.dx;
            this.players[socket.id]['y'] += input.dy;
        }
    },

    handleCoinPlacement(socket, input) {
        console.log(input);
        let newCoin = { x: input.x, y: input.y, kind: input.kind, parentID: input.parentID };
        this.coins.push(newCoin);
    },

    update() {
        const coinsToRemove = this.applyCollision();

        if (Object.keys(coinsToRemove).length > 0) {
            console.log(coinsToRemove);
            console.log(this.coins.length);
            console.log(this.coins.filter(coin => !coinsToRemove.get(coin)));
            console.log(this.coins.length);
        }

        this.coins = this.coins.filter(coin => !coinsToRemove.get(coin));

        Object.values(this.sockets).forEach(socket => {
            socket.emit('update', this.getCurrentState());
        });
    },

    getCurrentState() {
        return {
            players: this.players,
            coins: this.coins,
        };
    },

    applyCollision() {
        const coinsToRemove = new Map();
        this.coins.forEach(coin => {
            Object.keys(this.players).forEach(key => {
                const player = this.players[key];
                if (key !== coin.parentID &&
                    this.closeEnough(player.x, player.y, coin.x, coin.y)) {
                    player[coin.kind] += 1;
                    coinsToRemove.set(coin, true);
                }
            });
        });

        return coinsToRemove;
    },

    closeEnough(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= 10;
    },
});

module.exports = createGame;

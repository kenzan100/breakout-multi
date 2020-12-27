const createGame = () => ({
    players: {},
    sockets: {},
    coins: [],
    startAt: 0,
    lastSpeedUpAt: 0,
    speedCoefficient: 1,
    dirOffset: {
        0:   { x:    0, y: -100 },
        90:  { x:  100, y:   0 },
        180: { x:    0, y:  100 },
        270: { x: -100, y:   0 },
    },

    start () {
        this.startAt = Date.now();
        setInterval(this.update.bind(this), 1000 / 60);
    },

    joinGame(socket) {
        this.sockets[socket.id] = socket;
        this.players[socket.id] = {
            ID: socket.id, x: 10, y: 10, Rock: 0, Paper: 0, Scissor: 0, state: 'Rock', dir: 0
        };
    },

    handleInput(socket, input) {
        if (this.players[socket.id]) {
            this.players[socket.id]['x'] += input.dx; // * this.speedCoefficient;
            this.players[socket.id]['y'] += input.dy; // * this.speedCoefficient;
            this.players[socket.id]['dir'] = input.dir;
        }
    },

    handleCoinPlacement(socket, input) {
        console.log(input);
        const player = this.players[socket.id];
        const offset = this.dirOffset[player.dir];
        let newCoin = { x: input.x + offset.x, y: input.y + offset.y, kind: input.kind, parentID: socket.id };
        this.coins.push(newCoin);
    },

    update() {
        const elapsed = Date.now() - this.startAt;
        if (elapsed - this.lastSpeedUpAt > 5000) {
            this.speedCoefficient *= 1.01;
            this.lastSpeedUpAt = elapsed;
        }

        const coinsToRemove = this.applyCoinCollision();

        this.coins = this.coins.filter(coin => !coinsToRemove.get(coin));

        const match = this.applyPlayerCollision();
        if (match && match.winner && match.loser) {
            this.sockets[match.winner.ID].emit('win', match);
            this.sockets[match.loser.ID].emit('lose', match);
            delete this.sockets[match.loser.ID];
            delete this.players[match.loser.ID];
        };

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

    applyCoinCollision() {
        const coinsToRemove = new Map();
        this.coins.forEach(coin => {
            Object.keys(this.players).forEach(key => {
                const player = this.players[key];
                if (this.closeEnough(player.x, player.y, coin.x, coin.y, 30)) {
                    player[coin.kind] += 1;
                    player.state = this.setState(player);
                    coinsToRemove.set(coin, true);
                }
            });
        });

        return coinsToRemove;
    },

    setState(player) {
        const rps = { Rock: player.Rock, Paper: player.Paper, Scissor: player.Scissor };
        const max = Math.max.apply(null, Object.values(rps));
        let kind;

        if (max !== 0) {
            const idx = Object.values(rps).indexOf(max);
            kind = Object.keys(rps)[idx];
        }
        return kind;
    },

    applyPlayerCollision() {
        let match = {};

        Object.keys(this.players).forEach(p1_key => {
            Object.keys(this.players).forEach(p2_key => {
                if (p1_key === p2_key) { return; };

                const p1 = this.players[p1_key];
                const p2 = this.players[p2_key];
                if (this.closeEnough(p1.x, p1.y, p2.x, p2.y, 30)) {
                    const res = this.rock_paper_scissors(p1, p2);
                    match = res;
                    return;
                }
            });
        });

        return match;
    },

    closeEnough(x1, y1, x2, y2, threshold) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= (threshold || 10);
    },

    rock_paper_scissors(p1, p2) {
        const table = {
            Rock:  { Rock: 'tie', Paper: 'lose', Scissor: 'win' },
            Paper: { Rock: 'win', Paper: 'tie', Scissor: 'lose' },
            Scissor: { Rock: 'lose', Paper: 'win', Scissor: 'tie' },
        };

        const match = {};
        if (table[p1.state]) {
            const p1_win_lose = table[p1.state][p2.state];
            if (p1_win_lose === 'win') {
                match.winner = p1;
                match.loser = p2;
            } else if (p1_win_lose === 'lose') {
                match.winner = p2;
                match.loser = p1;
            }
        }
        return match;
    }
});

module.exports = createGame;

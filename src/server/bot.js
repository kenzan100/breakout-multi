const crypto = require("crypto");

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

const createBot = () => ({
    start(game) {
        const fakeSocketId = crypto.randomBytes(20).toString('hex');
        const x = getRandomInt(630);
        const y = getRandomInt(310);
        game.joinGame({ id: fakeSocketId }, false, x, y);
    },

    update() {
        const closestPlayer = this.getClosestPlayer();

        if (this.winning(closestPlayer)) {

            this.moveCloser(closestPlayer);

        } else if (this.losing(closestPlayer)) {

            this.moveAway(closestPlayer);

        }

        if (this.losing(closestPlayer)) {

            this.placeCoinToWin(closestPlayer);

        }
    },
});


const botManager = {
    game: null,
    cheat: null,
    bots: [],

    start(game) {
        this.game = game;
        setInterval(this.spawnBot.bind(this), 3000);
    },

    spawnBot() {
        if (this.cheat.numPlayers < 4) {
            const bot = createBot();
            bot.start(this.game);
            this.bots.push(bot);
        }
    },
};

module.exports = botManager;

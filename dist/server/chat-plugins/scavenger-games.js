"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var scavenger_games_exports = {};
__export(scavenger_games_exports, {
  ScavMods: () => ScavMods,
  ScavengerGameTemplate: () => ScavengerGameTemplate
});
module.exports = __toCommonJS(scavenger_games_exports);
var import_scavengers = require("./scavengers");
var import_lib = require("../../lib");
/**
 * Scavengers Games Plugin
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This plugin stores the different possible game modes and twists that take place in scavengers room
 *
 * @license MIT license
 */
function toSeconds(time) {
  const parts = time.split(":").reverse();
  return parts.map((value, index) => parseInt(value) * Math.pow(60, index)).reduce((a, b) => a + b);
}
class Leaderboard {
  constructor() {
    this.data = {};
  }
  addPoints(name, aspect, points, noUpdate) {
    const userid = toID(name);
    if (!userid || userid === "constructor" || !points)
      return this;
    if (!this.data[userid])
      this.data[userid] = { name };
    if (!this.data[userid][aspect])
      this.data[userid][aspect] = 0;
    this.data[userid][aspect] += points;
    if (!noUpdate)
      this.data[userid].name = name;
    return this;
  }
  visualize(sortBy, userid) {
    return new Promise((resolve, reject) => {
      let lowestScore = Infinity;
      let lastPlacement = 1;
      const ladder = import_lib.Utils.sortBy(
        Object.entries(this.data).filter(([u, bit]) => sortBy in bit),
        ([u, bit]) => -bit[sortBy]
      ).map(([u, bit], i) => {
        if (bit[sortBy] !== lowestScore) {
          lowestScore = bit[sortBy];
          lastPlacement = i + 1;
        }
        return {
          rank: lastPlacement,
          ...bit
        };
      });
      if (userid) {
        const rank = ladder.find((entry) => toID(entry.name) === userid);
        resolve(rank);
      } else {
        resolve(ladder);
      }
    });
  }
  async htmlLadder() {
    const data = await this.visualize("points");
    const display = `<div class="ladder" style="overflow-y: scroll; max-height: 170px;"><table style="width: 100%"><tr><th>Rank</th><th>Name</th><th>Points</th></tr>${data.map((line) => `<tr><td>${line.rank}</td><td>${line.name}</td><td>${line.points}</td></tr>`).join("")}</table></div>`;
    return display;
  }
}
const TWISTS = {
  perfectscore: {
    name: "Perfect Score",
    id: "perfectscore",
    desc: "Players who finish the hunt without submitting a single wrong answer get a shoutout!",
    onLeave(player) {
      if (!this.leftGame)
        this.leftGame = [];
      this.leftGame.push(player.id);
    },
    onSubmitPriority: 1,
    onSubmit(player, value) {
      const currentQuestion = player.currentQuestion;
      if (!player.answers)
        player.answers = {};
      if (!player.answers[currentQuestion])
        player.answers[currentQuestion] = [];
      if (player.answers[currentQuestion].includes(value))
        return;
      player.answers[currentQuestion].push(value);
    },
    onComplete(player, time, blitz) {
      const isPerfect = !this.leftGame?.includes(player.id) && Object.values(player.answers).every((attempts) => attempts.length <= 1);
      return { name: player.name, time, blitz, isPerfect };
    },
    onAfterEndPriority: 1,
    onAfterEnd(isReset) {
      if (isReset)
        return;
      const perfect = this.completed.filter((entry) => entry.isPerfect).map((entry) => entry.name);
      if (perfect.length) {
        this.announce(import_lib.Utils.html`${Chat.toListString(perfect)} ${perfect.length > 1 ? "have" : "has"} completed the hunt without a single wrong answer!`);
      }
    }
  },
  bonusround: {
    name: "Bonus Round",
    id: "bonusround",
    desc: "Players can choose whether or not they choose to complete the 4th question.",
    onAfterLoad() {
      if (this.questions.length === 3) {
        this.announce("This twist requires at least four questions.  Please reset the hunt and make it again.");
        this.huntLocked = true;
      } else {
        this.questions[this.questions.length - 1].hint += " (You may choose to skip this question using ``/scavenge skip``.)";
      }
    },
    onAnySubmit(player) {
      if (this.huntLocked) {
        player.sendRoom("The hunt was not set up correctly.  Please wait for the host to reset the hunt and create a new one.");
        return true;
      }
    },
    onSubmitPriority: 1,
    onSubmit(player, value) {
      const currentQuestion = player.currentQuestion;
      if (value === "skip" && currentQuestion + 1 === this.questions.length) {
        player.sendRoom("You have opted to skip the current question.");
        player.skippedQuestion = true;
        this.onComplete(player);
        return true;
      }
    },
    onComplete(player, time, blitz) {
      const noSkip = !player.skippedQuestion;
      return { name: player.name, time, blitz, noSkip };
    },
    onAfterEndPriority: 1,
    onAfterEnd(isReset) {
      if (isReset)
        return;
      const noSkip = this.completed.filter((entry) => entry.noSkip).map((entry) => entry.name);
      if (noSkip.length) {
        this.announce(import_lib.Utils.html`${Chat.toListString(noSkip)} ${noSkip.length > 1 ? "have" : "has"} completed the hunt without skipping the last question!`);
      }
    }
  },
  incognito: {
    name: "Incognito",
    id: "incognito",
    desc: "Upon answering the last question correctly, the player's finishing time will not be announced in the room!  Results will only be known at the end of the hunt.",
    onCorrectAnswer(player, value) {
      if (player.currentQuestion + 1 >= this.questions.length) {
        this.runEvent("PreComplete", player);
        player.sendRoom(`Congratulations! You have gotten the correct answer.`);
        player.sendRoom(`This is a special style where finishes aren't announced! To see your placement, wait for the hunt to end. Until then, it's your secret that you finished!`);
        return false;
      }
    },
    onPreComplete(player) {
      const now = Date.now();
      const time = Chat.toDurationString(now - this.startTime, { hhmmss: true });
      const canBlitz = this.completed.length < 3;
      const blitz = now - this.startTime <= 6e4 && canBlitz && (this.room.settings.scavSettings?.blitzPoints?.[this.gameType] || this.gameType === "official");
      const result = this.runEvent("Complete", player, time, blitz) || { name: player.name, time, blitz };
      this.preCompleted = this.preCompleted ? [...this.preCompleted, result] : [result];
      player.completed = true;
      player.destroy();
    },
    onEnd() {
      this.completed = this.preCompleted || [];
    }
  },
  spamfilter: {
    name: "Spam Filter",
    id: "spamfilter",
    desc: "Every wrong answer adds 30 seconds to your final time!",
    onIncorrectAnswer(player, value) {
      if (!player.incorrect)
        player.incorrect = [];
      const id = `${player.currentQuestion}-${value}`;
      if (player.incorrect.includes(id))
        return;
      player.incorrect.push(id);
    },
    onComplete(player, time, blitz) {
      const seconds = toSeconds(time);
      if (!player.incorrect)
        return { name: player.name, total: seconds, blitz, time, original_time: time };
      const total = seconds + 30 * player.incorrect.length;
      const finalTime = Chat.toDurationString(total * 1e3, { hhmmss: true });
      if (total > 60)
        blitz = false;
      return { name: player.name, total, blitz, time: finalTime, original_time: time };
    },
    onConfirmCompletion(player, time, blitz, place, result) {
      blitz = result.blitz;
      time = result.time;
      const deductionMessage = player.incorrect?.length ? Chat.count(player.incorrect, "incorrect guesses", "incorrect guess") : "Perfect!";
      return `<em>${import_lib.Utils.escapeHTML(player.name)}</em> has finished the hunt! (Final Time: ${time} - ${deductionMessage}${blitz ? " - BLITZ" : ""})`;
    },
    onEnd() {
      import_lib.Utils.sortBy(this.completed, (entry) => entry.total);
    }
  },
  blindincognito: {
    name: "Blind Incognito",
    id: "blindincognito",
    desc: "Upon completing the last question, neither you nor other players will know if the last question is correct!  You may be in for a nasty surprise when the hunt ends!",
    onAnySubmit(player, value) {
      if (player.precompleted) {
        player.sendRoom(`That may or may not be the right answer - if you aren't confident, you can try again!`);
        return true;
      }
    },
    onCorrectAnswer(player, value) {
      if (player.currentQuestion + 1 >= this.questions.length) {
        this.runEvent("PreComplete", player);
        player.sendRoom(`That may or may not be the right answer - if you aren't confident, you can try again!`);
        return true;
      }
    },
    onIncorrectAnswer(player, value) {
      if (player.currentQuestion + 1 >= this.questions.length) {
        player.sendRoom(`That may or may not be the right answer - if you aren't confident, you can try again!`);
        return false;
      }
    },
    onPreComplete(player) {
      const now = Date.now();
      const time = Chat.toDurationString(now - this.startTime, { hhmmss: true });
      const canBlitz = this.completed.length < 3;
      const blitz = now - this.startTime <= 6e4 && canBlitz && (this.room.settings.scavSettings?.blitzPoints?.[this.gameType] || this.gameType === "official");
      const result = this.runEvent("Complete", player, time, blitz) || { name: player.name, time, blitz };
      this.preCompleted = this.preCompleted ? [...this.preCompleted, result] : [result];
      player.precompleted = true;
    },
    onEnd() {
      this.completed = this.preCompleted || [];
    }
  },
  timetrial: {
    name: "Time Trial",
    id: "timetrial",
    desc: "Time starts when the player starts the hunt!",
    onAfterLoad() {
      if (this.questions.length === 3) {
        this.announce("This twist requires at least four questions. Please reset the hunt and make it again.");
        this.huntLocked = true;
      }
      this.altIps = {};
      this.startTimes = {};
    },
    onJoin(user) {
      if (!Config.noipchecks) {
        const altIp = user.ips.find((ip) => this.altIps[ip] && this.altsIps[ip].id !== user.id);
        if (altIp) {
          user.sendTo(this.room, `You already have started the hunt as ${this.altIps[altIp].name}.`);
          return true;
        }
      }
      if (!this.startTimes[user.id])
        this.startTimes[user.id] = Date.now();
      if (this.addPlayer(user)) {
        this.cacheUserIps(user);
        delete this.leftHunt[user.id];
        user.sendTo(this.room, "You joined the scavenger hunt! Use the command /scavenge to answer.");
        this.onSendQuestion(user);
      } else {
        user.sendTo(this.room, "You have already joined the hunt.");
      }
      return true;
    },
    onLeave(user) {
      for (const ip of user.ips) {
        this.altIps[ip] = { id: user.id, name: user.name };
      }
    },
    onAnySubmit(player) {
      if (this.huntLocked) {
        player.sendRoom("The hunt was not set up correctly.  Please wait for the host to reset the hunt and create a new one.");
        return true;
      }
    },
    onComplete(player, time, blitz) {
      const now = Date.now();
      const takenTime = Chat.toDurationString(now - this.startTimes[player.id], { hhmmss: true });
      const result = { name: player.name, id: player.id, time: takenTime, blitz };
      this.completed.push(result);
      const place = import_lib.Utils.formatOrder(this.completed.length);
      this.announce(
        import_lib.Utils.html`<em>${result.name}</em> is the ${place} player to finish the hunt! (${takenTime}${blitz ? " - BLITZ" : ""})`
      );
      import_lib.Utils.sortBy(this.completed, (entry) => entry.time);
      player.destroy();
      return true;
    }
  },
  scavengersfeud: {
    id: "scavengersfeud",
    name: "Scavengers Feud",
    desc: "After completing the hunt, players will guess what the most common incorrect answer for each question is.",
    onAfterLoad() {
      this.guesses = {};
      this.incorrect = this.questions.map(() => ({}));
      this.questions.push({
        hint: "Please enter what you think are the most common incorrect answers to each question.  (Enter your guesses in the order of the previous questions, and separate them with a comma)",
        answer: ["Any"],
        spoilers: []
      });
    },
    onIncorrectAnswer(player, value) {
      const curr = player.currentQuestion;
      if (!this.incorrect[curr][value])
        this.incorrect[curr][value] = [];
      if (this.incorrect[curr][value].includes(player.id))
        return;
      this.incorrect[curr][value].push(player.id);
    },
    onSubmitPriority: 1,
    onSubmit(player, jumble, value) {
      const currentQuestion = player.currentQuestion;
      if (currentQuestion + 1 === this.questions.length) {
        this.guesses[player.id] = value.split(",").map((part) => toID(part));
        this.onComplete(player);
        return true;
      }
    },
    onEnd() {
      this.questions = this.questions.slice(0, -1);
    },
    onAfterEnd(isReset) {
      if (isReset)
        return;
      const buffer = [];
      for (const [idx, data] of this.incorrect.entries()) {
        let collection = [];
        for (const str in data) {
          collection.push({ count: data[str].length, value: str });
        }
        collection = collection.sort((a, b) => b.count - a.count);
        const maxValue = collection[0]?.count || 0;
        const matches = collection.filter((pair) => pair.count === maxValue).map((pair) => pair.value);
        const matchedPlayers = [];
        for (const playerid in this.guesses) {
          const guesses = this.guesses[playerid];
          if (matches.includes(guesses[idx]))
            matchedPlayers.push(playerid);
        }
        const matchDisplay = matches.length ? matches.join(", ") : "No wrong answers!";
        const playerDisplay = matches.length ? matchedPlayers.length ? `- ${matchedPlayers.join(", ")}` : "- No one guessed correctly!" : "";
        buffer.push(`Q${idx + 1}: ${matchDisplay} ${playerDisplay}`);
      }
      this.announce(`<h3>Most common incorrect answers:</h3>${buffer.join("<br />")}`);
    }
  },
  minesweeper: {
    id: "minesweeper",
    name: "Minesweeper",
    desc: "The huntmaker can add incorrect 'mines' to the hunt - they get points every time a player scavenges it, and players that dodge all the mines in the hunt get points.",
    onAfterLoad() {
      this.guesses = this.questions.map(() => []);
      this.mines = [];
      for (const question of this.questions) {
        this.mines.push(question.answer.filter((ans) => ans.startsWith("!")));
        question.answer = question.answer.filter((ans) => !ans.startsWith("!"));
      }
      if (this.mines.some((mineSet) => mineSet.length === 0)) {
        this.announce("This twist requires at least one mine for each question. Please reset the hunt and make it again.");
        this.huntLocked = true;
      }
    },
    onEditQuestion(questionNumber, questionAnswer, value) {
      if (questionAnswer === "question")
        questionAnswer = "hint";
      if (!["hint", "answer"].includes(questionAnswer))
        return false;
      let answer = [];
      if (questionAnswer === "answer") {
        answer = value.split(";").map((p) => p.trim());
      }
      if (!questionNumber || questionNumber < 1 || questionNumber > this.questions.length || !answer && !value) {
        return false;
      }
      questionNumber--;
      if (questionAnswer === "answer") {
        this.mines[questionNumber] = answer.filter((ans) => ans.startsWith("!"));
        this.questions[questionNumber].answer = answer.filter((ans) => !ans.startsWith("!"));
      } else {
        this.questions[questionNumber].hint = value;
      }
      this.announce(`The ${questionAnswer} for question ${questionNumber + 1} has been edited.`);
      if (questionAnswer === "hint") {
        for (const p in this.playerTable) {
          this.playerTable[p].onNotifyChange(questionNumber);
        }
      }
      return true;
    },
    onAnySubmit(player) {
      if (this.huntLocked) {
        player.sendRoom("The hunt was not set up correctly.  Please wait for the host to reset the hunt and create a new one.");
        return true;
      }
    },
    onIncorrectAnswer(player, value) {
      const curr = player.currentQuestion;
      if (!this.guesses[curr][player.id])
        this.guesses[curr][player.id] = /* @__PURE__ */ new Set();
      this.guesses[curr][player.id].add(toID(value));
      throw new Chat.ErrorMessage("That is not the answer - try again!");
    },
    onShowEndBoard(endedBy) {
      const sliceIndex = this.gameType === "official" ? 5 : 3;
      const hosts = Chat.toListString(this.hosts.map((h) => `<em>${import_lib.Utils.escapeHTML(h.name)}</em>`));
      const mines = [];
      for (let index = 0; index < this.mines.length; index++) {
        mines[index] = [];
        for (const mine of this.mines[index]) {
          mines[index].push({ mine: mine.substr(1), users: [] });
        }
      }
      for (const player of Object.values(this.playerTable)) {
        if (!player)
          continue;
        if (player.mines) {
          for (const { index, mine } of player.mines) {
            mines[index].find((obj) => obj.mine === mine)?.users.push(player.name);
          }
        }
      }
      for (const mineSet of mines)
        mineSet.sort();
      this.announce(
        `The ${this.gameType ? `${this.gameType} ` : ""}scavenger hunt by ${hosts} was ended ${endedBy ? "by " + import_lib.Utils.escapeHTML(endedBy.name) : "automatically"}.<br />${this.completed.slice(0, sliceIndex).map((p, i) => `${import_lib.Utils.formatOrder(i + 1)} place: <em>${import_lib.Utils.escapeHTML(p.name)}</em> <span style="color: lightgreen;">[${p.time}]</span>.<br />`).join("")}${this.completed.length > sliceIndex ? `Consolation Prize: ${this.completed.slice(sliceIndex).map((e) => `<em>${import_lib.Utils.escapeHTML(e.name)}</em> <span style="color: lightgreen;">[${e.time}]</span>`).join(", ")}<br />` : ""}<br /><details style="cursor: pointer;"><summary>Solution: </summary><br />${this.questions.map((q, i) => `${i + 1}) ${Chat.formatText(q.hint)} <span style="color: lightgreen">[<em>${import_lib.Utils.escapeHTML(q.answer.join(" / "))}</em>]</span><br/><details style="cursor: pointer;"><summary>Mines: </summary>${mines[i].map(({ mine, users }) => import_lib.Utils.escapeHTML(`${mine}: ${users.join(" / ") || "-"}`)).join("<br />")}</details>`).join("<br />")}</details>`
      );
      return true;
    },
    onEnd(isReset) {
      if (isReset)
        return;
      for (const [q, guessObj] of this.guesses.entries()) {
        const mines = this.mines[q];
        for (const [playerId, guesses] of Object.entries(guessObj)) {
          const player = this.playerTable[playerId];
          if (!player.mines)
            player.mines = [];
          player.mines.push(...mines.filter((mine) => guesses.has(toID(mine))).map((mine) => ({ index: q, mine: mine.substr(1) })));
        }
      }
    },
    onAfterEndPriority: 1,
    onAfterEnd(isReset) {
      if (isReset)
        return;
      const noMines = [];
      for (const { name } of this.completed) {
        const player = this.playerTable[toID(name)];
        if (!player)
          continue;
        if (!player.mines?.length)
          noMines.push(name);
      }
      if (noMines.length) {
        this.announce(import_lib.Utils.html`${Chat.toListString(noMines)} ${noMines.length > 1 ? "have" : "has"} completed the hunt without hitting a single mine!`);
      }
    }
  }
};
const MODES = {
  ko: "kogames",
  kogames: {
    name: "KO Games",
    id: "kogames",
    mod: {
      name: "KO Games",
      id: "KO Games",
      isGameMode: true,
      onLoad() {
        this.allowRenames = false;
      },
      onJoin(user) {
        const game = this.room.scavgame;
        if (game.playerlist && !game.playerlist.includes(user.id)) {
          user.sendTo(this.room, "You are not allowed to join this scavenger hunt.");
          return true;
        }
      },
      onAfterEnd() {
        const game = this.room.scavgame;
        if (!this.completed.length) {
          this.announce("No one has completed the hunt - the round has been void.");
          return;
        }
        game.round++;
        if (!game.playerlist) {
          game.playerlist = this.completed.map((entry) => toID(entry.name));
          this.announce(`Round ${game.round} - ${Chat.toListString(this.completed.map((p) => `<em>${p.name}</em>`))} have successfully completed the last hunt and have moved on to the next round!`);
        } else {
          let eliminated = [];
          const completed = this.completed.map((entry) => toID(entry.name));
          if (completed.length === game.playerlist.length) {
            eliminated.push(completed.pop());
            game.playerlist = game.playerlist.filter((userid) => completed.includes(userid));
          } else {
            eliminated = game.playerlist.filter((userid) => !completed.includes(userid));
            for (const username of eliminated) {
              const userid = toID(username);
              game.playerlist = game.playerlist.filter((pid) => pid !== userid);
            }
          }
          this.announce(`Round ${game.round} - ${Chat.toListString(eliminated.map((n) => `<em>${n}</em>`))} ${Chat.plural(eliminated, "have", "has")} been eliminated! ${Chat.toListString(game.playerlist.map((p) => `<em>${this.playerTable[p].name}</em>`))} have successfully completed the last hunt and have moved on to the next round!`);
        }
        if (game.playerlist.length === 1) {
          const winningUser = Users.get(game.playerlist[0]);
          const winner = winningUser ? winningUser.name : game.playerlist[0];
          this.announce(`Congratulations to the winner - ${winner}!`);
          game.destroy();
        } else if (!game.playerlist.length) {
          this.announce("Everyone has been eliminated!  Better luck next time!");
          game.destroy();
        }
      }
    },
    round: 0,
    playerlist: null
  },
  scav: "scavengergames",
  scavgames: "scavengergames",
  scavengergames: {
    name: "Scavenger Games",
    id: "scavengergames",
    mod: {
      name: "Scavenger Games",
      id: "scavengergames",
      isGameMode: true,
      onLoad() {
        this.allowRenames = false;
        this.setTimer(1);
      },
      onJoin(user) {
        const game = this.room.scavgame;
        if (game.playerlist && !game.playerlist.includes(user.id)) {
          user.sendTo(this.room, "You are not allowed to join this scavenger hunt.");
          return true;
        }
      },
      onAfterEnd() {
        const game = this.room.scavgame;
        if (!this.completed.length) {
          this.announce("No one has completed the hunt - the round has been void.");
          return;
        }
        game.round++;
        let eliminated = [];
        if (!game.playerlist) {
          game.playerlist = this.completed.map((entry) => toID(entry.name));
        } else {
          const completed = this.completed.map((entry) => toID(entry.name));
          eliminated = game.playerlist.filter((userid) => !completed.includes(userid));
          for (const username of eliminated) {
            const userid = toID(username);
            game.playerlist = game.playerlist.filter((pid) => pid !== userid);
          }
        }
        this.announce(`Round ${game.round} - ${Chat.toListString(eliminated.map((n) => `<em>${n}</em>`))} ${eliminated.length ? `${Chat.plural(eliminated, "have", "has")} been eliminated!` : ""} ${Chat.toListString(game.playerlist.map((p) => `<em>${this.playerTable[p].name}</em>`))} have successfully completed the last hunt and have moved on to the next round!`);
        if (game.playerlist.length === 1) {
          const winningUser = Users.get(game.playerlist[0]);
          const winner = winningUser ? winningUser.name : game.playerlist[0];
          this.announce(`Congratulations to the winner - ${winner}!`);
          game.destroy();
        } else if (!game.playerlist.length) {
          this.announce("Everyone has been eliminated!  Better luck next time!");
          game.destroy();
        }
      }
    },
    round: 0,
    playerlist: null
  },
  pr: "pointrally",
  pointrally: {
    name: "Point Rally",
    id: "pointrally",
    pointDistribution: [50, 40, 32, 25, 20, 15, 10],
    mod: {
      name: "Point Rally",
      id: "pointrally",
      isGameMode: true,
      onLoad() {
        const game = this.room.scavgame;
        this.announce(`Round ${++game.round}`);
      },
      async onAfterEnd() {
        const game = this.room.scavgame;
        for (const [i, completed] of this.completed.map((e) => e.name).entries()) {
          const points = game.pointDistribution[i] || game.pointDistribution[game.pointDistribution.length - 1];
          game.leaderboard.addPoints(completed, "points", points);
        }
        const room = this.room;
        const html = await game.leaderboard.htmlLadder();
        room.add(`|raw|${html}`).update();
      }
    },
    round: 0,
    leaderboard: true
  },
  js: "jumpstart",
  jump: "jumpstart",
  jumpstart: {
    name: "Jump Start",
    id: "jumpstart",
    jumpstart: [60, 40, 30, 20, 10],
    round: 0,
    mod: {
      name: "Jump Start",
      id: "jumpstart",
      isGameMode: true,
      onLoad() {
        const game = this.room.scavgame;
        if (game.round === 0)
          return;
        const maxTime = Math.max(...game.jumpstart);
        this.jumpstartTimers = [];
        this.answerLock = true;
        for (const [i, time] of game.jumpstart.entries()) {
          if (!game.completed[i])
            break;
          this.jumpstartTimers[i] = setTimeout(() => {
            const target = game.completed.shift();
            if (!target)
              return;
            const staffHost = Users.get(this.staffHostId);
            const targetUser = Users.get(target);
            if (targetUser) {
              if (staffHost)
                staffHost.sendTo(this.room, `${targetUser.name} has received their first hint early.`);
              targetUser.sendTo(
                this.room,
                `|raw|<strong>The first hint to the next hunt is:</strong> ${Chat.formatText(this.questions[0].hint)}`
              );
              targetUser.sendTo(
                this.room,
                `|notify|Early Hint|The first hint to the next hunt is: ${Chat.formatText(this.questions[0].hint)}`
              );
            }
          }, (maxTime - time) * 1e3 + 5e3);
        }
        this.jumpstartTimers[this.jumpstartTimers.length] = setTimeout(() => {
          this.answerLock = false;
          const message = this.getCreationMessage(true);
          this.room.add(message).update();
          this.announce("You may start guessing!");
          this.startTime = Date.now();
        }, 1e3 * (maxTime + 5));
      },
      onJoin(user) {
        if (this.answerLock) {
          user.sendTo(this.room, `The hunt is not open for guesses yet!`);
          return true;
        }
      },
      onViewHunt(user) {
        if (this.answerLock && !(this.hosts.some((h) => h.id === user.id) || user.id === this.staffHostId)) {
          return true;
        }
      },
      onCreateCallback() {
        if (this.answerLock) {
          return `|raw|<div class="broadcast-blue"><strong>${["official", "unrated"].includes(this.gameType) ? "An" : "A"} ${this.gameType} Scavenger Hunt by <em>${import_lib.Utils.escapeHTML(Chat.toListString(this.hosts.map((h) => h.name)))}</em> has been started${this.hosts.some((h) => h.id === this.staffHostId) ? "" : ` by <em>${import_lib.Utils.escapeHTML(this.staffHostName)}</em>`}.<br />The first hint is currently being handed out to early finishers.`;
        }
      },
      onEnd(reset) {
        if (this.jumpstartTimers) {
          for (const timer of this.jumpstartTimers) {
            clearTimeout(timer);
          }
        }
        const game = this.room.scavgame;
        if (!reset) {
          if (game.round === 0) {
            game.completed = this.completed.map((entry) => toID(entry.name));
            game.round++;
          } else {
            game.destroy();
          }
        }
      }
    }
  },
  ts: "teamscavs",
  tscav: "teamscavs",
  teamscavengers: "teamscavs",
  teamscavs: {
    name: "Team Scavs",
    id: "teamscavs",
    /* {
    	[team
    	name: string]: {
    	  name: string[],
    	  players: UserID[],
    	  answers: string[],
    	  question: number,
    	  completed: boolean
    	}
      } */
    teams: {},
    teamAnnounce(player, message) {
      const team = this.getPlayerTeam(player);
      for (const userid of team.players) {
        const user = Users.getExact(userid);
        if (!user?.connected)
          continue;
        user.sendTo(this.room, `|raw|<div class="infobox">${message}</div>`);
      }
    },
    getPlayerTeam(player) {
      const game = this.room.scavgame;
      for (const teamID in game.teams) {
        const team = game.teams[teamID];
        if (team.players.includes(player.id)) {
          return team;
        }
      }
      return null;
    },
    advanceTeam(answerer, isFinished) {
      const hunt = this.room.getGame(import_scavengers.ScavengerHunt);
      const team = this.getPlayerTeam(answerer);
      team.question++;
      const question = hunt.getQuestion(team.question);
      for (const userid of team.players) {
        const user = Users.getExact(userid);
        if (!user)
          continue;
        user.sendTo(this.room, question);
      }
      team.answers = [];
    },
    mod: {
      name: "Team Scavs",
      id: "teamscavs",
      isGameMode: true,
      onLoad() {
        this.allowRenames = false;
      },
      onViewHunt(user) {
        const game = this.room.scavgame;
        const team = game.getPlayerTeam(user);
        const player = this.playerTable[user.id];
        if (!player || !team)
          return;
        if (player.currentQuestion !== team.question - 1)
          player.currentQuestion = team.question - 1;
        if (team.completed)
          player.completed = true;
      },
      onSendQuestion(player) {
        const game = this.room.scavgame;
        const team = game.getPlayerTeam(player);
        if (!team)
          return;
        if (player.currentQuestion !== team.question - 1)
          player.currentQuestion = team.question - 1;
        if (team.completed) {
          player.completed = true;
          player.sendRoom("Your team has already completed the hunt!");
          return true;
        }
      },
      onConnect(user) {
        const player = this.playerTable[user.id];
        if (!player)
          return;
        const game = this.room.scavgame;
        const team = game.getPlayerTeam(player);
        if (team) {
          if (player.currentQuestion !== team.question - 1)
            player.currentQuestion = team.question - 1;
          if (team.completed)
            player.completed = true;
        }
      },
      onJoin(user) {
        const game = this.room.scavgame;
        const team = game.getPlayerTeam(user);
        if (!team) {
          user.sendTo(this.room, "You are not allowed to join this scavenger hunt as you are not on any of the teams.");
          return true;
        }
      },
      onAfterLoadPriority: -9999,
      onAfterLoad() {
        const game = this.room.scavgame;
        if (Object.keys(game.teams).length === 0) {
          this.announce("Teams have not been set up yet.  Please reset the hunt.");
        }
      },
      // -1 so that blind incog takes precedence of this
      onCorrectAnswerPriority: -1,
      onCorrectAnswer(player, value) {
        const game = this.room.scavgame;
        if (player.currentQuestion + 1 < this.questions.length) {
          game.teamAnnounce(
            player,
            import_lib.Utils.html`<strong>${player.name}</strong> has gotten the correct answer (${value}) for question #${player.currentQuestion + 1}.`
          );
          game.advanceTeam(player);
          return false;
        }
      },
      onAnySubmit(player, value) {
        const game = this.room.scavgame;
        const team = game.getPlayerTeam(player);
        if (!team)
          return true;
        if (player.currentQuestion !== team.question - 1)
          player.currentQuestion = team.question - 1;
        if (team.completed)
          player.completed = true;
        if (player.completed)
          return;
        if (team.answers.includes(value))
          return;
        game.teamAnnounce(player, import_lib.Utils.html`${player.name} has guessed "${value}".`);
        team.answers.push(value);
      },
      onCompletePriority: 2,
      onComplete(player, time, blitz) {
        const game = this.room.scavgame;
        const team = game.getPlayerTeam(player);
        return { name: team.name, time, blitz };
      },
      // workaround that gives the answer after verifying that completion should not be hidden
      onConfirmCompletion(player, time, blitz) {
        const game = this.room.scavgame;
        const team = game.getPlayerTeam(player);
        team.completed = true;
        team.question++;
        game.teamAnnounce(
          player,
          import_lib.Utils.html`<strong>${player.name}</strong> has gotten the correct answer for question #${player.currentQuestion}.  Your team has completed the hunt!`
        );
      },
      onEnd() {
        const game = this.room.scavgame;
        for (const teamID in game.teams) {
          const team = game.teams[teamID];
          team.answers = [];
          team.question = 1;
          team.completed = false;
        }
      }
    }
  }
};
class ScavengerGameTemplate {
  constructor(room) {
    this.room = room;
    this.playerlist = null;
    this.timer = null;
  }
  destroy(force) {
    if (this.timer)
      clearTimeout(this.timer);
    const game = this.room.getGame(import_scavengers.ScavengerHunt);
    if (force && game)
      game.onEnd(false);
    this.room.scavgame = null;
  }
  eliminate(userid) {
    if (!this.playerlist?.includes(userid))
      return false;
    this.playerlist = this.playerlist.filter((pid) => pid !== userid);
    if (this.leaderboard)
      delete this.leaderboard.data[userid];
    return true;
  }
  announce(msg) {
    this.room.add(`|raw|<div class="broadcast-blue"><strong>${msg}</strong></div>`).update();
  }
}
const LoadGame = function(room, gameid) {
  let game = MODES[gameid];
  if (!game)
    return false;
  if (typeof game === "string")
    game = MODES[game];
  const base = new ScavengerGameTemplate(room);
  const scavgame = Object.assign(base, import_lib.Utils.deepClone(game));
  if (scavgame.leaderboard) {
    scavgame.leaderboard = new Leaderboard();
  }
  return scavgame;
};
const ScavMods = {
  LoadGame,
  twists: TWISTS,
  modes: MODES
};
//# sourceMappingURL=scavenger-games.js.map

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var abuse_monitor_exports = {};
__export(abuse_monitor_exports, {
  cache: () => cache,
  chatfilter: () => chatfilter,
  classifier: () => classifier,
  commands: () => commands,
  handlers: () => handlers,
  lastLogTime: () => lastLogTime,
  lock: () => lock,
  loginfilter: () => loginfilter,
  metadata: () => metadata,
  migrated: () => migrated,
  muted: () => muted,
  notifyStaff: () => notifyStaff,
  pages: () => pages,
  pokemonRegex: () => pokemonRegex,
  punishmentCache: () => punishmentCache,
  punishmentfilter: () => punishmentfilter,
  reviews: () => reviews,
  runActions: () => runActions,
  searchModlog: () => searchModlog,
  settings: () => settings,
  writeStats: () => writeStats
});
module.exports = __toCommonJS(abuse_monitor_exports);
var Artemis = __toESM(require("../artemis"));
var import_lib = require("../../lib");
var import_config_loader = require("../config-loader");
var import_dex_data = require("../../sim/dex-data");
var import_helptickets = require("./helptickets");
const WHITELIST = ["mia"];
const MUTE_DURATION = 7 * 60 * 1e3;
const DAY = 24 * 60 * 60 * 1e3;
const STAFF_NOTIF_INTERVAL = 10 * 60 * 1e3;
const MAX_MODLOG_TIME = 2 * 365 * DAY;
const NON_PUNISHMENTS = ["MUTE", "REPORT"];
const NOJOIN_COMMAND_WHITELIST = {
  "lock": "/lock",
  "weeklock": "/weeklock",
  "warn": "/warn",
  "forcerename": "/fr",
  "namelock": "/nl",
  "weeknamelock": "/wnl"
};
let migrated = global.Chat?.oldPlugins["abuse-monitor"]?.migrated || false;
const cache = (() => {
  const plugin = global.Chat?.oldPlugins["abuse-monitor"];
  if (!plugin?.cache)
    return {};
  if (plugin.migrated)
    return plugin.cache;
  for (const k in plugin.cache) {
    const cur = plugin.cache[k];
    if (typeof cur.recommended?.type === "string") {
      delete cur.recommended;
    }
  }
  migrated = true;
  return plugin.cache;
})();
const muted = Chat.oldPlugins["abuse-monitor"]?.muted || /* @__PURE__ */ new WeakMap();
const defaults = {
  threshold: 4,
  thresholdIncrement: null,
  minScore: 0.65,
  specials: {
    THREAT: { 0.96: "MAXIMUM" },
    IDENTITY_ATTACK: { 0.8: 2 },
    SEVERE_TOXICITY: { 0.8: 2 }
  },
  replacements: {},
  recommendOnly: true,
  punishments: [
    { certainty: 0.93, type: "IDENTITY_ATTACK", punishment: "WARN", count: 2 }
  ]
};
const settings = (() => {
  try {
    return { ...defaults, ...JSON.parse((0, import_lib.FS)("config/chat-plugins/nf.json").readSync()) };
  } catch (e) {
    if (e.code !== "ENOENT")
      throw e;
    return defaults;
  }
})();
const reviews = (() => {
  try {
    return JSON.parse((0, import_lib.FS)(`config/chat-plugins/artemis-reviews.json`).readSync());
  } catch {
    return {};
  }
})();
const metadata = (() => {
  try {
    return JSON.parse((0, import_lib.FS)("config/chat-plugins/artemis-metadata.json").readSync());
  } catch {
    return {};
  }
})();
function nextMonth(month) {
  const next = new Date(new Date(`${month}-15`).getTime() + 30 * 24 * 60 * 60 * 1e3);
  return next.toISOString().slice(0, 7);
}
function isFlaggedUserid(name, room) {
  const id = (0, import_dex_data.toID)(name);
  const entry = cache[room]?.staffNotified;
  if (!entry)
    return false;
  return typeof entry === "string" ? entry === id : entry.includes(id);
}
function visualizePunishmentKey(punishment, key) {
  if (key === "secondaryTypes") {
    if (!punishment.secondaryTypes)
      return "";
    const keys = import_lib.Utils.sortBy(Object.keys(punishment.secondaryTypes));
    return `${keys.map((k) => `${k}: ${punishment.secondaryTypes[k]}`).join(", ")}`;
  }
  return punishment[key]?.toString() || "";
}
function visualizePunishment(punishment) {
  return import_lib.Utils.sortBy(Object.keys(punishment)).map((k) => `${k}: ${visualizePunishmentKey(punishment, k)}`).join(", ");
}
function displayResolved(review, justSubmitted = false) {
  const user = Users.get(review.staff);
  if (!user)
    return;
  const resolved = review.resolved;
  if (!resolved)
    return;
  const prefix = `|pm|&|${user.getIdentity()}|`;
  user.send(
    prefix + `Your Artemis review for <<${review.room}>> was resolved by ${resolved.by}` + (justSubmitted ? "." : `, ${Chat.toDurationString(Date.now() - resolved.time)} ago.`)
  );
  if (resolved.details)
    user.send(prefix + `The response was: "${resolved.details}"`);
  const idx = reviews[review.staff].findIndex((r) => r.room === review.room);
  if (idx > -1)
    reviews[review.staff].splice(idx, 1);
  if (!reviews[review.staff].length) {
    delete reviews[review.staff];
  }
  saveReviews();
}
const punishmentCache = Chat.oldPlugins["abuse-monitor"]?.punishmentCache || /* @__PURE__ */ new WeakMap();
async function searchModlog(query) {
  const userObj = Users.get(query.user);
  if (userObj) {
    const data = punishmentCache.get(userObj);
    if (data) {
      let sum = 0;
      for (const action of query.actions || Object.keys(data)) {
        sum += data[action] || 0;
      }
      return sum;
    }
  }
  const search = {
    user: [],
    ip: [],
    note: [],
    actionTaker: [],
    action: []
  };
  if (query.user)
    search.user.push({ search: query.user, isExact: true });
  if (query.ip) {
    if (!Array.isArray(query.ip))
      query.ip = [query.ip];
    for (const ip of query.ip) {
      search.ip.push({ search: ip });
    }
  }
  const modlog = await Rooms.Modlog.search("global", search);
  if (!modlog)
    return 0;
  const ignores = metadata.modlogIgnores?.[query.user];
  if (userObj) {
    const validTypes = Array.from(Punishments.punishmentTypes.keys());
    const cacheEntry = {};
    for (const entry of modlog.results) {
      if (Date.now() - entry.time > MAX_MODLOG_TIME)
        continue;
      if (!validTypes.some((k) => entry.action.endsWith(k)))
        continue;
      if (!cacheEntry[entry.action])
        cacheEntry[entry.action] = 0;
      if (ignores) {
        if (typeof ignores === "string" && new Date(ignores).getTime() < new Date(entry.time).getTime()) {
          continue;
        } else if (Array.isArray(ignores) && ignores.includes(entry.entryID)) {
          continue;
        }
      }
      cacheEntry[entry.action]++;
    }
    punishmentCache.set(userObj, cacheEntry);
    let sum = 0;
    for (const action of query.actions || Object.keys(cacheEntry)) {
      sum += cacheEntry[action] || 0;
    }
    return sum;
  }
  if (query.actions) {
    for (const [i, entry] of modlog.results.entries()) {
      if (!query.actions.includes(entry.action)) {
        modlog.results.splice(i, 1);
      }
    }
  }
  return modlog.results.length;
}
const classifier = new Artemis.RemoteClassifier();
async function runActions(user, room, message, response) {
  const keys = import_lib.Utils.sortBy(Object.keys(response), (k) => -response[k]);
  const recommended = [];
  const prevRecommend = cache[room.roomid]?.recommended?.[user.id];
  for (const punishment of settings.punishments) {
    if (prevRecommend?.type) {
      if (PUNISHMENTS.indexOf(punishment.punishment) <= PUNISHMENTS.indexOf(prevRecommend?.type))
        continue;
    }
    for (const type of keys) {
      const num = response[type];
      if (punishment.type && punishment.type !== type)
        continue;
      if (punishment.certainty && punishment.certainty > num)
        continue;
      if (punishment.modlogCount) {
        const modlog = await searchModlog({
          user: user.id,
          actions: punishment.modlogActions
        });
        if (modlog < punishment.modlogCount)
          continue;
      }
      if (punishment.secondaryTypes) {
        let matches = 0;
        for (const curType in punishment.secondaryTypes) {
          if (response[curType] >= punishment.secondaryTypes[curType])
            matches++;
        }
        if (matches < Object.keys(punishment.secondaryTypes).length)
          continue;
      }
      if (punishment.count) {
        let hits = await Chat.database.all(
          `SELECT * FROM perspective_flags WHERE userid = ? AND type = ? AND certainty >= ?`,
          [user.id, type, num]
        );
        hits = hits.filter((f) => {
          const date = new Date(f.time);
          if (date.getFullYear() < 2022)
            return false;
          return !(date.getFullYear() === 2022 && date.getMonth() <= 4 && date.getDate() <= 17);
        });
        if (hits.length < punishment.count)
          continue;
      }
      recommended.push([punishment.punishment, type, !!punishment.requiresPunishment]);
    }
  }
  if (recommended.length) {
    import_lib.Utils.sortBy(recommended, ([punishment2]) => -PUNISHMENTS.indexOf(punishment2));
    if (recommended.filter((k) => !NON_PUNISHMENTS.includes(k[1])).every((k) => k[2])) {
      return;
    }
    const [punishment, reason] = recommended[0];
    if (cache[room.roomid]) {
      if (!cache[room.roomid].recommended)
        cache[room.roomid].recommended = {};
      cache[room.roomid].recommended[user.id] = { type: punishment, reason: reason.replace(/_/g, " ").toLowerCase() };
    }
    if (user.trusted) {
      Rooms.get("staff")?.add(
        `|c|&|/log [Artemis] ${getViewLink(room.roomid)} ${punishment} recommended for trusted user ${user.id}${user.trusted !== user.id ? ` [${user.trusted}]` : ""} `
      ).update();
      return;
    }
    const result = await punishmentHandlers[(0, import_dex_data.toID)(punishment)]?.(user, room, response, message);
    writeStats("punishments", {
      punishment,
      userid: user.id,
      roomid: room.roomid,
      timestamp: Date.now()
    });
    if (result !== false) {
      const notified = cache[room.roomid].staffNotified;
      if (notified) {
        if (typeof notified === "string") {
          if (notified === user.id)
            delete cache[room.roomid].staffNotified;
        } else {
          notified.splice(notified.indexOf(user.id), 1);
          if (!notified.length) {
            delete cache[room.roomid].staffNotified;
            void Chat.database.run(
              `INSERT INTO perspective_stats (staff, roomid, result, timestamp) VALUES ($staff, $roomid, $result, $timestamp) ON CONFLICT (roomid) DO UPDATE SET result = $result, timestamp = $timestamp`,
              // todo: maybe use 3 to indicate punishment?
              { staff: "", roomid: room.roomid, result: 1, timestamp: Date.now() }
            );
          }
        }
      }
      delete cache[room.roomid].users[user.id];
      if (!Object.keys(cache[room.roomid].users).length) {
        delete cache[room.roomid];
      }
      notifyStaff();
    }
  }
}
function globalModlog(action, user, note, roomid) {
  if (typeof roomid === "object")
    roomid = roomid.roomid;
  user = Users.get(user) || user;
  void Rooms.Modlog.write(roomid || "global", {
    isGlobal: true,
    action,
    ip: user && typeof user === "object" ? user.latestIp : void 0,
    userid: (0, import_dex_data.toID)(user) || void 0,
    loggedBy: "artemis",
    note
  });
}
const getViewLink = (roomid) => `<<view-battlechat-${roomid.replace("battle-", "")}>>`;
function addGlobalModAction(message, room) {
  room.add(`|c|&|/log ${message}`).update();
  Rooms.get(`staff`)?.add(`|c|&|/log ${getViewLink(room.roomid)} ${message}`).update();
}
const DISCLAIMER = '<small>This action was done automatically. Want to learn more about the AI? <a href="https://www.smogon.com/forums/threads/3570628/#post-9056769">Visit the information thread</a>.</small>';
async function lock(user, room, reason, isWeek) {
  if (settings.recommendOnly) {
    Rooms.get("staff")?.add(
      `|c|&|/log [Artemis] ${getViewLink(room.roomid)} ${isWeek ? "WEEK" : ""}LOCK recommended for ${user.id}`
    ).update();
    room.hideText([user.id], void 0, true);
    return false;
  }
  const affected = await Punishments.lock(
    user,
    isWeek ? Date.now() + 7 * 24 * 60 * 60 * 1e3 : null,
    user.id,
    false,
    reason,
    false,
    ["#artemis"]
  );
  globalModlog(`${isWeek ? "WEEK" : ""}LOCK`, user, reason, room);
  addGlobalModAction(`${user.name} was locked from talking by Artemis${isWeek ? " for a week. " : ". "}(${reason})`, room);
  if (affected.length > 1) {
    Rooms.get("staff")?.add(
      `|c|&|/log (${user.id}'s locked alts: ${affected.slice(1).map((curUser) => curUser.getLastName()).join(", ")})`
    );
  }
  room.add(`|c|&|/raw ${DISCLAIMER}`).update();
  room.hideText(affected.map((f) => f.id), void 0, true);
  let message = `|popup||html|Artemis has locked you from talking in chats, battles, and PMing regular users`;
  message += ` ${!isWeek ? "for two days" : "for a week"}`;
  message += `

Reason: ${reason}`;
  let appeal = "";
  if (Chat.pages.help) {
    appeal += `<a href="view-help-request--appeal"><button class="button"><strong>Appeal your punishment</strong></button></a>`;
  } else if (import_config_loader.Config.appealurl) {
    appeal += `appeal: <a href="${import_config_loader.Config.appealurl}">${import_config_loader.Config.appealurl}</a>`;
  }
  if (appeal)
    message += `

If you feel that your lock was unjustified, you can ${appeal}.`;
  message += `

Your lock will expire in a few days.`;
  user.send(message);
  const roomauth = Rooms.global.destroyPersonalRooms(user.id);
  if (roomauth.length) {
    Monitor.log(
      `[CrisisMonitor] Locked user ${user.name} has public roomauth (${roomauth.join(", ")}), and should probably be demoted.`
    );
  }
}
const punishmentHandlers = {
  report(user, room) {
    for (const k in room.users) {
      if (k === user.id)
        continue;
      const u = room.users[k];
      if (room.auth.get(u) !== Users.PLAYER_SYMBOL)
        continue;
      u.sendTo(
        room.roomid,
        `|c|&|/uhtml report,Toxicity has been automatically detected in this battle, please click below if you would like to report it.<br /><a class="button notifying" href="/view-help-request">Make a report</a>`
      );
    }
  },
  mute(user, room) {
    const roomMutes = muted.get(room) || /* @__PURE__ */ new WeakMap();
    if (!user.trusted) {
      muted.set(room, roomMutes);
      roomMutes.set(user, Date.now() + MUTE_DURATION);
    }
  },
  warn(user, room, response, message) {
    const reason = `${Users.PLAYER_SYMBOL}${user.name}: ${message}`;
    if (!user.connected) {
      Punishments.offlineWarns.set(user.id, reason);
    } else {
      user.send(`|c|~|/warn ${reason}`);
    }
    globalModlog("WARN", user, reason, room);
    addGlobalModAction(`${user.name} was warned by Artemis (${reason})`, room);
    const punishments = punishmentCache.get(user) || {};
    if (!punishments["WARN"])
      punishments["WARN"] = 0;
    punishments["WARN"]++;
    punishmentCache.set(user, punishments);
    room.add(`|c|&|/raw ${DISCLAIMER}`).update();
    room.hideText([user.id], void 0, true);
  },
  lock(user, room, response, message) {
    return lock(user, room, `${Users.PLAYER_SYMBOL}${user.name}: ${message}`);
  },
  weeklock(user, room, response, message) {
    return lock(user, room, `${Users.PLAYER_SYMBOL}${user.name}: ${message}`, true);
  }
};
const PUNISHMENTS = Object.keys(punishmentHandlers).map((f) => f.toUpperCase());
function makeScore(roomid, result) {
  let score = 0;
  let main = "";
  const flags = /* @__PURE__ */ new Set();
  for (const type in result) {
    const data = result[type];
    if (settings.minScore && data < settings.minScore)
      continue;
    const curScore = score;
    if (settings.specials[type]) {
      for (const k in settings.specials[type]) {
        if (data < Number(k))
          continue;
        const num = settings.specials[type][k];
        if (num === "MAXIMUM") {
          score = calcThreshold(roomid);
          main = type;
        } else {
          if (num > score) {
            score = num;
            main = type;
          }
        }
      }
    }
    if (settings.minScore) {
      if (score < 1) {
        score = 1;
        main = type;
      }
    }
    if (score !== curScore)
      flags.add(type);
  }
  return { score, flags: [...flags], main };
}
const chatfilter = function(message, user, room) {
  if (!room?.battle || !["rated", "unrated"].includes(room.battle.challengeType))
    return;
  const mutes = muted.get(room);
  const muteEntry = mutes?.get(user);
  if (muteEntry) {
    if (Date.now() > muteEntry) {
      mutes.delete(user);
      if (!mutes.size) {
        muted.delete(room);
      }
    } else {
      this.sendReply(
        `|c|&|/raw <div class="message-error">Your behavior in this battle has been automatically identified as breaking <a href="https://${import_config_loader.Config.routes.root}/rules">Pokemon Showdown's global rules.</a> Repeated instances of misbehavior may incur harsher punishment.</div>`
      );
      return false;
    }
  }
  if (settings.disabled)
    return;
  if (!import_config_loader.Config.perspectiveKey || message.startsWith("!"))
    return;
  const roomid = room.roomid;
  void (async () => {
    message = message.trim();
    message = message.replace(pokemonRegex, "[[Pokemon]]");
    for (const k in settings.replacements) {
      message = message.replace(new RegExp(k, "gi"), settings.replacements[k]);
    }
    const response = await classifier.classify(message);
    const { score, flags, main } = makeScore(roomid, response || {});
    if (score) {
      if (!cache[roomid])
        cache[roomid] = { users: {} };
      if (!cache[roomid].users[user.id])
        cache[roomid].users[user.id] = 0;
      cache[roomid].users[user.id] += score;
      let hitThreshold = 0;
      if (cache[roomid].users[user.id] >= calcThreshold(roomid)) {
        let notified = cache[roomid].staffNotified;
        if (notified) {
          if (!Array.isArray(notified)) {
            cache[roomid].staffNotified = notified = [notified];
          }
          if (!notified.includes(user.id)) {
            notified.push(user.id);
          }
        } else {
          cache[roomid].staffNotified = [user.id];
        }
        notifyStaff();
        hitThreshold = 1;
        void room?.uploadReplay?.(user, this.connection, "forpunishment");
        await Chat.database.run(
          `INSERT INTO perspective_flags (userid, score, certainty, type, roomid, time) VALUES (?, ?, ?, ?, ?, ?)`,
          // response exists if we got this far
          [user.id, score, response[main], main, room.roomid, Date.now()]
        );
        void runActions(user, room, message, response || {});
      }
      await Chat.database.run(
        "INSERT INTO perspective_logs (userid, message, score, flags, roomid, time, hit_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user.id, message, score, import_lib.Utils.sortBy(flags).join(","), roomid, Date.now(), hitThreshold]
      );
    }
  })();
};
chatfilter.priority = -100;
const loginfilter = (user) => {
  if (reviews[user.id]?.length) {
    for (const r of reviews[user.id]) {
      displayResolved(r);
    }
  }
};
function calcThreshold(roomid) {
  const incr = settings.thresholdIncrement;
  let num = settings.threshold;
  const room = Rooms.get(roomid);
  if (!room || !room.battle || !incr)
    return num;
  if (!incr.minTurns || room.battle.turn >= incr.minTurns) {
    num += Math.floor(room.battle.turn / incr.turns) * incr.amount;
  }
  return num;
}
const handlers = {
  onRoomDestroy(roomid) {
    const entry = cache[roomid];
    if (entry) {
      delete cache[roomid];
      if (entry.staffNotified) {
        notifyStaff();
        void Chat.database.run(
          `INSERT INTO perspective_stats (staff, roomid, result, timestamp) VALUES ($staff, $roomid, $result, $timestamp) ON CONFLICT (roomid) DO UPDATE SET result = $result, timestamp = $timestamp`,
          // 2 means dead
          { staff: "", roomid, result: 2, timestamp: Date.now() }
        );
      }
    }
  },
  onRoomClose(roomid, user) {
    if (!roomid.startsWith("view-abusemonitor-view"))
      return;
    const targetId = roomid.slice("view-abusemonitor-view-".length);
    if (cache[targetId]?.claimed === user.id) {
      delete cache[targetId].claimed;
      notifyStaff();
    }
  },
  onRenameRoom(oldId, newId, room) {
    if (cache[oldId]) {
      cache[newId] = cache[oldId];
      delete cache[oldId];
      notifyStaff();
    }
  }
};
function getFlaggedRooms() {
  return Object.keys(cache).filter((roomid) => cache[roomid].staffNotified);
}
function writeStats(type, entry) {
  const path = `logs/artemis/${type}/${Chat.toTimestamp(new Date()).split(" ")[0].slice(0, -3)}.jsonl`;
  try {
    (0, import_lib.FS)(path).parentDir().mkdirpSync();
  } catch {
  }
  void (0, import_lib.FS)(path).append(JSON.stringify(entry) + "\n");
}
function saveSettings(path) {
  if (!path)
    path = "nf";
  (0, import_lib.FS)(`config/chat-plugins/${path}.json`).writeUpdate(() => JSON.stringify(settings));
}
function saveReviews() {
  (0, import_lib.FS)(`config/chat-plugins/artemis-reviews.json`).writeUpdate(() => JSON.stringify(reviews));
}
function saveMetadata() {
  (0, import_lib.FS)("config/chat-plugins/artemis-metadata.json").writeUpdate(() => JSON.stringify(metadata));
}
const pokemonRegex = new RegExp(
  // we want only base formes and existent stuff
  `\\b(${Dex.species.all().filter((s) => !s.forme && s.num > 0).map((f) => f.id).join("|")})\\b`,
  "gi"
);
let lastLogTime = Chat.oldPlugins["abuse-monitor"]?.lastLogTime || 0;
function notifyStaff() {
  const staffRoom = Rooms.get("staff");
  if (staffRoom) {
    const flagged = getFlaggedRooms();
    let buf = "";
    if (flagged.length) {
      buf = `<button class="button" name="send" value="/am">Flagged battles need review</button>`;
    } else {
      buf = "No battles flagged.";
    }
    if (lastLogTime + STAFF_NOTIF_INTERVAL < Date.now() || !flagged.length) {
      staffRoom.send(`|uhtml|abusemonitor|<div class="infobox">${buf}</div>`);
      if (flagged.length) {
        lastLogTime = Date.now();
      } else {
        lastLogTime = 0;
      }
    }
    Chat.refreshPageFor("abusemonitor-flagged", staffRoom);
  }
}
function checkAccess(context, perm = "bypassall") {
  const user = context.user;
  if (!(WHITELIST.includes(user.id) || user.previousIDs.some((id) => WHITELIST.includes(id)))) {
    context.checkCan(perm);
  }
}
const commands = {
  am: "abusemonitor",
  abusemonitor: {
    ""() {
      return this.parse("/join view-abusemonitor-flagged");
    },
    async test(target, room, user) {
      checkAccess(this);
      const text = target;
      if (!text)
        return this.parse(`/help abusemonitor`);
      this.runBroadcast();
      let response = await classifier.classify(text);
      if (!response)
        response = {};
      for (const k in settings.replacements) {
        target = target.replace(new RegExp(k, "gi"), settings.replacements[k]);
      }
      const { score, flags } = makeScore("staff", response);
      let buf = `<strong>Score for "${text}"${target === text ? "" : ` (alt: "${target}")`}:</strong> ${score}<br />`;
      buf += `<strong>Flags:</strong> ${flags.join(", ")}<br />`;
      const punishments = [];
      for (const [i, p] of settings.punishments.entries()) {
        const matches = [];
        for (const k in response) {
          const descriptors = [];
          if (p.type) {
            if (p.type !== k)
              continue;
            descriptors.push("type");
          }
          if (p.certainty) {
            if (response[k] < p.certainty)
              continue;
            descriptors.push("certainty");
          }
          const secondaries = Object.entries(p.secondaryTypes || {});
          if (secondaries.length) {
            if (!secondaries.every(([sK, sV]) => response[sK] >= sV))
              continue;
            descriptors.push("secondary");
          }
          if (descriptors.length) {
            matches.push(`${k} (${descriptors.map((f) => `${f} match`).join(", ")})`);
          }
        }
        if (matches.length) {
          punishments.push({
            punishment: p,
            desc: matches,
            index: i
          });
        }
      }
      if (punishments.length) {
        buf += `<strong>Punishments:</strong><br />`;
        buf += punishments.map((p) => `&bull; ${p.index + 1}: <code>${visualizePunishment(p.punishment)}</code>: ${p.desc.join(", ")}`).join("<br />");
        buf += `<br />`;
      }
      buf += `<strong>Score breakdown:</strong><br />`;
      for (const k in response) {
        buf += `&bull; ${k}: ${response[k]}<br />`;
      }
      this.sendReplyBox(buf);
    },
    cm: "compare",
    async compare(target) {
      checkAccess(this);
      const [base, against] = import_lib.Utils.splitFirst(target, ",").map((f) => f.trim());
      if (!(base && against))
        return this.parse(`/help abusemonitor`);
      const colors = {
        "0": "Purple",
        "1": "DodgerBlue",
        "2": "Red"
      };
      const baseResponse = await classifier.classify(base) || {};
      const againstResponse = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(classifier.classify(against));
        }, 500);
      }) || {};
      let buf = import_lib.Utils.html`<strong>Compared scores for "${base}" `;
      buf += `(<strong style="color: ${colors["1"]}">1</strong>) `;
      buf += import_lib.Utils.html`and "${against}" (<strong style="color: ${colors["2"]}">2</strong>): </strong><br />`;
      for (const [k, val] of Object.entries(baseResponse)) {
        const max = Math.max(val, againstResponse[k]);
        const num = val === againstResponse[k] ? "0" : max === val ? "1" : "2";
        buf += `&bull; ${k}: <strong style="color: ${colors[num]}">${num}</strong> `;
        if (num === "0") {
          buf += `(${max})`;
        } else {
          buf += `(${max} vs ${(max === val ? againstResponse : baseResponse)[k]})`;
        }
        buf += `<br />`;
      }
      this.runBroadcast();
      return this.sendReplyBox(buf);
    },
    async score(target) {
      checkAccess(this);
      target = target.trim();
      if (!target)
        return this.parse(`/help abusemonitor`);
      const [text, scoreText] = import_lib.Utils.splitFirst(target, ",").map((f) => f.trim());
      const args = Chat.parseArguments(scoreText, ",", { useIDs: false });
      const scores = {};
      for (let k in args) {
        const vals = args[k];
        if (vals.length > 1) {
          return this.errorReply(`Too many values for ${k}`);
        }
        k = k.toUpperCase().replace(/\s/g, "_");
        if (!(k in Artemis.RemoteClassifier.ATTRIBUTES)) {
          return this.errorReply(`Invalid attribute: ${k}`);
        }
        const val = parseFloat(vals[0]);
        if (isNaN(val)) {
          return this.errorReply(`Invalid value for ${k}: ${vals[0]}`);
        }
        scores[k] = val;
      }
      for (const k in Artemis.RemoteClassifier.ATTRIBUTES) {
        if (!(k in scores))
          scores[k] = 0;
      }
      const response = await classifier.suggestScore(text, scores);
      if (response.error)
        throw new Chat.ErrorMessage(response.error);
      this.sendReply(`Recommendation successfully sent.`);
      Rooms.get("abuselog")?.roomlog(`${this.user.name} used /am score ${target}`);
    },
    toggle(target) {
      checkAccess(this);
      if (this.meansYes(target)) {
        if (!settings.disabled)
          return this.errorReply(`The abuse monitor is already enabled.`);
        settings.disabled = false;
      } else if (this.meansNo(target)) {
        if (settings.disabled)
          return this.errorReply(`The abuse monitor is already disabled.`);
        settings.disabled = true;
      } else {
        return this.errorReply(`Invalid setting. Must be 'on' or 'off'.`);
      }
      saveSettings();
      this.refreshPage("abusemonitor-settings");
      this.privateGlobalModAction(`${this.user.name} ${!settings.disabled ? "enabled" : "disabled"} the abuse monitor.`);
      this.globalModlog("ABUSEMONITOR", null, !settings.disabled ? "enable" : "disable");
    },
    threshold(target) {
      checkAccess(this);
      if (!target) {
        return this.sendReply(`The current abuse monitor threshold is ${settings.threshold}.`);
      }
      const num = parseInt(target);
      if (isNaN(num)) {
        this.errorReply(`Invalid number: ${target}`);
        return this.parse(`/help abusemonitor`);
      }
      if (settings.threshold === num) {
        return this.errorReply(`The abuse monitor threshold is already ${num}.`);
      }
      settings.threshold = num;
      saveSettings();
      this.refreshPage("abusemonitor-settings");
      this.privateGlobalModAction(`${this.user.name} set the abuse monitor trigger threshold to ${num}.`);
      this.globalModlog("ABUSEMONITOR THRESHOLD", null, `${num}`);
      this.sendReply(
        `|html|Remember to use <code>/am respawn</code> to deploy the settings to the child process.`
      );
    },
    async resolve(target) {
      this.checkCan("lock");
      target = target.toLowerCase().trim().replace(/ +/g, "");
      let [roomid, rawResult] = import_lib.Utils.splitFirst(target, ",").map((f) => f.trim());
      const tarRoom = Rooms.get(roomid);
      if (!tarRoom || !cache[tarRoom.roomid] || !cache[tarRoom.roomid]?.staffNotified) {
        return this.popupReply(`That room has not been flagged by the abuse monitor.`);
      }
      if (roomid.includes("-") && roomid.endsWith("pw")) {
        roomid = roomid.split("-").slice(0, -1).join("-");
      }
      let result = (0, import_dex_data.toID)(rawResult) === "success" ? 1 : (0, import_dex_data.toID)(rawResult) === "failure" ? 0 : null;
      if (result === null)
        return this.popupReply(`Invalid result - must be 'success' or 'failure'.`);
      const inserted = await Chat.database.get(`SELECT result FROM perspective_stats WHERE roomid = ?`, [roomid]);
      if (inserted?.result === 1) {
        result = inserted.result;
      }
      delete cache[tarRoom.roomid];
      notifyStaff();
      this.closePage(`abusemonitor-view-${tarRoom.roomid}`);
      this.closePage(`abusemonitor-flagged`);
      await Chat.database.run(
        `INSERT INTO perspective_stats (staff, roomid, result, timestamp) VALUES ($staff, $roomid, $result, $timestamp) ON CONFLICT (roomid) DO UPDATE SET result = $result, timestamp = $timestamp`,
        { staff: this.user.id, roomid, result, timestamp: Date.now() }
      );
      return this.parse(`/j view-abusemonitor-flagged`);
    },
    unmute(target, room, user) {
      this.checkCan("lock");
      room = this.requireRoom();
      target = (0, import_dex_data.toID)(target);
      if (!target) {
        return this.parse(`/help am`);
      }
      const roomMutes = muted.get(room);
      if (!roomMutes) {
        return this.errorReply(`No users have Artemis mutes in this room.`);
      }
      const targetUser = Users.get(target);
      if (!targetUser) {
        return this.errorReply(`User '${target}' not found.`);
      }
      if (!roomMutes.has(targetUser)) {
        return this.errorReply(`That user does not have an Artemis mute in this room.`);
      }
      roomMutes.delete(targetUser);
      this.modlog(`ABUSEMONITOR UNMUTE`, targetUser);
      this.privateModAction(`${user.name} removed ${targetUser.name}'s Artemis mute.`);
    },
    async nojoinpunish(target, room, user) {
      this.checkCan("lock");
      const [roomid, type, rest] = import_lib.Utils.splitFirst(target, ",", 2).map((f) => f.trim());
      const tarRoom = Rooms.get(roomid);
      if (!tarRoom)
        return this.popupReply(`The room "${roomid}" does not exist.`);
      const cmd = NOJOIN_COMMAND_WHITELIST[(0, import_dex_data.toID)(type)];
      if (!cmd) {
        return this.errorReply(
          `Invalid punishment given. Must be one of ${Object.keys(NOJOIN_COMMAND_WHITELIST).join(", ")}.`
        );
      }
      this.room = tarRoom;
      this.room.reportJoin("j", user.getIdentityWithStatus(this.room), user);
      const result = await this.parse(`${cmd} ${rest}`, { bypassRoomCheck: true });
      if (result) {
        this.add(
          '|c|&|/raw If you have questions about this action, please contact staff by making a <a href="view-help-request" class="button">help ticket</a>'
        );
      }
      this.room.reportJoin("l", user.getIdentityWithStatus(this.room), user);
    },
    view(target, room, user) {
      target = target.toLowerCase().trim();
      if (!target)
        return this.parse(`/help am`);
      return this.parse(`/j view-abusemonitor-view-${target}`);
    },
    logs(target) {
      checkAccess(this);
      const [count, userid] = import_lib.Utils.splitFirst(target, ",").map(import_dex_data.toID);
      this.parse(`/join view-abusemonitor-logs-${count || "200"}${userid ? `-${userid}` : ""}`);
    },
    ul: "userlogs",
    userlogs(target) {
      checkAccess(this, "lock");
      return this.parse(`/join view-abusemonitor-userlogs-${(0, import_dex_data.toID)(target)}`);
    },
    stats(target) {
      checkAccess(this);
      return this.parse(`/join view-abusemonitor-stats${target ? `-${target}` : ""}`);
    },
    async respawn(target, room, user) {
      checkAccess(this);
      this.sendReply(`Respawning...`);
      const unspawned = await classifier.respawn();
      this.sendReply(`DONE. ${Chat.count(unspawned, "processes", "process")} unspawned.`);
      this.addGlobalModAction(`${user.name} used /abusemonitor respawn`);
    },
    async rescale(target, room, user) {
      if (!WHITELIST.includes(user.id))
        this.canUseConsole();
      const examples = target.split(",").filter(Boolean);
      const type = examples.shift()?.toUpperCase().replace(/\s/g, "_") || "";
      if (!(type in Artemis.RemoteClassifier.ATTRIBUTES)) {
        return this.errorReply(`Invalid type: ${type}`);
      }
      if (examples.length < 3) {
        return this.errorReply(`At least 3 examples are needed.`);
      }
      const scales = [];
      const oldScales = [];
      for (const chunk of examples) {
        const [message, rawNum] = chunk.split("|");
        if (!(message && rawNum)) {
          return this.errorReply(`Invalid example: "${chunk}". Must be in \`\`message|num\`\` format.`);
        }
        const num = parseFloat(rawNum);
        if (isNaN(num)) {
          return this.errorReply(`Invalid number in example '${chunk}'.`);
        }
        const data = await classifier.classify(message);
        if (!data) {
          return this.errorReply(`No results found. Try again in a minute?`);
        }
        oldScales.push(num);
        scales.push(data[type]);
        await import_lib.Utils.waitUntil(Date.now() + 1e3);
      }
      const newAverage = scales.reduce((a, b) => a + b) / scales.length;
      const oldAverage = oldScales.reduce((a, b) => a + b) / oldScales.length;
      const round = (num) => Number(num.toFixed(4));
      const change = newAverage / oldAverage;
      this.sendReply(`Change average: ${change}`);
      await this.parse(`/am bs prescale`);
      for (const p of settings.punishments) {
        if (p.type !== type)
          continue;
        if (p.certainty)
          p.certainty = round(p.certainty * change);
        if (p.secondaryTypes) {
          for (const k in p.secondaryTypes) {
            p.secondaryTypes[k] = round(p.secondaryTypes[k] * change);
          }
        }
      }
      if (type in settings.specials) {
        for (const n in settings.specials[type]) {
          const num = settings.specials[type][n];
          delete settings.specials[type][n];
          settings.specials[type][round(parseFloat(n) * change)] = num;
        }
      }
      saveSettings();
      this.refreshPage("abusemonitor-settings");
      this.addGlobalModAction(
        `${user.name} used /abusemonitor rescale ${type.toLowerCase().replace("_", "")}`
      );
      this.globalModlog(`ABUSEMONITOR RESCALE`, null, `${type}: ${examples.join(", ")}`);
    },
    async userclear(target, room, user) {
      checkAccess(this);
      const { targetUsername, rest } = this.splitUser(target);
      const targetId = (0, import_dex_data.toID)(targetUsername);
      if (!targetId)
        return this.parse(`/help abusemonitor`);
      if (user.lastCommand !== `am userclear ${targetId}`) {
        user.lastCommand = `am userclear ${targetId}`;
        this.errorReply(`Are you sure you want to clear abuse monitor database records for ${targetId}?`);
        this.errorReply(`Retype the command if you're sure.`);
        return;
      }
      user.lastCommand = "";
      const results = await Chat.database.run(
        "DELETE FROM perspective_logs WHERE userid = ?",
        [targetId]
      );
      if (!results.changes) {
        return this.errorReply(`No logs for ${targetUsername} found.`);
      }
      this.sendReply(`${results.changes} log(s) cleared for ${targetId}.`);
      this.privateGlobalModAction(`${user.name} cleared abuse monitor logs for ${targetUsername}${rest ? ` (${rest})` : ""}.`);
      this.globalModlog("ABUSEMONITOR CLEAR", targetId, rest);
    },
    async deletelog(target, room, user) {
      checkAccess(this);
      target = (0, import_dex_data.toID)(target);
      if (!target)
        return this.parse(`/help abusemonitor`);
      const num = parseInt(target);
      if (isNaN(num)) {
        return this.errorReply(`Invalid log number: ${target}`);
      }
      const row = await Chat.database.get(
        "SELECT * FROM perspective_logs WHERE rowid = ?",
        [num]
      );
      if (!row) {
        return this.errorReply(`No log with ID ${num} found.`);
      }
      await Chat.database.run(
        // my kingdom for RETURNING * in sqlite :(
        "DELETE FROM perspective_logs WHERE rowid = ?",
        [num]
      );
      this.sendReply(`Log ${num} deleted.`);
      this.privateGlobalModAction(`${user.name} deleted an abuse monitor log for the user ${row.userid}.`);
      this.stafflog(
        `Message: "${row.message}", room: ${row.roomid}, time: ${Chat.toTimestamp(new Date(row.time))}`
      );
      this.globalModlog("ABUSEMONITOR DELETELOG", row.userid, `${num}`);
      Chat.refreshPageFor("abusemonitor-logs", "staff", true);
    },
    es: "editspecial",
    editspecial(target, room, user) {
      checkAccess(this);
      if (!(0, import_dex_data.toID)(target))
        return this.parse(`/help abusemonitor`);
      let [rawType, rawPercent, rawScore] = target.split(",");
      const type = rawType.toUpperCase().replace(/\s/g, "_");
      rawScore = (0, import_dex_data.toID)(rawScore);
      const types = { ...Artemis.RemoteClassifier.ATTRIBUTES, "ALL": {} };
      if (!(type in types)) {
        return this.errorReply(`Invalid type: ${type}. Valid types: ${Object.keys(types).join(", ")}.`);
      }
      const percent = parseFloat(rawPercent);
      if (isNaN(percent) || percent > 1 || percent < 0) {
        return this.errorReply(`Invalid percent: ${percent}. Must be between 0 and 1.`);
      }
      const score = parseInt(rawScore) || (0, import_dex_data.toID)(rawScore).toUpperCase();
      switch (typeof score) {
        case "string":
          if (score !== "MAXIMUM") {
            return this.errorReply(`Invalid score. Must be a number or "MAXIMUM".`);
          }
          break;
        case "number":
          if (isNaN(score) || score < 0) {
            return this.errorReply(`Invalid score. Must be a number or "MAXIMUM".`);
          }
          break;
      }
      if (settings.specials[type]?.[percent] && !this.cmd.includes("f")) {
        return this.errorReply(`That special case already exists. Use /am forceeditspecial to change it.`);
      }
      if (!settings.specials[type])
        settings.specials[type] = {};
      settings.specials[type][percent] = score;
      saveSettings();
      this.refreshPage("abusemonitor-settings");
      this.privateGlobalModAction(`${user.name} set the abuse monitor special case for ${type} at ${percent}% to ${score}.`);
      this.globalModlog("ABUSEMONITOR SPECIAL", type, `${percent}% to ${score}`);
      this.sendReply(`|html|Remember to use <code>/am respawn</code> to deploy the settings to the child processes.`);
    },
    ds: "deletespecial",
    deletespecial(target, room, user) {
      checkAccess(this);
      const [rawType, rawPercent] = target.split(",");
      const type = rawType.toUpperCase().replace(/\s/g, "_");
      const types = { ...Artemis.RemoteClassifier.ATTRIBUTES, "ALL": {} };
      if (!(type in types)) {
        return this.errorReply(`Invalid type: ${type}. Valid types: ${Object.keys(types).join(", ")}.`);
      }
      const percent = parseFloat(rawPercent);
      if (isNaN(percent) || percent > 1 || percent < 0) {
        return this.errorReply(`Invalid percent: ${percent}. Must be between 0 and 1.`);
      }
      if (!settings.specials[type]?.[percent]) {
        return this.errorReply(`That special case does not exist.`);
      }
      delete settings.specials[type][percent];
      if (!Object.keys(settings.specials[type]).length) {
        delete settings.specials[type];
      }
      saveSettings();
      this.refreshPage("abusemonitor-settings");
      this.privateGlobalModAction(`${user.name} deleted the abuse monitor special case for ${type} at ${percent}%.`);
      this.globalModlog("ABUSEMONITOR DELETESPECIAL", type, `${percent}%`);
      this.sendReply(`|html|Remember to use <code>/am respawn</code> to deploy the settings to the child processes.`);
    },
    em: "editmin",
    editmin(target, room, user) {
      checkAccess(this);
      const num = parseFloat(target);
      if (isNaN(num) || num < 0 || num > 1) {
        return this.errorReply(`Invalid minimum score: ${num}. Must be a positive integer.`);
      }
      settings.minScore = num;
      saveSettings();
      this.refreshPage("abusemonitor-settings");
      this.privateGlobalModAction(`${user.name} set the abuse monitor minimum score to ${num}.`);
      this.globalModlog("ABUSEMONITOR MIN", null, "" + num);
      this.sendReply(`|html|Remember to use <code>/am respawn</code> to deploy the settings to the child processes.`);
    },
    ex: "exportpunishment",
    exportpunishment(target) {
      checkAccess(this);
      const num = parseInt(target) - 1;
      if (isNaN(num)) {
        return this.errorReply(`Invalid punishment number: ${num + 1}.`);
      }
      const punishment = settings.punishments[num];
      if (!punishment) {
        return this.errorReply(`Punishment ${num + 1} does not exist.`);
      }
      this.sendReply(
        `|html|Punishment ${num + 1}: <code>${visualizePunishment(punishment).replace(/: /g, " = ")}</code>`
      );
    },
    changeall(target, room, user) {
      checkAccess(this);
      const [to, from] = target.split(",").map((f) => (0, import_dex_data.toID)(f));
      if (!(to && from)) {
        return this.errorReply(`Specify a type to change and a type to change to.`);
      }
      if (![to, from].every((f) => punishmentHandlers[f])) {
        return this.errorReply(
          `Invalid types given. Valid types: ${Object.keys(punishmentHandlers).join(", ")}.`
        );
      }
      const changed = [];
      for (const [i, punishment] of settings.punishments.entries()) {
        if ((0, import_dex_data.toID)(punishment.type) === to) {
          punishment.type = from.toUpperCase();
          changed.push(i + 1);
        }
      }
      if (!changed.length) {
        return this.errorReply(`No punishments of type '${to}' found.`);
      }
      this.sendReply(`Updated punishment(s) ${changed.join(", ")}`);
      this.privateGlobalModAction(`${user.name} updated all abuse-monitor punishments of type ${to} to type ${from}`);
      saveSettings();
      this.globalModlog(`ABUSEMONITOR CHANGEALL`, null, `${to} to ${from}`);
    },
    ep: "exportpunishments",
    // exports punishment settings to something easily copy/pastable
    exportpunishments() {
      checkAccess(this);
      let buf = settings.punishments.map((punishment) => {
        const line = [];
        for (const k in punishment) {
          const key = k;
          const val = punishment[key];
          switch (key) {
            case "modlogCount":
              line.push(`mlc=${val}`);
              break;
            case "modlogActions":
              line.push(`${val.map((f) => `mla=${f}`).join(", ")}`);
              break;
            case "punishment":
              line.push(`p=${val}`);
              break;
            case "type":
              line.push(`t=${val}`);
              break;
            case "count":
              line.push(`c=${val}`);
              break;
            case "certainty":
              line.push(`ct=${val}`);
              break;
            case "secondaryTypes":
              for (const type in val) {
                line.push(`st=${type}|${val[type]}`);
              }
              break;
          }
        }
        return line.join(", ");
      }).join("<br />");
      if (!buf)
        buf = "None found";
      this.sendReplyBox(buf);
    },
    ap: "addpunishment",
    addpunishment(target, room, user) {
      checkAccess(this);
      if (!(0, import_dex_data.toID)(target))
        return this.parse(`/help am`);
      const targets = target.split(",").map((f) => f.trim());
      const punishment = {};
      for (const cur of targets) {
        let [key, value] = import_lib.Utils.splitFirst(cur, "=").map((f) => f.trim());
        key = (0, import_dex_data.toID)(key);
        if (!key || !value) {
          continue;
        }
        switch (key) {
          case "punishment":
          case "p":
            if (punishment.punishment) {
              return this.errorReply(`Duplicate punishment values.`);
            }
            value = (0, import_dex_data.toID)(value).toUpperCase();
            if (!PUNISHMENTS.includes(value)) {
              return this.errorReply(`Invalid punishment: ${value}. Valid punishments: ${PUNISHMENTS.join(", ")}.`);
            }
            punishment.punishment = value;
            break;
          case "count":
          case "num":
          case "c":
            if (punishment.count) {
              return this.errorReply(`Duplicate count values.`);
            }
            const num = parseInt(value);
            if (isNaN(num)) {
              return this.errorReply(`Invalid count '${value}'. Must be a number.`);
            }
            punishment.count = num;
            break;
          case "type":
          case "t":
            if (punishment.type) {
              return this.errorReply(`Duplicate type values.`);
            }
            value = value.replace(/\s/g, "_").toUpperCase();
            if (!Artemis.RemoteClassifier.ATTRIBUTES[value]) {
              return this.errorReply(
                `Invalid attribute: ${value}. Valid attributes: ${Object.keys(Artemis.RemoteClassifier.ATTRIBUTES).join(", ")}.`
              );
            }
            punishment.type = value;
            break;
          case "certainty":
          case "ct":
            if (punishment.certainty) {
              return this.errorReply(`Duplicate certainty values.`);
            }
            const certainty = parseFloat(value);
            if (isNaN(certainty) || certainty > 1 || certainty < 0) {
              return this.errorReply(`Invalid certainty '${value}'. Must be a number above 0 and below 1.`);
            }
            punishment.certainty = certainty;
            break;
          case "mla":
          case "modlogaction":
            value = value.toUpperCase();
            if (!punishment.modlogActions) {
              punishment.modlogActions = [];
            }
            if (punishment.modlogActions.includes(value)) {
              return this.errorReply(`Duplicate modlog action values - '${value}'.`);
            }
            punishment.modlogActions.push(value);
            break;
          case "mlc":
          case "modlogcount":
            if (punishment.modlogCount) {
              return this.errorReply(`Duplicate modlog count values.`);
            }
            const count = parseInt(value);
            if (isNaN(count)) {
              return this.errorReply(`Invalid modlog count.`);
            }
            punishment.modlogCount = count;
            break;
          case "st":
          case "s":
          case "secondary":
            let [sType, sValue] = import_lib.Utils.splitFirst(value, "|").map((f) => f.trim());
            if (!sType || !sValue) {
              return this.errorReply(`Invalid secondary type/certainty.`);
            }
            sType = sType.replace(/\s/g, "_").toUpperCase();
            if (!Artemis.RemoteClassifier.ATTRIBUTES[sType]) {
              return this.errorReply(
                `Invalid secondary attribute: ${sType}. Valid attributes: ${Object.keys(Artemis.RemoteClassifier.ATTRIBUTES).join(", ")}.`
              );
            }
            const sCertainty = parseFloat(sValue);
            if (isNaN(sCertainty) || sCertainty > 1 || sCertainty < 0) {
              return this.errorReply(`Invalid secondary certainty '${sValue}'. Must be a number above 0 and below 1.`);
            }
            if (!punishment.secondaryTypes) {
              punishment.secondaryTypes = {};
            }
            if (punishment.secondaryTypes[sType]) {
              return this.errorReply(`Duplicate secondary type.`);
            }
            punishment.secondaryTypes[sType] = sCertainty;
            break;
          case "requirepunishment":
          case "rp":
            punishment.requiresPunishment = true;
            break;
          default:
            this.errorReply(`Invalid key:  ${key}`);
            return this.parse(`/help am`);
        }
      }
      if (!punishment.punishment) {
        return this.errorReply(`A punishment type must be specified.`);
      }
      for (const [i, p] of settings.punishments.entries()) {
        let matches = 0;
        for (const k in p) {
          const key = k;
          const val = visualizePunishmentKey(punishment, key);
          if (val && val === visualizePunishmentKey(p, key))
            matches++;
        }
        if (matches === Object.keys(p).length) {
          return this.errorReply(`This punishment is already stored at ${i + 1}.`);
        }
      }
      settings.punishments.push(punishment);
      saveSettings();
      this.refreshPage("abusemonitor-settings");
      this.privateGlobalModAction(`${user.name} added a ${punishment.punishment} abuse-monitor punishment.`);
      const str = visualizePunishment(punishment);
      this.stafflog(`Info: ${str}`);
      this.globalModlog(`ABUSEMONITOR ADDPUNISHMENT`, null, str);
    },
    dp: "deletepunishment",
    deletepunishment(target, room, user) {
      checkAccess(this);
      const idx = parseInt(target) - 1;
      if (isNaN(idx))
        return this.errorReply(`Invalid number.`);
      const punishment = settings.punishments[idx];
      if (!punishment) {
        return this.errorReply(`No punishments exist at index ${idx + 1}.`);
      }
      settings.punishments.splice(idx, 1);
      saveSettings();
      this.refreshPage("abusemonitor-settings");
      this.privateGlobalModAction(`${user.name} removed the abuse-monitor punishment indexed at ${idx + 1}.`);
      this.stafflog(
        `Punishment: ${Object.keys(punishment).map((f) => `${f}: ${punishment[f]}`).join(", ")}`
      );
      this.globalModlog(`ABUSEMONITOR REMOVEPUNISHMENT`, null, `${idx + 1}`);
    },
    vs: "viewsettings",
    settings: "viewsettings",
    viewsettings() {
      checkAccess(this);
      return this.parse(`/join view-abusemonitor-settings`);
    },
    ti: "thresholdincrement",
    thresholdincrement(target, room, user) {
      checkAccess(this);
      if (!(0, import_dex_data.toID)(target)) {
        return this.parse(`/help am`);
      }
      const [rawTurns, rawIncrement, rawMin] = import_lib.Utils.splitFirst(target, ",", 2).map(import_dex_data.toID);
      const turns = parseInt(rawTurns);
      if (isNaN(turns) || turns < 0) {
        return this.errorReply(`Turns must be a number above 0.`);
      }
      const increment = parseInt(rawIncrement);
      if (isNaN(increment) || increment < 0) {
        return this.errorReply(`The increment must be a number above 0.`);
      }
      const min = parseInt(rawMin);
      if (rawMin && isNaN(min)) {
        return this.errorReply(`Invalid minimum (must be a number).`);
      }
      settings.thresholdIncrement = { amount: increment, turns };
      if (min) {
        settings.thresholdIncrement.minTurns = min;
      }
      saveSettings();
      this.refreshPage("abusemonitor-settings");
      this.privateGlobalModAction(
        `${user.name} set the abuse-monitor threshold increment ${increment} every ${Chat.count(turns, "turns")}${min ? ` after ${Chat.count(min, "turns")}` : ""}`
      );
      this.globalModlog(
        `ABUSEMONITOR INCREMENT`,
        null,
        `${increment} every ${turns} turn(s)${min ? ` after ${min} turn(s)` : ""}`
      );
    },
    di: "deleteincrement",
    deleteincrement(target, room, user) {
      checkAccess(this);
      if (!settings.thresholdIncrement)
        return this.errorReply(`The threshold increment is already disabled.`);
      settings.thresholdIncrement = null;
      saveSettings();
      this.refreshPage("abusemonitor-settings");
      this.privateGlobalModAction(`${user.name} disabled the abuse-monitor threshold increment.`);
      this.globalModlog(`ABUSEMONITOR DISABLEINCREMENT`);
    },
    async failures(target) {
      checkAccess(this);
      if (!(0, import_dex_data.toID)(target)) {
        target = Chat.toTimestamp(new Date()).split(" ")[0];
      }
      const timeNum = new Date(target).getTime();
      if (isNaN(timeNum)) {
        return this.errorReply(`Invalid date.`);
      }
      let logs = await Chat.database.all(
        "SELECT * FROM perspective_stats WHERE result = 0 AND timestamp > ? AND timestamp < ?",
        [timeNum, timeNum + 24 * 60 * 60 * 1e3]
      );
      logs = logs.filter((log) => // proofing against node's stupid date lib
      Chat.toTimestamp(new Date(log.timestamp)).split(" ")[0] === target);
      if (!logs.length) {
        return this.errorReply(`No logs found for that date.`);
      }
      this.sendReplyBox(
        `<strong>${Chat.count(logs, "logs")}</strong> found on the date ${target}:<hr />` + logs.map((f) => `<a href="/${f.roomid}">${f.roomid}</a>`).join("<br />")
      );
    },
    bs: "backupsettings",
    async backupsettings(target, room, user) {
      checkAccess(this);
      target = target.replace(/\//g, "-").toLowerCase().trim();
      let dotIdx = target.lastIndexOf(".");
      if (dotIdx < 0) {
        dotIdx = target.length;
      }
      target = target.toLowerCase().slice(0, dotIdx);
      if (target) {
        target = `/artemis/${target}`;
        await (0, import_lib.FS)(`config/chat-plugins/artemis/`).mkdirIfNonexistent();
      } else {
        target = `/nf.backup`;
      }
      saveSettings(target);
      this.addGlobalModAction(`${user.name} used /abusemonitor backupsettings`);
      this.stafflog(`Logged to ${target || "default location"}`);
      if (target) {
        this.globalModlog(`ABUSEMONITOR BACKUP`, null, target);
      }
      this.refreshPage("abusemonitor-settings");
    },
    lb: "loadbackup",
    async loadbackup(target, room, user) {
      checkAccess(this);
      let path = `nf.backup`;
      if (target) {
        path = `artemis/${target.toLowerCase().replace(/\//g, "-")}`;
      }
      const backup = await (0, import_lib.FS)(`config/chat-plugins/${path}.json`).readIfExists();
      if (!backup)
        return this.errorReply(`No backup settings saved.`);
      const backupSettings = JSON.parse(backup);
      Object.assign(settings, backupSettings);
      saveSettings();
      this.addGlobalModAction(`${user.name} used /abusemonitor loadbackup`);
      this.stafflog(`Loaded ${path}`);
      this.refreshPage("abusemonitor-settings");
    },
    async deletebackup(target, room, user) {
      checkAccess(this);
      target = target.toLowerCase().replace(/\//g, "-");
      if (!target)
        return this.errorReply(`Specify a backup file.`);
      const path = (0, import_lib.FS)(`config/chat-plugins/artemis/${target}.json`);
      if (!await path.exists()) {
        return this.errorReply(`Backup '${target}' not found.`);
      }
      await path.unlinkIfExists();
      this.globalModlog(`ABUSEMONITOR DELETEBACKUP`, null, target);
      this.sendReply(`Backup '${target}' deleted.`);
      this.privateGlobalModAction(`${user.name} deleted the abuse-monitor backup '${target}'`);
    },
    async backups() {
      checkAccess(this);
      let buf = `<strong>Artemis backups:</strong><br />`;
      const files = await (0, import_lib.FS)(`config/chat-plugins/artemis`).readdirIfExists();
      if (!files.length) {
        buf += `No backups found.`;
      } else {
        buf += files.map((f) => {
          const fName = f.slice(0, f.lastIndexOf("."));
          let line = `&bull; ${fName} `;
          line += `<button name="send" value="/abusemonitor deletebackup ${fName}">Delete</button> `;
          line += `<button name="send" value="/abusemonitor loadbackup ${fName}">Load</button>`;
          return line;
        }).join("<br />");
      }
      this.sendReplyBox(buf);
    },
    togglepunishments(target, room, user) {
      checkAccess(this);
      let message;
      if (this.meansYes(target)) {
        if (!settings.recommendOnly) {
          return this.errorReply(`Automatic punishments are already enabled.`);
        }
        settings.recommendOnly = false;
        message = `${user.name} enabled automatic punishments for the Artemis battle monitor`;
      } else if (this.meansNo(target)) {
        if (settings.recommendOnly) {
          return this.errorReply(`Automatic punishments are already disabled.`);
        }
        settings.recommendOnly = true;
        message = `${user.name} disabled automatic punishments for the Artemis battle monitor`;
      } else {
        return this.sendReply(`Automatic punishments are: ${!settings.recommendOnly ? "ON" : "OFF"}.`);
      }
      this.privateGlobalModAction(message);
      this.globalModlog(`ABUSEMONITOR TOGGLE`, null, settings.recommendOnly ? "off" : "on");
      saveSettings();
    },
    review() {
      this.checkCan("lock");
      return this.parse(`/join view-abusemonitor-review`);
    },
    reviews() {
      checkAccess(this);
      return this.parse(`/join view-abusemonitor-reviews`);
    },
    async submitreview(target, room, user) {
      var _a;
      this.checkCan("lock");
      if (!target)
        return this.parse(`/help abusemonitor submitreview`);
      const [roomid, reason] = import_lib.Utils.splitFirst(target, ",").map((f) => f.trim());
      const log = await (0, import_helptickets.getBattleLog)((0, import_helptickets.getBattleLinks)(roomid)[0] || "");
      if (!log) {
        return this.popupReply(`No logs found for that roomid.`);
      }
      if (reviews[user.id]?.some((f) => f.room === roomid)) {
        return this.popupReply(`You have already submitted a review for this room.`);
      }
      if (reason.length < 1 || reason.length > 2e3) {
        return this.popupReply(`Your review must be between 1 and 2000 characters.`);
      }
      (reviews[_a = user.id] || (reviews[_a] = [])).push({
        room: roomid,
        details: reason,
        staff: user.id,
        time: Date.now()
      });
      saveReviews();
      Chat.refreshPageFor("abusemonitor-reviews", "staff");
      this.closePage("abusemonitor-review");
      this.popupReply(`Your review has been submitted.`);
    },
    resolvereview(target, room, user) {
      checkAccess(this);
      let [userid, roomid, accurate, result] = import_lib.Utils.splitFirst(target, ",", 3).map((f) => f.trim());
      userid = (0, import_dex_data.toID)(userid);
      roomid = (0, import_helptickets.getBattleLinks)(roomid)[0] || "";
      if (!userid || !roomid || !accurate || !result) {
        return this.parse(`/help abusemonitor resolvereview`);
      }
      if (!reviews[userid]) {
        return this.errorReply(`No reviews found by that user.`);
      }
      const review = reviews[userid].find((f) => (0, import_helptickets.getBattleLinks)(f.room).includes(roomid));
      if (!review) {
        return this.errorReply(`No reviews found by that user for that room.`);
      }
      const isAccurate = Number(accurate);
      if (isNaN(isAccurate) || isAccurate < 0 || isAccurate > 1) {
        return this.popupReply(`Invalid accuracy. Must be a number between 0 and 1.`);
      }
      if (review.resolved) {
        return this.errorReply(`That review has already been resolved.`);
      }
      review.resolved = {
        by: user.id,
        time: Date.now(),
        details: result,
        result: isAccurate
      };
      displayResolved(review, true);
      writeStats("reviews", review);
      Chat.refreshPageFor("abusemonitor-reviews", "staff");
    },
    replace(target, room, user) {
      checkAccess(this);
      if (!target)
        return this.parse(`/help am`);
      const [old, newWord] = target.split(",");
      if (!old || !newWord)
        return this.errorReply(`Invalid arguments - must be [oldWord], [newWord].`);
      if ((0, import_dex_data.toID)(old) === (0, import_dex_data.toID)(newWord))
        return this.errorReply(`The old word and the new word are the same.`);
      if (settings.replacements[old]) {
        return this.errorReply(`The old word '${old}' is already in use (for '${settings.replacements[old]}').`);
      }
      Chat.validateRegex(target);
      settings.replacements[old] = newWord;
      saveSettings();
      this.privateGlobalModAction(`${user.name} added an Artemis replacement for '${old}' to '${newWord}'.`);
      this.globalModlog(`ABUSEMONITOR REPLACE`, null, `'${old}' to '${newWord}'`);
      this.refreshPage("abusemonitor-settings");
    },
    removereplace(target, room, user) {
      checkAccess(this);
      if (!target)
        return this.parse(`/help am`);
      const replaceTo = settings.replacements[target];
      if (!replaceTo) {
        return this.errorReply(`${target} is not a currently set replacement.`);
      }
      delete settings.replacements[target];
      saveSettings();
      this.privateGlobalModAction(`${user.name} removed the Artemis replacement for ${target}`);
      this.globalModlog(`ABUSEMONITOR REMOVEREPLACEMENT`, null, `${target} (=> ${replaceTo})`);
      this.refreshPage("abusemonitor-settings");
    },
    edithistory(target, room, user) {
      this.checkCan("globalban");
      target = (0, import_dex_data.toID)(target);
      if (!target) {
        return this.parse(`/help abusemonitor`);
      }
      return this.parse(`/j view-abusemonitor-edithistory-${target}`);
    },
    ignoremodlog: {
      add(target, room, user) {
        this.checkCan("globalban");
        let targetUser;
        [targetUser, target] = this.splitOne(target).map((f) => f.trim());
        targetUser = (0, import_dex_data.toID)(targetUser);
        if (!targetUser || !target) {
          return this.popupReply(
            `Must specify a user and a target date (or modlog entry number).`
          );
        }
        if (!metadata.modlogIgnores)
          metadata.modlogIgnores = {};
        const num = Number(target);
        if (isNaN(num)) {
          if (!/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(target)) {
            return this.errorReply(`Invalid date provided. Must be in YYYY-MM-DD format.`);
          }
          metadata.modlogIgnores[targetUser] = target;
          target = "before and including " + target;
        } else {
          let ignores = metadata.modlogIgnores[targetUser];
          if (!Array.isArray(ignores)) {
            metadata.modlogIgnores[targetUser] = ignores = [];
          }
          if (ignores.includes(num)) {
            return this.errorReply(`That modlog entry is already ignored.`);
          }
          ignores.push(num);
          target = `entry #${target}`;
        }
        this.globalModlog(`ABUSEMONITOR MODLOGIGNORE`, targetUser, target);
        saveMetadata();
        this.refreshPage(`abusemonitor-edithistory-${targetUser}`);
      },
      remove(target, room, user) {
        this.checkCan("globalban");
        let [targetUser, rawNum] = this.splitOne(target).map((f) => f.trim());
        targetUser = (0, import_dex_data.toID)(targetUser);
        const num = Number(rawNum);
        if (!targetUser || !rawNum) {
          return this.popupReply(
            `Specify a target user and a target (either a modlog entry # or a date).`
          );
        }
        const entry = metadata.modlogIgnores?.[targetUser];
        if (!entry) {
          return this.errorReply(`That user has no ignored modlog entries registered.`);
        }
        if (typeof entry === "string") {
          rawNum = entry;
          delete metadata.modlogIgnores[targetUser];
        } else {
          if (isNaN(num)) {
            return this.errorReply(`Invalid modlog entry number: ${num}`);
          }
          const idx = entry.indexOf(num);
          if (idx === -1) {
            return this.errorReply(`That modlog entry is not ignored for the user ${targetUser}.`);
          }
          entry.splice(idx, 1);
          if (!entry.length) {
            delete metadata.modlogIgnores[targetUser];
          }
        }
        saveMetadata();
        this.globalModlog(`ABUSEMONITOR REMOVEMODLOGIGNORE`, targetUser, rawNum);
        this.refreshPage(`abusemonitor-edithistory-${targetUser}`);
      }
    }
  },
  abusemonitorhelp() {
    return this.sendReplyBox([
      `<strong>Staff commands:</strong>`,
      `/am userlogs [user] - View the Artemis flagged message logs for the given [user]. Requires: % @ &`,
      `/am unmute [user] - Remove the Artemis mute from the given [user]. Requires: % @ &`,
      `/am review - Submit feedback for manual abuse monitor review. Requires: % @ &`,
      `</details><br /><details class="readmore"><summary><strong>Management commands:</strong></summary>`,
      `/am toggle - Toggle the abuse monitor on and off. Requires: whitelist &`,
      `/am threshold [number] - Set the abuse monitor trigger threshold. Requires: whitelist &`,
      `/am resolve [room] - Mark a abuse monitor flagged room as handled by staff. Requires: % @ &`,
      `/am respawn - Respawns abuse monitor processes. Requires: whitelist &`,
      `/am logs [count][, userid] - View logs of recent matches by the abuse monitor. `,
      `If a userid is given, searches only logs from that userid. Requires: whitelist &`,
      `/am userclear [user] - Clear all logged abuse monitor hits for a user. Requires: whitelist &`,
      `/am deletelog [number] - Deletes a abuse monitor log matching the row ID [number] given. Requires: whitelist &`,
      `/am editspecial [type], [percent], [score] - Sets a special case for the abuse monitor. Requires: whitelist &`,
      `[score] can be either a number or MAXIMUM, which will set it to the maximum score possible (that will trigger an action)`,
      `/am deletespecial [type], [percent] - Deletes a special case for the abuse monitor. Requires: whitelist &`,
      `/am editmin [number] - Sets the minimum percent needed to process for all flags. Requires: whitelist &`,
      `/am viewsettings - View the current settings for the abuse monitor. Requires: whitelist &`,
      `/am thresholdincrement [num], [amount][, min turns] - Sets the threshold increment for the abuse monitor to increase [amount] every [num] turns.`,
      `If [min turns] is provided, increments will start after that turn number. Requires: whitelist &`,
      `/am deleteincrement - clear abuse-monitor threshold increment. Requires: whitelist &`,
      `</details>`
    ].join("<br />"));
  }
};
const pages = {
  abusemonitor: {
    flagged(query, user) {
      checkAccess(this, "lock");
      const ids = getFlaggedRooms();
      this.title = "[Abuse Monitor] Flagged rooms";
      let buf = `<div class="pad">`;
      buf += `<h2>Flagged rooms</h2>`;
      if (!ids.length) {
        buf += `<p class="error">No rooms have been flagged recently.</p>`;
        return buf;
      }
      buf += `<p>Currently flagged rooms: ${ids.length}</p>`;
      buf += `<div class="ladder pad">`;
      buf += `<table><tr><th>Status</th><th>Room</th><th>Claimed by</th><th>Action</th></tr>`;
      for (const roomid of ids) {
        const entry = cache[roomid];
        buf += `<tr>`;
        if (entry.claimed) {
          buf += `<td><span style="color:green">`;
          buf += `<i class="fa fa-circle-o"></i> <strong>Claimed</strong></span></td>`;
        } else {
          buf += `<td><span style="color:orange">`;
          buf += `<i class="fa fa-circle-o"></i> <strong>Unclaimed</strong></span></td>`;
        }
        buf += import_lib.Utils.html`<td>${Rooms.get(roomid)?.title || roomid}</td>`;
        buf += `<td>${entry.claimed ? entry.claimed : "-"}</td>`;
        buf += `<td><button class="button" name="send" value="/am view ${roomid}">`;
        buf += `${entry.claimed ? "Show" : "Claim"}</button></td>`;
        buf += `</tr>`;
      }
      buf += `</table></div>`;
      return buf;
    },
    async view(query, user) {
      checkAccess(this, "lock");
      const roomid = query.join("-");
      if (!(0, import_dex_data.toID)(roomid)) {
        return this.errorReply(`You must specify a roomid to view abuse monitor data for.`);
      }
      let buf = `<div class="pad">`;
      buf += `<button style="float:right;" class="button" name="send" value="/join ${this.pageid}">`;
      buf += `<i class="fa fa-refresh"></i> Refresh</button>`;
      buf += `<h2>Abuse Monitor`;
      const room = Rooms.get(roomid);
      if (!room) {
        if (cache[roomid]) {
          delete cache[roomid];
          notifyStaff();
        }
        buf += `</h2><hr /><p class="error">No such room.</p>`;
        return buf;
      }
      room.pokeExpireTimer();
      if (!cache[roomid]) {
        buf += `</h2><hr /><p class="error">The abuse monitor has not flagged the given room.</p>`;
        return buf;
      }
      const titleParts = room.roomid.split("-");
      if (titleParts[titleParts.length - 1].endsWith("pw")) {
        titleParts.pop();
      }
      buf += import_lib.Utils.html` - ${room.title}</h2>`;
      this.title = `[Abuse Monitor] ${titleParts.join("-")}`;
      buf += `<p>${Chat.formatText(`<<${room.roomid}>>`)}</p>`;
      buf += `<hr />`;
      if (!cache[roomid].claimed) {
        cache[roomid].claimed = user.id;
        notifyStaff();
      } else {
        buf += `<p><strong>Claimed:</strong> ${cache[roomid].claimed}</p>`;
      }
      buf += `<details class="readmore"><summary><strong>Chat:</strong></summary><div class="infobox">`;
      const users = new import_lib.Utils.Multiset();
      const logData = await (0, import_helptickets.getBattleLog)(room.roomid, true);
      if (!logData)
        return `<div class="pad"><p class="error">No such room.</p></div>`;
      for (const line of logData.log) {
        const data = room.log.parseChatLine(line);
        if (!data)
          continue;
        if (["/log", "/raw"].some((prefix) => data.message.startsWith(prefix))) {
          continue;
        }
        const id = (0, import_dex_data.toID)(data.user);
        if (!id)
          continue;
        users.add(id);
        buf += `<div class="chat chatmessage">`;
        buf += `<strong style="color: ${import_helptickets.HelpTicket.colorName(id, logData)}">`;
        buf += import_lib.Utils.html`<span class="username">${data.user}:</span></strong> ${data.message}</div>`;
      }
      buf += `</div></details>`;
      const recs = cache[roomid].recommended || {};
      if (Object.keys(recs).length) {
        for (const id in recs) {
          const rec = recs[id];
          buf += `<p><strong>Recommended action for ${id}:</strong> ${rec.type} (${rec.reason})</p>`;
        }
      }
      buf += `<p><strong>Users:</strong><small> (click a name to punish)</small></p>`;
      const sortedUsers = import_lib.Utils.sortBy([...users], ([id, num]) => [isFlaggedUserid(id, roomid), -num, id]);
      for (const [id] of sortedUsers) {
        const curUser = Users.getExact(id);
        buf += import_lib.Utils.html`<details class="readmore"><summary>${curUser?.name || id} `;
        buf += `<button class="button" name="send" value="/mlid ${id},room=global">Modlog</button>`;
        buf += `</summary><div class="infobox">`;
        const punishments = ["Warn", "Lock", "Weeklock", "Forcerename", "Namelock", "Weeknamelock"];
        for (const name of punishments) {
          buf += `<form data-submitsend="/am nojoinpunish ${roomid},${(0, import_dex_data.toID)(name)},${id},{reason}">`;
          buf += `<button class="button notifying" type="submit">${name}</button><br />`;
          buf += `Optional reason: <input name="reason" />`;
          buf += `</form><br />`;
        }
        buf += `</div></details><br />`;
      }
      buf += `<hr /><strong>Mark resolved:</strong><br />`;
      buf += `<button class="button" name="send" value="/msgroom staff, /am resolve ${room.roomid},success">As accurate flag</button> | `;
      buf += `<button class="button" name="send" value="/msgroom staff, /am resolve ${room.roomid},failure">As inaccurate flag</button>`;
      return buf;
    },
    async userlogs(query, user) {
      this.checkCan("lock");
      let buf = `<div class="pad"><h2>Artemis user logs</h2><hr />`;
      const userid = (0, import_dex_data.toID)(query.shift());
      if (!userid || userid.length > 18) {
        buf += `<p class="message-error">Invalid username.</p>`;
        return buf;
      }
      this.title = `[Artemis Logs] ${userid}`;
      const logs = await Chat.database.all(`SELECT * FROM perspective_logs WHERE userid = ? LIMIT 100`, [userid]);
      if (!logs.length) {
        buf += `<p class="message-error">No logs found.</p>`;
        return buf;
      }
      buf += `<div class="ladder pad"><table><tr><th>Date</th><th>Room</th><th>User</th><th>Message</th></tr>`;
      import_lib.Utils.sortBy(logs, (log) => -log.time);
      for (const log of logs) {
        buf += `<tr><td>${Chat.toTimestamp(new Date(log.time), { human: true })}</td>`;
        buf += `<td><a href="/${log.roomid}">${log.roomid}</a></td>`;
        buf += import_lib.Utils.html`<td>${log.userid}</td><td>${log.message}</td></tr>`;
      }
      return buf;
    },
    async logs(query, user) {
      checkAccess(this);
      this.title = "[Abuse Monitor] Logs";
      let buf = `<div class="pad">`;
      buf += `<h2>Abuse Monitor Logs</h2><hr />`;
      const rawCount = query.shift() || "";
      let count = 200;
      if (rawCount) {
        count = parseInt(rawCount);
        if (isNaN(count)) {
          buf += `<p class="message-error">Invalid limit specified: ${rawCount}</p>`;
          return buf;
        }
      }
      const userid = (0, import_dex_data.toID)(query.shift());
      let logQuery = `SELECT rowid, * FROM perspective_logs `;
      const args = [];
      if (userid) {
        logQuery += `WHERE userid = ? `;
        args.push(userid);
      }
      logQuery += `ORDER BY rowid DESC LIMIT ?`;
      args.push(count);
      const logs = await Chat.database.all(logQuery, args);
      if (!logs.length) {
        buf += `<p class="message-error">No logs found${userid ? ` for the user ${userid}` : ""}.</p>`;
        return buf;
      }
      import_lib.Utils.sortBy(logs, (log) => [-log.time, log.roomid, log.userid]);
      buf += `<p>${logs.length} log(s) found.</p>`;
      buf += `<div class="ladder pad">`;
      buf += `<table><tr><th>Room</th>`;
      if (!userid) {
        buf += `<th>User</th>`;
      }
      buf += `<th>Message</th>`;
      buf += `<th>Time</th><th>Score / Flags</th><th>Other data</th><th>Manage</th></tr>`;
      const prettifyFlag = (flag) => flag.toLowerCase().replace(/_/g, " ");
      for (const log of logs) {
        const { roomid } = log;
        buf += `<tr>`;
        buf += `<td><a href="https://${import_config_loader.Config.routes.replays}/${roomid.slice(7)}">${roomid}</a></td>`;
        if (!userid)
          buf += `<td>${log.userid}</td>`;
        buf += import_lib.Utils.html`<td>${log.message}</td>`;
        buf += `<td>${Chat.toTimestamp(new Date(log.time))}</td>`;
        buf += `<td>${log.score} (${log.flags.split(",").map(prettifyFlag).join(", ")})</td>`;
        buf += `<td>Hit threshold: ${log.hit_threshold ? "Yes" : "No"}</td><td>`;
        buf += `<button class="button" name="send" value="/msgroom staff,/abusemonitor deletelog ${log.rowid}">Delete</button>`;
        buf += `</td>`;
        buf += `</tr>`;
      }
      buf += `</table></div>`;
      if (count === logs.length) {
        buf += `<center>`;
        buf += `<button class="button" name="send" value="/msgroom staff, /am logs ${count + 100}">Show 100 more</button>`;
        buf += `</center>`;
      }
      return buf;
    },
    async stats(query, user) {
      checkAccess(this);
      const dateString = (query.join("-") || Chat.toTimestamp(new Date())).slice(0, 7);
      if (!/^[0-9]{4}-[0-9]{2}$/.test(dateString)) {
        return this.errorReply(`Invalid date: ${dateString}`);
      }
      let buf = `<div class="pad">`;
      buf += `<button style="float:right;" class="button" name="send" value="/join ${this.pageid}">`;
      buf += `<i class="fa fa-refresh"></i> Refresh</button>`;
      buf += `<h2>Abuse Monitor stats for ${dateString}</h2>`;
      const next = nextMonth(dateString);
      const prev = new Date(new Date(`${dateString}-15`).getTime() - 30 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 7);
      buf += `<a class="button" target="replace" href="/view-abusemonitor-stats-${prev}-15">Previous month</a> | `;
      buf += `<a class="button" target="replace" href="/view-abusemonitor-stats-${next}-15">Next month</a>`;
      buf += `<hr />`;
      const logs = await Chat.database.all(
        `SELECT * FROM perspective_stats WHERE timestamp > ? AND timestamp < ?`,
        [new Date(dateString + "-01").getTime(), new Date(nextMonth(dateString)).getTime()]
      );
      this.title = "[Abuse Monitor] Stats";
      if (!logs.length) {
        buf += `<p class="message-error">No logs found for the month ${dateString}.</p>`;
        return buf;
      }
      this.title += ` ${dateString}`;
      buf += `<p>${Chat.count(logs.length, "logs")} found.</p>`;
      let successes = 0;
      let failures = 0;
      let dead = 0;
      const staffStats = {};
      const dayStats = {};
      for (const log of logs) {
        const cur = Chat.toTimestamp(new Date(log.timestamp)).split(" ")[0];
        if (!dayStats[cur])
          dayStats[cur] = { successes: 0, failures: 0, dead: 0, total: 0 };
        if (log.result === 2) {
          dead++;
          dayStats[cur].dead++;
          continue;
        } else if (log.result === 1) {
          successes++;
          dayStats[cur].successes++;
        } else {
          failures++;
          dayStats[cur].failures++;
        }
        if (!staffStats[log.staff])
          staffStats[log.staff] = 0;
        staffStats[log.staff]++;
        dayStats[cur].total++;
      }
      const percent = (numerator, denom) => Math.floor(numerator / denom * 100) || 0;
      buf += `<p><strong>Success rate:</strong> ${percent(successes, successes + failures)}% (${successes})</p>`;
      buf += `<p><strong>Failure rate:</strong> ${percent(failures, successes + failures)}% (${failures})</p>`;
      buf += `<p><details class="readmore"><summary><strong>Stats including dead flags</strong></summary>`;
      buf += `<p><strong>Total dead: ${dead}</strong></p>`;
      buf += `<p><strong>Success rate:</strong> ${percent(successes, logs.length)}% (${successes})</p>`;
      buf += `<p><strong>Failure rate:</strong> ${percent(failures, logs.length)}% (${failures})</p>`;
      buf += `</summary></details></p>`;
      buf += `<p><strong>Day stats:</strong></p>`;
      buf += `<div class="ladder pad"><table>`;
      let header = "";
      let data = "";
      const sortedDays = import_lib.Utils.sortBy(Object.keys(dayStats), (d) => new Date(d).getTime());
      for (const [i, day] of sortedDays.entries()) {
        const cur = dayStats[day];
        if (!cur.total)
          continue;
        header += `<th>${day.split("-")[2]} (${cur.total})</th>`;
        data += `<td><small>${cur.successes} (${percent(cur.successes, cur.total)}%)`;
        if (cur.failures) {
          data += ` | ${cur.failures} (${percent(cur.failures, cur.total)}%)`;
        } else {
          data += " | 0 (0%)";
        }
        if (cur.dead)
          data += ` | ${cur.dead}`;
        data += "</small></td>";
        if ((i + 1) % 5 === 0 && sortedDays[i + 1]) {
          buf += `<tr>${header}</tr><tr>${data}</tr>`;
          buf += `</div></table>`;
          buf += `<div class="ladder pad"><table>`;
          header = "";
          data = "";
        }
      }
      buf += `<tr>${header}</tr><tr>${data}</tr>`;
      buf += `</div></table>`;
      buf += `<hr /><p><strong>Punishment stats:</strong></p>`;
      const punishmentStats = {
        inaccurate: 0,
        total: 0,
        byDay: {},
        types: {}
      };
      const inaccurate = /* @__PURE__ */ new Set();
      const logPath = (0, import_lib.FS)(`logs/artemis/punishments/${dateString}.jsonl`);
      if (await logPath.exists()) {
        const stream = logPath.createReadStream();
        for await (const line of stream.byLine()) {
          if (!line.trim())
            continue;
          const chunk = JSON.parse(line.trim());
          punishmentStats.total++;
          if (!punishmentStats.types[chunk.punishment])
            punishmentStats.types[chunk.punishment] = 0;
          punishmentStats.types[chunk.punishment]++;
          const day = Chat.toTimestamp(new Date(chunk.timestamp)).split(" ")[0];
          if (!punishmentStats.byDay[day])
            punishmentStats.byDay[day] = { total: 0, inaccurate: 0 };
          punishmentStats.byDay[day].total++;
        }
      }
      const reviewLogPath = (0, import_lib.FS)(`logs/artemis/reviews/${dateString}.jsonl`);
      if (await reviewLogPath.exists()) {
        const stream = reviewLogPath.createReadStream();
        for await (const line of stream.byLine()) {
          if (!line.trim())
            continue;
          const chunk = JSON.parse(line.trim());
          if (!chunk.resolved.result) {
            punishmentStats.inaccurate++;
            inaccurate.add(chunk.room);
            const day = Chat.toTimestamp(new Date(chunk.time)).split(" ")[0];
            if (!punishmentStats.byDay[day])
              punishmentStats.byDay[day] = { total: 0, inaccurate: 0 };
            punishmentStats.byDay[day].inaccurate++;
          }
        }
      }
      buf += `<p>Total punishments: ${punishmentStats.total}</p>`;
      const accurate = punishmentStats.total - punishmentStats.inaccurate;
      buf += `<p>Accurate punishments: ${accurate} (${percent(accurate, punishmentStats.total)}%)</p>`;
      buf += `<details class="readmore"><summary>Inaccurate punishments: ${punishmentStats.inaccurate} `;
      buf += `(${percent(punishmentStats.inaccurate, punishmentStats.total)}%)</summary>`;
      buf += Array.from(inaccurate).map((f) => `<a href="/${f}">${f}</a>`).join(", ");
      buf += `</details>`;
      if (punishmentStats.total) {
        buf += `<p><strong>Day stats:</strong></p>`;
        buf += `<div class="ladder pad"><table>`;
        header = "";
        data = "";
        const sortedDayStats = import_lib.Utils.sortBy(Object.keys(punishmentStats.byDay), (d) => new Date(d).getTime());
        for (const [i, day] of sortedDayStats.entries()) {
          const cur = punishmentStats.byDay[day];
          if (!cur.total)
            continue;
          header += `<th>${day.split("-")[2]} (${cur.total})</th>`;
          const curAccurate = cur.total - cur.inaccurate;
          data += `<td><small>${curAccurate} (${percent(curAccurate, cur.total)}%)`;
          if (cur.inaccurate) {
            data += ` | ${cur.inaccurate} (${percent(cur.inaccurate, cur.total)}%)`;
          } else {
            data += " | 0 (0%)";
          }
          data += "</small></td>";
          if ((i + 1) % 5 === 0 && sortedDays[i + 1]) {
            buf += `<tr>${header}</tr><tr>${data}</tr>`;
            buf += `</div></table>`;
            buf += `<div class="ladder pad"><table>`;
            header = "";
            data = "";
          }
        }
        buf += `<tr>${header}</tr><tr>${data}</tr>`;
        buf += `</div></table>`;
        buf += `<br /><strong>Punishment breakdown:</strong><br />`;
        buf += `<div class="ladder pad"><table>`;
        buf += `<tr><th>Type</th><th>Count</th><th>Percent</th></tr>`;
        const sorted = import_lib.Utils.sortBy(Object.entries(punishmentStats.types), (e) => e[1]);
        for (const [type, num] of sorted) {
          buf += `<tr><td>${type}</td><td>${num}</td><td>${percent(num, punishmentStats.total)}%</td></tr>`;
        }
        buf += `</table></div>`;
      }
      buf += `<hr /><p><strong>Staff stats:</strong></p>`;
      buf += `<div class="ladder pad"><table>`;
      buf += `<tr><th>User</th><th>Total</th><th>Percent total</th></tr>`;
      for (const id of import_lib.Utils.sortBy(Object.keys(staffStats), (k) => -staffStats[k])) {
        buf += `<tr><td>${id}</td><td>${staffStats[id]}</td><td>${staffStats[id] / logs.length * 100}%</td></tr>`;
      }
      buf += `</table></div>`;
      return buf;
    },
    async settings() {
      checkAccess(this);
      this.title = `[Abuse Monitor] Settings`;
      let buf = `<div class="pad"><h2>Abuse Monitor Settings</h2>`;
      buf += `<button class="button" name="send" value="/am vs">Reload page</button>`;
      buf += `<button class="button" name="send" value="/msgroom staff,/am respawn">Reload processes</button>`;
      buf += `<button class="button" name="send" value="/msgroom staff,/am bs">Backup settings</button>`;
      if (await (0, import_lib.FS)("config/chat-plugins/nf.backup.json").exists()) {
        buf += `<button class="button" name="send" value="/msgroom staff,/am lb">Load backup</button>`;
      }
      buf += `<div class="infobox"><h3>Miscellaneous settings</h3><hr />`;
      buf += `Minimum percent to process: <form data-submitsend="/msgroom staff,/am editmin {num}">`;
      buf += `<input name="num" value="${settings.minScore}"/>`;
      buf += `<button class="button notifying" type="submit">Change minimum</button></form>`;
      buf += `<br />Score threshold: <form data-submitsend="/msgroom staff,/am threshold {num}">`;
      buf += `<input name="num" value="${settings.threshold}"/>`;
      buf += `<button class="button notifying" type="submit">Change threshold</button></form>`;
      const incr = settings.thresholdIncrement;
      if (incr) {
        buf += `<br />Threshold increments: `;
        buf += `Increases ${incr.amount} every ${incr.turns} turns`;
        if (incr.minTurns)
          buf += ` after turn ${incr.minTurns}`;
        buf += `<br />`;
      }
      const replacements = Object.keys(settings.replacements);
      if (replacements.length) {
        buf += `<br />Replacements: `;
        buf += replacements.map((k) => `${k}: ${settings.replacements[k]}`).join(", ");
        buf += `<br />`;
      }
      buf += `</div><div class="infobox"><h3>Punishment settings</h3><hr />`;
      if (settings.punishments.length) {
        for (const [i, p] of settings.punishments.entries()) {
          buf += `&bull; ${i + 1}: `;
          buf += Object.keys(p).map(
            (f) => `${f}: ${visualizePunishmentKey(p, f)}`
          ).join(", ");
          buf += ` (<button class="button" name="send" value="/msgroom staff,/am dp ${i + 1}">delete</button>)`;
          buf += `<br />`;
        }
        buf += `<br />`;
      }
      buf += `<details class="readmore"><summary>Add a punishment</summary>`;
      buf += `<form data-submitsend="/msgroom staff,/am ap p={punishment},t={type},ct={certainty},c={count}">`;
      buf += `Punishment: <input name="punishment" /> <small>(required)</small><br />`;
      buf += `Type: <input name="type" /> <small>(required)</small><br />`;
      buf += `Certainty: <input name="certainty" /> <small>(optional)</small><br />`;
      buf += `Count: <input name="count" /> <small>(optional)</small><br />`;
      buf += `<button class="button notifying" type="submit">Add punishment</button></details>`;
      buf += `</form><br />`;
      buf += `</div><div class="infobox"><h3>Scoring:</h3><hr />`;
      const keys = import_lib.Utils.sortBy(
        Object.keys(Artemis.RemoteClassifier.ATTRIBUTES),
        (k) => [-Object.keys(settings.specials[k] || {}).length, k]
      );
      for (const k of keys) {
        buf += `<strong>${k}</strong>:<br />`;
        if (settings.specials[k]) {
          for (const percent in settings.specials[k]) {
            buf += `&bull; ${percent}%: ${settings.specials[k][percent]} `;
            buf += `(<button class="button" name="send" value="/msgroom staff,/am ds ${k},${percent}">Delete</button>)`;
            buf += `<br />`;
          }
        }
        buf += `<br />`;
        buf += `<details class="readmore"><summary>Add a special case</summary>`;
        buf += `<form data-submitsend="/msgroom staff,/am es ${k},{percent},{score}">`;
        buf += `Percent needed: <input type="text" name="percent" /><br />`;
        buf += `Score: <input type="text" name="score" /><br />`;
        buf += `<button class="button notifying" type="submit">Add</button>`;
        buf += `</form></details>`;
        buf += `<hr />`;
      }
      buf += `</div>`;
      return buf;
    },
    reviews() {
      checkAccess(this);
      this.title = `[Abuse Monitor] Reviews`;
      let buf = `<div class="pad"><h2>Artemis recommendation reviews ({{total}})</h2>`;
      buf += `<button class="button" name="send" value="/msgroom staff,/am reviews">Reload reviews</button>`;
      buf += `<hr />`;
      let total = 0;
      let atLeastOne = false;
      for (const userid in reviews) {
        const curReviews = reviews[userid].filter((f) => !f.resolved);
        if (curReviews.length) {
          buf += `<strong>${Chat.count(curReviews, "reviews")} from ${userid}:</strong><hr />`;
          total += curReviews.length;
        } else {
          continue;
        }
        for (const review of curReviews) {
          buf += `<div class="infobox">`;
          buf += `Battle: <a href="//${import_config_loader.Config.routes.client}/${(0, import_helptickets.getBattleLinks)(review.room)[0]}">${review.room}</a><br />`;
          buf += import_lib.Utils.html`<details class="readmore"><summary>Review details:</summary>${review.details}</details>`;
          buf += `<form data-submitsend="/msgroom staff,/am resolvereview ${review.staff},${review.room},{result},{response}">`;
          buf += `Respond: <br /><textarea name="response" rows="3" cols="40"></textarea><br />`;
          buf += `Mark result: <select name="result">`;
          buf += `<option value="1">Accurate</option>`;
          buf += `<option value="0">Inaccurate</option>`;
          buf += `</select><br />`;
          buf += `<button class="button notifying" type="submit">Resolve</button>`;
          buf += `</form></div><br />`;
          atLeastOne = true;
        }
        buf += `<hr />`;
      }
      if (!atLeastOne) {
        buf += `No reviews to display.`;
        return buf;
      }
      buf = buf.replace("{{total}}", `${total}`);
      return buf;
    },
    review() {
      this.checkCan("lock");
      this.title = `[Abuse Monitor] Review`;
      let buf = `<div class="pad"><h2>Artemis recommendation review</h2>`;
      buf += `<hr />`;
      buf += `<form data-submitsend="/msgroom staff,/am submitreview {room},{details}">`;
      buf += `<label>Enter a room ID (replay URL will work):</label>`;
      buf += `<br />`;
      buf += `<input type="text" name="room" />`;
      buf += `<br />`;
      buf += `<label>Tell what was inaccurate and why:</label> `;
      buf += `<br />`;
      buf += `<textarea name="details" rows="3" cols="20"></textarea>`;
      buf += `<br />`;
      buf += `<button class="button notifying" type="submit">Submit</button>`;
      buf += `</form>`;
      return buf;
    },
    async edithistory(query, user) {
      this.checkCan("globalban");
      const targetUser = (0, import_dex_data.toID)(query[0]);
      if (!targetUser) {
        return this.errorReply(`Specify a user.`);
      }
      this.title = `[Artemis History] ${targetUser}`;
      let buf = `<div class="pad"><h2>Artemis modlog handling for ${targetUser}</h2><hr />`;
      const modlogEntries = await Rooms.Modlog.search("global", {
        user: [{ search: targetUser, isExact: true }],
        note: [],
        ip: [],
        action: [],
        actionTaker: []
      }, 100, true);
      if (!modlogEntries?.results.length) {
        buf += `<div class="message-error">No entries found.</div>`;
        return buf;
      }
      buf += `<div class="ladder pad"><table><tr><th>Entry</th><th>Options</th></tr><tr>`;
      buf += modlogEntries.results.map((result) => {
        const day = Chat.toTimestamp(new Date(result.time)).split(" ")[0];
        let innerBuf = import_lib.Utils.html`<td><small>#${result.entryID}</small> [${day}] `;
        innerBuf += `${result.action}${result.note ? ` (${result.note.trim()})` : ``}</td>`;
        const existingIgnore = metadata.modlogIgnores?.[targetUser];
        const todayMatch = existingIgnore === day;
        const entryMatch = Array.isArray(existingIgnore) && existingIgnore?.includes(result.entryID);
        let cmd = entryMatch ? `am ignoremodlog remove` : `am ignoremodlog add`;
        innerBuf += `<td><button class="button" name="send" value="/${cmd} ${targetUser},${result.entryID}">`;
        innerBuf += `(${entryMatch ? "Unignore" : "Ignore"} specific)</button> `;
        cmd = todayMatch ? `am ignoremodlog remove` : `am ignoremodlog add`;
        innerBuf += `<button class="button" name="send" value="/${cmd} ${targetUser},${day}">`;
        innerBuf += `(${todayMatch ? "Unignore" : "Ignore"} up to this date)</button></td>`;
        return innerBuf;
      }).join("</tr><tr>");
      buf += `</tr></table></div>`;
      return buf;
    }
  },
  async battlechat(query) {
    const [format, num, pw] = query.map(import_dex_data.toID);
    this.checkCan("lock");
    if (!format || !num) {
      return this.errorReply(`Invalid battle link provided.`);
    }
    this.title = `[Battle Logs] ${format}-${num}`;
    const full = `battle-${format}-${num}${pw ? `-${pw}` : ""}`;
    const logData = await (0, import_helptickets.getBattleLog)(full);
    if (!logData) {
      return this.errorReply(`No logs found for the battle <code>${full}</code>.`);
    }
    let log = logData.log;
    log = log.filter((l) => l.startsWith("|c|"));
    let buf = '<div class="pad">';
    buf += `<h2>Logs for <a href="/${full}">${logData.title}</a></h2>`;
    buf += `Players: ${Object.values(logData.players).map(import_dex_data.toID).filter(Boolean).join(", ")}<hr />`;
    let atLeastOne = false;
    for (const line of log) {
      const [, , username, message] = import_lib.Utils.splitFirst(line, "|", 3);
      buf += import_lib.Utils.html`<div class="chat"><span class="username"><username>${username}:</username></span> ${message}</div>`;
      atLeastOne = true;
    }
    if (!atLeastOne)
      buf += `None found.`;
    return buf;
  }
};
const punishmentfilter = (user, punishment) => {
  if (typeof user === "string")
    return;
  if (!Punishments.punishmentTypes.has(punishment.type))
    return;
  const cacheEntry = punishmentCache.get(user) || {};
  if (!cacheEntry[punishment.type])
    cacheEntry[punishment.type] = 0;
  cacheEntry[punishment.type]++;
};
//# sourceMappingURL=abuse-monitor.js.map

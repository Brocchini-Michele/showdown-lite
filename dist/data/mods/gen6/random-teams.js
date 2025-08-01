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
var random_teams_exports = {};
__export(random_teams_exports, {
  RandomGen6Teams: () => RandomGen6Teams,
  default: () => random_teams_default
});
module.exports = __toCommonJS(random_teams_exports);
var import_random_teams2 = __toESM(require("../gen7/random-teams"));
var import_lib = require("../../../lib");
var import_dex = require("../../../sim/dex");
class RandomGen6Teams extends import_random_teams2.default {
  constructor(format, prng) {
    super(format, prng);
    this.randomData = require("./random-data.json");
    this.randomFactorySets = require("./factory-sets.json");
    this.noStab = [...this.noStab, "aquajet", "fakeout", "iceshard", "machpunch", "quickattack", "vacuumwave"];
    this.moveEnforcementCheckers = {
      Bug: (movePool, moves, abilities, types, counter) => ["megahorn", "pinmissile"].some((m) => movePool.includes(m)) || !counter.get("Bug") && abilities.has("Tinted Lens"),
      Dark: (movePool, moves, abilities, types, counter, species) => !counter.get("Dark") && !abilities.has("Protean"),
      Dragon: (movePool, moves, abilities, types, counter) => !counter.get("Dragon") && !abilities.has("Aerilate") && !abilities.has("Pixilate") && !moves.has("dragonascent") && !moves.has("rest") && !moves.has("sleeptalk"),
      Electric: (movePool, moves, abilities, types, counter) => !counter.get("Electric"),
      Fairy: (movePool, moves, abilities, types, counter) => !counter.get("Fairy") && !abilities.has("Pixilate") && (!!counter.setupType || !counter.get("Status")),
      Fighting: (movePool, moves, abilities, types, counter, species) => !counter.get("Fighting") && (species.baseStats.atk >= 110 || abilities.has("Justified") || abilities.has("Unburden") || !!counter.setupType || !counter.get("Status")),
      Fire: (movePool, moves, abilities, types, counter) => !counter.get("Fire") || ["eruption", "quiverdance"].some((m) => movePool.includes(m)),
      Flying: (movePool, moves, abilities, types, counter) => !counter.get("Flying") && (abilities.has("Gale Wings") || abilities.has("Serene Grace") || types.has("Normal") && movePool.includes("bravebird")),
      Ghost: (movePool, moves, abilities, types, counter) => !types.has("Dark") && !counter.get("Ghost"),
      Grass: (movePool, moves, abilities, types, counter) => !counter.get("Grass") && !types.has("Fairy") && !types.has("Poison") && !types.has("Steel"),
      Ground: (movePool, moves, abilities, types, counter) => !counter.get("Ground") && !moves.has("rest") && !moves.has("sleeptalk"),
      Ice: (movePool, moves, abilities, types, counter) => !counter.get("Ice") && !abilities.has("Refrigerate"),
      Normal: (movePool) => movePool.includes("facade"),
      Poison: (movePool, moves, abilities, types, counter) => !counter.get("Poison") && (!!counter.setupType || abilities.has("Adaptability") || abilities.has("Sheer Force") || movePool.includes("gunkshot")),
      Psychic: (movePool, moves, abilities, types, counter, species) => !!counter.get("Psychic") && !types.has("Flying") && !abilities.has("Pixilate") && counter.get("stab") < species.types.length,
      Rock: (movePool, moves, abilities, types, counter) => !counter.get("Rock") && !types.has("Fairy") && (abilities.has("Rock Head") || counter.setupType === "Physical"),
      Steel: (movePool, moves, abilities, types, counter) => !counter.get("Steel") && (abilities.has("Technician") || movePool.includes("meteormash")),
      Water: (movePool, moves, abilities, types, counter) => (!counter.get("Water") || !counter.get("stab")) && !abilities.has("Protean"),
      Adaptability: (movePool, moves, abilities, types, counter, species) => !counter.setupType && species.types.length > 1 && (!counter.get(species.types[0]) || !counter.get(species.types[1])),
      Aerilate: (movePool, moves, abilities, types, counter) => !counter.get("Normal"),
      Pixilate: (movePool, moves, abilities, types, counter) => !counter.get("Normal"),
      Refrigerate: (movePool, moves, abilities, types, counter) => !moves.has("blizzard") && !counter.get("Normal"),
      Contrary: (movePool, moves, abilities, types, counter, species) => !counter.get("contrary") && species.name !== "Shuckle",
      "Bad Dreams": (movePool) => movePool.includes("darkvoid"),
      "Slow Start": (movePool) => movePool.includes("substitute"),
      protect: (movePool) => movePool.includes("wish"),
      wish: (movePool, moves, abilities, types, counter, species) => species.baseStats.hp < 110 && !abilities.has("Regenerator") && movePool.includes("protect")
    };
  }
  shouldCullMove(move, types, moves, abilities, counter, movePool, teamDetails, species, isLead) {
    const restTalk = moves.has("rest") && moves.has("sleeptalk");
    if (move.priority > 0 && counter.get("speedsetup"))
      return { cull: true };
    switch (move.id) {
      case "cottonguard":
      case "defendorder":
        return { cull: !counter.get("recovery") && !moves.has("rest") };
      case "focuspunch":
        return { cull: !moves.has("substitute") || counter.damagingMoves.size < 2 };
      case "lightscreen":
        if (movePool.length > 1) {
          const screen = movePool.indexOf("reflect");
          if (screen >= 0)
            this.fastPop(movePool, screen);
        }
        return { cull: !moves.has("reflect") };
      case "perishsong":
        return { cull: !moves.has("protect") };
      case "reflect":
        if (movePool.length > 1) {
          const screen = movePool.indexOf("lightscreen");
          if (screen >= 0)
            this.fastPop(movePool, screen);
        }
        return { cull: !moves.has("lightscreen") };
      case "rest":
        return { cull: movePool.includes("sleeptalk") };
      case "sleeptalk":
        if (movePool.length > 1) {
          const rest = movePool.indexOf("rest");
          if (rest >= 0)
            this.fastPop(movePool, rest);
        }
        return { cull: !moves.has("rest") };
      case "storedpower":
        return { cull: !counter.setupType };
      case "switcheroo":
      case "trick":
        return { cull: counter.get("Physical") + counter.get("Special") < 3 || !!counter.get("priority") };
      case "bellydrum":
      case "bulkup":
      case "coil":
      case "curse":
      case "dragondance":
      case "honeclaws":
      case "swordsdance":
        return { cull: move.id === "bellydrum" && !abilities.has("Unburden") && !counter.get("priority") || counter.get("Physical") + counter.get("physicalpool") < 2 && (!moves.has("rest") || !moves.has("sleeptalk")) || (counter.setupType !== "Physical" || counter.get("physicalsetup") > 1) && (!moves.has("growth") || moves.has("sunnyday")), isSetup: true };
      case "calmmind":
      case "geomancy":
      case "nastyplot":
      case "tailglow":
        if (types.has("Dark") && moves.has("darkpulse")) {
          counter.setupType = "Special";
          return { cull: false, isSetup: true };
        }
        return { cull: counter.setupType !== "Special" || counter.get("specialsetup") > 1 || counter.get("Special") + counter.get("specialpool") < 2 && (!moves.has("rest") || !moves.has("sleeptalk")), isSetup: true };
      case "quiverdance":
        return { cull: false, isSetup: true };
      case "growth":
      case "shellsmash":
      case "workup":
        return { cull: counter.setupType !== "Mixed" || counter.get("mixedsetup") > 1 || counter.damagingMoves.size + counter.get("physicalpool") + counter.get("specialpool") < 2 || move.id === "growth" && !moves.has("sunnyday"), isSetup: true };
      case "agility":
      case "autotomize":
      case "rockpolish":
      case "shiftgear":
        return { cull: counter.damagingMoves.size < 2 || restTalk, isSetup: !counter.setupType };
      case "flamecharge":
        return { cull: moves.has("dracometeor") || moves.has("overheat") || counter.damagingMoves.size < 3 && !counter.setupType };
      case "circlethrow":
      case "dragontail":
        return { cull: !!counter.setupType && (!moves.has("rest") && !moves.has("sleeptalk") || moves.has("stormthrow")) || (!!counter.get("speedsetup") || ["encore", "raindance", "roar", "trickroom", "whirlwind"].some((m) => moves.has(m))) || counter.get(move.type) > 1 && counter.get("Status") > 1 || abilities.has("Sheer Force") && !!counter.get("sheerforce") };
      case "defog":
        return { cull: !!counter.setupType || moves.has("spikes") || moves.has("stealthrock") || restTalk || !!teamDetails.defog };
      case "fakeout":
      case "tailwind":
        return { cull: !!counter.setupType || ["substitute", "switcheroo", "trick"].some((m) => moves.has(m)) };
      case "foulplay":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || counter.get("Dark") > 2 || moves.has("clearsmog") || restTalk || !!counter.get("priority") && counter.damagingMoves.size - 1 === counter.get("priority") };
      case "haze":
      case "spikes":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("trickroom") };
      case "healbell":
      case "technoblast":
        return { cull: !!counter.get("speedsetup") };
      case "healingwish":
      case "memento":
        return { cull: !!counter.setupType || !!counter.get("recovery") || moves.has("substitute") };
      case "iceshard":
        return { cull: moves.has("shellsmash") };
      case "leechseed":
      case "roar":
      case "whirlwind":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("dragontail") };
      case "nightshade":
      case "seismictoss":
        return { cull: !abilities.has("Parental Bond") && (counter.damagingMoves.size > 1 || !!counter.setupType) || moves.has("poweruppunch") };
      case "protect":
        const screens = moves.has("lightscreen") && moves.has("reflect");
        return { cull: moves.has("rest") || screens || !!counter.setupType && !moves.has("wish") || !["Guts", "Harvest", "Poison Heal", "Quick Feet", "Speed Boost"].some((abil) => abilities.has(abil)) && !["leechseed", "perishsong", "toxic", "wish"].some((m) => moves.has(m)) && !["sharpedomega", "dianciemega"].includes(species.id) };
      case "pursuit":
        return { cull: moves.has("nightslash") || !!counter.setupType || counter.get("Status") > 1 || counter.get("Dark") > 2 || moves.has("knockoff") && !types.has("Dark") };
      case "rapidspin":
        return { cull: !!counter.setupType || !!teamDetails.rapidSpin };
      case "superfang":
        return { cull: !!counter.setupType };
      case "stealthrock":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || ["rest", "substitute", "trickroom"].some((m) => moves.has(m)) || !!teamDetails.stealthRock };
      case "stickyweb":
        return { cull: !!teamDetails.stickyWeb };
      case "toxicspikes":
        return { cull: !!counter.setupType || !!teamDetails.toxicSpikes };
      case "trickroom":
        return { cull: moves.has("lightscreen") || moves.has("reflect") || !!counter.setupType || !!counter.get("speedsetup") || counter.damagingMoves.size < 2 };
      case "uturn":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || abilities.has("Speed Boost") && moves.has("protect") || abilities.has("Protean") && counter.get("Status") > 2 };
      case "voltswitch":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("raindance") || moves.has("uturn") };
      case "wish":
        return { cull: species.baseStats.hp < 110 && !abilities.has("Regenerator") && !movePool.includes("protect") && !["ironhead", "protect", "spikyshield", "uturn"].some((m) => moves.has(m)) };
      case "bugbite":
      case "bugbuzz":
      case "signalbeam":
        return { cull: moves.has("uturn") && !counter.setupType && !abilities.has("Tinted Lens") };
      case "darkpulse":
        return { cull: ["crunch", "knockoff", "hyperspacefury"].some((m) => moves.has(m)) && counter.setupType !== "Special" };
      case "suckerpunch":
        return { cull: counter.damagingMoves.size < 2 || counter.get("Dark") > 1 && !types.has("Dark") || moves.has("glare") || restTalk };
      case "dragonclaw":
        return { cull: moves.has("dragontail") || moves.has("outrage") };
      case "dracometeor":
        return { cull: moves.has("swordsdance") || counter.setupType === "Physical" && counter.get("Dragon") > 1 };
      case "dragonpulse":
      case "spacialrend":
        return { cull: moves.has("dracometeor") || moves.has("outrage") || moves.has("dragontail") && !counter.setupType };
      case "outrage":
        return { cull: moves.has("dracometeor") && counter.damagingMoves.size < 3 };
      case "thunderbolt":
        return { cull: moves.has("discharge") || moves.has("voltswitch") && moves.has("wildcharge") };
      case "dazzlinggleam":
        return { cull: moves.has("playrough") && counter.setupType !== "Special" };
      case "aurasphere":
      case "focusblast":
        return { cull: restTalk || (moves.has("closecombat") || moves.has("superpower")) && counter.setupType !== "Special" };
      case "drainpunch":
        return { cull: !moves.has("bulkup") && (moves.has("closecombat") || moves.has("highjumpkick")) || (moves.has("focusblast") || moves.has("superpower")) && counter.setupType !== "Physical" };
      case "closecombat":
      case "highjumpkick":
        return { cull: moves.has("bulkup") && moves.has("drainpunch") || counter.setupType === "Special" && (moves.has("aurasphere") || moves.has("focusblast") || movePool.includes("aurasphere")) };
      case "machpunch":
        return { cull: types.has("Fighting") && counter.get("stab") < species.types.length && !abilities.has("Technician") };
      case "stormthrow":
        return { cull: moves.has("circlethrow") && restTalk };
      case "superpower":
        const isSetup = abilities.has("Contrary");
        return { cull: counter.get("Fighting") > 1 && !!counter.setupType || restTalk && !isSetup, isSetup };
      case "vacuumwave":
        return { cull: (moves.has("closecombat") || moves.has("machpunch")) && counter.setupType !== "Special" };
      case "fierydance":
      case "firefang":
      case "flamethrower":
        return { cull: move.id === "flamethrower" && moves.has("drainpunch") && counter.setupType !== "Special" || moves.has("blazekick") || moves.has("overheat") || (moves.has("fireblast") || moves.has("lavaplume")) && counter.setupType !== "Physical" };
      case "fireblast":
        return { cull: moves.has("flareblitz") && counter.setupType !== "Special" || moves.has("lavaplume") && !counter.setupType && !counter.get("speedsetup") };
      case "lavaplume":
        return { cull: moves.has("firepunch") || moves.has("fireblast") && (!!counter.setupType || !!counter.get("speedsetup")) };
      case "airslash":
      case "hurricane":
        return { cull: [move.id === "hurricane" ? "airslash" : "hurricane", "acrobatics", "bravebird"].some((m) => moves.has(m)) };
      case "shadowball":
        return { cull: moves.has("darkpulse") || moves.has("hex") && moves.has("willowisp") };
      case "shadowclaw":
        return { cull: moves.has("shadowforce") || moves.has("shadowsneak") || moves.has("shadowball") && counter.setupType !== "Physical" };
      case "shadowsneak":
        return { cull: restTalk || types.has("Ghost") && species.types.length > 1 && counter.get("stab") < 2 };
      case "hex":
        return { cull: moves.has("shadowball") && !moves.has("willowisp") };
      case "gigadrain":
      case "powerwhip":
        return { cull: moves.has("seedbomb") || moves.has("petaldance") || moves.has("sunnyday") && moves.has("solarbeam") || counter.get("Special") < 4 && !counter.setupType && moves.has("leafstorm") };
      case "leafblade":
      case "woodhammer":
        return { cull: moves.has("hornleech") && counter.get("Physical") < 4 || moves.has("gigadrain") && counter.setupType !== "Physical" };
      case "leafstorm":
        return { cull: counter.get("Grass") > 1 && !!counter.setupType };
      case "solarbeam":
        return { cull: !abilities.has("Drought") && !moves.has("sunnyday") || moves.has("gigadrain") || moves.has("leafstorm") };
      case "bonemerang":
      case "earthpower":
      case "precipiceblades":
        return { cull: moves.has("earthquake") };
      case "earthquake":
        return { cull: moves.has("closecombat") && abilities.has("Aerilate") };
      case "freezedry":
        return { cull: moves.has("icebeam") || moves.has("icywind") || counter.get("stab") < species.types.length };
      case "bodyslam":
      case "return":
        return { cull: moves.has("doubleedge") || moves.has("glare") && moves.has("headbutt") || move.id === "return" && moves.has("bodyslam") };
      case "endeavor":
        return { cull: !isLead && !abilities.has("Defeatist") };
      case "explosion":
        return { cull: !!counter.setupType || abilities.has("Refrigerate") && (moves.has("freezedry") || movePool.includes("return")) || moves.has("wish") };
      case "extremespeed":
        return { cull: counter.setupType !== "Physical" && moves.has("vacuumwave") };
      case "hiddenpower":
        return { cull: moves.has("rest") || !counter.get("stab") && counter.damagingMoves.size < 2 || counter.setupType === "Special" && types.has("Fairy") && movePool.includes("moonblast") };
      case "hypervoice":
        return { cull: moves.has("blizzard") || moves.has("return") };
      case "judgment":
        return { cull: counter.setupType !== "Special" && counter.get("stab") > 1 };
      case "quickattack":
        return { cull: types.has("Normal") && (!counter.get("stab") || counter.get("Normal") > 2) || types.has("Rock") && !!counter.get("Status") };
      case "weatherball":
        return { cull: !moves.has("raindance") && !moves.has("sunnyday") };
      case "poisonjab":
        return { cull: moves.has("gunkshot") };
      case "acidspray":
      case "sludgewave":
        return { cull: moves.has("poisonjab") || moves.has("sludgebomb") };
      case "psychic":
        return { cull: moves.has("psyshock") };
      case "psychocut":
      case "zenheadbutt":
        return { cull: (moves.has("psychic") || moves.has("psyshock")) && counter.setupType !== "Physical" || abilities.has("Contrary") && !counter.setupType && !!counter.get("physicalpool") };
      case "psyshock":
        const psychic = movePool.indexOf("psychic");
        if (psychic >= 0)
          this.fastPop(movePool, psychic);
        return { cull: false };
      case "headsmash":
        return { cull: moves.has("stoneedge") };
      case "rockblast":
      case "rockslide":
        return { cull: moves.has("headsmash") || moves.has("stoneedge") };
      case "bulletpunch":
        return { cull: moves.has("substitute") };
      case "hydropump":
        return { cull: moves.has("razorshell") || moves.has("waterfall") || moves.has("scald") && (counter.get("Special") < 4 || species.types.length > 1 && counter.get("stab") < 3) || restTalk };
      case "originpulse":
      case "surf":
        return { cull: moves.has("hydropump") || moves.has("scald") };
      case "scald":
        return { cull: moves.has("waterfall") || moves.has("waterpulse") || species.id === "quagsire" && movePool.includes("recover") };
      case "glare":
      case "headbutt":
        return { cull: moves.has("bodyslam") || !moves.has("glare") };
      case "stunspore":
      case "thunderwave":
        const otherStatus = ["discharge", "spore", "toxic", "trickroom", "yawn"].some((m) => moves.has(m));
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || restTalk || otherStatus };
      case "toxic":
        return { cull: !!counter.setupType || ["hypnosis", "sleeppowder", "toxicspikes", "willowisp", "yawn", "raindance", "flamecharge"].some((m) => moves.has(m)) };
      case "raindance":
        return { cull: counter.get("Physical") + counter.get("Special") < 2 || !types.has("Water") && !counter.get("Water") || restTalk };
      case "sunnyday":
        const cull = counter.get("Physical") + counter.get("Special") < 2 || !abilities.has("Chlorophyll") && !abilities.has("Flower Gift") && !moves.has("solarbeam") || restTalk;
        if (cull && movePool.length > 1) {
          const solarbeam = movePool.indexOf("solarbeam");
          if (solarbeam >= 0)
            this.fastPop(movePool, solarbeam);
          if (movePool.length > 1) {
            const weatherball = movePool.indexOf("weatherball");
            if (weatherball >= 0)
              this.fastPop(movePool, weatherball);
          }
        }
        return { cull };
      case "milkdrink":
      case "moonlight":
      case "painsplit":
      case "recover":
      case "roost":
      case "synthesis":
        return { cull: ["leechseed", "rest"].some((m) => moves.has(m)) || moves.has("wish") && (moves.has("protect") || movePool.includes("protect")) };
      case "safeguard":
        return { cull: moves.has("destinybond") };
      case "substitute":
        const moveBasedCull = ["copycat", "dragondance", "shiftgear"].some((m) => movePool.includes(m));
        return { cull: ["dracometeor", "pursuit", "rest", "taunt", "uturn", "voltswitch", "whirlwind"].some((m) => moves.has(m)) || moves.has("leafstorm") && !abilities.has("Contrary") || moveBasedCull };
    }
    return { cull: false };
  }
  shouldCullAbility(ability, types, moves, abilities, counter, movePool, teamDetails, species) {
    switch (ability) {
      case "Flare Boost":
      case "Gluttony":
      case "Moody":
      case "Snow Cloak":
      case "Steadfast":
      case "Magician":
        return true;
      case "Contrary":
      case "Iron Fist":
      case "Skill Link":
      case "Strong Jaw":
        return !counter.get((0, import_dex.toID)(ability));
      case "Aerilate":
      case "Pixilate":
      case "Refrigerate":
        return !counter.get("Normal");
      case "Analytic":
      case "Download":
      case "Hyper Cutter":
        return species.nfe;
      case "Battle Armor":
      case "Sturdy":
        return !!counter.get("recoil") && !counter.get("recovery");
      case "Chlorophyll":
      case "Leaf Guard":
        return species.baseStats.spe > 100 || abilities.has("Harvest") || !moves.has("sunnyday") && !teamDetails.sun;
      case "Competitive":
        return !counter.get("Special") || moves.has("rest") && moves.has("sleeptalk");
      case "Compound Eyes":
      case "No Guard":
        return !counter.get("inaccurate");
      case "Defiant":
      case "Moxie":
        return !counter.get("Physical") || moves.has("dragontail");
      case "Flash Fire":
        return abilities.has("Drought");
      case "Harvest":
        return abilities.has("Frisk");
      case "Hustle":
        return counter.get("Physical") < 2;
      case "Hydration":
      case "Rain Dish":
      case "Swift Swim":
        return species.baseStats.spe > 100 || !moves.has("raindance") && !teamDetails.rain || !moves.has("raindance") && ["Rock Head", "Water Absorb"].some((abil) => abilities.has(abil));
      case "Ice Body":
        return !teamDetails.hail;
      case "Immunity":
      case "Snow Warning":
        return moves.has("facade") || moves.has("hypervoice");
      case "Intimidate":
        return moves.has("bodyslam") || moves.has("rest") || abilities.has("Reckless") && counter.get("recoil") > 1;
      case "Lightning Rod":
        return species.types.includes("Ground") || (!!teamDetails.rain || moves.has("raindance")) && abilities.has("Swift Swim");
      case "Limber":
        return species.types.includes("Electric");
      case "Magnet Pull":
        return !types.has("Electric") && !moves.has("earthpower");
      case "Mold Breaker":
        return moves.has("acrobatics") || abilities.has("Adaptability") || abilities.has("Sheer Force") && !!counter.get("sheerforce");
      case "Overgrow":
        return !counter.get("Grass");
      case "Poison Heal":
        return abilities.has("Technician") && !!counter.get("technician");
      case "Prankster":
        return !counter.get("Status");
      case "Pressure":
      case "Synchronize":
        return counter.get("Status") < 2 || !!counter.get("recoil") || !!species.isMega;
      case "Reckless":
      case "Rock Head":
        return !counter.get("recoil") || !!species.isMega;
      case "Regenerator":
        return abilities.has("Magic Guard");
      case "Sand Force":
      case "Sand Rush":
      case "Sand Veil":
        return !teamDetails.sand;
      case "Scrappy":
        return !species.types.includes("Normal");
      case "Serene Grace":
        return !counter.get("serenegrace") || species.name === "Blissey";
      case "Sheer Force":
        return !counter.get("sheerforce") || moves.has("doubleedge") || abilities.has("Guts") || !!species.isMega;
      case "Simple":
        return !counter.setupType && !moves.has("flamecharge");
      case "Solar Power":
        return !counter.get("Special") || !teamDetails.sun || !!species.isMega;
      case "Speed Boost":
        return moves.has("uturn");
      case "Swarm":
        return !counter.get("Bug") || !!species.isMega;
      case "Sweet Veil":
        return types.has("Grass");
      case "Technician":
        return !counter.get("technician") || moves.has("tailslap") || !!species.isMega;
      case "Tinted Lens":
        return moves.has("protect") || abilities.has("Prankster") || counter.get("damage") >= counter.damagingMoves.size || counter.get("Status") > 2 && !counter.setupType;
      case "Torrent":
        return !counter.get("Water") || !!species.isMega;
      case "Unaware":
        return !!counter.setupType || species.id === "clefable" && moves.has("stealthrock");
      case "Unburden":
        return !!species.isMega || abilities.has("Prankster") || !counter.setupType && !moves.has("acrobatics");
      case "Water Absorb":
        return moves.has("raindance") || ["Drizzle", "Unaware", "Volt Absorb"].some((a) => abilities.has(a));
      case "Weak Armor":
        return counter.setupType !== "Physical";
    }
    return false;
  }
  getHighPriorityItem(ability, types, moves, counter, teamDetails, species, isLead) {
    if (species.requiredItem)
      return species.requiredItem;
    if (species.requiredItems)
      return this.sample(species.requiredItems);
    if (species.name === "Marowak")
      return "Thick Club";
    if (species.name === "Dedenne")
      return "Petaya Berry";
    if (species.name === "Deoxys-Attack")
      return isLead && moves.has("stealthrock") ? "Focus Sash" : "Life Orb";
    if (species.name === "Farfetch\u2019d")
      return "Stick";
    if (species.name === "Genesect" && moves.has("technoblast"))
      return "Douse Drive";
    if (species.baseSpecies === "Pikachu")
      return "Light Ball";
    if (species.name === "Shedinja" || species.name === "Smeargle")
      return "Focus Sash";
    if (species.name === "Unfezant" && counter.get("Physical") >= 2)
      return "Scope Lens";
    if (species.name === "Unown")
      return "Choice Specs";
    if (species.name === "Wobbuffet")
      return "Custap Berry";
    if (ability === "Harvest")
      return "Sitrus Berry";
    if (ability === "Imposter")
      return "Choice Scarf";
    if (moves.has("switcheroo") || moves.has("trick")) {
      if (ability === "Klutz") {
        return "Assault Vest";
      } else if (species.baseStats.spe >= 60 && species.baseStats.spe <= 108) {
        return "Choice Scarf";
      } else {
        return counter.get("Physical") > counter.get("Special") ? "Choice Band" : "Choice Specs";
      }
    }
    if (species.nfe)
      return ability === "Technician" && counter.get("Physical") >= 4 ? "Choice Band" : "Eviolite";
    if (moves.has("copycat") && counter.get("Physical") >= 3)
      return "Choice Band";
    if (moves.has("bellydrum"))
      return "Sitrus Berry";
    if (moves.has("geomancy") || moves.has("solarbeam") && ability !== "Drought" && !moves.has("sunnyday") && !teamDetails.sun) {
      return "Power Herb";
    }
    if (moves.has("shellsmash")) {
      return ability === "Solid Rock" && !!counter.get("priority") ? "Weakness Policy" : "White Herb";
    }
    if ((ability === "Guts" || moves.has("facade")) && !moves.has("sleeptalk")) {
      return moves.has("drainpunch") ? "Flame Orb" : "Toxic Orb";
    }
    if (ability === "Magic Guard" && counter.damagingMoves.size > 1 || ability === "Sheer Force" && !!counter.get("sheerforce")) {
      return "Life Orb";
    }
    if (moves.has("psychoshift"))
      return "Flame Orb";
    if (ability === "Poison Heal")
      return "Toxic Orb";
    if (ability === "Unburden") {
      if (moves.has("fakeout")) {
        return "Normal Gem";
      } else if (["dracometeor", "leafstorm", "overheat"].some((m) => moves.has(m))) {
        return "White Herb";
      } else if (moves.has("substitute") || counter.setupType) {
        return "Sitrus Berry";
      } else {
        return "Red Card";
      }
    }
    if (moves.has("acrobatics"))
      return "";
    if (moves.has("raindance"))
      return ability === "Forecast" ? "Damp Rock" : "Life Orb";
    if (moves.has("sunnyday"))
      return ability === "Forecast" ? "Heat Rock" : "Life Orb";
    if (moves.has("lightscreen") && moves.has("reflect"))
      return "Light Clay";
    if (moves.has("rest") && !moves.has("sleeptalk") && ability !== "Natural Cure" && ability !== "Shed Skin") {
      return "Chesto Berry";
    }
  }
  getMediumPriorityItem(ability, moves, counter, species, isDoubles, isLead) {
    const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;
    const scarfReqs = species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && !counter.get("priority");
    if ((ability === "Speed Boost" || ability === "Stance Change") && counter.get("Physical") + counter.get("Special") > 2) {
      return "Life Orb";
    }
    if (counter.get("Physical") >= 4 && ["bodyslam", "dragontail", "fakeout", "flamecharge", "rapidspin", "suckerpunch"].every((m) => !moves.has(m))) {
      return (species.baseStats.atk >= 100 || ability === "Huge Power") && scarfReqs && this.randomChance(2, 3) ? "Choice Scarf" : "Choice Band";
    }
    if (counter.get("Special") >= 4 && !moves.has("acidspray") && !moves.has("clearsmog") && !moves.has("fierydance")) {
      return species.baseStats.spa >= 100 && scarfReqs && this.randomChance(2, 3) ? "Choice Scarf" : "Choice Specs";
    }
    if (counter.get("Physical") >= 3 && moves.has("defog") && scarfReqs && !moves.has("foulplay")) {
      return "Choice Scarf";
    }
    if (counter.get("Special") >= 3 && moves.has("uturn") && !moves.has("acidspray"))
      return "Choice Specs";
    if (ability === "Slow Start" || ["bite", "clearsmog", "curse", "protect", "sleeptalk"].some((m) => moves.has(m)) || species.name.includes("Rotom-")) {
      return "Leftovers";
    }
    if (["endeavor", "flail", "reversal"].some((m) => moves.has(m)) && ability !== "Sturdy") {
      return ability === "Defeatist" ? "Expert Belt" : "Focus Sash";
    }
    if (moves.has("outrage") && counter.setupType)
      return "Lum Berry";
    if (moves.has("substitute"))
      return counter.damagingMoves.size > 2 && !!counter.get("drain") ? "Life Orb" : "Leftovers";
    if (this.dex.getEffectiveness("Ground", species) >= 2 && ability !== "Levitate" && !moves.has("magnetrise")) {
      return "Air Balloon";
    }
    if ((ability === "Iron Barbs" || ability === "Rough Skin") && this.randomChance(1, 2))
      return "Rocky Helmet";
    if (counter.get("Physical") + counter.get("Special") >= 4 && species.baseStats.spd >= 50 && defensiveStatTotal >= 235) {
      return "Assault Vest";
    }
    if (species.name === "Palkia" && (moves.has("dracometeor") || moves.has("spacialrend")) && moves.has("hydropump")) {
      return "Lustrous Orb";
    }
    if (species.types.includes("Normal") && moves.has("fakeout") && counter.get("Normal") >= 2)
      return "Silk Scarf";
    if (counter.damagingMoves.size >= 4) {
      return counter.get("Dragon") || moves.has("suckerpunch") || counter.get("Normal") ? "Life Orb" : "Expert Belt";
    }
    if (counter.damagingMoves.size >= 3 && counter.get("speedsetup") && defensiveStatTotal >= 300)
      return "Weakness Policy";
    if (isLead && ability !== "Regenerator" && ability !== "Sturdy" && !counter.get("recoil") && !counter.get("recovery") && defensiveStatTotal < 255) {
      return "Focus Sash";
    }
  }
  getLowPriorityItem(ability, types, moves, abilities, counter, teamDetails, species, isLead) {
    const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;
    if (ability === "Gale Wings" && moves.has("bravebird"))
      return "Sharp Beak";
    if (moves.has("stickyweb") && ability === "Sturdy")
      return "Mental Herb";
    if (ability === "Serene Grace" && moves.has("airslash") && species.baseStats.spe > 100)
      return "Metronome";
    if (ability === "Sturdy" && moves.has("explosion") && !counter.get("speedsetup"))
      return "Custap Berry";
    if (ability === "Super Luck")
      return "Scope Lens";
    if (counter.damagingMoves.size >= 3 && ability !== "Sturdy" && (species.baseStats.spe >= 90 || !moves.has("voltswitch")) && ["acidspray", "dragontail", "foulplay", "rapidspin", "superfang", "uturn"].every((m) => !moves.has(m))) {
      return counter.get("speedsetup") || moves.has("trickroom") || species.baseStats.spe > 40 && defensiveStatTotal <= 275 ? "Life Orb" : "Leftovers";
    }
  }
  randomSet(species, teamDetails = {}, isLead = false) {
    species = this.dex.species.get(species);
    let forme = species.name;
    if (typeof species.battleOnly === "string") {
      forme = species.battleOnly;
    }
    if (species.cosmeticFormes) {
      forme = this.sample([species.name].concat(species.cosmeticFormes));
    }
    const data = this.randomData[species.id];
    const movePool = (data?.moves || Object.keys(this.dex.species.getLearnset(species.id))).slice();
    const rejectedPool = [];
    let ability = "";
    const evs = { hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85 };
    const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    const types = new Set(species.types);
    let abilities = new Set(Object.values(species.abilities));
    if (species.unreleasedHidden)
      abilities.delete(species.abilities.H);
    let availableHP = 0;
    for (const setMoveid of movePool) {
      if (setMoveid.startsWith("hiddenpower"))
        availableHP++;
    }
    const SetupException = ["closecombat", "diamondstorm", "extremespeed", "suckerpunch", "superpower"];
    const moves = /* @__PURE__ */ new Set();
    let counter;
    let hasHiddenPower = false;
    do {
      while (moves.size < this.maxMoveCount && movePool.length) {
        const moveid = this.sampleNoReplace(movePool);
        if (moveid.startsWith("hiddenpower")) {
          availableHP--;
          if (hasHiddenPower)
            continue;
          hasHiddenPower = true;
        }
        moves.add(moveid);
      }
      while (moves.size < this.maxMoveCount && rejectedPool.length) {
        const moveid = this.sampleNoReplace(rejectedPool);
        if (moveid.startsWith("hiddenpower")) {
          if (hasHiddenPower)
            continue;
          hasHiddenPower = true;
        }
        moves.add(moveid);
      }
      counter = this.queryMoves(moves, species.types, abilities, movePool);
      for (const moveid of moves) {
        const move = this.dex.moves.get(moveid);
        let { cull, isSetup } = this.shouldCullMove(
          move,
          types,
          moves,
          abilities,
          counter,
          movePool,
          teamDetails,
          species,
          isLead
        );
        if (move.category === "Physical" && counter.setupType === "Special" || move.category === "Special" && counter.setupType === "Physical") {
          const stabs = counter.get(species.types[0]) + counter.get(species.types[1]);
          if (!SetupException.includes(moveid) && (!types.has(move.type) || stabs > 1 || counter.get(move.category) < 2))
            cull = true;
        }
        if (counter.setupType && !isSetup && counter.setupType !== "Mixed" && move.category !== counter.setupType && counter.get(counter.setupType) < 2 && (move.category !== "Status" || !move.flags.heal) && moveid !== "sleeptalk" && !types.has("Dark") && !moves.has("darkpulse") && (move.category !== "Status" || counter.get(counter.setupType) + counter.get("Status") > 3 && counter.get("physicalsetup") + counter.get("specialsetup") < 2)) {
          cull = true;
        }
        if (counter.setupType === "Special" && moveid === "hiddenpower" && species.types.length > 1 && counter.get("Special") <= 2 && !types.has(move.type) && !counter.get("Physical") && counter.get("specialpool")) {
          cull = true;
        }
        const runEnforcementChecker = (checkerName) => {
          if (!this.moveEnforcementCheckers[checkerName])
            return false;
          return this.moveEnforcementCheckers[checkerName](
            movePool,
            moves,
            abilities,
            types,
            counter,
            species,
            teamDetails
          );
        };
        if (!cull && !isSetup && !move.weather && !move.stallingMove && !move.damage && (move.category !== "Status" || !move.flags.heal) && !["judgment", "sleeptalk", "toxic", "lightscreen", "reflect"].includes(moveid) && (counter.get("physicalsetup") + counter.get("specialsetup") < 2 && (!counter.setupType || counter.setupType === "Mixed" || move.category !== counter.setupType && move.category !== "Status" || counter.get(counter.setupType) + counter.get("Status") > 3)) && (move.category === "Status" || !types.has(move.type) || move.basePower && move.basePower < 40 && !move.multihit)) {
          if (!counter.get("stab") && !moves.has("nightshade") && !moves.has("seismictoss") && (species.types.length > 1 || species.types[0] !== "Normal" && species.types[0] !== "Psychic" || !moves.has("icebeam") || species.baseStats.spa >= species.baseStats.spd) || !counter.get("recovery") && !counter.setupType && ["healingwish", "switcheroo", "trick", "trickroom"].every((m) => !moves.has(m)) && ["recover", "roost", "slackoff", "softboiled"].some((m) => movePool.includes(m)) && counter.get("Status") || movePool.includes("milkdrink") || movePool.includes("moonlight") && types.size < 2 || movePool.includes("stickyweb") && !counter.setupType && !teamDetails.stickyWeb || species.requiredMove && movePool.includes((0, import_dex.toID)(species.requiredMove)) || moves.has("suckerpunch") && counter.get("stab") < species.types.length || movePool.includes("quiverdance") && ["defog", "uturn", "stickyweb"].every((m) => !moves.has(m)) && counter.get("Special") < 4) {
            cull = true;
          } else {
            for (const type of types) {
              if (runEnforcementChecker(type)) {
                cull = true;
              }
            }
            for (const abil of abilities) {
              if (runEnforcementChecker(abil)) {
                cull = true;
              }
            }
            for (const m of moves) {
              if (runEnforcementChecker(m)) {
                cull = true;
              }
            }
          }
        }
        if (moveid === "rest" && cull) {
          const sleeptalk = movePool.indexOf("sleeptalk");
          if (sleeptalk >= 0) {
            if (movePool.length < 2) {
              cull = false;
            } else {
              this.fastPop(movePool, sleeptalk);
            }
          }
        }
        if (cull && (movePool.length - availableHP || availableHP && (moveid.startsWith("hiddenpower") || !hasHiddenPower))) {
          if (move.category !== "Status" && !move.damage && !move.flags.charge && (!moveid.startsWith("hiddenpower") || !availableHP))
            rejectedPool.push(moveid);
          moves.delete(moveid);
          if (moveid.startsWith("hiddenpower"))
            hasHiddenPower = false;
          break;
        }
        if (cull && rejectedPool.length) {
          moves.delete(moveid);
          if (moveid.startsWith("hiddenpower"))
            hasHiddenPower = false;
          break;
        }
      }
    } while (moves.size < this.maxMoveCount && (movePool.length || rejectedPool.length));
    if (hasHiddenPower) {
      let hpType;
      for (const move of moves) {
        if (move.startsWith("hiddenpower")) {
          hpType = move.substr(11);
          break;
        }
      }
      if (!hpType)
        throw new Error(`hasHiddenPower is true, but no Hidden Power move was found.`);
      const HPivs = this.dex.types.get(hpType).HPivs;
      let iv;
      for (iv in HPivs) {
        ivs[iv] = HPivs[iv];
      }
    }
    if (moves.has("autotomize") && moves.has("heavyslam")) {
      moves.delete("autotomize");
      moves.add("rockpolish");
    }
    if (moves.has("raindance") && moves.has("thunderbolt")) {
      moves.delete("thunderbolt");
      moves.add("thunder");
    }
    if (species.battleOnly && !species.requiredAbility) {
      abilities = new Set(Object.values(this.dex.species.get(species.battleOnly).abilities));
    }
    const abilityData = [...abilities].map((a) => this.dex.abilities.get(a));
    import_lib.Utils.sortBy(abilityData, (abil) => -abil.rating);
    if (abilityData.length > 1) {
      if (abilityData[2] && abilityData[1].rating <= abilityData[2].rating && this.randomChance(1, 2)) {
        [abilityData[1], abilityData[2]] = [abilityData[2], abilityData[1]];
      }
      if (abilityData[0].rating <= abilityData[1].rating && this.randomChance(1, 2)) {
        [abilityData[0], abilityData[1]] = [abilityData[1], abilityData[0]];
      } else if (abilityData[0].rating - 0.6 <= abilityData[1].rating && this.randomChance(2, 3)) {
        [abilityData[0], abilityData[1]] = [abilityData[1], abilityData[0]];
      }
      ability = abilityData[0].name;
      while (this.shouldCullAbility(ability, types, moves, abilities, counter, movePool, teamDetails, species)) {
        if (ability === abilityData[0].name && abilityData[1].rating >= 1) {
          ability = abilityData[1].name;
        } else if (ability === abilityData[1].name && abilityData[2] && abilityData[2].rating >= 1) {
          ability = abilityData[2].name;
        } else {
          ability = abilityData[0].name;
          break;
        }
      }
      if (abilities.has("Guts") && ability !== "Quick Feet" && (moves.has("facade") || moves.has("protect") || moves.has("rest") && moves.has("sleeptalk"))) {
        ability = "Guts";
      } else if (abilities.has("Moxie") && counter.get("Physical") > 3) {
        ability = "Moxie";
      }
      if (species.name === "Ambipom" && !counter.get("technician")) {
        ability = "Pickup";
      } else if (species.name === "Lopunny" && moves.has("switcheroo") && this.randomChance(2, 3)) {
        ability = "Klutz";
      }
      if (species.name === "Altaria")
        ability = "Natural Cure";
    } else {
      ability = abilityData[0].name;
    }
    let item = this.getHighPriorityItem(ability, types, moves, counter, teamDetails, species, isLead);
    if (item === void 0)
      item = this.getMediumPriorityItem(ability, moves, counter, species, false, isLead);
    if (item === void 0) {
      item = this.getLowPriorityItem(ability, types, moves, abilities, counter, teamDetails, species, isLead);
    }
    if (item === void 0)
      item = "Leftovers";
    if (item === "Leftovers" && types.has("Poison")) {
      item = "Black Sludge";
    }
    const level = this.adjustLevel || data.level || (species.nfe ? 90 : 80);
    const srWeakness = this.dex.getEffectiveness("Rock", species);
    while (evs.hp > 1) {
      const hp = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
      if (moves.has("substitute") && moves.has("reversal")) {
        if (hp % 4 > 0)
          break;
      } else if (moves.has("substitute") && (item === "Petaya Berry" || item === "Sitrus Berry")) {
        if (hp % 4 === 0)
          break;
      } else if (moves.has("bellydrum") && item === "Sitrus Berry") {
        if (hp % 2 === 0)
          break;
      } else {
        if (srWeakness <= 0 || hp % (4 / srWeakness) > 0)
          break;
      }
      evs.hp -= 4;
    }
    if (!counter.get("Physical") && !moves.has("copycat") && !moves.has("transform")) {
      evs.atk = 0;
      ivs.atk = hasHiddenPower ? ivs.atk - 30 : 0;
    }
    if (["gyroball", "metalburst", "trickroom"].some((m) => moves.has(m))) {
      evs.spe = 0;
      ivs.spe = hasHiddenPower ? ivs.spe - 30 : 0;
    }
    return {
      name: species.baseSpecies,
      species: forme,
      gender: species.gender,
      moves: Array.from(moves),
      ability,
      evs,
      ivs,
      item,
      level,
      shiny: this.randomChance(1, 1024)
    };
  }
  randomFactorySet(species, teamData, tier) {
    const id = (0, import_dex.toID)(species.name);
    const setList = this.randomFactorySets[tier][id].sets;
    const itemsMax = { choicespecs: 1, choiceband: 1, choicescarf: 1 };
    const movesMax = {
      rapidspin: 1,
      batonpass: 1,
      stealthrock: 1,
      defog: 1,
      spikes: 1,
      toxicspikes: 1
    };
    const requiredMoves = { stealthrock: "hazardSet", rapidspin: "hazardClear", defog: "hazardClear" };
    const weatherAbilitiesRequire = {
      hydration: "raindance",
      swiftswim: "raindance",
      leafguard: "sunnyday",
      solarpower: "sunnyday",
      chlorophyll: "sunnyday",
      sandforce: "sandstorm",
      sandrush: "sandstorm",
      sandveil: "sandstorm",
      snowcloak: "hail"
    };
    const weatherAbilities = ["drizzle", "drought", "snowwarning", "sandstream"];
    let effectivePool = [];
    const priorityPool = [];
    for (const curSet of setList) {
      if (this.forceMonotype && !species.types.includes(this.forceMonotype))
        continue;
      const itemData = this.dex.items.get(curSet.item);
      if (teamData.megaCount && teamData.megaCount > 0 && itemData.megaStone)
        continue;
      if (itemsMax[itemData.id] && teamData.has[itemData.id] >= itemsMax[itemData.id])
        continue;
      const abilityState = this.dex.abilities.get(curSet.ability);
      if (weatherAbilitiesRequire[abilityState.id] && teamData.weather !== weatherAbilitiesRequire[abilityState.id])
        continue;
      if (teamData.weather && weatherAbilities.includes(abilityState.id))
        continue;
      let reject = false;
      let hasRequiredMove = false;
      const curSetVariants = [];
      for (const move of curSet.moves) {
        const variantIndex = this.random(move.length);
        const moveId = (0, import_dex.toID)(move[variantIndex]);
        if (movesMax[moveId] && teamData.has[moveId] >= movesMax[moveId]) {
          reject = true;
          break;
        }
        if (requiredMoves[moveId] && !teamData.has[requiredMoves[moveId]]) {
          hasRequiredMove = true;
        }
        curSetVariants.push(variantIndex);
      }
      if (reject)
        continue;
      effectivePool.push({ set: curSet, moveVariants: curSetVariants });
      if (hasRequiredMove)
        priorityPool.push({ set: curSet, moveVariants: curSetVariants });
    }
    if (priorityPool.length)
      effectivePool = priorityPool;
    if (!effectivePool.length) {
      if (!teamData.forceResult)
        return null;
      for (const curSet of setList) {
        effectivePool.push({ set: curSet });
      }
    }
    const setData = this.sample(effectivePool);
    const moves = [];
    for (const [i, moveSlot] of setData.set.moves.entries()) {
      moves.push(setData.moveVariants ? moveSlot[setData.moveVariants[i]] : this.sample(moveSlot));
    }
    return {
      name: setData.set.name || species.baseSpecies,
      species: setData.set.species,
      gender: setData.set.gender || species.gender || (this.randomChance(1, 2) ? "M" : "F"),
      item: setData.set.item || "",
      ability: setData.set.ability || species.abilities["0"],
      shiny: typeof setData.set.shiny === "undefined" ? this.randomChance(1, 1024) : setData.set.shiny,
      level: this.adjustLevel || 100,
      happiness: typeof setData.set.happiness === "undefined" ? 255 : setData.set.happiness,
      evs: setData.set.evs || { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 },
      ivs: setData.set.ivs || { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      nature: setData.set.nature || "Serious",
      moves
    };
  }
  randomFactoryTeam(side, depth = 0) {
    this.enforceNoDirectCustomBanlistChanges();
    const forceResult = depth >= 12;
    if (!this.factoryTier)
      this.factoryTier = this.sample(["Uber", "OU", "UU", "RU", "NU", "PU"]);
    const chosenTier = this.factoryTier;
    const pokemon = [];
    const pokemonPool = Object.keys(this.randomFactorySets[chosenTier]);
    const teamData = {
      typeCount: {},
      typeComboCount: {},
      baseFormes: {},
      megaCount: 0,
      has: {},
      forceResult,
      weaknesses: {},
      resistances: {}
    };
    const requiredMoveFamilies = ["hazardSet", "hazardClear"];
    const requiredMoves = { stealthrock: "hazardSet", rapidspin: "hazardClear", defog: "hazardClear" };
    const weatherAbilitiesSet = {
      drizzle: "raindance",
      drought: "sunnyday",
      snowwarning: "hail",
      sandstream: "sandstorm"
    };
    const resistanceAbilities = {
      dryskin: ["Water"],
      waterabsorb: ["Water"],
      stormdrain: ["Water"],
      flashfire: ["Fire"],
      heatproof: ["Fire"],
      lightningrod: ["Electric"],
      motordrive: ["Electric"],
      voltabsorb: ["Electric"],
      sapsipper: ["Grass"],
      thickfat: ["Ice", "Fire"],
      levitate: ["Ground"]
    };
    while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
      const species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
      if (!species.exists)
        continue;
      const speciesFlags = this.randomFactorySets[chosenTier][species.id].flags;
      if (teamData.baseFormes[species.baseSpecies])
        continue;
      if (!teamData.megaCount)
        teamData.megaCount = 0;
      if (teamData.megaCount >= 1 && speciesFlags.megaOnly)
        continue;
      const limitFactor = Math.round(this.maxTeamSize / 6) || 1;
      const types = species.types;
      let skip = false;
      for (const type of types) {
        if (teamData.typeCount[type] >= 2 * limitFactor && this.randomChance(4, 5)) {
          skip = true;
          break;
        }
      }
      if (skip)
        continue;
      const set = this.randomFactorySet(species, teamData, chosenTier);
      if (!set)
        continue;
      let typeCombo = types.slice().sort().join();
      if (set.ability === "Drought" || set.ability === "Drizzle") {
        typeCombo = set.ability;
      }
      if (teamData.typeComboCount[typeCombo] >= 1 * limitFactor)
        continue;
      pokemon.push(set);
      for (const type of types) {
        if (type in teamData.typeCount) {
          teamData.typeCount[type]++;
        } else {
          teamData.typeCount[type] = 1;
        }
      }
      teamData.typeComboCount[typeCombo] = teamData.typeComboCount[typeCombo] + 1 || 1;
      teamData.baseFormes[species.baseSpecies] = 1;
      const itemData = this.dex.items.get(set.item);
      if (itemData.megaStone)
        teamData.megaCount++;
      if (itemData.id in teamData.has) {
        teamData.has[itemData.id]++;
      } else {
        teamData.has[itemData.id] = 1;
      }
      const abilityState = this.dex.abilities.get(set.ability);
      if (abilityState.id in weatherAbilitiesSet) {
        teamData.weather = weatherAbilitiesSet[abilityState.id];
      }
      for (const move of set.moves) {
        const moveId = (0, import_dex.toID)(move);
        if (moveId in teamData.has) {
          teamData.has[moveId]++;
        } else {
          teamData.has[moveId] = 1;
        }
        if (moveId in requiredMoves) {
          teamData.has[requiredMoves[moveId]] = 1;
        }
      }
      for (const typeName of this.dex.types.names()) {
        if (teamData.resistances[typeName] >= 1)
          continue;
        if (resistanceAbilities[abilityState.id]?.includes(typeName) || !this.dex.getImmunity(typeName, types)) {
          teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
          if (teamData.resistances[typeName] >= 1)
            teamData.weaknesses[typeName] = 0;
          continue;
        }
        const typeMod = this.dex.getEffectiveness(typeName, types);
        if (typeMod < 0) {
          teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
          if (teamData.resistances[typeName] >= 1)
            teamData.weaknesses[typeName] = 0;
        } else if (typeMod > 0) {
          teamData.weaknesses[typeName] = (teamData.weaknesses[typeName] || 0) + 1;
        }
      }
    }
    if (pokemon.length < this.maxTeamSize)
      return this.randomFactoryTeam(side, ++depth);
    if (!teamData.forceResult) {
      for (const requiredFamily of requiredMoveFamilies) {
        if (!teamData.has[requiredFamily])
          return this.randomFactoryTeam(side, ++depth);
      }
      for (const type in teamData.weaknesses) {
        if (teamData.weaknesses[type] >= 3)
          return this.randomFactoryTeam(side, ++depth);
      }
    }
    return pokemon;
  }
}
var random_teams_default = RandomGen6Teams;
//# sourceMappingURL=random-teams.js.map

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
var abilities_exports = {};
__export(abilities_exports, {
  Abilities: () => Abilities
});
module.exports = __toCommonJS(abilities_exports);
const Abilities = {
  noability: {
    isNonstandard: "Past",
    name: "No Ability",
    rating: 0.1,
    num: 0
  },
  adaptability: {
    onModifyMove(move) {
      move.stab = 2;
    },
    name: "Adaptability",
    rating: 4,
    num: 91
  },
  aerilate: {
    onModifyTypePriority: -1,
    onModifyType(move, pokemon) {
      const noModifyType = [
        "judgment",
        "multiattack",
        "naturalgift",
        "revelationdance",
        "technoblast",
        "terrainpulse",
        "weatherball"
      ];
      if (move.type === "Normal" && !noModifyType.includes(move.id) && !(move.isZ && move.category !== "Status") && !(move.name === "Tera Blast" && pokemon.terastallized)) {
        move.type = "Flying";
        move.typeChangerBoosted = this.effect;
      }
    },
    onBasePowerPriority: 23,
    onBasePower(basePower, pokemon, target, move) {
      if (move.typeChangerBoosted === this.effect)
        return this.chainModify([4915, 4096]);
    },
    name: "Aerilate",
    rating: 4,
    num: 184
  },
  aftermath: {
    name: "Aftermath",
    onDamagingHitOrder: 1,
    onDamagingHit(damage, target, source, move) {
      if (!target.hp && this.checkMoveMakesContact(move, source, target, true)) {
        this.damage(source.baseMaxhp / 4, source, target);
      }
    },
    rating: 2,
    num: 106
  },
  airlock: {
    onSwitchIn(pokemon) {
      this.effectState.switchingIn = true;
    },
    onStart(pokemon) {
      if (this.effectState.switchingIn) {
        this.add("-ability", pokemon, "Air Lock");
        this.effectState.switchingIn = false;
      }
      this.eachEvent("WeatherChange", this.effect);
    },
    onEnd(pokemon) {
      this.eachEvent("WeatherChange", this.effect);
    },
    suppressWeather: true,
    name: "Air Lock",
    rating: 1.5,
    num: 76
  },
  analytic: {
    onBasePowerPriority: 21,
    onBasePower(basePower, pokemon) {
      let boosted = true;
      for (const target of this.getAllActive()) {
        if (target === pokemon)
          continue;
        if (this.queue.willMove(target)) {
          boosted = false;
          break;
        }
      }
      if (boosted) {
        this.debug("Analytic boost");
        return this.chainModify([5325, 4096]);
      }
    },
    name: "Analytic",
    rating: 2.5,
    num: 148
  },
  angerpoint: {
    onHit(target, source, move) {
      if (!target.hp)
        return;
      if (move?.effectType === "Move" && target.getMoveHitData(move).crit) {
        this.boost({ atk: 12 }, target, target);
      }
    },
    name: "Anger Point",
    rating: 1,
    num: 83
  },
  angershell: {
    onDamage(damage, target, source, effect) {
      if (effect.effectType === "Move" && !effect.multihit && (!effect.negateSecondary && !(effect.hasSheerForce && source.hasAbility("sheerforce")))) {
        this.effectState.checkedAngerShell = false;
      } else {
        this.effectState.checkedAngerShell = true;
      }
    },
    onTryEatItem(item) {
      const healingItems = [
        "aguavberry",
        "enigmaberry",
        "figyberry",
        "iapapaberry",
        "magoberry",
        "sitrusberry",
        "wikiberry",
        "oranberry",
        "berryjuice"
      ];
      if (healingItems.includes(item.id)) {
        return this.effectState.checkedAngerShell;
      }
      return true;
    },
    onAfterMoveSecondary(target, source, move) {
      this.effectState.checkedAngerShell = true;
      if (!source || source === target || !target.hp || !move.totalDamage)
        return;
      const lastAttackedBy = target.getLastAttackedBy();
      if (!lastAttackedBy)
        return;
      const damage = move.multihit ? move.totalDamage : lastAttackedBy.damage;
      if (target.hp <= target.maxhp / 2 && target.hp + damage > target.maxhp / 2) {
        this.boost({ atk: 1, spa: 1, spe: 1, def: -1, spd: -1 }, target, target);
      }
    },
    name: "Anger Shell",
    rating: 3,
    num: 271
  },
  anticipation: {
    onStart(pokemon) {
      for (const target of pokemon.foes()) {
        for (const moveSlot of target.moveSlots) {
          const move = this.dex.moves.get(moveSlot.move);
          if (move.category === "Status")
            continue;
          const moveType = move.id === "hiddenpower" ? target.hpType : move.type;
          if (this.dex.getImmunity(moveType, pokemon) && this.dex.getEffectiveness(moveType, pokemon) > 0 || move.ohko) {
            this.add("-ability", pokemon, "Anticipation");
            return;
          }
        }
      }
    },
    name: "Anticipation",
    rating: 0.5,
    num: 107
  },
  arenatrap: {
    onFoeTrapPokemon(pokemon) {
      if (!pokemon.isAdjacent(this.effectState.target))
        return;
      if (pokemon.isGrounded()) {
        pokemon.tryTrap(true);
      }
    },
    onFoeMaybeTrapPokemon(pokemon, source) {
      if (!source)
        source = this.effectState.target;
      if (!source || !pokemon.isAdjacent(source))
        return;
      if (pokemon.isGrounded(!pokemon.knownType)) {
        pokemon.maybeTrapped = true;
      }
    },
    name: "Arena Trap",
    rating: 5,
    num: 71
  },
  armortail: {
    onFoeTryMove(target, source, move) {
      const targetAllExceptions = ["perishsong", "flowershield", "rototiller"];
      if (move.target === "foeSide" || move.target === "all" && !targetAllExceptions.includes(move.id)) {
        return;
      }
      const armorTailHolder = this.effectState.target;
      if ((source.isAlly(armorTailHolder) || move.target === "all") && move.priority > 0.1) {
        this.attrLastMove("[still]");
        this.add("cant", armorTailHolder, "ability: Armor Tail", move, "[of] " + target);
        return false;
      }
    },
    isBreakable: true,
    name: "Armor Tail",
    rating: 2.5,
    num: 296
  },
  aromaveil: {
    onAllyTryAddVolatile(status, target, source, effect) {
      if (["attract", "disable", "encore", "healblock", "taunt", "torment"].includes(status.id)) {
        if (effect.effectType === "Move") {
          const effectHolder = this.effectState.target;
          this.add("-block", target, "ability: Aroma Veil", "[of] " + effectHolder);
        }
        return null;
      }
    },
    isBreakable: true,
    name: "Aroma Veil",
    rating: 2,
    num: 165
  },
  asoneglastrier: {
    onPreStart(pokemon) {
      this.add("-ability", pokemon, "As One");
      this.add("-ability", pokemon, "Unnerve");
      this.effectState.unnerved = true;
    },
    onEnd() {
      this.effectState.unnerved = false;
    },
    onFoeTryEatItem() {
      return !this.effectState.unnerved;
    },
    onSourceAfterFaint(length, target, source, effect) {
      if (effect && effect.effectType === "Move") {
        this.boost({ atk: length }, source, source, this.dex.abilities.get("chillingneigh"));
      }
    },
    isPermanent: true,
    name: "As One (Glastrier)",
    rating: 3.5,
    num: 266
  },
  asonespectrier: {
    onPreStart(pokemon) {
      this.add("-ability", pokemon, "As One");
      this.add("-ability", pokemon, "Unnerve");
      this.effectState.unnerved = true;
    },
    onEnd() {
      this.effectState.unnerved = false;
    },
    onFoeTryEatItem() {
      return !this.effectState.unnerved;
    },
    onSourceAfterFaint(length, target, source, effect) {
      if (effect && effect.effectType === "Move") {
        this.boost({ spa: length }, source, source, this.dex.abilities.get("grimneigh"));
      }
    },
    isPermanent: true,
    name: "As One (Spectrier)",
    rating: 3.5,
    num: 267
  },
  aurabreak: {
    onStart(pokemon) {
      if (this.suppressingAbility(pokemon))
        return;
      this.add("-ability", pokemon, "Aura Break");
    },
    onAnyTryPrimaryHit(target, source, move) {
      if (target === source || move.category === "Status")
        return;
      move.hasAuraBreak = true;
    },
    isBreakable: true,
    name: "Aura Break",
    rating: 1,
    num: 188
  },
  baddreams: {
    onResidualOrder: 28,
    onResidualSubOrder: 2,
    onResidual(pokemon) {
      if (!pokemon.hp)
        return;
      for (const target of pokemon.foes()) {
        if (target.status === "slp" || target.hasAbility("comatose")) {
          this.damage(target.baseMaxhp / 8, target, pokemon);
        }
      }
    },
    name: "Bad Dreams",
    rating: 1.5,
    num: 123
  },
  ballfetch: {
    name: "Ball Fetch",
    rating: 0,
    num: 237
  },
  battery: {
    onAllyBasePowerPriority: 22,
    onAllyBasePower(basePower, attacker, defender, move) {
      if (attacker !== this.effectState.target && move.category === "Special") {
        this.debug("Battery boost");
        return this.chainModify([5325, 4096]);
      }
    },
    name: "Battery",
    rating: 0,
    num: 217
  },
  battlearmor: {
    onCriticalHit: false,
    isBreakable: true,
    name: "Battle Armor",
    rating: 1,
    num: 4
  },
  battlebond: {
    onSourceAfterFaint(length, target, source, effect) {
      if (effect?.effectType !== "Move")
        return;
      if (source.abilityState.battleBondTriggered)
        return;
      if (source.species.id === "greninja" && source.hp && !source.transformed && source.side.foePokemonLeft()) {
        this.add("-activate", source, "ability: Battle Bond");
        this.boost({ atk: 1, spa: 1, spe: 1 }, source, source, this.effect);
        source.abilityState.battleBondTriggered = true;
      }
    },
    isNonstandard: "Unobtainable",
    isPermanent: true,
    name: "Battle Bond",
    rating: 3.5,
    num: 210
  },
  beadsofruin: {
    onStart(pokemon) {
      if (this.suppressingAbility(pokemon))
        return;
      this.add("-ability", pokemon, "Beads of Ruin");
    },
    onAnyModifySpD(spd, target, source, move) {
      const abilityHolder = this.effectState.target;
      if (target.hasAbility("Beads of Ruin"))
        return;
      if (!move.ruinedSpD?.hasAbility("Beads of Ruin"))
        move.ruinedSpD = abilityHolder;
      if (move.ruinedSpD !== abilityHolder)
        return;
      this.debug("Beads of Ruin SpD drop");
      return this.chainModify(0.75);
    },
    name: "Beads of Ruin",
    rating: 4.5,
    num: 284
  },
  beastboost: {
    onSourceAfterFaint(length, target, source, effect) {
      if (effect && effect.effectType === "Move") {
        const bestStat = source.getBestStat(true, true);
        this.boost({ [bestStat]: length }, source);
      }
    },
    name: "Beast Boost",
    rating: 3.5,
    num: 224
  },
  berserk: {
    onDamage(damage, target, source, effect) {
      if (effect.effectType === "Move" && !effect.multihit && (!effect.negateSecondary && !(effect.hasSheerForce && source.hasAbility("sheerforce")))) {
        this.effectState.checkedBerserk = false;
      } else {
        this.effectState.checkedBerserk = true;
      }
    },
    onTryEatItem(item) {
      const healingItems = [
        "aguavberry",
        "enigmaberry",
        "figyberry",
        "iapapaberry",
        "magoberry",
        "sitrusberry",
        "wikiberry",
        "oranberry",
        "berryjuice"
      ];
      if (healingItems.includes(item.id)) {
        return this.effectState.checkedBerserk;
      }
      return true;
    },
    onAfterMoveSecondary(target, source, move) {
      this.effectState.checkedBerserk = true;
      if (!source || source === target || !target.hp || !move.totalDamage)
        return;
      const lastAttackedBy = target.getLastAttackedBy();
      if (!lastAttackedBy)
        return;
      const damage = move.multihit ? move.totalDamage : lastAttackedBy.damage;
      if (target.hp <= target.maxhp / 2 && target.hp + damage > target.maxhp / 2) {
        this.boost({ spa: 1 }, target, target);
      }
    },
    name: "Berserk",
    rating: 2,
    num: 201
  },
  bigpecks: {
    onTryBoost(boost, target, source, effect) {
      if (source && target === source)
        return;
      if (boost.def && boost.def < 0) {
        delete boost.def;
        if (!effect.secondaries && effect.id !== "octolock") {
          this.add("-fail", target, "unboost", "Defense", "[from] ability: Big Pecks", "[of] " + target);
        }
      }
    },
    isBreakable: true,
    name: "Big Pecks",
    rating: 0.5,
    num: 145
  },
  blaze: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Fire" && attacker.hp <= attacker.maxhp / 3) {
        this.debug("Blaze boost");
        return this.chainModify(1.5);
      }
    },
    onModifySpAPriority: 5,
    onModifySpA(atk, attacker, defender, move) {
      if (move.type === "Fire" && attacker.hp <= attacker.maxhp / 3) {
        this.debug("Blaze boost");
        return this.chainModify(1.5);
      }
    },
    name: "Blaze",
    rating: 2,
    num: 66
  },
  bulletproof: {
    onTryHit(pokemon, target, move) {
      if (move.flags["bullet"]) {
        this.add("-immune", pokemon, "[from] ability: Bulletproof");
        return null;
      }
    },
    isBreakable: true,
    name: "Bulletproof",
    rating: 3,
    num: 171
  },
  cheekpouch: {
    onEatItem(item, pokemon) {
      this.heal(pokemon.baseMaxhp / 3);
    },
    name: "Cheek Pouch",
    rating: 2,
    num: 167
  },
  chillingneigh: {
    onSourceAfterFaint(length, target, source, effect) {
      if (effect && effect.effectType === "Move") {
        this.boost({ atk: length }, source);
      }
    },
    name: "Chilling Neigh",
    rating: 3,
    num: 264
  },
  chlorophyll: {
    onModifySpe(spe, pokemon) {
      if (["sunnyday", "desolateland"].includes(pokemon.effectiveWeather())) {
        return this.chainModify(2);
      }
    },
    name: "Chlorophyll",
    rating: 3,
    num: 34
  },
  clearbody: {
    onTryBoost(boost, target, source, effect) {
      if (source && target === source)
        return;
      let showMsg = false;
      let i;
      for (i in boost) {
        if (boost[i] < 0) {
          delete boost[i];
          showMsg = true;
        }
      }
      if (showMsg && !effect.secondaries && effect.id !== "octolock") {
        this.add("-fail", target, "unboost", "[from] ability: Clear Body", "[of] " + target);
      }
    },
    isBreakable: true,
    name: "Clear Body",
    rating: 2,
    num: 29
  },
  cloudnine: {
    onSwitchIn(pokemon) {
      this.effectState.switchingIn = true;
    },
    onStart(pokemon) {
      if (this.effectState.switchingIn) {
        this.add("-ability", pokemon, "Cloud Nine");
        this.effectState.switchingIn = false;
      }
      this.eachEvent("WeatherChange", this.effect);
    },
    onEnd(pokemon) {
      this.eachEvent("WeatherChange", this.effect);
    },
    suppressWeather: true,
    name: "Cloud Nine",
    rating: 1.5,
    num: 13
  },
  colorchange: {
    onAfterMoveSecondary(target, source, move) {
      if (!target.hp)
        return;
      const type = move.type;
      if (target.isActive && move.effectType === "Move" && move.category !== "Status" && type !== "???" && !target.hasType(type)) {
        if (!target.setType(type))
          return false;
        this.add("-start", target, "typechange", type, "[from] ability: Color Change");
        if (target.side.active.length === 2 && target.position === 1) {
          const action = this.queue.willMove(target);
          if (action && action.move.id === "curse") {
            action.targetLoc = -1;
          }
        }
      }
    },
    name: "Color Change",
    rating: 0,
    num: 16
  },
  comatose: {
    onStart(pokemon) {
      this.add("-ability", pokemon, "Comatose");
    },
    onSetStatus(status, target, source, effect) {
      if (effect?.status) {
        this.add("-immune", target, "[from] ability: Comatose");
      }
      return false;
    },
    // Permanent sleep "status" implemented in the relevant sleep-checking effects
    isPermanent: true,
    name: "Comatose",
    rating: 4,
    num: 213
  },
  commander: {
    onUpdate(pokemon) {
      const ally = pokemon.allies()[0];
      if (!ally || pokemon.baseSpecies.baseSpecies !== "Tatsugiri" || ally.baseSpecies.baseSpecies !== "Dondozo") {
        if (pokemon.getVolatile("commanding"))
          pokemon.removeVolatile("commanding");
        return;
      }
      if (!pokemon.getVolatile("commanding")) {
        if (ally.getVolatile("commanded"))
          return;
        this.queue.cancelAction(pokemon);
        this.add("-activate", pokemon, "ability: Commander", "[of] " + ally);
        pokemon.addVolatile("commanding");
        ally.addVolatile("commanded", pokemon);
      } else {
        if (!ally.fainted)
          return;
        pokemon.removeVolatile("commanding");
      }
    },
    isPermanent: true,
    name: "Commander",
    rating: 0,
    num: 279
  },
  competitive: {
    onAfterEachBoost(boost, target, source, effect) {
      if (!source || target.isAlly(source)) {
        if (effect.id === "stickyweb") {
          this.hint("Court Change Sticky Web counts as lowering your own Speed, and Competitive only affects stats lowered by foes.", true, source.side);
        }
        return;
      }
      let statsLowered = false;
      let i;
      for (i in boost) {
        if (boost[i] < 0) {
          statsLowered = true;
        }
      }
      if (statsLowered) {
        this.boost({ spa: 2 }, target, target, null, false, true);
      }
    },
    name: "Competitive",
    rating: 2.5,
    num: 172
  },
  compoundeyes: {
    onSourceModifyAccuracyPriority: -1,
    onSourceModifyAccuracy(accuracy) {
      if (typeof accuracy !== "number")
        return;
      this.debug("compoundeyes - enhancing accuracy");
      return this.chainModify([5325, 4096]);
    },
    name: "Compound Eyes",
    rating: 3,
    num: 14
  },
  contrary: {
    onChangeBoost(boost, target, source, effect) {
      if (effect && effect.id === "zpower")
        return;
      let i;
      for (i in boost) {
        boost[i] *= -1;
      }
    },
    isBreakable: true,
    name: "Contrary",
    rating: 4.5,
    num: 126
  },
  corrosion: {
    // Implemented in sim/pokemon.js:Pokemon#setStatus
    name: "Corrosion",
    rating: 2.5,
    num: 212
  },
  costar: {
    onStart(pokemon) {
      const ally = pokemon.allies()[0];
      if (!ally)
        return;
      let i;
      for (i in ally.boosts) {
        pokemon.boosts[i] = ally.boosts[i];
      }
      const volatilesToCopy = ["focusenergy", "gmaxchistrike", "laserfocus"];
      for (const volatile of volatilesToCopy) {
        if (ally.volatiles[volatile]) {
          pokemon.addVolatile(volatile);
          if (volatile === "gmaxchistrike")
            pokemon.volatiles[volatile].layers = ally.volatiles[volatile].layers;
        } else {
          pokemon.removeVolatile(volatile);
        }
      }
      this.add("-copyboost", pokemon, ally, "[from] ability: Costar");
    },
    name: "Costar",
    rating: 0,
    num: 294
  },
  cottondown: {
    onDamagingHit(damage, target, source, move) {
      let activated = false;
      for (const pokemon of this.getAllActive()) {
        if (pokemon === target || pokemon.fainted)
          continue;
        if (!activated) {
          this.add("-ability", target, "Cotton Down");
          activated = true;
        }
        this.boost({ spe: -1 }, pokemon, target, null, true);
      }
    },
    name: "Cotton Down",
    rating: 2,
    num: 238
  },
  cudchew: {
    onEatItem(item, pokemon) {
      if (item.isBerry && pokemon.addVolatile("cudchew")) {
        pokemon.volatiles["cudchew"].berry = item;
      }
    },
    onEnd(pokemon) {
      delete pokemon.volatiles["cudchew"];
    },
    condition: {
      noCopy: true,
      duration: 2,
      onRestart() {
        this.effectState.duration = 2;
      },
      onResidualOrder: 28,
      onResidualSubOrder: 2,
      onEnd(pokemon) {
        if (pokemon.hp) {
          const item = this.effectState.berry;
          this.add("-activate", pokemon, "ability: Cud Chew");
          this.add("-enditem", pokemon, item.name, "[eat]");
          if (this.singleEvent("Eat", item, null, pokemon, null, null)) {
            this.runEvent("EatItem", pokemon, null, null, item);
          }
          if (item.onEat)
            pokemon.ateBerry = true;
        }
      }
    },
    name: "Cud Chew",
    rating: 2,
    num: 291
  },
  curiousmedicine: {
    onStart(pokemon) {
      for (const ally of pokemon.adjacentAllies()) {
        ally.clearBoosts();
        this.add("-clearboost", ally, "[from] ability: Curious Medicine", "[of] " + pokemon);
      }
    },
    name: "Curious Medicine",
    rating: 0,
    num: 261
  },
  cursedbody: {
    onDamagingHit(damage, target, source, move) {
      if (source.volatiles["disable"])
        return;
      if (!move.isMax && !move.flags["futuremove"] && move.id !== "struggle") {
        if (this.randomChance(3, 10)) {
          source.addVolatile("disable", this.effectState.target);
        }
      }
    },
    name: "Cursed Body",
    rating: 2,
    num: 130
  },
  cutecharm: {
    onDamagingHit(damage, target, source, move) {
      if (this.checkMoveMakesContact(move, source, target)) {
        if (this.randomChance(3, 10)) {
          source.addVolatile("attract", this.effectState.target);
        }
      }
    },
    name: "Cute Charm",
    rating: 0.5,
    num: 56
  },
  damp: {
    onAnyTryMove(target, source, effect) {
      if (["explosion", "mindblown", "mistyexplosion", "selfdestruct"].includes(effect.id)) {
        this.attrLastMove("[still]");
        this.add("cant", this.effectState.target, "ability: Damp", effect, "[of] " + target);
        return false;
      }
    },
    onAnyDamage(damage, target, source, effect) {
      if (effect && effect.name === "Aftermath") {
        return false;
      }
    },
    isBreakable: true,
    name: "Damp",
    rating: 0.5,
    num: 6
  },
  dancer: {
    name: "Dancer",
    // implemented in runMove in scripts.js
    rating: 1.5,
    num: 216
  },
  darkaura: {
    onStart(pokemon) {
      if (this.suppressingAbility(pokemon))
        return;
      this.add("-ability", pokemon, "Dark Aura");
    },
    onAnyBasePowerPriority: 20,
    onAnyBasePower(basePower, source, target, move) {
      if (target === source || move.category === "Status" || move.type !== "Dark")
        return;
      if (!move.auraBooster?.hasAbility("Dark Aura"))
        move.auraBooster = this.effectState.target;
      if (move.auraBooster !== this.effectState.target)
        return;
      return this.chainModify([move.hasAuraBreak ? 3072 : 5448, 4096]);
    },
    name: "Dark Aura",
    rating: 3,
    num: 186
  },
  dauntlessshield: {
    onStart(pokemon) {
      if (this.effectState.shieldBoost)
        return;
      if (this.boost({ def: 1 }, pokemon)) {
        this.effectState.shieldBoost = true;
      }
    },
    name: "Dauntless Shield",
    rating: 3.5,
    num: 235
  },
  dazzling: {
    onFoeTryMove(target, source, move) {
      const targetAllExceptions = ["perishsong", "flowershield", "rototiller"];
      if (move.target === "foeSide" || move.target === "all" && !targetAllExceptions.includes(move.id)) {
        return;
      }
      const dazzlingHolder = this.effectState.target;
      if ((source.isAlly(dazzlingHolder) || move.target === "all") && move.priority > 0.1) {
        this.attrLastMove("[still]");
        this.add("cant", dazzlingHolder, "ability: Dazzling", move, "[of] " + target);
        return false;
      }
    },
    isBreakable: true,
    name: "Dazzling",
    rating: 2.5,
    num: 219
  },
  defeatist: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk, pokemon) {
      if (pokemon.hp <= pokemon.maxhp / 2) {
        return this.chainModify(0.5);
      }
    },
    onModifySpAPriority: 5,
    onModifySpA(atk, pokemon) {
      if (pokemon.hp <= pokemon.maxhp / 2) {
        return this.chainModify(0.5);
      }
    },
    name: "Defeatist",
    rating: -1,
    num: 129
  },
  defiant: {
    onAfterEachBoost(boost, target, source, effect) {
      if (!source || target.isAlly(source)) {
        if (effect.id === "stickyweb") {
          this.hint("Court Change Sticky Web counts as lowering your own Speed, and Defiant only affects stats lowered by foes.", true, source.side);
        }
        return;
      }
      let statsLowered = false;
      let i;
      for (i in boost) {
        if (boost[i] < 0) {
          statsLowered = true;
        }
      }
      if (statsLowered) {
        this.boost({ atk: 2 }, target, target, null, false, true);
      }
    },
    name: "Defiant",
    rating: 3,
    num: 128
  },
  deltastream: {
    onStart(source) {
      this.field.setWeather("deltastream");
    },
    onAnySetWeather(target, source, weather) {
      const strongWeathers = ["desolateland", "primordialsea", "deltastream"];
      if (this.field.getWeather().id === "deltastream" && !strongWeathers.includes(weather.id))
        return false;
    },
    onEnd(pokemon) {
      if (this.field.weatherState.source !== pokemon)
        return;
      for (const target of this.getAllActive()) {
        if (target === pokemon)
          continue;
        if (target.hasAbility("deltastream")) {
          this.field.weatherState.source = target;
          return;
        }
      }
      this.field.clearWeather();
    },
    name: "Delta Stream",
    rating: 4,
    num: 191
  },
  desolateland: {
    onStart(source) {
      this.field.setWeather("desolateland");
    },
    onAnySetWeather(target, source, weather) {
      const strongWeathers = ["desolateland", "primordialsea", "deltastream"];
      if (this.field.getWeather().id === "desolateland" && !strongWeathers.includes(weather.id))
        return false;
    },
    onEnd(pokemon) {
      if (this.field.weatherState.source !== pokemon)
        return;
      for (const target of this.getAllActive()) {
        if (target === pokemon)
          continue;
        if (target.hasAbility("desolateland")) {
          this.field.weatherState.source = target;
          return;
        }
      }
      this.field.clearWeather();
    },
    name: "Desolate Land",
    rating: 4.5,
    num: 190
  },
  disguise: {
    onDamagePriority: 1,
    onDamage(damage, target, source, effect) {
      if (effect && effect.effectType === "Move" && ["mimikyu", "mimikyutotem"].includes(target.species.id) && !target.transformed) {
        this.add("-activate", target, "ability: Disguise");
        this.effectState.busted = true;
        return 0;
      }
    },
    onCriticalHit(target, source, move) {
      if (!target)
        return;
      if (!["mimikyu", "mimikyutotem"].includes(target.species.id) || target.transformed) {
        return;
      }
      const hitSub = target.volatiles["substitute"] && !move.flags["bypasssub"] && !(move.infiltrates && this.gen >= 6);
      if (hitSub)
        return;
      if (!target.runImmunity(move.type))
        return;
      return false;
    },
    onEffectiveness(typeMod, target, type, move) {
      if (!target || move.category === "Status")
        return;
      if (!["mimikyu", "mimikyutotem"].includes(target.species.id) || target.transformed) {
        return;
      }
      const hitSub = target.volatiles["substitute"] && !move.flags["bypasssub"] && !(move.infiltrates && this.gen >= 6);
      if (hitSub)
        return;
      if (!target.runImmunity(move.type))
        return;
      return 0;
    },
    onUpdate(pokemon) {
      if (["mimikyu", "mimikyutotem"].includes(pokemon.species.id) && this.effectState.busted) {
        const speciesid = pokemon.species.id === "mimikyutotem" ? "Mimikyu-Busted-Totem" : "Mimikyu-Busted";
        pokemon.formeChange(speciesid, this.effect, true);
        this.damage(pokemon.baseMaxhp / 8, pokemon, pokemon, this.dex.species.get(speciesid));
      }
    },
    isBreakable: true,
    isPermanent: true,
    name: "Disguise",
    rating: 3.5,
    num: 209
  },
  download: {
    onStart(pokemon) {
      let totaldef = 0;
      let totalspd = 0;
      for (const target of pokemon.foes()) {
        totaldef += target.getStat("def", false, true);
        totalspd += target.getStat("spd", false, true);
      }
      if (totaldef && totaldef >= totalspd) {
        this.boost({ spa: 1 });
      } else if (totalspd) {
        this.boost({ atk: 1 });
      }
    },
    name: "Download",
    rating: 3.5,
    num: 88
  },
  dragonsmaw: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Dragon") {
        this.debug("Dragon's Maw boost");
        return this.chainModify(1.5);
      }
    },
    onModifySpAPriority: 5,
    onModifySpA(atk, attacker, defender, move) {
      if (move.type === "Dragon") {
        this.debug("Dragon's Maw boost");
        return this.chainModify(1.5);
      }
    },
    name: "Dragon's Maw",
    rating: 3.5,
    num: 263
  },
  drizzle: {
    onStart(source) {
      for (const action of this.queue) {
        if (action.choice === "runPrimal" && action.pokemon === source && source.species.id === "kyogre")
          return;
        if (action.choice !== "runSwitch" && action.choice !== "runPrimal")
          break;
      }
      this.field.setWeather("raindance");
    },
    name: "Drizzle",
    rating: 4,
    num: 2
  },
  drought: {
    onStart(source) {
      for (const action of this.queue) {
        if (action.choice === "runPrimal" && action.pokemon === source && source.species.id === "groudon")
          return;
        if (action.choice !== "runSwitch" && action.choice !== "runPrimal")
          break;
      }
      this.field.setWeather("sunnyday");
    },
    name: "Drought",
    rating: 4,
    num: 70
  },
  dryskin: {
    onTryHit(target, source, move) {
      if (target !== source && move.type === "Water") {
        if (!this.heal(target.baseMaxhp / 4)) {
          this.add("-immune", target, "[from] ability: Dry Skin");
        }
        return null;
      }
    },
    onSourceBasePowerPriority: 17,
    onSourceBasePower(basePower, attacker, defender, move) {
      if (move.type === "Fire") {
        return this.chainModify(1.25);
      }
    },
    onWeather(target, source, effect) {
      if (target.hasItem("utilityumbrella"))
        return;
      if (effect.id === "raindance" || effect.id === "primordialsea") {
        this.heal(target.baseMaxhp / 8);
      } else if (effect.id === "sunnyday" || effect.id === "desolateland") {
        this.damage(target.baseMaxhp / 8, target, target);
      }
    },
    isBreakable: true,
    name: "Dry Skin",
    rating: 3,
    num: 87
  },
  earlybird: {
    name: "Early Bird",
    // Implemented in statuses.js
    rating: 1.5,
    num: 48
  },
  eartheater: {
    onTryHit(target, source, move) {
      if (target !== source && move.type === "Ground") {
        if (!this.heal(target.baseMaxhp / 4)) {
          this.add("-immune", target, "[from] ability: Earth Eater");
        }
        return null;
      }
    },
    isBreakable: true,
    name: "Earth Eater",
    rating: 3.5,
    num: 297
  },
  effectspore: {
    onDamagingHit(damage, target, source, move) {
      if (this.checkMoveMakesContact(move, source, target) && !source.status && source.runStatusImmunity("powder")) {
        const r = this.random(100);
        if (r < 11) {
          source.setStatus("slp", target);
        } else if (r < 21) {
          source.setStatus("par", target);
        } else if (r < 30) {
          source.setStatus("psn", target);
        }
      }
    },
    name: "Effect Spore",
    rating: 2,
    num: 27
  },
  electricsurge: {
    onStart(source) {
      this.field.setTerrain("electricterrain");
    },
    name: "Electric Surge",
    rating: 4,
    num: 226
  },
  electromorphosis: {
    onDamagingHitOrder: 1,
    onDamagingHit(damage, target, source, move) {
      target.addVolatile("charge");
    },
    name: "Electromorphosis",
    rating: 2.5,
    num: 280
  },
  emergencyexit: {
    onEmergencyExit(target) {
      if (!this.canSwitch(target.side) || target.forceSwitchFlag || target.switchFlag)
        return;
      for (const side of this.sides) {
        for (const active of side.active) {
          active.switchFlag = false;
        }
      }
      target.switchFlag = true;
      this.add("-activate", target, "ability: Emergency Exit");
    },
    name: "Emergency Exit",
    rating: 1,
    num: 194
  },
  fairyaura: {
    onStart(pokemon) {
      if (this.suppressingAbility(pokemon))
        return;
      this.add("-ability", pokemon, "Fairy Aura");
    },
    onAnyBasePowerPriority: 20,
    onAnyBasePower(basePower, source, target, move) {
      if (target === source || move.category === "Status" || move.type !== "Fairy")
        return;
      if (!move.auraBooster?.hasAbility("Fairy Aura"))
        move.auraBooster = this.effectState.target;
      if (move.auraBooster !== this.effectState.target)
        return;
      return this.chainModify([move.hasAuraBreak ? 3072 : 5448, 4096]);
    },
    name: "Fairy Aura",
    rating: 3,
    num: 187
  },
  filter: {
    onSourceModifyDamage(damage, source, target, move) {
      if (target.getMoveHitData(move).typeMod > 0) {
        this.debug("Filter neutralize");
        return this.chainModify(0.75);
      }
    },
    isBreakable: true,
    name: "Filter",
    rating: 3,
    num: 111
  },
  flamebody: {
    onDamagingHit(damage, target, source, move) {
      if (this.checkMoveMakesContact(move, source, target)) {
        if (this.randomChance(3, 10)) {
          source.trySetStatus("brn", target);
        }
      }
    },
    name: "Flame Body",
    rating: 2,
    num: 49
  },
  flareboost: {
    onBasePowerPriority: 19,
    onBasePower(basePower, attacker, defender, move) {
      if (attacker.status === "brn" && move.category === "Special") {
        return this.chainModify(1.5);
      }
    },
    name: "Flare Boost",
    rating: 2,
    num: 138
  },
  flashfire: {
    onTryHit(target, source, move) {
      if (target !== source && move.type === "Fire") {
        move.accuracy = true;
        if (!target.addVolatile("flashfire")) {
          this.add("-immune", target, "[from] ability: Flash Fire");
        }
        return null;
      }
    },
    onEnd(pokemon) {
      pokemon.removeVolatile("flashfire");
    },
    condition: {
      noCopy: true,
      // doesn't get copied by Baton Pass
      onStart(target) {
        this.add("-start", target, "ability: Flash Fire");
      },
      onModifyAtkPriority: 5,
      onModifyAtk(atk, attacker, defender, move) {
        if (move.type === "Fire" && attacker.hasAbility("flashfire")) {
          this.debug("Flash Fire boost");
          return this.chainModify(1.5);
        }
      },
      onModifySpAPriority: 5,
      onModifySpA(atk, attacker, defender, move) {
        if (move.type === "Fire" && attacker.hasAbility("flashfire")) {
          this.debug("Flash Fire boost");
          return this.chainModify(1.5);
        }
      },
      onEnd(target) {
        this.add("-end", target, "ability: Flash Fire", "[silent]");
      }
    },
    isBreakable: true,
    name: "Flash Fire",
    rating: 3.5,
    num: 18
  },
  flowergift: {
    onStart(pokemon) {
      this.singleEvent("WeatherChange", this.effect, this.effectState, pokemon);
    },
    onWeatherChange(pokemon) {
      if (!pokemon.isActive || pokemon.baseSpecies.baseSpecies !== "Cherrim" || pokemon.transformed)
        return;
      if (!pokemon.hp)
        return;
      if (["sunnyday", "desolateland"].includes(pokemon.effectiveWeather())) {
        if (pokemon.species.id !== "cherrimsunshine") {
          pokemon.formeChange("Cherrim-Sunshine", this.effect, false, "[msg]");
        }
      } else {
        if (pokemon.species.id === "cherrimsunshine") {
          pokemon.formeChange("Cherrim", this.effect, false, "[msg]");
        }
      }
    },
    onAllyModifyAtkPriority: 3,
    onAllyModifyAtk(atk, pokemon) {
      if (this.effectState.target.baseSpecies.baseSpecies !== "Cherrim")
        return;
      if (["sunnyday", "desolateland"].includes(pokemon.effectiveWeather())) {
        return this.chainModify(1.5);
      }
    },
    onAllyModifySpDPriority: 4,
    onAllyModifySpD(spd, pokemon) {
      if (this.effectState.target.baseSpecies.baseSpecies !== "Cherrim")
        return;
      if (["sunnyday", "desolateland"].includes(pokemon.effectiveWeather())) {
        return this.chainModify(1.5);
      }
    },
    isBreakable: true,
    name: "Flower Gift",
    rating: 1,
    num: 122
  },
  flowerveil: {
    onAllyTryBoost(boost, target, source, effect) {
      if (source && target === source || !target.hasType("Grass"))
        return;
      let showMsg = false;
      let i;
      for (i in boost) {
        if (boost[i] < 0) {
          delete boost[i];
          showMsg = true;
        }
      }
      if (showMsg && !effect.secondaries) {
        const effectHolder = this.effectState.target;
        this.add("-block", target, "ability: Flower Veil", "[of] " + effectHolder);
      }
    },
    onAllySetStatus(status, target, source, effect) {
      if (target.hasType("Grass") && source && target !== source && effect && effect.id !== "yawn") {
        this.debug("interrupting setStatus with Flower Veil");
        if (effect.name === "Synchronize" || effect.effectType === "Move" && !effect.secondaries) {
          const effectHolder = this.effectState.target;
          this.add("-block", target, "ability: Flower Veil", "[of] " + effectHolder);
        }
        return null;
      }
    },
    onAllyTryAddVolatile(status, target) {
      if (target.hasType("Grass") && status.id === "yawn") {
        this.debug("Flower Veil blocking yawn");
        const effectHolder = this.effectState.target;
        this.add("-block", target, "ability: Flower Veil", "[of] " + effectHolder);
        return null;
      }
    },
    isBreakable: true,
    name: "Flower Veil",
    rating: 0,
    num: 166
  },
  fluffy: {
    onSourceModifyDamage(damage, source, target, move) {
      let mod = 1;
      if (move.type === "Fire")
        mod *= 2;
      if (move.flags["contact"])
        mod /= 2;
      return this.chainModify(mod);
    },
    isBreakable: true,
    name: "Fluffy",
    rating: 3.5,
    num: 218
  },
  forecast: {
    onStart(pokemon) {
      this.singleEvent("WeatherChange", this.effect, this.effectState, pokemon);
    },
    onWeatherChange(pokemon) {
      if (pokemon.baseSpecies.baseSpecies !== "Castform" || pokemon.transformed)
        return;
      let forme = null;
      switch (pokemon.effectiveWeather()) {
        case "sunnyday":
        case "desolateland":
          if (pokemon.species.id !== "castformsunny")
            forme = "Castform-Sunny";
          break;
        case "raindance":
        case "primordialsea":
          if (pokemon.species.id !== "castformrainy")
            forme = "Castform-Rainy";
          break;
        case "hail":
        case "snow":
          if (pokemon.species.id !== "castformsnowy")
            forme = "Castform-Snowy";
          break;
        default:
          if (pokemon.species.id !== "castform")
            forme = "Castform";
          break;
      }
      if (pokemon.isActive && forme) {
        pokemon.formeChange(forme, this.effect, false, "[msg]");
      }
    },
    name: "Forecast",
    rating: 2,
    num: 59
  },
  forewarn: {
    onStart(pokemon) {
      let warnMoves = [];
      let warnBp = 1;
      for (const target of pokemon.foes()) {
        for (const moveSlot of target.moveSlots) {
          const move = this.dex.moves.get(moveSlot.move);
          let bp = move.basePower;
          if (move.ohko)
            bp = 150;
          if (move.id === "counter" || move.id === "metalburst" || move.id === "mirrorcoat")
            bp = 120;
          if (bp === 1)
            bp = 80;
          if (!bp && move.category !== "Status")
            bp = 80;
          if (bp > warnBp) {
            warnMoves = [[move, target]];
            warnBp = bp;
          } else if (bp === warnBp) {
            warnMoves.push([move, target]);
          }
        }
      }
      if (!warnMoves.length)
        return;
      const [warnMoveName, warnTarget] = this.sample(warnMoves);
      this.add("-activate", pokemon, "ability: Forewarn", warnMoveName, "[of] " + warnTarget);
    },
    name: "Forewarn",
    rating: 0.5,
    num: 108
  },
  friendguard: {
    name: "Friend Guard",
    onAnyModifyDamage(damage, source, target, move) {
      if (target !== this.effectState.target && target.isAlly(this.effectState.target)) {
        this.debug("Friend Guard weaken");
        return this.chainModify(0.75);
      }
    },
    isBreakable: true,
    rating: 0,
    num: 132
  },
  frisk: {
    onStart(pokemon) {
      for (const target of pokemon.foes()) {
        if (target.item) {
          this.add("-item", target, target.getItem().name, "[from] ability: Frisk", "[of] " + pokemon, "[identify]");
        }
      }
    },
    name: "Frisk",
    rating: 1.5,
    num: 119
  },
  fullmetalbody: {
    onTryBoost(boost, target, source, effect) {
      if (source && target === source)
        return;
      let showMsg = false;
      let i;
      for (i in boost) {
        if (boost[i] < 0) {
          delete boost[i];
          showMsg = true;
        }
      }
      if (showMsg && !effect.secondaries && effect.id !== "octolock") {
        this.add("-fail", target, "unboost", "[from] ability: Full Metal Body", "[of] " + target);
      }
    },
    name: "Full Metal Body",
    rating: 2,
    num: 230
  },
  furcoat: {
    onModifyDefPriority: 6,
    onModifyDef(def) {
      return this.chainModify(2);
    },
    isBreakable: true,
    name: "Fur Coat",
    rating: 4,
    num: 169
  },
  galewings: {
    onModifyPriority(priority, pokemon, target, move) {
      if (move?.type === "Flying" && pokemon.hp === pokemon.maxhp)
        return priority + 1;
    },
    name: "Gale Wings",
    rating: 2.5,
    num: 177
  },
  galvanize: {
    onModifyTypePriority: -1,
    onModifyType(move, pokemon) {
      const noModifyType = [
        "judgment",
        "multiattack",
        "naturalgift",
        "revelationdance",
        "technoblast",
        "terrainpulse",
        "weatherball"
      ];
      if (move.type === "Normal" && !noModifyType.includes(move.id) && !(move.isZ && move.category !== "Status") && !(move.name === "Tera Blast" && pokemon.terastallized)) {
        move.type = "Electric";
        move.typeChangerBoosted = this.effect;
      }
    },
    onBasePowerPriority: 23,
    onBasePower(basePower, pokemon, target, move) {
      if (move.typeChangerBoosted === this.effect)
        return this.chainModify([4915, 4096]);
    },
    name: "Galvanize",
    rating: 4,
    num: 206
  },
  gluttony: {
    name: "Gluttony",
    rating: 1.5,
    num: 82,
    onStart(pokemon) {
      pokemon.abilityState.gluttony = true;
    },
    onDamage(item, pokemon) {
      pokemon.abilityState.gluttony = true;
    }
  },
  goodasgold: {
    onTryHit(target, source, move) {
      if (move.category === "Status" && target !== source) {
        this.add("-immune", target, "[from] ability: Good as Gold");
        return null;
      }
    },
    isBreakable: true,
    name: "Good as Gold",
    rating: 5,
    num: 283
  },
  gooey: {
    onDamagingHit(damage, target, source, move) {
      if (this.checkMoveMakesContact(move, source, target, true)) {
        this.add("-ability", target, "Gooey");
        this.boost({ spe: -1 }, source, target, null, true);
      }
    },
    name: "Gooey",
    rating: 2,
    num: 183
  },
  gorillatactics: {
    onStart(pokemon) {
      pokemon.abilityState.choiceLock = "";
    },
    onBeforeMove(pokemon, target, move) {
      if (move.isZOrMaxPowered || move.id === "struggle")
        return;
      if (pokemon.abilityState.choiceLock && pokemon.abilityState.choiceLock !== move.id) {
        this.addMove("move", pokemon, move.name);
        this.attrLastMove("[still]");
        this.debug("Disabled by Gorilla Tactics");
        this.add("-fail", pokemon);
        return false;
      }
    },
    onModifyMove(move, pokemon) {
      if (pokemon.abilityState.choiceLock || move.isZOrMaxPowered || move.id === "struggle")
        return;
      pokemon.abilityState.choiceLock = move.id;
    },
    onModifyAtkPriority: 1,
    onModifyAtk(atk, pokemon) {
      if (pokemon.volatiles["dynamax"])
        return;
      this.debug("Gorilla Tactics Atk Boost");
      return this.chainModify(1.5);
    },
    onDisableMove(pokemon) {
      if (!pokemon.abilityState.choiceLock)
        return;
      if (pokemon.volatiles["dynamax"])
        return;
      for (const moveSlot of pokemon.moveSlots) {
        if (moveSlot.id !== pokemon.abilityState.choiceLock) {
          pokemon.disableMove(moveSlot.id, false, this.effectState.sourceEffect);
        }
      }
    },
    onEnd(pokemon) {
      pokemon.abilityState.choiceLock = "";
    },
    name: "Gorilla Tactics",
    rating: 4.5,
    num: 255
  },
  grasspelt: {
    onModifyDefPriority: 6,
    onModifyDef(pokemon) {
      if (this.field.isTerrain("grassyterrain"))
        return this.chainModify(1.5);
    },
    isBreakable: true,
    name: "Grass Pelt",
    rating: 0.5,
    num: 179
  },
  grassysurge: {
    onStart(source) {
      this.field.setTerrain("grassyterrain");
    },
    name: "Grassy Surge",
    rating: 4,
    num: 229
  },
  grimneigh: {
    onSourceAfterFaint(length, target, source, effect) {
      if (effect && effect.effectType === "Move") {
        this.boost({ spa: length }, source);
      }
    },
    name: "Grim Neigh",
    rating: 3,
    num: 265
  },
  guarddog: {
    onDragOutPriority: 1,
    onDragOut(pokemon) {
      this.add("-activate", pokemon, "ability: Guard Dog");
      return null;
    },
    onTryBoost(boost, target, source, effect) {
      if (effect.name === "Intimidate" && boost.atk) {
        delete boost.atk;
        this.boost({ atk: 1 }, target, target, null, false, true);
      }
    },
    name: "Guard Dog",
    rating: 2,
    num: 275
  },
  gulpmissile: {
    onDamagingHit(damage, target, source, move) {
      if (!source.hp || !source.isActive || target.transformed || target.isSemiInvulnerable())
        return;
      if (["cramorantgulping", "cramorantgorging"].includes(target.species.id)) {
        this.damage(source.baseMaxhp / 4, source, target);
        if (target.species.id === "cramorantgulping") {
          this.boost({ def: -1 }, source, target, null, true);
        } else {
          source.trySetStatus("par", target, move);
        }
        target.formeChange("cramorant", move);
      }
    },
    // The Dive part of this mechanic is implemented in Dive's `onTryMove` in moves.ts
    onSourceTryPrimaryHit(target, source, effect) {
      if (effect && effect.id === "surf" && source.hasAbility("gulpmissile") && source.species.name === "Cramorant" && !source.transformed) {
        const forme = source.hp <= source.maxhp / 2 ? "cramorantgorging" : "cramorantgulping";
        source.formeChange(forme, effect);
      }
    },
    isPermanent: true,
    name: "Gulp Missile",
    rating: 2.5,
    num: 241
  },
  guts: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk, pokemon) {
      if (pokemon.status) {
        return this.chainModify(1.5);
      }
    },
    name: "Guts",
    rating: 3.5,
    num: 62
  },
  hadronengine: {
    onStart(pokemon) {
      if (!this.field.setTerrain("electricterrain") && this.field.isTerrain("electricterrain")) {
        this.add("-activate", pokemon, "ability: Hadron Engine");
      }
    },
    onModifySpAPriority: 5,
    onModifySpA(atk, attacker, defender, move) {
      if (this.field.isTerrain("electricterrain")) {
        this.debug("Hadron Engine boost");
        return this.chainModify([5461, 4096]);
      }
    },
    name: "Hadron Engine",
    rating: 4.5,
    num: 289
  },
  harvest: {
    name: "Harvest",
    onResidualOrder: 28,
    onResidualSubOrder: 2,
    onResidual(pokemon) {
      if (this.field.isWeather(["sunnyday", "desolateland"]) || this.randomChance(1, 2)) {
        if (pokemon.hp && !pokemon.item && this.dex.items.get(pokemon.lastItem).isBerry) {
          pokemon.setItem(pokemon.lastItem);
          pokemon.lastItem = "";
          this.add("-item", pokemon, pokemon.getItem(), "[from] ability: Harvest");
        }
      }
    },
    rating: 2.5,
    num: 139
  },
  healer: {
    name: "Healer",
    onResidualOrder: 5,
    onResidualSubOrder: 3,
    onResidual(pokemon) {
      for (const allyActive of pokemon.adjacentAllies()) {
        if (allyActive.status && this.randomChance(3, 10)) {
          this.add("-activate", pokemon, "ability: Healer");
          allyActive.cureStatus();
        }
      }
    },
    rating: 0,
    num: 131
  },
  heatproof: {
    onSourceBasePowerPriority: 18,
    onSourceBasePower(basePower, attacker, defender, move) {
      if (move.type === "Fire") {
        return this.chainModify(0.5);
      }
    },
    onDamage(damage, target, source, effect) {
      if (effect && effect.id === "brn") {
        return damage / 2;
      }
    },
    isBreakable: true,
    name: "Heatproof",
    rating: 2,
    num: 85
  },
  heavymetal: {
    onModifyWeightPriority: 1,
    onModifyWeight(weighthg) {
      return weighthg * 2;
    },
    isBreakable: true,
    name: "Heavy Metal",
    rating: 0,
    num: 134
  },
  honeygather: {
    name: "Honey Gather",
    rating: 0,
    num: 118
  },
  hugepower: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk) {
      return this.chainModify(2);
    },
    name: "Huge Power",
    rating: 5,
    num: 37
  },
  hungerswitch: {
    onResidualOrder: 29,
    onResidual(pokemon) {
      if (pokemon.species.baseSpecies !== "Morpeko" || pokemon.transformed)
        return;
      const targetForme = pokemon.species.name === "Morpeko" ? "Morpeko-Hangry" : "Morpeko";
      pokemon.formeChange(targetForme);
    },
    name: "Hunger Switch",
    rating: 1,
    num: 258
  },
  hustle: {
    // This should be applied directly to the stat as opposed to chaining with the others
    onModifyAtkPriority: 5,
    onModifyAtk(atk) {
      return this.modify(atk, 1.5);
    },
    onSourceModifyAccuracyPriority: -1,
    onSourceModifyAccuracy(accuracy, target, source, move) {
      if (move.category === "Physical" && typeof accuracy === "number") {
        return this.chainModify([3277, 4096]);
      }
    },
    name: "Hustle",
    rating: 3.5,
    num: 55
  },
  hydration: {
    onResidualOrder: 5,
    onResidualSubOrder: 3,
    onResidual(pokemon) {
      if (pokemon.status && ["raindance", "primordialsea"].includes(pokemon.effectiveWeather())) {
        this.debug("hydration");
        this.add("-activate", pokemon, "ability: Hydration");
        pokemon.cureStatus();
      }
    },
    name: "Hydration",
    rating: 1.5,
    num: 93
  },
  hypercutter: {
    onTryBoost(boost, target, source, effect) {
      if (source && target === source)
        return;
      if (boost.atk && boost.atk < 0) {
        delete boost.atk;
        if (!effect.secondaries) {
          this.add("-fail", target, "unboost", "Attack", "[from] ability: Hyper Cutter", "[of] " + target);
        }
      }
    },
    isBreakable: true,
    name: "Hyper Cutter",
    rating: 1.5,
    num: 52
  },
  icebody: {
    onWeather(target, source, effect) {
      if (effect.id === "hail" || effect.id === "snow") {
        this.heal(target.baseMaxhp / 16);
      }
    },
    onImmunity(type, pokemon) {
      if (type === "hail")
        return false;
    },
    name: "Ice Body",
    rating: 1,
    num: 115
  },
  iceface: {
    onStart(pokemon) {
      if (this.field.isWeather(["hail", "snow"]) && pokemon.species.id === "eiscuenoice" && !pokemon.transformed) {
        this.add("-activate", pokemon, "ability: Ice Face");
        this.effectState.busted = false;
        pokemon.formeChange("Eiscue", this.effect, true);
      }
    },
    onDamagePriority: 1,
    onDamage(damage, target, source, effect) {
      if (effect && effect.effectType === "Move" && effect.category === "Physical" && target.species.id === "eiscue" && !target.transformed) {
        this.add("-activate", target, "ability: Ice Face");
        this.effectState.busted = true;
        return 0;
      }
    },
    onCriticalHit(target, type, move) {
      if (!target)
        return;
      if (move.category !== "Physical" || target.species.id !== "eiscue" || target.transformed)
        return;
      if (target.volatiles["substitute"] && !(move.flags["bypasssub"] || move.infiltrates))
        return;
      if (!target.runImmunity(move.type))
        return;
      return false;
    },
    onEffectiveness(typeMod, target, type, move) {
      if (!target)
        return;
      if (move.category !== "Physical" || target.species.id !== "eiscue" || target.transformed)
        return;
      const hitSub = target.volatiles["substitute"] && !move.flags["bypasssub"] && !(move.infiltrates && this.gen >= 6);
      if (hitSub)
        return;
      if (!target.runImmunity(move.type))
        return;
      return 0;
    },
    onUpdate(pokemon) {
      if (pokemon.species.id === "eiscue" && this.effectState.busted) {
        pokemon.formeChange("Eiscue-Noice", this.effect, true);
      }
    },
    onWeatherChange(pokemon, source, sourceEffect) {
      if (sourceEffect?.suppressWeather)
        return;
      if (!pokemon.hp)
        return;
      if (this.field.isWeather(["hail", "snow"]) && pokemon.species.id === "eiscuenoice" && !pokemon.transformed) {
        this.add("-activate", pokemon, "ability: Ice Face");
        this.effectState.busted = false;
        pokemon.formeChange("Eiscue", this.effect, true);
      }
    },
    isBreakable: true,
    isPermanent: true,
    name: "Ice Face",
    rating: 3,
    num: 248
  },
  icescales: {
    onSourceModifyDamage(damage, source, target, move) {
      if (move.category === "Special") {
        return this.chainModify(0.5);
      }
    },
    isBreakable: true,
    name: "Ice Scales",
    rating: 4,
    num: 246
  },
  illuminate: {
    name: "Illuminate",
    rating: 0,
    num: 35
  },
  illusion: {
    onBeforeSwitchIn(pokemon) {
      pokemon.illusion = null;
      for (let i = pokemon.side.pokemon.length - 1; i > pokemon.position; i--) {
        const possibleTarget = pokemon.side.pokemon[i];
        if (!possibleTarget.fainted) {
          pokemon.illusion = possibleTarget;
          break;
        }
      }
    },
    onDamagingHit(damage, target, source, move) {
      if (target.illusion) {
        this.singleEvent("End", this.dex.abilities.get("Illusion"), target.abilityState, target, source, move);
      }
    },
    onEnd(pokemon) {
      if (pokemon.illusion) {
        this.debug("illusion cleared");
        pokemon.illusion = null;
        const details = pokemon.species.name + (pokemon.level === 100 ? "" : ", L" + pokemon.level) + (pokemon.gender === "" ? "" : ", " + pokemon.gender) + (pokemon.set.shiny ? ", shiny" : "");
        this.add("replace", pokemon, details);
        this.add("-end", pokemon, "Illusion");
      }
    },
    onFaint(pokemon) {
      pokemon.illusion = null;
    },
    name: "Illusion",
    rating: 4.5,
    num: 149
  },
  immunity: {
    onUpdate(pokemon) {
      if (pokemon.status === "psn" || pokemon.status === "tox") {
        this.add("-activate", pokemon, "ability: Immunity");
        pokemon.cureStatus();
      }
    },
    onSetStatus(status, target, source, effect) {
      if (status.id !== "psn" && status.id !== "tox")
        return;
      if (effect?.status) {
        this.add("-immune", target, "[from] ability: Immunity");
      }
      return false;
    },
    isBreakable: true,
    name: "Immunity",
    rating: 2,
    num: 17
  },
  imposter: {
    onSwitchIn(pokemon) {
      this.effectState.switchingIn = true;
    },
    onStart(pokemon) {
      if (!this.effectState.switchingIn)
        return;
      const target = pokemon.side.foe.active[pokemon.side.foe.active.length - 1 - pokemon.position];
      if (target) {
        pokemon.transformInto(target, this.dex.abilities.get("imposter"));
      }
      this.effectState.switchingIn = false;
    },
    name: "Imposter",
    rating: 5,
    num: 150
  },
  infiltrator: {
    onModifyMove(move) {
      move.infiltrates = true;
    },
    name: "Infiltrator",
    rating: 2.5,
    num: 151
  },
  innardsout: {
    name: "Innards Out",
    onDamagingHitOrder: 1,
    onDamagingHit(damage, target, source, move) {
      if (!target.hp) {
        this.damage(target.getUndynamaxedHP(damage), source, target);
      }
    },
    rating: 4,
    num: 215
  },
  innerfocus: {
    onTryAddVolatile(status, pokemon) {
      if (status.id === "flinch")
        return null;
    },
    onTryBoost(boost, target, source, effect) {
      if (effect.name === "Intimidate" && boost.atk) {
        delete boost.atk;
        this.add("-fail", target, "unboost", "Attack", "[from] ability: Inner Focus", "[of] " + target);
      }
    },
    isBreakable: true,
    name: "Inner Focus",
    rating: 1,
    num: 39
  },
  insomnia: {
    onUpdate(pokemon) {
      if (pokemon.status === "slp") {
        this.add("-activate", pokemon, "ability: Insomnia");
        pokemon.cureStatus();
      }
    },
    onSetStatus(status, target, source, effect) {
      if (status.id !== "slp")
        return;
      if (effect?.status) {
        this.add("-immune", target, "[from] ability: Insomnia");
      }
      return false;
    },
    isBreakable: true,
    name: "Insomnia",
    rating: 1.5,
    num: 15
  },
  intimidate: {
    onStart(pokemon) {
      let activated = false;
      for (const target of pokemon.adjacentFoes()) {
        if (!activated) {
          this.add("-ability", pokemon, "Intimidate", "boost");
          activated = true;
        }
        if (target.volatiles["substitute"]) {
          this.add("-immune", target);
        } else {
          this.boost({ atk: -1 }, target, pokemon, null, true);
        }
      }
    },
    name: "Intimidate",
    rating: 3.5,
    num: 22
  },
  intrepidsword: {
    onStart(pokemon) {
      if (this.effectState.swordBoost)
        return;
      if (this.boost({ atk: 1 }, pokemon)) {
        this.effectState.swordBoost = true;
      }
    },
    name: "Intrepid Sword",
    rating: 4,
    num: 234
  },
  ironbarbs: {
    onDamagingHitOrder: 1,
    onDamagingHit(damage, target, source, move) {
      if (this.checkMoveMakesContact(move, source, target, true)) {
        this.damage(source.baseMaxhp / 8, source, target);
      }
    },
    name: "Iron Barbs",
    rating: 2.5,
    num: 160
  },
  ironfist: {
    onBasePowerPriority: 23,
    onBasePower(basePower, attacker, defender, move) {
      if (move.flags["punch"]) {
        this.debug("Iron Fist boost");
        return this.chainModify([4915, 4096]);
      }
    },
    name: "Iron Fist",
    rating: 3,
    num: 89
  },
  justified: {
    onDamagingHit(damage, target, source, move) {
      if (move.type === "Dark") {
        this.boost({ atk: 1 });
      }
    },
    name: "Justified",
    rating: 2.5,
    num: 154
  },
  keeneye: {
    onTryBoost(boost, target, source, effect) {
      if (source && target === source)
        return;
      if (boost.accuracy && boost.accuracy < 0) {
        delete boost.accuracy;
        if (!effect.secondaries) {
          this.add("-fail", target, "unboost", "accuracy", "[from] ability: Keen Eye", "[of] " + target);
        }
      }
    },
    onModifyMove(move) {
      move.ignoreEvasion = true;
    },
    isBreakable: true,
    name: "Keen Eye",
    rating: 0.5,
    num: 51
  },
  klutz: {
    // Item suppression implemented in Pokemon.ignoringItem() within sim/pokemon.js
    onStart(pokemon) {
      this.singleEvent("End", pokemon.getItem(), pokemon.itemState, pokemon);
    },
    name: "Klutz",
    rating: -1,
    num: 103
  },
  leafguard: {
    onSetStatus(status, target, source, effect) {
      if (["sunnyday", "desolateland"].includes(target.effectiveWeather())) {
        if (effect?.status) {
          this.add("-immune", target, "[from] ability: Leaf Guard");
        }
        return false;
      }
    },
    onTryAddVolatile(status, target) {
      if (status.id === "yawn" && ["sunnyday", "desolateland"].includes(target.effectiveWeather())) {
        this.add("-immune", target, "[from] ability: Leaf Guard");
        return null;
      }
    },
    isBreakable: true,
    name: "Leaf Guard",
    rating: 0.5,
    num: 102
  },
  levitate: {
    // airborneness implemented in sim/pokemon.js:Pokemon#isGrounded
    isBreakable: true,
    name: "Levitate",
    rating: 3.5,
    num: 26
  },
  libero: {
    onPrepareHit(source, target, move) {
      if (this.effectState.libero)
        return;
      if (move.hasBounced || move.flags["futuremove"] || move.sourceEffect === "snatch")
        return;
      const type = move.type;
      if (type && type !== "???" && source.getTypes().join() !== type) {
        if (!source.setType(type))
          return;
        this.effectState.libero = true;
        this.add("-start", source, "typechange", type, "[from] ability: Libero");
      }
    },
    onSwitchIn() {
      delete this.effectState.libero;
    },
    name: "Libero",
    rating: 4,
    num: 236
  },
  lightmetal: {
    onModifyWeight(weighthg) {
      return this.trunc(weighthg / 2);
    },
    isBreakable: true,
    name: "Light Metal",
    rating: 1,
    num: 135
  },
  lightningrod: {
    onTryHit(target, source, move) {
      if (target !== source && move.type === "Electric") {
        if (!this.boost({ spa: 1 })) {
          this.add("-immune", target, "[from] ability: Lightning Rod");
        }
        return null;
      }
    },
    onAnyRedirectTarget(target, source, source2, move) {
      if (move.type !== "Electric" || move.flags["pledgecombo"])
        return;
      const redirectTarget = ["randomNormal", "adjacentFoe"].includes(move.target) ? "normal" : move.target;
      if (this.validTarget(this.effectState.target, source, redirectTarget)) {
        if (move.smartTarget)
          move.smartTarget = false;
        if (this.effectState.target !== target) {
          this.add("-activate", this.effectState.target, "ability: Lightning Rod");
        }
        return this.effectState.target;
      }
    },
    isBreakable: true,
    name: "Lightning Rod",
    rating: 3,
    num: 31
  },
  limber: {
    onUpdate(pokemon) {
      if (pokemon.status === "par") {
        this.add("-activate", pokemon, "ability: Limber");
        pokemon.cureStatus();
      }
    },
    onSetStatus(status, target, source, effect) {
      if (status.id !== "par")
        return;
      if (effect?.status) {
        this.add("-immune", target, "[from] ability: Limber");
      }
      return false;
    },
    isBreakable: true,
    name: "Limber",
    rating: 2,
    num: 7
  },
  lingeringaroma: {
    onDamagingHit(damage, target, source, move) {
      const sourceAbility = source.getAbility();
      if (sourceAbility.isPermanent || sourceAbility.id === "lingeringaroma") {
        return;
      }
      if (this.checkMoveMakesContact(move, source, target, !source.isAlly(target))) {
        const oldAbility = source.setAbility("lingeringaroma", target);
        if (oldAbility) {
          this.add("-activate", target, "ability: Lingering Aroma", this.dex.abilities.get(oldAbility).name, "[of] " + source);
        }
      }
    },
    name: "Lingering Aroma",
    rating: 2,
    num: 268
  },
  liquidooze: {
    onSourceTryHeal(damage, target, source, effect) {
      this.debug("Heal is occurring: " + target + " <- " + source + " :: " + effect.id);
      const canOoze = ["drain", "leechseed", "strengthsap"];
      if (canOoze.includes(effect.id)) {
        this.damage(damage);
        return 0;
      }
    },
    name: "Liquid Ooze",
    rating: 2.5,
    num: 64
  },
  liquidvoice: {
    onModifyTypePriority: -1,
    onModifyType(move, pokemon) {
      if (move.flags["sound"] && !pokemon.volatiles["dynamax"]) {
        move.type = "Water";
      }
    },
    name: "Liquid Voice",
    rating: 1.5,
    num: 204
  },
  longreach: {
    onModifyMove(move) {
      delete move.flags["contact"];
    },
    name: "Long Reach",
    rating: 1,
    num: 203
  },
  magicbounce: {
    name: "Magic Bounce",
    onTryHitPriority: 1,
    onTryHit(target, source, move) {
      if (target === source || move.hasBounced || !move.flags["reflectable"]) {
        return;
      }
      const newMove = this.dex.getActiveMove(move.id);
      newMove.hasBounced = true;
      newMove.pranksterBoosted = false;
      this.actions.useMove(newMove, target, source);
      return null;
    },
    onAllyTryHitSide(target, source, move) {
      if (target.isAlly(source) || move.hasBounced || !move.flags["reflectable"]) {
        return;
      }
      const newMove = this.dex.getActiveMove(move.id);
      newMove.hasBounced = true;
      newMove.pranksterBoosted = false;
      this.actions.useMove(newMove, this.effectState.target, source);
      return null;
    },
    condition: {
      duration: 1
    },
    isBreakable: true,
    rating: 4,
    num: 156
  },
  magicguard: {
    onDamage(damage, target, source, effect) {
      if (effect.effectType !== "Move") {
        if (effect.effectType === "Ability")
          this.add("-activate", source, "ability: " + effect.name);
        return false;
      }
    },
    name: "Magic Guard",
    rating: 4,
    num: 98
  },
  magician: {
    onAfterMoveSecondarySelf(source, target, move) {
      if (!move || !target)
        return;
      if (target !== source && move.category !== "Status") {
        if (source.item || source.volatiles["gem"] || move.id === "fling")
          return;
        const yourItem = target.takeItem(source);
        if (!yourItem)
          return;
        if (!source.setItem(yourItem)) {
          target.item = yourItem.id;
          return;
        }
        this.add("-item", source, yourItem, "[from] ability: Magician", "[of] " + target);
      }
    },
    name: "Magician",
    rating: 1,
    num: 170
  },
  magmaarmor: {
    onUpdate(pokemon) {
      if (pokemon.status === "frz") {
        this.add("-activate", pokemon, "ability: Magma Armor");
        pokemon.cureStatus();
      }
    },
    onImmunity(type, pokemon) {
      if (type === "frz")
        return false;
    },
    isBreakable: true,
    name: "Magma Armor",
    rating: 0.5,
    num: 40
  },
  magnetpull: {
    onFoeTrapPokemon(pokemon) {
      if (pokemon.hasType("Steel") && pokemon.isAdjacent(this.effectState.target)) {
        pokemon.tryTrap(true);
      }
    },
    onFoeMaybeTrapPokemon(pokemon, source) {
      if (!source)
        source = this.effectState.target;
      if (!source || !pokemon.isAdjacent(source))
        return;
      if (!pokemon.knownType || pokemon.hasType("Steel")) {
        pokemon.maybeTrapped = true;
      }
    },
    name: "Magnet Pull",
    rating: 4,
    num: 42
  },
  marvelscale: {
    onModifyDefPriority: 6,
    onModifyDef(def, pokemon) {
      if (pokemon.status) {
        return this.chainModify(1.5);
      }
    },
    isBreakable: true,
    name: "Marvel Scale",
    rating: 2.5,
    num: 63
  },
  megalauncher: {
    onBasePowerPriority: 19,
    onBasePower(basePower, attacker, defender, move) {
      if (move.flags["pulse"]) {
        return this.chainModify(1.5);
      }
    },
    name: "Mega Launcher",
    rating: 3,
    num: 178
  },
  merciless: {
    onModifyCritRatio(critRatio, source, target) {
      if (target && ["psn", "tox"].includes(target.status))
        return 5;
    },
    name: "Merciless",
    rating: 1.5,
    num: 196
  },
  mimicry: {
    onStart(pokemon) {
      this.singleEvent("TerrainChange", this.effect, this.effectState, pokemon);
    },
    onTerrainChange(pokemon) {
      let types;
      switch (this.field.terrain) {
        case "electricterrain":
          types = ["Electric"];
          break;
        case "grassyterrain":
          types = ["Grass"];
          break;
        case "mistyterrain":
          types = ["Fairy"];
          break;
        case "psychicterrain":
          types = ["Psychic"];
          break;
        default:
          types = pokemon.baseSpecies.types;
      }
      const oldTypes = pokemon.getTypes();
      if (oldTypes.join() === types.join() || !pokemon.setType(types))
        return;
      if (this.field.terrain || pokemon.transformed) {
        this.add("-start", pokemon, "typechange", types.join("/"), "[from] ability: Mimicry");
        if (!this.field.terrain)
          this.hint("Transform Mimicry changes you to your original un-transformed types.");
      } else {
        this.add("-activate", pokemon, "ability: Mimicry");
        this.add("-end", pokemon, "typechange", "[silent]");
      }
    },
    name: "Mimicry",
    rating: 0,
    num: 250
  },
  minus: {
    onModifySpAPriority: 5,
    onModifySpA(spa, pokemon) {
      for (const allyActive of pokemon.allies()) {
        if (allyActive.hasAbility(["minus", "plus"])) {
          return this.chainModify(1.5);
        }
      }
    },
    name: "Minus",
    rating: 0,
    num: 58
  },
  mirrorarmor: {
    onTryBoost(boost, target, source, effect) {
      if (!source || target === source || !boost || effect.name === "Mirror Armor")
        return;
      let b;
      for (b in boost) {
        if (boost[b] < 0) {
          if (target.boosts[b] === -6)
            continue;
          const negativeBoost = {};
          negativeBoost[b] = boost[b];
          delete boost[b];
          if (source.hp) {
            this.add("-ability", target, "Mirror Armor");
            this.boost(negativeBoost, source, target, null, true);
          }
        }
      }
    },
    isBreakable: true,
    name: "Mirror Armor",
    rating: 2,
    num: 240
  },
  mistysurge: {
    onStart(source) {
      this.field.setTerrain("mistyterrain");
    },
    name: "Misty Surge",
    rating: 3.5,
    num: 228
  },
  moldbreaker: {
    onStart(pokemon) {
      this.add("-ability", pokemon, "Mold Breaker");
    },
    onModifyMove(move) {
      move.ignoreAbility = true;
    },
    name: "Mold Breaker",
    rating: 3,
    num: 104
  },
  moody: {
    onResidualOrder: 28,
    onResidualSubOrder: 2,
    onResidual(pokemon) {
      let stats = [];
      const boost = {};
      let statPlus;
      for (statPlus in pokemon.boosts) {
        if (statPlus === "accuracy" || statPlus === "evasion")
          continue;
        if (pokemon.boosts[statPlus] < 6) {
          stats.push(statPlus);
        }
      }
      let randomStat = stats.length ? this.sample(stats) : void 0;
      if (randomStat)
        boost[randomStat] = 2;
      stats = [];
      let statMinus;
      for (statMinus in pokemon.boosts) {
        if (statMinus === "accuracy" || statMinus === "evasion")
          continue;
        if (pokemon.boosts[statMinus] > -6 && statMinus !== randomStat) {
          stats.push(statMinus);
        }
      }
      randomStat = stats.length ? this.sample(stats) : void 0;
      if (randomStat)
        boost[randomStat] = -1;
      this.boost(boost, pokemon, pokemon);
    },
    name: "Moody",
    rating: 5,
    num: 141
  },
  motordrive: {
    onTryHit(target, source, move) {
      if (target !== source && move.type === "Electric") {
        if (!this.boost({ spe: 1 })) {
          this.add("-immune", target, "[from] ability: Motor Drive");
        }
        return null;
      }
    },
    isBreakable: true,
    name: "Motor Drive",
    rating: 3,
    num: 78
  },
  moxie: {
    onSourceAfterFaint(length, target, source, effect) {
      if (effect && effect.effectType === "Move") {
        this.boost({ atk: length }, source);
      }
    },
    name: "Moxie",
    rating: 3,
    num: 153
  },
  multiscale: {
    onSourceModifyDamage(damage, source, target, move) {
      if (target.hp >= target.maxhp) {
        this.debug("Multiscale weaken");
        return this.chainModify(0.5);
      }
    },
    isBreakable: true,
    name: "Multiscale",
    rating: 3.5,
    num: 136
  },
  multitype: {
    // Multitype's type-changing itself is implemented in statuses.js
    isPermanent: true,
    name: "Multitype",
    rating: 4,
    num: 121
  },
  mummy: {
    name: "Mummy",
    onDamagingHit(damage, target, source, move) {
      const sourceAbility = source.getAbility();
      if (sourceAbility.isPermanent || sourceAbility.id === "mummy") {
        return;
      }
      if (this.checkMoveMakesContact(move, source, target, !source.isAlly(target))) {
        const oldAbility = source.setAbility("mummy", target);
        if (oldAbility) {
          this.add("-activate", target, "ability: Mummy", this.dex.abilities.get(oldAbility).name, "[of] " + source);
        }
      }
    },
    rating: 2,
    num: 152
  },
  myceliummight: {
    onFractionalPriorityPriority: -1,
    onFractionalPriority(priority, pokemon, target, move) {
      if (move.category === "Status") {
        return -0.1;
      }
    },
    onModifyMove(move) {
      if (move.category === "Status") {
        move.ignoreAbility = true;
      }
    },
    name: "Mycelium Might",
    rating: 2,
    num: 298
  },
  naturalcure: {
    onCheckShow(pokemon) {
      if (pokemon.side.active.length === 1)
        return;
      if (pokemon.showCure === true || pokemon.showCure === false)
        return;
      const cureList = [];
      let noCureCount = 0;
      for (const curPoke of pokemon.side.active) {
        if (!curPoke?.status) {
          continue;
        }
        if (curPoke.showCure) {
          continue;
        }
        const species = curPoke.species;
        if (!Object.values(species.abilities).includes("Natural Cure")) {
          continue;
        }
        if (!species.abilities["1"] && !species.abilities["H"]) {
          continue;
        }
        if (curPoke !== pokemon && !this.queue.willSwitch(curPoke)) {
          continue;
        }
        if (curPoke.hasAbility("naturalcure")) {
          cureList.push(curPoke);
        } else {
          noCureCount++;
        }
      }
      if (!cureList.length || !noCureCount) {
        for (const pkmn of cureList) {
          pkmn.showCure = true;
        }
      } else {
        this.add("-message", "(" + cureList.length + " of " + pokemon.side.name + "'s pokemon " + (cureList.length === 1 ? "was" : "were") + " cured by Natural Cure.)");
        for (const pkmn of cureList) {
          pkmn.showCure = false;
        }
      }
    },
    onSwitchOut(pokemon) {
      if (!pokemon.status)
        return;
      if (pokemon.showCure === void 0)
        pokemon.showCure = true;
      if (pokemon.showCure)
        this.add("-curestatus", pokemon, pokemon.status, "[from] ability: Natural Cure");
      pokemon.clearStatus();
      if (!pokemon.showCure)
        pokemon.showCure = void 0;
    },
    name: "Natural Cure",
    rating: 2.5,
    num: 30
  },
  neuroforce: {
    onModifyDamage(damage, source, target, move) {
      if (move && target.getMoveHitData(move).typeMod > 0) {
        return this.chainModify([5120, 4096]);
      }
    },
    name: "Neuroforce",
    rating: 2.5,
    num: 233
  },
  neutralizinggas: {
    // Ability suppression implemented in sim/pokemon.ts:Pokemon#ignoringAbility
    onPreStart(pokemon) {
      if (pokemon.transformed)
        return;
      this.add("-ability", pokemon, "Neutralizing Gas");
      pokemon.abilityState.ending = false;
      const strongWeathers = ["desolateland", "primordialsea", "deltastream"];
      for (const target of this.getAllActive()) {
        if (target.hasItem("Ability Shield")) {
          this.add("-block", target, "item: Ability Shield");
          continue;
        }
        if (target.illusion) {
          this.singleEvent("End", this.dex.abilities.get("Illusion"), target.abilityState, target, pokemon, "neutralizinggas");
        }
        if (target.volatiles["slowstart"]) {
          delete target.volatiles["slowstart"];
          this.add("-end", target, "Slow Start", "[silent]");
        }
        if (strongWeathers.includes(target.getAbility().id)) {
          this.singleEvent("End", this.dex.abilities.get(target.getAbility().id), target.abilityState, target, pokemon, "neutralizinggas");
        }
      }
    },
    onEnd(source) {
      if (source.transformed)
        return;
      for (const pokemon of this.getAllActive()) {
        if (pokemon !== source && pokemon.hasAbility("Neutralizing Gas")) {
          return;
        }
      }
      this.add("-end", source, "ability: Neutralizing Gas");
      if (source.abilityState.ending)
        return;
      source.abilityState.ending = true;
      const sortedActive = this.getAllActive();
      this.speedSort(sortedActive);
      for (const pokemon of sortedActive) {
        if (pokemon !== source) {
          if (pokemon.getAbility().isPermanent)
            continue;
          this.singleEvent("Start", pokemon.getAbility(), pokemon.abilityState, pokemon);
          if (pokemon.ability === "gluttony") {
            pokemon.abilityState.gluttony = false;
          }
        }
      }
    },
    name: "Neutralizing Gas",
    rating: 4,
    num: 256
  },
  noguard: {
    onAnyInvulnerabilityPriority: 1,
    onAnyInvulnerability(target, source, move) {
      if (move && (source === this.effectState.target || target === this.effectState.target))
        return 0;
    },
    onAnyAccuracy(accuracy, target, source, move) {
      if (move && (source === this.effectState.target || target === this.effectState.target)) {
        return true;
      }
      return accuracy;
    },
    name: "No Guard",
    rating: 4,
    num: 99
  },
  normalize: {
    onModifyTypePriority: 1,
    onModifyType(move, pokemon) {
      const noModifyType = [
        "hiddenpower",
        "judgment",
        "multiattack",
        "naturalgift",
        "revelationdance",
        "struggle",
        "technoblast",
        "terrainpulse",
        "weatherball"
      ];
      if (!(move.isZ && move.category !== "Status") && !noModifyType.includes(move.id) && // TODO: Figure out actual interaction
      !(move.name === "Tera Blast" && pokemon.terastallized)) {
        move.type = "Normal";
        move.typeChangerBoosted = this.effect;
      }
    },
    onBasePowerPriority: 23,
    onBasePower(basePower, pokemon, target, move) {
      if (move.typeChangerBoosted === this.effect)
        return this.chainModify([4915, 4096]);
    },
    name: "Normalize",
    rating: 0,
    num: 96
  },
  oblivious: {
    onUpdate(pokemon) {
      if (pokemon.volatiles["attract"]) {
        this.add("-activate", pokemon, "ability: Oblivious");
        pokemon.removeVolatile("attract");
        this.add("-end", pokemon, "move: Attract", "[from] ability: Oblivious");
      }
      if (pokemon.volatiles["taunt"]) {
        this.add("-activate", pokemon, "ability: Oblivious");
        pokemon.removeVolatile("taunt");
      }
    },
    onImmunity(type, pokemon) {
      if (type === "attract")
        return false;
    },
    onTryHit(pokemon, target, move) {
      if (move.id === "attract" || move.id === "captivate" || move.id === "taunt") {
        this.add("-immune", pokemon, "[from] ability: Oblivious");
        return null;
      }
    },
    onTryBoost(boost, target, source, effect) {
      if (effect.name === "Intimidate" && boost.atk) {
        delete boost.atk;
        this.add("-fail", target, "unboost", "Attack", "[from] ability: Oblivious", "[of] " + target);
      }
    },
    isBreakable: true,
    name: "Oblivious",
    rating: 1.5,
    num: 12
  },
  opportunist: {
    onFoeAfterBoost(boost, target, source, effect) {
      if (effect?.name === "Opportunist" || effect?.name === "Mirror Herb")
        return;
      const pokemon = this.effectState.target;
      const positiveBoosts = {};
      let i;
      for (i in boost) {
        if (boost[i] > 0) {
          positiveBoosts[i] = boost[i];
        }
      }
      if (Object.keys(positiveBoosts).length < 1)
        return;
      this.boost(positiveBoosts, pokemon);
    },
    name: "Opportunist",
    rating: 3,
    num: 290
  },
  orichalcumpulse: {
    onStart(pokemon) {
      if (this.field.setWeather("sunnyday")) {
        this.add("-activate", pokemon, "Orichalcum Pulse", "[source]");
      } else if (this.field.isWeather("sunnyday")) {
        this.add("-activate", pokemon, "ability: Orichalcum Pulse");
      }
    },
    onModifyAtkPriority: 5,
    onModifyAtk(atk, pokemon) {
      if (["sunnyday", "desolateland"].includes(pokemon.effectiveWeather())) {
        this.debug("Orichalcum boost");
        return this.chainModify([5461, 4096]);
      }
    },
    name: "Orichalcum Pulse",
    rating: 4.5,
    num: 288
  },
  overcoat: {
    onImmunity(type, pokemon) {
      if (type === "sandstorm" || type === "hail" || type === "powder")
        return false;
    },
    onTryHitPriority: 1,
    onTryHit(target, source, move) {
      if (move.flags["powder"] && target !== source && this.dex.getImmunity("powder", target)) {
        this.add("-immune", target, "[from] ability: Overcoat");
        return null;
      }
    },
    isBreakable: true,
    name: "Overcoat",
    rating: 2,
    num: 142
  },
  overgrow: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Grass" && attacker.hp <= attacker.maxhp / 3) {
        this.debug("Overgrow boost");
        return this.chainModify(1.5);
      }
    },
    onModifySpAPriority: 5,
    onModifySpA(atk, attacker, defender, move) {
      if (move.type === "Grass" && attacker.hp <= attacker.maxhp / 3) {
        this.debug("Overgrow boost");
        return this.chainModify(1.5);
      }
    },
    name: "Overgrow",
    rating: 2,
    num: 65
  },
  owntempo: {
    onUpdate(pokemon) {
      if (pokemon.volatiles["confusion"]) {
        this.add("-activate", pokemon, "ability: Own Tempo");
        pokemon.removeVolatile("confusion");
      }
    },
    onTryAddVolatile(status, pokemon) {
      if (status.id === "confusion")
        return null;
    },
    onHit(target, source, move) {
      if (move?.volatileStatus === "confusion") {
        this.add("-immune", target, "confusion", "[from] ability: Own Tempo");
      }
    },
    onTryBoost(boost, target, source, effect) {
      if (effect.name === "Intimidate" && boost.atk) {
        delete boost.atk;
        this.add("-fail", target, "unboost", "Attack", "[from] ability: Own Tempo", "[of] " + target);
      }
    },
    isBreakable: true,
    name: "Own Tempo",
    rating: 1.5,
    num: 20
  },
  parentalbond: {
    onPrepareHit(source, target, move) {
      if (move.category === "Status" || move.multihit || move.flags["noparentalbond"] || move.flags["charge"] || move.flags["futuremove"] || move.spreadHit || move.isZ || move.isMax)
        return;
      move.multihit = 2;
      move.multihitType = "parentalbond";
    },
    // Damage modifier implemented in BattleActions#modifyDamage()
    onSourceModifySecondaries(secondaries, target, source, move) {
      if (move.multihitType === "parentalbond" && move.id === "secretpower" && move.hit < 2) {
        return secondaries.filter((effect) => effect.volatileStatus === "flinch");
      }
    },
    name: "Parental Bond",
    rating: 4.5,
    num: 185
  },
  pastelveil: {
    onStart(pokemon) {
      for (const ally of pokemon.alliesAndSelf()) {
        if (["psn", "tox"].includes(ally.status)) {
          this.add("-activate", pokemon, "ability: Pastel Veil");
          ally.cureStatus();
        }
      }
    },
    onUpdate(pokemon) {
      if (["psn", "tox"].includes(pokemon.status)) {
        this.add("-activate", pokemon, "ability: Pastel Veil");
        pokemon.cureStatus();
      }
    },
    onAllySwitchIn(pokemon) {
      if (["psn", "tox"].includes(pokemon.status)) {
        this.add("-activate", this.effectState.target, "ability: Pastel Veil");
        pokemon.cureStatus();
      }
    },
    onSetStatus(status, target, source, effect) {
      if (!["psn", "tox"].includes(status.id))
        return;
      if (effect?.status) {
        this.add("-immune", target, "[from] ability: Pastel Veil");
      }
      return false;
    },
    onAllySetStatus(status, target, source, effect) {
      if (!["psn", "tox"].includes(status.id))
        return;
      if (effect?.status) {
        const effectHolder = this.effectState.target;
        this.add("-block", target, "ability: Pastel Veil", "[of] " + effectHolder);
      }
      return false;
    },
    isBreakable: true,
    name: "Pastel Veil",
    rating: 2,
    num: 257
  },
  perishbody: {
    onDamagingHit(damage, target, source, move) {
      if (!this.checkMoveMakesContact(move, source, target))
        return;
      let announced = false;
      for (const pokemon of [target, source]) {
        if (pokemon.volatiles["perishsong"])
          continue;
        if (!announced) {
          this.add("-ability", target, "Perish Body");
          announced = true;
        }
        pokemon.addVolatile("perishsong");
      }
    },
    name: "Perish Body",
    rating: 1,
    num: 253
  },
  pickpocket: {
    onAfterMoveSecondary(target, source, move) {
      if (source && source !== target && move?.flags["contact"]) {
        if (target.item || target.switchFlag || target.forceSwitchFlag || source.switchFlag === true) {
          return;
        }
        const yourItem = source.takeItem(target);
        if (!yourItem) {
          return;
        }
        if (!target.setItem(yourItem)) {
          source.item = yourItem.id;
          return;
        }
        this.add("-enditem", source, yourItem, "[silent]", "[from] ability: Pickpocket", "[of] " + source);
        this.add("-item", target, yourItem, "[from] ability: Pickpocket", "[of] " + source);
      }
    },
    name: "Pickpocket",
    rating: 1,
    num: 124
  },
  pickup: {
    onResidualOrder: 28,
    onResidualSubOrder: 2,
    onResidual(pokemon) {
      if (pokemon.item)
        return;
      const pickupTargets = this.getAllActive().filter((target) => target.lastItem && target.usedItemThisTurn && pokemon.isAdjacent(target));
      if (!pickupTargets.length)
        return;
      const randomTarget = this.sample(pickupTargets);
      const item = randomTarget.lastItem;
      randomTarget.lastItem = "";
      this.add("-item", pokemon, this.dex.items.get(item), "[from] ability: Pickup");
      pokemon.setItem(item);
    },
    name: "Pickup",
    rating: 0.5,
    num: 53
  },
  pixilate: {
    onModifyTypePriority: -1,
    onModifyType(move, pokemon) {
      const noModifyType = [
        "judgment",
        "multiattack",
        "naturalgift",
        "revelationdance",
        "technoblast",
        "terrainpulse",
        "weatherball"
      ];
      if (move.type === "Normal" && !noModifyType.includes(move.id) && !(move.isZ && move.category !== "Status") && !(move.name === "Tera Blast" && pokemon.terastallized)) {
        move.type = "Fairy";
        move.typeChangerBoosted = this.effect;
      }
    },
    onBasePowerPriority: 23,
    onBasePower(basePower, pokemon, target, move) {
      if (move.typeChangerBoosted === this.effect)
        return this.chainModify([4915, 4096]);
    },
    name: "Pixilate",
    rating: 4,
    num: 182
  },
  plus: {
    onModifySpAPriority: 5,
    onModifySpA(spa, pokemon) {
      for (const allyActive of pokemon.allies()) {
        if (allyActive.hasAbility(["minus", "plus"])) {
          return this.chainModify(1.5);
        }
      }
    },
    name: "Plus",
    rating: 0,
    num: 57
  },
  poisonheal: {
    onDamagePriority: 1,
    onDamage(damage, target, source, effect) {
      if (effect.id === "psn" || effect.id === "tox") {
        this.heal(target.baseMaxhp / 8);
        return false;
      }
    },
    name: "Poison Heal",
    rating: 4,
    num: 90
  },
  poisonpoint: {
    onDamagingHit(damage, target, source, move) {
      if (this.checkMoveMakesContact(move, source, target)) {
        if (this.randomChance(3, 10)) {
          source.trySetStatus("psn", target);
        }
      }
    },
    name: "Poison Point",
    rating: 1.5,
    num: 38
  },
  poisontouch: {
    // upokecenter says this is implemented as an added secondary effect
    onModifyMove(move) {
      if (!move?.flags["contact"] || move.target === "self")
        return;
      if (!move.secondaries) {
        move.secondaries = [];
      }
      move.secondaries.push({
        chance: 30,
        status: "psn",
        ability: this.dex.abilities.get("poisontouch")
      });
    },
    name: "Poison Touch",
    rating: 2,
    num: 143
  },
  powerconstruct: {
    onResidualOrder: 29,
    onResidual(pokemon) {
      if (pokemon.baseSpecies.baseSpecies !== "Zygarde" || pokemon.transformed || !pokemon.hp)
        return;
      if (pokemon.species.id === "zygardecomplete" || pokemon.hp > pokemon.maxhp / 2)
        return;
      this.add("-activate", pokemon, "ability: Power Construct");
      pokemon.formeChange("Zygarde-Complete", this.effect, true);
      pokemon.baseMaxhp = Math.floor(Math.floor(
        2 * pokemon.species.baseStats["hp"] + pokemon.set.ivs["hp"] + Math.floor(pokemon.set.evs["hp"] / 4) + 100
      ) * pokemon.level / 100 + 10);
      const newMaxHP = pokemon.volatiles["dynamax"] ? 2 * pokemon.baseMaxhp : pokemon.baseMaxhp;
      pokemon.hp = newMaxHP - (pokemon.maxhp - pokemon.hp);
      pokemon.maxhp = newMaxHP;
      this.add("-heal", pokemon, pokemon.getHealth, "[silent]");
    },
    isPermanent: true,
    name: "Power Construct",
    rating: 5,
    num: 211
  },
  powerofalchemy: {
    onAllyFaint(target) {
      if (!this.effectState.target.hp)
        return;
      const ability = target.getAbility();
      const additionalBannedAbilities = [
        "noability",
        "flowergift",
        "forecast",
        "hungerswitch",
        "illusion",
        "imposter",
        "neutralizinggas",
        "powerofalchemy",
        "receiver",
        "trace",
        "wonderguard"
      ];
      if (target.getAbility().isPermanent || additionalBannedAbilities.includes(target.ability))
        return;
      if (this.effectState.target.setAbility(ability)) {
        this.add("-ability", this.effectState.target, ability, "[from] ability: Power of Alchemy", "[of] " + target);
      }
    },
    name: "Power of Alchemy",
    rating: 0,
    num: 223
  },
  powerspot: {
    onAllyBasePowerPriority: 22,
    onAllyBasePower(basePower, attacker, defender, move) {
      if (attacker !== this.effectState.target) {
        this.debug("Power Spot boost");
        return this.chainModify([5325, 4096]);
      }
    },
    name: "Power Spot",
    rating: 0,
    num: 249
  },
  prankster: {
    onModifyPriority(priority, pokemon, target, move) {
      if (move?.category === "Status") {
        move.pranksterBoosted = true;
        return priority + 1;
      }
    },
    name: "Prankster",
    rating: 4,
    num: 158
  },
  pressure: {
    onStart(pokemon) {
      this.add("-ability", pokemon, "Pressure");
    },
    onDeductPP(target, source) {
      if (target.isAlly(source))
        return;
      return 1;
    },
    name: "Pressure",
    rating: 2.5,
    num: 46
  },
  primordialsea: {
    onStart(source) {
      this.field.setWeather("primordialsea");
    },
    onAnySetWeather(target, source, weather) {
      const strongWeathers = ["desolateland", "primordialsea", "deltastream"];
      if (this.field.getWeather().id === "primordialsea" && !strongWeathers.includes(weather.id))
        return false;
    },
    onEnd(pokemon) {
      if (this.field.weatherState.source !== pokemon)
        return;
      for (const target of this.getAllActive()) {
        if (target === pokemon)
          continue;
        if (target.hasAbility("primordialsea")) {
          this.field.weatherState.source = target;
          return;
        }
      }
      this.field.clearWeather();
    },
    name: "Primordial Sea",
    rating: 4.5,
    num: 189
  },
  prismarmor: {
    onSourceModifyDamage(damage, source, target, move) {
      if (target.getMoveHitData(move).typeMod > 0) {
        this.debug("Prism Armor neutralize");
        return this.chainModify(0.75);
      }
    },
    name: "Prism Armor",
    rating: 3,
    num: 232
  },
  propellertail: {
    onModifyMovePriority: 1,
    onModifyMove(move) {
      move.tracksTarget = move.target !== "scripted";
    },
    name: "Propeller Tail",
    rating: 0,
    num: 239
  },
  protean: {
    onPrepareHit(source, target, move) {
      if (this.effectState.protean)
        return;
      if (move.hasBounced || move.flags["futuremove"] || move.sourceEffect === "snatch")
        return;
      const type = move.type;
      if (type && type !== "???" && source.getTypes().join() !== type) {
        if (!source.setType(type))
          return;
        this.effectState.protean = true;
        this.add("-start", source, "typechange", type, "[from] ability: Protean");
      }
    },
    onSwitchIn(pokemon) {
      delete this.effectState.protean;
    },
    name: "Protean",
    rating: 4,
    num: 168
  },
  protosynthesis: {
    onStart(pokemon) {
      this.singleEvent("WeatherChange", this.effect, this.effectState, pokemon);
    },
    onWeatherChange(pokemon) {
      if (pokemon.transformed)
        return;
      if (this.field.isWeather("sunnyday")) {
        pokemon.addVolatile("protosynthesis");
      } else if (!pokemon.volatiles["protosynthesis"]?.fromBooster) {
        pokemon.removeVolatile("protosynthesis");
      }
    },
    onEnd(pokemon) {
      delete pokemon.volatiles["protosynthesis"];
      this.add("-end", pokemon, "Protosynthesis", "[silent]");
    },
    condition: {
      noCopy: true,
      onStart(pokemon, source, effect) {
        if (effect?.id === "boosterenergy") {
          this.effectState.fromBooster = true;
          this.add("-activate", pokemon, "ability: Protosynthesis", "[fromitem]");
        } else {
          this.add("-activate", pokemon, "ability: Protosynthesis");
        }
        this.effectState.bestStat = pokemon.getBestStat(false, true);
        this.add("-start", pokemon, "protosynthesis" + this.effectState.bestStat);
      },
      onModifyAtkPriority: 5,
      onModifyAtk(atk, source, target, move) {
        if (this.effectState.bestStat !== "atk")
          return;
        this.debug("Protosynthesis atk boost");
        return this.chainModify([5325, 4096]);
      },
      onModifyDefPriority: 6,
      onModifyDef(def, target, source, move) {
        if (this.effectState.bestStat !== "def")
          return;
        this.debug("Protosynthesis def boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpAPriority: 5,
      onModifySpA(relayVar, source, target, move) {
        if (this.effectState.bestStat !== "spa")
          return;
        this.debug("Protosynthesis spa boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpDPriority: 6,
      onModifySpD(relayVar, target, source, move) {
        if (this.effectState.bestStat !== "spd")
          return;
        this.debug("Protosynthesis spd boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpe(spe, pokemon) {
        if (this.effectState.bestStat !== "spe")
          return;
        this.debug("Protosynthesis spe boost");
        return this.chainModify(1.5);
      },
      onEnd(pokemon) {
        this.add("-end", pokemon, "Protosynthesis");
      }
    },
    isPermanent: true,
    name: "Protosynthesis",
    rating: 3,
    num: 281
  },
  psychicsurge: {
    onStart(source) {
      this.field.setTerrain("psychicterrain");
    },
    name: "Psychic Surge",
    rating: 4,
    num: 227
  },
  punkrock: {
    onBasePowerPriority: 7,
    onBasePower(basePower, attacker, defender, move) {
      if (move.flags["sound"]) {
        this.debug("Punk Rock boost");
        return this.chainModify([5325, 4096]);
      }
    },
    onSourceModifyDamage(damage, source, target, move) {
      if (move.flags["sound"]) {
        this.debug("Punk Rock weaken");
        return this.chainModify(0.5);
      }
    },
    isBreakable: true,
    name: "Punk Rock",
    rating: 3.5,
    num: 244
  },
  purepower: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk) {
      return this.chainModify(2);
    },
    name: "Pure Power",
    rating: 5,
    num: 74
  },
  purifyingsalt: {
    onSetStatus(status, target, source, effect) {
      if (effect?.status) {
        this.add("-immune", target, "[from] ability: Purifying Salt");
      }
      return false;
    },
    onTryAddVolatile(status, target) {
      if (status.id === "yawn") {
        this.add("-immune", target, "[from] ability: Purifying Salt");
        return null;
      }
    },
    onSourceModifyAtkPriority: 6,
    onSourceModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Ghost") {
        this.debug("Purifying Salt weaken");
        return this.chainModify(0.5);
      }
    },
    onSourceModifySpAPriority: 5,
    onSourceModifySpA(spa, attacker, defender, move) {
      if (move.type === "Ghost") {
        this.debug("Purifying Salt weaken");
        return this.chainModify(0.5);
      }
    },
    isBreakable: true,
    name: "Purifying Salt",
    rating: 4,
    num: 272
  },
  quarkdrive: {
    onStart(pokemon) {
      this.singleEvent("TerrainChange", this.effect, this.effectState, pokemon);
    },
    onTerrainChange(pokemon) {
      if (pokemon.transformed)
        return;
      if (this.field.isTerrain("electricterrain")) {
        pokemon.addVolatile("quarkdrive");
      } else if (!pokemon.volatiles["quarkdrive"]?.fromBooster) {
        pokemon.removeVolatile("quarkdrive");
      }
    },
    onEnd(pokemon) {
      delete pokemon.volatiles["quarkdrive"];
      this.add("-end", pokemon, "Quark Drive", "[silent]");
    },
    condition: {
      noCopy: true,
      onStart(pokemon, source, effect) {
        if (effect?.id === "boosterenergy") {
          this.effectState.fromBooster = true;
          this.add("-activate", pokemon, "ability: Quark Drive", "[fromitem]");
        } else {
          this.add("-activate", pokemon, "ability: Quark Drive");
        }
        this.effectState.bestStat = pokemon.getBestStat(false, true);
        this.add("-start", pokemon, "quarkdrive" + this.effectState.bestStat);
      },
      onModifyAtkPriority: 5,
      onModifyAtk(atk, source, target, move) {
        if (this.effectState.bestStat !== "atk")
          return;
        this.debug("Quark Drive atk boost");
        return this.chainModify([5325, 4096]);
      },
      onModifyDefPriority: 6,
      onModifyDef(def, target, source, move) {
        if (this.effectState.bestStat !== "def")
          return;
        this.debug("Quark Drive def boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpAPriority: 5,
      onModifySpA(relayVar, source, target, move) {
        if (this.effectState.bestStat !== "spa")
          return;
        this.debug("Quark Drive spa boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpDPriority: 6,
      onModifySpD(relayVar, target, source, move) {
        if (this.effectState.bestStat !== "spd")
          return;
        this.debug("Quark Drive spd boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpe(spe, pokemon) {
        if (this.effectState.bestStat !== "spe")
          return;
        this.debug("Quark Drive spe boost");
        return this.chainModify(1.5);
      },
      onEnd(pokemon) {
        this.add("-end", pokemon, "Quark Drive");
      }
    },
    isPermanent: true,
    name: "Quark Drive",
    rating: 3,
    num: 282
  },
  queenlymajesty: {
    onFoeTryMove(target, source, move) {
      const targetAllExceptions = ["perishsong", "flowershield", "rototiller"];
      if (move.target === "foeSide" || move.target === "all" && !targetAllExceptions.includes(move.id)) {
        return;
      }
      const dazzlingHolder = this.effectState.target;
      if ((source.isAlly(dazzlingHolder) || move.target === "all") && move.priority > 0.1) {
        this.attrLastMove("[still]");
        this.add("cant", dazzlingHolder, "ability: Queenly Majesty", move, "[of] " + target);
        return false;
      }
    },
    isBreakable: true,
    name: "Queenly Majesty",
    rating: 2.5,
    num: 214
  },
  quickdraw: {
    onFractionalPriorityPriority: -1,
    onFractionalPriority(priority, pokemon, target, move) {
      if (move.category !== "Status" && this.randomChance(3, 10)) {
        this.add("-activate", pokemon, "ability: Quick Draw");
        return 0.1;
      }
    },
    name: "Quick Draw",
    rating: 2.5,
    num: 259
  },
  quickfeet: {
    onModifySpe(spe, pokemon) {
      if (pokemon.status) {
        return this.chainModify(1.5);
      }
    },
    name: "Quick Feet",
    rating: 2.5,
    num: 95
  },
  raindish: {
    onWeather(target, source, effect) {
      if (target.hasItem("utilityumbrella"))
        return;
      if (effect.id === "raindance" || effect.id === "primordialsea") {
        this.heal(target.baseMaxhp / 16);
      }
    },
    name: "Rain Dish",
    rating: 1.5,
    num: 44
  },
  rattled: {
    onDamagingHit(damage, target, source, move) {
      if (["Dark", "Bug", "Ghost"].includes(move.type)) {
        this.boost({ spe: 1 });
      }
    },
    onAfterBoost(boost, target, source, effect) {
      if (effect?.name === "Intimidate") {
        this.boost({ spe: 1 });
      }
    },
    name: "Rattled",
    rating: 1,
    num: 155
  },
  receiver: {
    onAllyFaint(target) {
      if (!this.effectState.target.hp)
        return;
      const ability = target.getAbility();
      const additionalBannedAbilities = [
        "noability",
        "flowergift",
        "forecast",
        "hungerswitch",
        "illusion",
        "imposter",
        "neutralizinggas",
        "powerofalchemy",
        "receiver",
        "trace",
        "wonderguard"
      ];
      if (target.getAbility().isPermanent || additionalBannedAbilities.includes(target.ability))
        return;
      if (this.effectState.target.setAbility(ability)) {
        this.add("-ability", this.effectState.target, ability, "[from] ability: Receiver", "[of] " + target);
      }
    },
    name: "Receiver",
    rating: 0,
    num: 222
  },
  reckless: {
    onBasePowerPriority: 23,
    onBasePower(basePower, attacker, defender, move) {
      if (move.recoil || move.hasCrashDamage) {
        this.debug("Reckless boost");
        return this.chainModify([4915, 4096]);
      }
    },
    name: "Reckless",
    rating: 3,
    num: 120
  },
  refrigerate: {
    onModifyTypePriority: -1,
    onModifyType(move, pokemon) {
      const noModifyType = [
        "judgment",
        "multiattack",
        "naturalgift",
        "revelationdance",
        "technoblast",
        "terrainpulse",
        "weatherball"
      ];
      if (move.type === "Normal" && !noModifyType.includes(move.id) && !(move.isZ && move.category !== "Status") && !(move.name === "Tera Blast" && pokemon.terastallized)) {
        move.type = "Ice";
        move.typeChangerBoosted = this.effect;
      }
    },
    onBasePowerPriority: 23,
    onBasePower(basePower, pokemon, target, move) {
      if (move.typeChangerBoosted === this.effect)
        return this.chainModify([4915, 4096]);
    },
    name: "Refrigerate",
    rating: 4,
    num: 174
  },
  regenerator: {
    onSwitchOut(pokemon) {
      pokemon.heal(pokemon.baseMaxhp / 3);
    },
    name: "Regenerator",
    rating: 4.5,
    num: 144
  },
  ripen: {
    onTryHeal(damage, target, source, effect) {
      if (!effect)
        return;
      if (effect.name === "Berry Juice" || effect.name === "Leftovers") {
        this.add("-activate", target, "ability: Ripen");
      }
      if (effect.isBerry)
        return this.chainModify(2);
    },
    onChangeBoost(boost, target, source, effect) {
      if (effect && effect.isBerry) {
        let b;
        for (b in boost) {
          boost[b] *= 2;
        }
      }
    },
    onSourceModifyDamagePriority: -1,
    onSourceModifyDamage(damage, source, target, move) {
      if (target.abilityState.berryWeaken) {
        target.abilityState.berryWeaken = false;
        return this.chainModify(0.5);
      }
    },
    onTryEatItemPriority: -1,
    onTryEatItem(item, pokemon) {
      this.add("-activate", pokemon, "ability: Ripen");
    },
    onEatItem(item, pokemon) {
      const weakenBerries = [
        "Babiri Berry",
        "Charti Berry",
        "Chilan Berry",
        "Chople Berry",
        "Coba Berry",
        "Colbur Berry",
        "Haban Berry",
        "Kasib Berry",
        "Kebia Berry",
        "Occa Berry",
        "Passho Berry",
        "Payapa Berry",
        "Rindo Berry",
        "Roseli Berry",
        "Shuca Berry",
        "Tanga Berry",
        "Wacan Berry",
        "Yache Berry"
      ];
      pokemon.abilityState.berryWeaken = weakenBerries.includes(item.name);
    },
    name: "Ripen",
    rating: 2,
    num: 247
  },
  rivalry: {
    onBasePowerPriority: 24,
    onBasePower(basePower, attacker, defender, move) {
      if (attacker.gender && defender.gender) {
        if (attacker.gender === defender.gender) {
          this.debug("Rivalry boost");
          return this.chainModify(1.25);
        } else {
          this.debug("Rivalry weaken");
          return this.chainModify(0.75);
        }
      }
    },
    name: "Rivalry",
    rating: 0,
    num: 79
  },
  rkssystem: {
    // RKS System's type-changing itself is implemented in statuses.js
    isPermanent: true,
    name: "RKS System",
    rating: 4,
    num: 225
  },
  rockhead: {
    onDamage(damage, target, source, effect) {
      if (effect.id === "recoil") {
        if (!this.activeMove)
          throw new Error("Battle.activeMove is null");
        if (this.activeMove.id !== "struggle")
          return null;
      }
    },
    name: "Rock Head",
    rating: 3,
    num: 69
  },
  rockypayload: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Rock") {
        this.debug("Rocky Payload boost");
        return this.chainModify(1.5);
      }
    },
    onModifySpAPriority: 5,
    onModifySpA(atk, attacker, defender, move) {
      if (move.type === "Rock") {
        this.debug("Rocky Payload boost");
        return this.chainModify(1.5);
      }
    },
    name: "Rocky Payload",
    rating: 3.5,
    num: 276
  },
  roughskin: {
    onDamagingHitOrder: 1,
    onDamagingHit(damage, target, source, move) {
      if (this.checkMoveMakesContact(move, source, target, true)) {
        this.damage(source.baseMaxhp / 8, source, target);
      }
    },
    name: "Rough Skin",
    rating: 2.5,
    num: 24
  },
  runaway: {
    name: "Run Away",
    rating: 0,
    num: 50
  },
  sandforce: {
    onBasePowerPriority: 21,
    onBasePower(basePower, attacker, defender, move) {
      if (this.field.isWeather("sandstorm")) {
        if (move.type === "Rock" || move.type === "Ground" || move.type === "Steel") {
          this.debug("Sand Force boost");
          return this.chainModify([5325, 4096]);
        }
      }
    },
    onImmunity(type, pokemon) {
      if (type === "sandstorm")
        return false;
    },
    name: "Sand Force",
    rating: 2,
    num: 159
  },
  sandrush: {
    onModifySpe(spe, pokemon) {
      if (this.field.isWeather("sandstorm")) {
        return this.chainModify(2);
      }
    },
    onImmunity(type, pokemon) {
      if (type === "sandstorm")
        return false;
    },
    name: "Sand Rush",
    rating: 3,
    num: 146
  },
  sandspit: {
    onDamagingHit(damage, target, source, move) {
      this.field.setWeather("sandstorm");
    },
    name: "Sand Spit",
    rating: 1,
    num: 245
  },
  sandstream: {
    onStart(source) {
      this.field.setWeather("sandstorm");
    },
    name: "Sand Stream",
    rating: 4,
    num: 45
  },
  sandveil: {
    onImmunity(type, pokemon) {
      if (type === "sandstorm")
        return false;
    },
    onModifyAccuracyPriority: -1,
    onModifyAccuracy(accuracy) {
      if (typeof accuracy !== "number")
        return;
      if (this.field.isWeather("sandstorm")) {
        this.debug("Sand Veil - decreasing accuracy");
        return this.chainModify([3277, 4096]);
      }
    },
    isBreakable: true,
    name: "Sand Veil",
    rating: 1.5,
    num: 8
  },
  sapsipper: {
    onTryHitPriority: 1,
    onTryHit(target, source, move) {
      if (target !== source && move.type === "Grass") {
        if (!this.boost({ atk: 1 })) {
          this.add("-immune", target, "[from] ability: Sap Sipper");
        }
        return null;
      }
    },
    onAllyTryHitSide(target, source, move) {
      if (source === this.effectState.target || !target.isAlly(source))
        return;
      if (move.type === "Grass") {
        this.boost({ atk: 1 }, this.effectState.target);
      }
    },
    isBreakable: true,
    name: "Sap Sipper",
    rating: 3,
    num: 157
  },
  schooling: {
    onStart(pokemon) {
      if (pokemon.baseSpecies.baseSpecies !== "Wishiwashi" || pokemon.level < 20 || pokemon.transformed)
        return;
      if (pokemon.hp > pokemon.maxhp / 4) {
        if (pokemon.species.id === "wishiwashi") {
          pokemon.formeChange("Wishiwashi-School");
        }
      } else {
        if (pokemon.species.id === "wishiwashischool") {
          pokemon.formeChange("Wishiwashi");
        }
      }
    },
    onResidualOrder: 29,
    onResidual(pokemon) {
      if (pokemon.baseSpecies.baseSpecies !== "Wishiwashi" || pokemon.level < 20 || pokemon.transformed || !pokemon.hp)
        return;
      if (pokemon.hp > pokemon.maxhp / 4) {
        if (pokemon.species.id === "wishiwashi") {
          pokemon.formeChange("Wishiwashi-School");
        }
      } else {
        if (pokemon.species.id === "wishiwashischool") {
          pokemon.formeChange("Wishiwashi");
        }
      }
    },
    isPermanent: true,
    name: "Schooling",
    rating: 3,
    num: 208
  },
  scrappy: {
    onModifyMovePriority: -5,
    onModifyMove(move) {
      if (!move.ignoreImmunity)
        move.ignoreImmunity = {};
      if (move.ignoreImmunity !== true) {
        move.ignoreImmunity["Fighting"] = true;
        move.ignoreImmunity["Normal"] = true;
      }
    },
    onTryBoost(boost, target, source, effect) {
      if (effect.name === "Intimidate" && boost.atk) {
        delete boost.atk;
        this.add("-fail", target, "unboost", "Attack", "[from] ability: Scrappy", "[of] " + target);
      }
    },
    name: "Scrappy",
    rating: 3,
    num: 113
  },
  screencleaner: {
    onStart(pokemon) {
      let activated = false;
      for (const sideCondition of ["reflect", "lightscreen", "auroraveil"]) {
        for (const side of [pokemon.side, ...pokemon.side.foeSidesWithConditions()]) {
          if (side.getSideCondition(sideCondition)) {
            if (!activated) {
              this.add("-activate", pokemon, "ability: Screen Cleaner");
              activated = true;
            }
            side.removeSideCondition(sideCondition);
          }
        }
      }
    },
    name: "Screen Cleaner",
    rating: 2,
    num: 251
  },
  seedsower: {
    onDamagingHit(damage, target, source, move) {
      this.field.setTerrain("grassyterrain");
    },
    name: "Seed Sower",
    rating: 2.5,
    num: 269
  },
  serenegrace: {
    onModifyMovePriority: -2,
    onModifyMove(move) {
      if (move.secondaries) {
        this.debug("doubling secondary chance");
        for (const secondary of move.secondaries) {
          if (secondary.chance)
            secondary.chance *= 2;
        }
      }
      if (move.self?.chance)
        move.self.chance *= 2;
    },
    name: "Serene Grace",
    rating: 3.5,
    num: 32
  },
  shadowshield: {
    onSourceModifyDamage(damage, source, target, move) {
      if (target.hp >= target.maxhp) {
        this.debug("Shadow Shield weaken");
        return this.chainModify(0.5);
      }
    },
    name: "Shadow Shield",
    rating: 3.5,
    num: 231
  },
  shadowtag: {
    onFoeTrapPokemon(pokemon) {
      if (!pokemon.hasAbility("shadowtag") && pokemon.isAdjacent(this.effectState.target)) {
        pokemon.tryTrap(true);
      }
    },
    onFoeMaybeTrapPokemon(pokemon, source) {
      if (!source)
        source = this.effectState.target;
      if (!source || !pokemon.isAdjacent(source))
        return;
      if (!pokemon.hasAbility("shadowtag")) {
        pokemon.maybeTrapped = true;
      }
    },
    name: "Shadow Tag",
    rating: 5,
    num: 23
  },
  sharpness: {
    onBasePowerPriority: 19,
    onBasePower(basePower, attacker, defender, move) {
      if (move.flags["slicing"]) {
        this.debug("Shapness boost");
        return this.chainModify(1.5);
      }
    },
    name: "Sharpness",
    rating: 3.5,
    num: 292
  },
  shedskin: {
    onResidualOrder: 5,
    onResidualSubOrder: 3,
    onResidual(pokemon) {
      if (pokemon.hp && pokemon.status && this.randomChance(33, 100)) {
        this.debug("shed skin");
        this.add("-activate", pokemon, "ability: Shed Skin");
        pokemon.cureStatus();
      }
    },
    name: "Shed Skin",
    rating: 3,
    num: 61
  },
  sheerforce: {
    onModifyMove(move, pokemon) {
      if (move.secondaries) {
        delete move.secondaries;
        delete move.self;
        if (move.id === "clangoroussoulblaze")
          delete move.selfBoost;
        move.hasSheerForce = true;
      }
    },
    onBasePowerPriority: 21,
    onBasePower(basePower, pokemon, target, move) {
      if (move.hasSheerForce)
        return this.chainModify([5325, 4096]);
    },
    name: "Sheer Force",
    rating: 3.5,
    num: 125
  },
  shellarmor: {
    onCriticalHit: false,
    isBreakable: true,
    name: "Shell Armor",
    rating: 1,
    num: 75
  },
  shielddust: {
    onModifySecondaries(secondaries) {
      this.debug("Shield Dust prevent secondary");
      return secondaries.filter((effect) => !!(effect.self || effect.dustproof));
    },
    isBreakable: true,
    name: "Shield Dust",
    rating: 2,
    num: 19
  },
  shieldsdown: {
    onStart(pokemon) {
      if (pokemon.baseSpecies.baseSpecies !== "Minior" || pokemon.transformed)
        return;
      if (pokemon.hp > pokemon.maxhp / 2) {
        if (pokemon.species.forme !== "Meteor") {
          pokemon.formeChange("Minior-Meteor");
        }
      } else {
        if (pokemon.species.forme === "Meteor") {
          pokemon.formeChange(pokemon.set.species);
        }
      }
    },
    onResidualOrder: 29,
    onResidual(pokemon) {
      if (pokemon.baseSpecies.baseSpecies !== "Minior" || pokemon.transformed || !pokemon.hp)
        return;
      if (pokemon.hp > pokemon.maxhp / 2) {
        if (pokemon.species.forme !== "Meteor") {
          pokemon.formeChange("Minior-Meteor");
        }
      } else {
        if (pokemon.species.forme === "Meteor") {
          pokemon.formeChange(pokemon.set.species);
        }
      }
    },
    onSetStatus(status, target, source, effect) {
      if (target.species.id !== "miniormeteor" || target.transformed)
        return;
      if (effect?.status) {
        this.add("-immune", target, "[from] ability: Shields Down");
      }
      return false;
    },
    onTryAddVolatile(status, target) {
      if (target.species.id !== "miniormeteor" || target.transformed)
        return;
      if (status.id !== "yawn")
        return;
      this.add("-immune", target, "[from] ability: Shields Down");
      return null;
    },
    isPermanent: true,
    name: "Shields Down",
    rating: 3,
    num: 197
  },
  simple: {
    onChangeBoost(boost, target, source, effect) {
      if (effect && effect.id === "zpower")
        return;
      let i;
      for (i in boost) {
        boost[i] *= 2;
      }
    },
    isBreakable: true,
    name: "Simple",
    rating: 4,
    num: 86
  },
  skilllink: {
    onModifyMove(move) {
      if (move.multihit && Array.isArray(move.multihit) && move.multihit.length) {
        move.multihit = move.multihit[1];
      }
      if (move.multiaccuracy) {
        delete move.multiaccuracy;
      }
    },
    name: "Skill Link",
    rating: 3,
    num: 92
  },
  slowstart: {
    onStart(pokemon) {
      pokemon.addVolatile("slowstart");
    },
    onEnd(pokemon) {
      delete pokemon.volatiles["slowstart"];
      this.add("-end", pokemon, "Slow Start", "[silent]");
    },
    condition: {
      duration: 5,
      onResidualOrder: 28,
      onResidualSubOrder: 2,
      onStart(target) {
        this.add("-start", target, "ability: Slow Start");
      },
      onModifyAtkPriority: 5,
      onModifyAtk(atk, pokemon) {
        return this.chainModify(0.5);
      },
      onModifySpe(spe, pokemon) {
        return this.chainModify(0.5);
      },
      onEnd(target) {
        this.add("-end", target, "Slow Start");
      }
    },
    name: "Slow Start",
    rating: -1,
    num: 112
  },
  slushrush: {
    onModifySpe(spe, pokemon) {
      if (this.field.isWeather(["hail", "snow"])) {
        return this.chainModify(2);
      }
    },
    name: "Slush Rush",
    rating: 3,
    num: 202
  },
  sniper: {
    onModifyDamage(damage, source, target, move) {
      if (target.getMoveHitData(move).crit) {
        this.debug("Sniper boost");
        return this.chainModify(1.5);
      }
    },
    name: "Sniper",
    rating: 2,
    num: 97
  },
  snowcloak: {
    onImmunity(type, pokemon) {
      if (type === "hail")
        return false;
    },
    onModifyAccuracyPriority: -1,
    onModifyAccuracy(accuracy) {
      if (typeof accuracy !== "number")
        return;
      if (this.field.isWeather(["hail", "snow"])) {
        this.debug("Snow Cloak - decreasing accuracy");
        return this.chainModify([3277, 4096]);
      }
    },
    isBreakable: true,
    name: "Snow Cloak",
    rating: 1.5,
    num: 81
  },
  snowwarning: {
    onStart(source) {
      this.field.setWeather("snow");
    },
    name: "Snow Warning",
    rating: 4,
    num: 117
  },
  solarpower: {
    onModifySpAPriority: 5,
    onModifySpA(spa, pokemon) {
      if (["sunnyday", "desolateland"].includes(pokemon.effectiveWeather())) {
        return this.chainModify(1.5);
      }
    },
    onWeather(target, source, effect) {
      if (target.hasItem("utilityumbrella"))
        return;
      if (effect.id === "sunnyday" || effect.id === "desolateland") {
        this.damage(target.baseMaxhp / 8, target, target);
      }
    },
    name: "Solar Power",
    rating: 2,
    num: 94
  },
  solidrock: {
    onSourceModifyDamage(damage, source, target, move) {
      if (target.getMoveHitData(move).typeMod > 0) {
        this.debug("Solid Rock neutralize");
        return this.chainModify(0.75);
      }
    },
    isBreakable: true,
    name: "Solid Rock",
    rating: 3,
    num: 116
  },
  soulheart: {
    onAnyFaintPriority: 1,
    onAnyFaint() {
      this.boost({ spa: 1 }, this.effectState.target);
    },
    name: "Soul-Heart",
    rating: 3.5,
    num: 220
  },
  soundproof: {
    onTryHit(target, source, move) {
      if (target !== source && move.flags["sound"]) {
        this.add("-immune", target, "[from] ability: Soundproof");
        return null;
      }
    },
    onAllyTryHitSide(target, source, move) {
      if (move.flags["sound"]) {
        this.add("-immune", this.effectState.target, "[from] ability: Soundproof");
      }
    },
    isBreakable: true,
    name: "Soundproof",
    rating: 2,
    num: 43
  },
  speedboost: {
    onResidualOrder: 28,
    onResidualSubOrder: 2,
    onResidual(pokemon) {
      if (pokemon.activeTurns) {
        this.boost({ spe: 1 });
      }
    },
    name: "Speed Boost",
    rating: 4.5,
    num: 3
  },
  stakeout: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk, attacker, defender) {
      if (!defender.activeTurns) {
        this.debug("Stakeout boost");
        return this.chainModify(2);
      }
    },
    onModifySpAPriority: 5,
    onModifySpA(atk, attacker, defender) {
      if (!defender.activeTurns) {
        this.debug("Stakeout boost");
        return this.chainModify(2);
      }
    },
    name: "Stakeout",
    rating: 4.5,
    num: 198
  },
  stall: {
    onFractionalPriority: -0.1,
    name: "Stall",
    rating: -1,
    num: 100
  },
  stalwart: {
    onModifyMovePriority: 1,
    onModifyMove(move) {
      move.tracksTarget = move.target !== "scripted";
    },
    name: "Stalwart",
    rating: 0,
    num: 242
  },
  stamina: {
    onDamagingHit(damage, target, source, effect) {
      this.boost({ def: 1 });
    },
    name: "Stamina",
    rating: 3.5,
    num: 192
  },
  stancechange: {
    onModifyMovePriority: 1,
    onModifyMove(move, attacker, defender) {
      if (attacker.species.baseSpecies !== "Aegislash" || attacker.transformed)
        return;
      if (move.category === "Status" && move.id !== "kingsshield")
        return;
      const targetForme = move.id === "kingsshield" ? "Aegislash" : "Aegislash-Blade";
      if (attacker.species.name !== targetForme)
        attacker.formeChange(targetForme);
    },
    isPermanent: true,
    name: "Stance Change",
    rating: 4,
    num: 176
  },
  static: {
    onDamagingHit(damage, target, source, move) {
      if (this.checkMoveMakesContact(move, source, target)) {
        if (this.randomChance(3, 10)) {
          source.trySetStatus("par", target);
        }
      }
    },
    name: "Static",
    rating: 2,
    num: 9
  },
  steadfast: {
    onFlinch(pokemon) {
      this.boost({ spe: 1 });
    },
    name: "Steadfast",
    rating: 1,
    num: 80
  },
  steamengine: {
    onDamagingHit(damage, target, source, move) {
      if (["Water", "Fire"].includes(move.type)) {
        this.boost({ spe: 6 });
      }
    },
    name: "Steam Engine",
    rating: 2,
    num: 243
  },
  steelworker: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Steel") {
        this.debug("Steelworker boost");
        return this.chainModify(1.5);
      }
    },
    onModifySpAPriority: 5,
    onModifySpA(atk, attacker, defender, move) {
      if (move.type === "Steel") {
        this.debug("Steelworker boost");
        return this.chainModify(1.5);
      }
    },
    name: "Steelworker",
    rating: 3.5,
    num: 200
  },
  steelyspirit: {
    onAllyBasePowerPriority: 22,
    onAllyBasePower(basePower, attacker, defender, move) {
      if (move.type === "Steel") {
        this.debug("Steely Spirit boost");
        return this.chainModify(1.5);
      }
    },
    name: "Steely Spirit",
    rating: 3.5,
    num: 252
  },
  stench: {
    onModifyMovePriority: -1,
    onModifyMove(move) {
      if (move.category !== "Status") {
        this.debug("Adding Stench flinch");
        if (!move.secondaries)
          move.secondaries = [];
        for (const secondary of move.secondaries) {
          if (secondary.volatileStatus === "flinch")
            return;
        }
        move.secondaries.push({
          chance: 10,
          volatileStatus: "flinch"
        });
      }
    },
    name: "Stench",
    rating: 0.5,
    num: 1
  },
  stickyhold: {
    onTakeItem(item, pokemon, source) {
      if (!this.activeMove)
        throw new Error("Battle.activeMove is null");
      if (!pokemon.hp || pokemon.item === "stickybarb")
        return;
      if (source && source !== pokemon || this.activeMove.id === "knockoff") {
        this.add("-activate", pokemon, "ability: Sticky Hold");
        return false;
      }
    },
    isBreakable: true,
    name: "Sticky Hold",
    rating: 1.5,
    num: 60
  },
  stormdrain: {
    onTryHit(target, source, move) {
      if (target !== source && move.type === "Water") {
        if (!this.boost({ spa: 1 })) {
          this.add("-immune", target, "[from] ability: Storm Drain");
        }
        return null;
      }
    },
    onAnyRedirectTarget(target, source, source2, move) {
      if (move.type !== "Water" || move.flags["pledgecombo"])
        return;
      const redirectTarget = ["randomNormal", "adjacentFoe"].includes(move.target) ? "normal" : move.target;
      if (this.validTarget(this.effectState.target, source, redirectTarget)) {
        if (move.smartTarget)
          move.smartTarget = false;
        if (this.effectState.target !== target) {
          this.add("-activate", this.effectState.target, "ability: Storm Drain");
        }
        return this.effectState.target;
      }
    },
    isBreakable: true,
    name: "Storm Drain",
    rating: 3,
    num: 114
  },
  strongjaw: {
    onBasePowerPriority: 19,
    onBasePower(basePower, attacker, defender, move) {
      if (move.flags["bite"]) {
        return this.chainModify(1.5);
      }
    },
    name: "Strong Jaw",
    rating: 3.5,
    num: 173
  },
  sturdy: {
    onTryHit(pokemon, target, move) {
      if (move.ohko) {
        this.add("-immune", pokemon, "[from] ability: Sturdy");
        return null;
      }
    },
    onDamagePriority: -30,
    onDamage(damage, target, source, effect) {
      if (target.hp === target.maxhp && damage >= target.hp && effect && effect.effectType === "Move") {
        this.add("-ability", target, "Sturdy");
        return target.hp - 1;
      }
    },
    isBreakable: true,
    name: "Sturdy",
    rating: 3,
    num: 5
  },
  suctioncups: {
    onDragOutPriority: 1,
    onDragOut(pokemon) {
      this.add("-activate", pokemon, "ability: Suction Cups");
      return null;
    },
    isBreakable: true,
    name: "Suction Cups",
    rating: 1,
    num: 21
  },
  superluck: {
    onModifyCritRatio(critRatio) {
      return critRatio + 1;
    },
    name: "Super Luck",
    rating: 1.5,
    num: 105
  },
  supremeoverlord: {
    onStart(pokemon) {
      if (pokemon.side.totalFainted) {
        this.add("-activate", pokemon, "ability: Supreme Overlord");
        const fallen = Math.min(pokemon.side.totalFainted, 5);
        this.add("-start", pokemon, `fallen${fallen}`, "[silent]");
        this.effectState.fallen = fallen;
      }
    },
    onEnd(pokemon) {
      this.add("-end", pokemon, `fallen${this.effectState.fallen}`, "[silent]");
    },
    onBasePowerPriority: 21,
    onBasePower(basePower, attacker, defender, move) {
      if (this.effectState.fallen) {
        const powMod = [4096, 4506, 4915, 5325, 5734, 6144];
        this.debug(`Supreme Overlord boost: ${powMod[this.effectState.fallen]}/4096`);
        return this.chainModify([powMod[this.effectState.fallen], 4096]);
      }
    },
    name: "Supreme Overlord",
    rating: 4,
    num: 293
  },
  surgesurfer: {
    onModifySpe(spe) {
      if (this.field.isTerrain("electricterrain")) {
        return this.chainModify(2);
      }
    },
    name: "Surge Surfer",
    rating: 3,
    num: 207
  },
  swarm: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Bug" && attacker.hp <= attacker.maxhp / 3) {
        this.debug("Swarm boost");
        return this.chainModify(1.5);
      }
    },
    onModifySpAPriority: 5,
    onModifySpA(atk, attacker, defender, move) {
      if (move.type === "Bug" && attacker.hp <= attacker.maxhp / 3) {
        this.debug("Swarm boost");
        return this.chainModify(1.5);
      }
    },
    name: "Swarm",
    rating: 2,
    num: 68
  },
  sweetveil: {
    name: "Sweet Veil",
    onAllySetStatus(status, target, source, effect) {
      if (status.id === "slp") {
        this.debug("Sweet Veil interrupts sleep");
        const effectHolder = this.effectState.target;
        this.add("-block", target, "ability: Sweet Veil", "[of] " + effectHolder);
        return null;
      }
    },
    onAllyTryAddVolatile(status, target) {
      if (status.id === "yawn") {
        this.debug("Sweet Veil blocking yawn");
        const effectHolder = this.effectState.target;
        this.add("-block", target, "ability: Sweet Veil", "[of] " + effectHolder);
        return null;
      }
    },
    isBreakable: true,
    rating: 2,
    num: 175
  },
  swiftswim: {
    onModifySpe(spe, pokemon) {
      if (["raindance", "primordialsea"].includes(pokemon.effectiveWeather())) {
        return this.chainModify(2);
      }
    },
    name: "Swift Swim",
    rating: 3,
    num: 33
  },
  symbiosis: {
    onAllyAfterUseItem(item, pokemon) {
      if (pokemon.switchFlag)
        return;
      const source = this.effectState.target;
      const myItem = source.takeItem();
      if (!myItem)
        return;
      if (!this.singleEvent("TakeItem", myItem, source.itemState, pokemon, source, this.effect, myItem) || !pokemon.setItem(myItem)) {
        source.item = myItem.id;
        return;
      }
      this.add("-activate", source, "ability: Symbiosis", myItem, "[of] " + pokemon);
    },
    name: "Symbiosis",
    rating: 0,
    num: 180
  },
  synchronize: {
    onAfterSetStatus(status, target, source, effect) {
      if (!source || source === target)
        return;
      if (effect && effect.id === "toxicspikes")
        return;
      if (status.id === "slp" || status.id === "frz")
        return;
      this.add("-activate", target, "ability: Synchronize");
      source.trySetStatus(status, target, { status: status.id, id: "synchronize" });
    },
    name: "Synchronize",
    rating: 2,
    num: 28
  },
  swordofruin: {
    onStart(pokemon) {
      if (this.suppressingAbility(pokemon))
        return;
      this.add("-ability", pokemon, "Sword of Ruin");
    },
    onAnyModifyDef(def, target, source, move) {
      const abilityHolder = this.effectState.target;
      if (target.hasAbility("Sword of Ruin"))
        return;
      if (!move.ruinedDef?.hasAbility("Sword of Ruin"))
        move.ruinedDef = abilityHolder;
      if (move.ruinedDef !== abilityHolder)
        return;
      this.debug("Sword of Ruin Def drop");
      return this.chainModify(0.75);
    },
    name: "Sword of Ruin",
    rating: 4.5,
    num: 285
  },
  tabletsofruin: {
    onStart(pokemon) {
      if (this.suppressingAbility(pokemon))
        return;
      this.add("-ability", pokemon, "Tablets of Ruin");
    },
    onAnyModifyAtk(atk, source, target, move) {
      const abilityHolder = this.effectState.target;
      if (source.hasAbility("Tablets of Ruin"))
        return;
      if (!move.ruinedAtk)
        move.ruinedAtk = abilityHolder;
      if (move.ruinedAtk !== abilityHolder)
        return;
      this.debug("Tablets of Ruin Atk drop");
      return this.chainModify(0.75);
    },
    name: "Tablets of Ruin",
    rating: 4.5,
    num: 284
  },
  tangledfeet: {
    onModifyAccuracyPriority: -1,
    onModifyAccuracy(accuracy, target) {
      if (typeof accuracy !== "number")
        return;
      if (target?.volatiles["confusion"]) {
        this.debug("Tangled Feet - decreasing accuracy");
        return this.chainModify(0.5);
      }
    },
    isBreakable: true,
    name: "Tangled Feet",
    rating: 1,
    num: 77
  },
  tanglinghair: {
    onDamagingHit(damage, target, source, move) {
      if (this.checkMoveMakesContact(move, source, target, true)) {
        this.add("-ability", target, "Tangling Hair");
        this.boost({ spe: -1 }, source, target, null, true);
      }
    },
    name: "Tangling Hair",
    rating: 2,
    num: 221
  },
  technician: {
    onBasePowerPriority: 30,
    onBasePower(basePower, attacker, defender, move) {
      const basePowerAfterMultiplier = this.modify(basePower, this.event.modifier);
      this.debug("Base Power: " + basePowerAfterMultiplier);
      if (basePowerAfterMultiplier <= 60) {
        this.debug("Technician boost");
        return this.chainModify(1.5);
      }
    },
    name: "Technician",
    rating: 3.5,
    num: 101
  },
  telepathy: {
    onTryHit(target, source, move) {
      if (target !== source && target.isAlly(source) && move.category !== "Status") {
        this.add("-activate", target, "ability: Telepathy");
        return null;
      }
    },
    isBreakable: true,
    name: "Telepathy",
    rating: 0,
    num: 140
  },
  teravolt: {
    onStart(pokemon) {
      this.add("-ability", pokemon, "Teravolt");
    },
    onModifyMove(move) {
      move.ignoreAbility = true;
    },
    name: "Teravolt",
    rating: 3,
    num: 164
  },
  thermalexchange: {
    onDamagingHit(damage, target, source, move) {
      if (move.type === "Fire") {
        this.boost({ atk: 1 });
      }
    },
    onUpdate(pokemon) {
      if (pokemon.status === "brn") {
        this.add("-activate", pokemon, "ability: Thermal Exchange");
        pokemon.cureStatus();
      }
    },
    onSetStatus(status, target, source, effect) {
      if (status.id !== "brn")
        return;
      if (effect?.status) {
        this.add("-immune", target, "[from] ability: Thermal Exchange");
      }
      return false;
    },
    name: "Thermal Exchange",
    rating: 2.5,
    num: 270
  },
  thickfat: {
    onSourceModifyAtkPriority: 6,
    onSourceModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Ice" || move.type === "Fire") {
        this.debug("Thick Fat weaken");
        return this.chainModify(0.5);
      }
    },
    onSourceModifySpAPriority: 5,
    onSourceModifySpA(atk, attacker, defender, move) {
      if (move.type === "Ice" || move.type === "Fire") {
        this.debug("Thick Fat weaken");
        return this.chainModify(0.5);
      }
    },
    isBreakable: true,
    name: "Thick Fat",
    rating: 3.5,
    num: 47
  },
  tintedlens: {
    onModifyDamage(damage, source, target, move) {
      if (target.getMoveHitData(move).typeMod < 0) {
        this.debug("Tinted Lens boost");
        return this.chainModify(2);
      }
    },
    name: "Tinted Lens",
    rating: 4,
    num: 110
  },
  torrent: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Water" && attacker.hp <= attacker.maxhp / 3) {
        this.debug("Torrent boost");
        return this.chainModify(1.5);
      }
    },
    onModifySpAPriority: 5,
    onModifySpA(atk, attacker, defender, move) {
      if (move.type === "Water" && attacker.hp <= attacker.maxhp / 3) {
        this.debug("Torrent boost");
        return this.chainModify(1.5);
      }
    },
    name: "Torrent",
    rating: 2,
    num: 67
  },
  toughclaws: {
    onBasePowerPriority: 21,
    onBasePower(basePower, attacker, defender, move) {
      if (move.flags["contact"]) {
        return this.chainModify([5325, 4096]);
      }
    },
    name: "Tough Claws",
    rating: 3.5,
    num: 181
  },
  toxicboost: {
    onBasePowerPriority: 19,
    onBasePower(basePower, attacker, defender, move) {
      if ((attacker.status === "psn" || attacker.status === "tox") && move.category === "Physical") {
        return this.chainModify(1.5);
      }
    },
    name: "Toxic Boost",
    rating: 3,
    num: 137
  },
  toxicdebris: {
    onDamagingHit(damage, target, source, move) {
      const side = source.isAlly(target) ? source.side.foe : source.side;
      const toxicSpikes = side.sideConditions["toxicspikes"];
      if (move.category === "Physical" && (!toxicSpikes || toxicSpikes.layers < 2)) {
        this.add("-activate", target, "ability: Toxic Debris");
        side.addSideCondition("toxicspikes", target);
      }
    },
    name: "Toxic Debris",
    rating: 3.5,
    num: 295
  },
  trace: {
    onStart(pokemon) {
      if (pokemon.adjacentFoes().some((foeActive) => foeActive.ability === "noability")) {
        this.effectState.gaveUp = true;
      }
      if (pokemon.hasItem("Ability Shield")) {
        this.add("-block", pokemon, "item: Ability Shield");
        this.effectState.gaveUp = true;
      }
    },
    onUpdate(pokemon) {
      if (!pokemon.isStarted || this.effectState.gaveUp)
        return;
      const additionalBannedAbilities = [
        // Zen Mode included here for compatability with Gen 5-6
        "noability",
        "flowergift",
        "forecast",
        "hungerswitch",
        "illusion",
        "imposter",
        "neutralizinggas",
        "powerofalchemy",
        "receiver",
        "trace",
        "zenmode"
      ];
      const possibleTargets = pokemon.adjacentFoes().filter((target2) => !target2.getAbility().isPermanent && !additionalBannedAbilities.includes(target2.ability));
      if (!possibleTargets.length)
        return;
      const target = this.sample(possibleTargets);
      const ability = target.getAbility();
      if (pokemon.setAbility(ability)) {
        this.add("-ability", pokemon, ability, "[from] ability: Trace", "[of] " + target);
      }
    },
    name: "Trace",
    rating: 2.5,
    num: 36
  },
  transistor: {
    onModifyAtkPriority: 5,
    onModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Electric") {
        this.debug("Transistor boost");
        return this.chainModify(1.5);
      }
    },
    onModifySpAPriority: 5,
    onModifySpA(atk, attacker, defender, move) {
      if (move.type === "Electric") {
        this.debug("Transistor boost");
        return this.chainModify(1.5);
      }
    },
    name: "Transistor",
    rating: 3.5,
    num: 262
  },
  triage: {
    onModifyPriority(priority, pokemon, target, move) {
      if (move?.flags["heal"])
        return priority + 3;
    },
    name: "Triage",
    rating: 3.5,
    num: 205
  },
  truant: {
    onStart(pokemon) {
      pokemon.removeVolatile("truant");
      if (pokemon.activeTurns && (pokemon.moveThisTurnResult !== void 0 || !this.queue.willMove(pokemon))) {
        pokemon.addVolatile("truant");
      }
    },
    onBeforeMovePriority: 9,
    onBeforeMove(pokemon) {
      if (pokemon.removeVolatile("truant")) {
        this.add("cant", pokemon, "ability: Truant");
        return false;
      }
      pokemon.addVolatile("truant");
    },
    condition: {},
    name: "Truant",
    rating: -1,
    num: 54
  },
  turboblaze: {
    onStart(pokemon) {
      this.add("-ability", pokemon, "Turboblaze");
    },
    onModifyMove(move) {
      move.ignoreAbility = true;
    },
    name: "Turboblaze",
    rating: 3,
    num: 163
  },
  unaware: {
    name: "Unaware",
    onAnyModifyBoost(boosts, pokemon) {
      const unawareUser = this.effectState.target;
      if (unawareUser === pokemon)
        return;
      if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
        boosts["def"] = 0;
        boosts["spd"] = 0;
        boosts["evasion"] = 0;
      }
      if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
        boosts["atk"] = 0;
        boosts["def"] = 0;
        boosts["spa"] = 0;
        boosts["accuracy"] = 0;
      }
    },
    isBreakable: true,
    rating: 4,
    num: 109
  },
  unburden: {
    onAfterUseItem(item, pokemon) {
      if (pokemon !== this.effectState.target)
        return;
      pokemon.addVolatile("unburden");
    },
    onTakeItem(item, pokemon) {
      pokemon.addVolatile("unburden");
    },
    onEnd(pokemon) {
      pokemon.removeVolatile("unburden");
    },
    condition: {
      onModifySpe(spe, pokemon) {
        if (!pokemon.item && !pokemon.ignoringAbility()) {
          return this.chainModify(2);
        }
      }
    },
    name: "Unburden",
    rating: 3.5,
    num: 84
  },
  unnerve: {
    onPreStart(pokemon) {
      this.add("-ability", pokemon, "Unnerve");
      this.effectState.unnerved = true;
    },
    onStart(pokemon) {
      if (this.effectState.unnerved)
        return;
      this.add("-ability", pokemon, "Unnerve");
      this.effectState.unnerved = true;
    },
    onEnd() {
      this.effectState.unnerved = false;
    },
    onFoeTryEatItem() {
      return !this.effectState.unnerved;
    },
    name: "Unnerve",
    rating: 1,
    num: 127
  },
  unseenfist: {
    onModifyMove(move) {
      if (move.flags["contact"])
        delete move.flags["protect"];
    },
    name: "Unseen Fist",
    rating: 2,
    num: 260
  },
  vesselofruin: {
    onStart(pokemon) {
      if (this.suppressingAbility(pokemon))
        return;
      this.add("-ability", pokemon, "Vessel of Ruin");
    },
    onAnyModifySpA(spa, source, target, move) {
      const abilityHolder = this.effectState.target;
      if (source.hasAbility("Vessel of Ruin"))
        return;
      if (!move.ruinedSpA)
        move.ruinedSpA = abilityHolder;
      if (move.ruinedSpA !== abilityHolder)
        return;
      this.debug("Vessel of Ruin SpA drop");
      return this.chainModify(0.75);
    },
    name: "Vessel of Ruin",
    rating: 4.5,
    num: 284
  },
  victorystar: {
    onAnyModifyAccuracyPriority: -1,
    onAnyModifyAccuracy(accuracy, target, source) {
      if (source.isAlly(this.effectState.target) && typeof accuracy === "number") {
        return this.chainModify([4506, 4096]);
      }
    },
    name: "Victory Star",
    rating: 2,
    num: 162
  },
  vitalspirit: {
    onUpdate(pokemon) {
      if (pokemon.status === "slp") {
        this.add("-activate", pokemon, "ability: Vital Spirit");
        pokemon.cureStatus();
      }
    },
    onSetStatus(status, target, source, effect) {
      if (status.id !== "slp")
        return;
      if (effect?.status) {
        this.add("-immune", target, "[from] ability: Vital Spirit");
      }
      return false;
    },
    isBreakable: true,
    name: "Vital Spirit",
    rating: 1.5,
    num: 72
  },
  voltabsorb: {
    onTryHit(target, source, move) {
      if (target !== source && move.type === "Electric") {
        if (!this.heal(target.baseMaxhp / 4)) {
          this.add("-immune", target, "[from] ability: Volt Absorb");
        }
        return null;
      }
    },
    isBreakable: true,
    name: "Volt Absorb",
    rating: 3.5,
    num: 10
  },
  wanderingspirit: {
    onDamagingHit(damage, target, source, move) {
      const additionalBannedAbilities = ["hungerswitch", "illusion", "neutralizinggas", "wonderguard"];
      if (source.getAbility().isPermanent || additionalBannedAbilities.includes(source.ability) || target.volatiles["dynamax"]) {
        return;
      }
      if (this.checkMoveMakesContact(move, source, target)) {
        const targetCanBeSet = this.runEvent("SetAbility", target, source, this.effect, source.ability);
        if (!targetCanBeSet)
          return targetCanBeSet;
        const sourceAbility = source.setAbility("wanderingspirit", target);
        if (!sourceAbility)
          return;
        if (target.isAlly(source)) {
          this.add("-activate", target, "Skill Swap", "", "", "[of] " + source);
        } else {
          this.add("-activate", target, "ability: Wandering Spirit", this.dex.abilities.get(sourceAbility).name, "Wandering Spirit", "[of] " + source);
        }
        target.setAbility(sourceAbility);
      }
    },
    name: "Wandering Spirit",
    rating: 2.5,
    num: 254
  },
  waterabsorb: {
    onTryHit(target, source, move) {
      if (target !== source && move.type === "Water") {
        if (!this.heal(target.baseMaxhp / 4)) {
          this.add("-immune", target, "[from] ability: Water Absorb");
        }
        return null;
      }
    },
    isBreakable: true,
    name: "Water Absorb",
    rating: 3.5,
    num: 11
  },
  waterbubble: {
    onSourceModifyAtkPriority: 5,
    onSourceModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Fire") {
        return this.chainModify(0.5);
      }
    },
    onSourceModifySpAPriority: 5,
    onSourceModifySpA(atk, attacker, defender, move) {
      if (move.type === "Fire") {
        return this.chainModify(0.5);
      }
    },
    onModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Water") {
        return this.chainModify(2);
      }
    },
    onModifySpA(atk, attacker, defender, move) {
      if (move.type === "Water") {
        return this.chainModify(2);
      }
    },
    onUpdate(pokemon) {
      if (pokemon.status === "brn") {
        this.add("-activate", pokemon, "ability: Water Bubble");
        pokemon.cureStatus();
      }
    },
    onSetStatus(status, target, source, effect) {
      if (status.id !== "brn")
        return;
      if (effect?.status) {
        this.add("-immune", target, "[from] ability: Water Bubble");
      }
      return false;
    },
    isBreakable: true,
    name: "Water Bubble",
    rating: 4.5,
    num: 199
  },
  watercompaction: {
    onDamagingHit(damage, target, source, move) {
      if (move.type === "Water") {
        this.boost({ def: 2 });
      }
    },
    name: "Water Compaction",
    rating: 1.5,
    num: 195
  },
  waterveil: {
    onUpdate(pokemon) {
      if (pokemon.status === "brn") {
        this.add("-activate", pokemon, "ability: Water Veil");
        pokemon.cureStatus();
      }
    },
    onSetStatus(status, target, source, effect) {
      if (status.id !== "brn")
        return;
      if (effect?.status) {
        this.add("-immune", target, "[from] ability: Water Veil");
      }
      return false;
    },
    isBreakable: true,
    name: "Water Veil",
    rating: 2,
    num: 41
  },
  weakarmor: {
    onDamagingHit(damage, target, source, move) {
      if (move.category === "Physical") {
        this.boost({ def: -1, spe: 2 }, target, target);
      }
    },
    name: "Weak Armor",
    rating: 1,
    num: 133
  },
  wellbakedbody: {
    onTryHit(target, source, move) {
      if (target !== source && move.type === "Fire") {
        if (!this.boost({ def: 2 })) {
          this.add("-immune", target, "[from] ability: Well-Baked Body");
        }
        return null;
      }
    },
    isBreakable: true,
    name: "Well-Baked Body",
    rating: 3.5,
    num: 273
  },
  whitesmoke: {
    onTryBoost(boost, target, source, effect) {
      if (source && target === source)
        return;
      let showMsg = false;
      let i;
      for (i in boost) {
        if (boost[i] < 0) {
          delete boost[i];
          showMsg = true;
        }
      }
      if (showMsg && !effect.secondaries && effect.id !== "octolock") {
        this.add("-fail", target, "unboost", "[from] ability: White Smoke", "[of] " + target);
      }
    },
    isBreakable: true,
    name: "White Smoke",
    rating: 2,
    num: 73
  },
  wimpout: {
    onEmergencyExit(target) {
      if (!this.canSwitch(target.side) || target.forceSwitchFlag || target.switchFlag)
        return;
      for (const side of this.sides) {
        for (const active of side.active) {
          active.switchFlag = false;
        }
      }
      target.switchFlag = true;
      this.add("-activate", target, "ability: Wimp Out");
    },
    name: "Wimp Out",
    rating: 1,
    num: 193
  },
  windpower: {
    onDamagingHitOrder: 1,
    onDamagingHit(damage, target, source, move) {
      if (move.flags["wind"]) {
        target.addVolatile("charge");
      }
    },
    onAllySideConditionStart(target, source, sideCondition) {
      const pokemon = this.effectState.target;
      if (sideCondition.id === "tailwind") {
        pokemon.addVolatile("charge");
      }
    },
    name: "Wind Power",
    rating: 1,
    num: 277
  },
  windrider: {
    onStart(pokemon) {
      if (pokemon.side.sideConditions["tailwind"]) {
        this.boost({ atk: 1 }, pokemon, pokemon);
      }
    },
    onTryHit(target, source, move) {
      if (target !== source && move.flags["wind"]) {
        if (!this.boost({ atk: 1 }, target, target)) {
          this.add("-immune", target, "[from] ability: Wind Rider");
        }
        return null;
      }
    },
    onAllySideConditionStart(target, source, sideCondition) {
      const pokemon = this.effectState.target;
      if (sideCondition.id === "tailwind") {
        this.boost({ atk: 1 }, pokemon, pokemon);
      }
    },
    name: "Wind Rider",
    rating: 3.5,
    // We do not want Brambleghast to get Infiltrator in Randbats
    num: 274
  },
  wonderguard: {
    onTryHit(target, source, move) {
      if (target === source || move.category === "Status" || move.type === "???" || move.id === "struggle")
        return;
      if (move.id === "skydrop" && !source.volatiles["skydrop"])
        return;
      this.debug("Wonder Guard immunity: " + move.id);
      if (target.runEffectiveness(move) <= 0) {
        if (move.smartTarget) {
          move.smartTarget = false;
        } else {
          this.add("-immune", target, "[from] ability: Wonder Guard");
        }
        return null;
      }
    },
    isBreakable: true,
    name: "Wonder Guard",
    rating: 5,
    num: 25
  },
  wonderskin: {
    onModifyAccuracyPriority: 10,
    onModifyAccuracy(accuracy, target, source, move) {
      if (move.category === "Status" && typeof accuracy === "number") {
        this.debug("Wonder Skin - setting accuracy to 50");
        return 50;
      }
    },
    isBreakable: true,
    name: "Wonder Skin",
    rating: 2,
    num: 147
  },
  zenmode: {
    onResidualOrder: 29,
    onResidual(pokemon) {
      if (pokemon.baseSpecies.baseSpecies !== "Darmanitan" || pokemon.transformed) {
        return;
      }
      if (pokemon.hp <= pokemon.maxhp / 2 && !["Zen", "Galar-Zen"].includes(pokemon.species.forme)) {
        pokemon.addVolatile("zenmode");
      } else if (pokemon.hp > pokemon.maxhp / 2 && ["Zen", "Galar-Zen"].includes(pokemon.species.forme)) {
        pokemon.addVolatile("zenmode");
        pokemon.removeVolatile("zenmode");
      }
    },
    onEnd(pokemon) {
      if (!pokemon.volatiles["zenmode"] || !pokemon.hp)
        return;
      pokemon.transformed = false;
      delete pokemon.volatiles["zenmode"];
      if (pokemon.species.baseSpecies === "Darmanitan" && pokemon.species.battleOnly) {
        pokemon.formeChange(pokemon.species.battleOnly, this.effect, false, "[silent]");
      }
    },
    condition: {
      onStart(pokemon) {
        if (!pokemon.species.name.includes("Galar")) {
          if (pokemon.species.id !== "darmanitanzen")
            pokemon.formeChange("Darmanitan-Zen");
        } else {
          if (pokemon.species.id !== "darmanitangalarzen")
            pokemon.formeChange("Darmanitan-Galar-Zen");
        }
      },
      onEnd(pokemon) {
        if (["Zen", "Galar-Zen"].includes(pokemon.species.forme)) {
          pokemon.formeChange(pokemon.species.battleOnly);
        }
      }
    },
    isPermanent: true,
    name: "Zen Mode",
    rating: 0,
    num: 161
  },
  zerotohero: {
    onSwitchOut(pokemon) {
      if (pokemon.baseSpecies.baseSpecies !== "Palafin" || pokemon.transformed)
        return;
      if (pokemon.species.forme !== "Hero") {
        pokemon.formeChange("Palafin-Hero", this.effect, true);
      }
    },
    onSwitchIn() {
      this.effectState.switchingIn = true;
    },
    onStart(pokemon) {
      if (!this.effectState.switchingIn)
        return;
      this.effectState.switchingIn = false;
      if (pokemon.baseSpecies.baseSpecies !== "Palafin" || pokemon.transformed)
        return;
      if (!this.effectState.heroMessageDisplayed && pokemon.species.forme === "Hero") {
        this.add("-activate", pokemon, "ability: Zero to Hero");
        this.effectState.heroMessageDisplayed = true;
      }
    },
    isPermanent: true,
    name: "Zero to Hero",
    rating: 5,
    num: 278
  },
  // CAP
  mountaineer: {
    onDamage(damage, target, source, effect) {
      if (effect && effect.id === "stealthrock") {
        return false;
      }
    },
    onTryHit(target, source, move) {
      if (move.type === "Rock" && !target.activeTurns) {
        this.add("-immune", target, "[from] ability: Mountaineer");
        return null;
      }
    },
    isNonstandard: "CAP",
    isBreakable: true,
    name: "Mountaineer",
    rating: 3,
    num: -2
  },
  rebound: {
    isNonstandard: "CAP",
    name: "Rebound",
    onTryHitPriority: 1,
    onTryHit(target, source, move) {
      if (this.effectState.target.activeTurns)
        return;
      if (target === source || move.hasBounced || !move.flags["reflectable"]) {
        return;
      }
      const newMove = this.dex.getActiveMove(move.id);
      newMove.hasBounced = true;
      this.actions.useMove(newMove, target, source);
      return null;
    },
    onAllyTryHitSide(target, source, move) {
      if (this.effectState.target.activeTurns)
        return;
      if (target.isAlly(source) || move.hasBounced || !move.flags["reflectable"]) {
        return;
      }
      const newMove = this.dex.getActiveMove(move.id);
      newMove.hasBounced = true;
      this.actions.useMove(newMove, this.effectState.target, source);
      return null;
    },
    condition: {
      duration: 1
    },
    isBreakable: true,
    rating: 3,
    num: -3
  },
  persistent: {
    isNonstandard: "CAP",
    name: "Persistent",
    // implemented in the corresponding move
    rating: 3,
    num: -4
  }
};
//# sourceMappingURL=abilities.js.map

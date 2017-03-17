var spells = require('./rules/spells.json');

exports.getSpell = function(name) {
  for (var i = 0; i < spells.length; i++) {
    if (name == spells[i].name) {
      return spells[i];
    }
  }
  console.log('Failed to find spell ' + name);
};

exports.getKnownSpells = function(c, playerClass) {
  var r = [];
  var maxLevel = exports.getMaxSpellLevel(c, playerClass);
  for (var i = 0; i < spells.length; i++) {
    var spell = spells[i];
    if (spell.class.indexOf(c.class) != -1 && (spell.level == 'Cantrip' || parseInt(spell.level.substr(0,1)) <= maxLevel)) {
      r.push(spell);
    }
  }
  // add in any known spells on the character sheet
  if (c.spells) {
    for (var level in c.spells) {
      var s = c.spells[level];
      for (var i = 0; i < s.length; i++) {
        r.push(exports.getSpell(s[i]));
      }
    }
  }
  // add in any spells from the archetype
  if (c.archetype) {
    var levelFeatures = playerClass.archetypes[c.archetype].levelFeatures;
    for (var i = 0; i < levelFeatures.length; i++) {
      var lf = levelFeatures[i];
      if (lf.level <= c.level && lf.spells) {
        for (var level in lf.spells) {
          var sl = lf.spells[level];
          for (var j = 0; j < sl.length; j++) {
            r.push(exports.getSpell(sl[j]));
          }
        }
      }
    }
  }

  return r;
};

exports.getMaxSpellLevel = function(c, playerClass) {
  var l = 0;
  // the max level of spell that can be cast is the highest level you have for a spell slot
  for (var i = 0; i < playerClass.levelFeatures.length; i++) {
    var lf = playerClass.levelFeatures[i];
    if (lf.level <= c.level) {
      for (var name in lf.spellSlots) {
        if (name != 'cantrips') {
          l = Math.max(l, parseInt(name));
        }
      }
    }
  }
  return l;
};

exports.getSpellslots = function(c, playerClass, level) {
  // find the spell slots object
  var spellSlots;
  for (var i = 0; i < playerClass.levelFeatures.length; i++) {
    if (c.level == playerClass.levelFeatures[i].level && playerClass.levelFeatures[i].spellSlots) {
      spellSlots = playerClass.levelFeatures[i].spellSlots;
    }
  }

  // if did not find, then look in the archetype
  if (!spellSlots && c.archetype) {
    var archetype = playerClass.archetypes[c.archetype];
    for (var i = 0; i < archetype.levelFeatures.length; i++) {
      if (c.level == archetype.levelFeatures[i].level && archetype.levelFeatures[i].spellSlots) {
        spellSlots = archetype.levelFeatures[i].spellSlots;
      }
    }
  }

  if (!spellSlots) {
    return 0;
  } else if (level == 0) {
    return spellSlots.cantrips;
  } else {
    return spellSlots[level.toString()];
  }
};

var spells = require('./rules/spells.json');

exports.getSpell = function(name) {
  for (var i = 0; i < spells.length; i++) {
    if (name == spells[i].name) {
      return spells[i];
    }
  }
  console.log('Failed to find spell ' + name);
};

// gets the list of spells that should appear in a 'spellbook'
exports.getSpellsForSpellbook = function(c, playerClass) {
  var r = [];
  var maxLevel = exports.getMaxSpellLevel(c, playerClass);
  for (var i = 0; i < spells.length; i++) {
    var spell = spells[i];
    if (spell.class.indexOf(c.class) != -1 && (spell.level == 'Cantrip' || parseInt(spell.level.substr(0,1)) <= maxLevel)) {
      r.push(spell);
    }
  }
  // add in any known spells on the character sheet if not already there
  if (c.spells) {
    for (var level in c.spells) {
      var s = c.spells[level];
      for (var i = 0; i < s.length; i++) {
        var spell = exports.getSpell(s[i]);
        if (!findSpell(r, spell)) {
          r.push(spell);
        }
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
  r.sort(function(a, b) {
    if (a.name > b.name) {
      return 1;
    } else if (a.name < b.name) {
      return -1;
    }
    return 0;
  });
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

// gets the list of spells that can be cast
// this may or may not be the same as the spells in the spell book
exports.getCastableSpells = function(c, playerClass) {
    return exports.getSpellsForSpellbook(c, playerClass);
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

// returns true if has feature 'spellcasting'
exports.isSpellcaster = function(c) {
  for (var i = 0; i < c.features.length; i++) {
    if (c.features[i].label == 'Spellcasting') {
      return true;
    }
  }
  return false;
};

exports.castableCantrip = function(c, spell) {
  return spell.level == 'Cantrip' && (c.spells.cantrips.indexOf(spell.name) != -1 || isClassSpell(c, spell.name));
};

function isClassSpell(c, spellName) {
  // for now just make sure arcane trickster has mage hand
  return spellName == 'Mage Hand' && c.class == 'Rogue' && c.archetype == 'Arcane Trickster';
};

function findSpell(list, spell) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].name == spell.name) {
      return true;
    }
  }
  return false;
}
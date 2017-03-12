var spells = require('./rules/spells.json');

exports.getSpell = function(name) {
  for (var i = 0; i < spells.length; i++) {
    if (name == spells[i].name) {
      return spells[i];
    }
  }
  console.log('Failed to find spell ' + name);
};

exports.getSpellsByClass = function(className, maxLevel) {
  var r = [];
  for (var i = 0; i < spells.length; i++) {
    var spell = spells[i];
    if (spell.class.indexOf(className) != -1 && (spell.level == 'Cantrip' || parseInt(spell.level.substr(0,1)) <= maxLevel )) {
      r.push(spell);
    }
  }
  return r;
};

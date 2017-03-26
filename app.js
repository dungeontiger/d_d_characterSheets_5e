var express = require('express');
var fs = require('fs');
var mustache = require('mustache');
var app = express();

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.send('D&D Generated Character Sheets 5th Edition!')
});

app.get('/character/:name', function (req, res) {
  // load the JSON for this character
  var character = fs.readFileSync('characters/' + req.params.name + '.json');
  app.renderCharacter(JSON.parse(character), res);
});

app.listen(3000, function () {
  console.log('Ready');
});

// load classes
var Spells = require('./Spells');

// data files
app.uncheckedBox = '&#9723;';
app.checkedBox = '&#9724;';
app.races = [];
var raceList = require('./rules/races.json');
for (var r in raceList) {
  app.races[raceList[r]] = require('./rules/' + raceList[r] + '.json');
}
app.classes = [];
var classList = require('./rules/classes.json');
for (var r in classList) {
  app.classes[classList[r]] = require('./rules/' + classList[r] + '.json');
}
app.skills = require('./rules/skills.json');
app.backgrounds = require('./rules/backgrounds.json');
app.armor = require('./rules/armor.json');
app.weapons = require('./rules/weapons.json');
app.exp = require('./rules/exp.json');
app.profBonus = require('./rules/profBonus.json');
app.abilityMods = require('./rules/abilityMods.json');

app.renderCharacter = function(character, res) {
  // add calculations
  app.addCalculations(character);
  // html
  var output = '<html>'
  // head
  output += '<head>';
  // title
  output += '<title>' + character.name + '</title>';
  // font includes
  output += '<link href="https://fonts.googleapis.com/css?family=UnifrakturMaguntia|Cinzel|Great+Vibes|Old+Standard+TT" rel="stylesheet">';
  // css include
  output += '<link rel="stylesheet" href="/css/character.css">';
  output += '</head>';
  // body
  output += '<body>';
  // add header
  output += app.header();
  // name
  output += app.nameTable(character);
  // intro block
  output += app.introBlock(character);
  // combat stats
  output += app.combatStats(character);
  // ability scores and saving Throws
  output += app.abilityScoresSavingThrows(character);
  // skills, proficiencies and current stats block
  output += app.drawSkills(character);
  // weapons
  output += app.drawWeapons(character);
  // spells
  output += app.spells(character);
  // equipment and treasure
  output += app.equipmentAndTreasure(character);
  // character description
  output += app.characterDescription(character);
  // spellbook
  output += app.renderSpellbook(character);
  output += '</body>';
  output+= '</html>';
  res.send(output);
};

app.getNumericPrefix = function(n) {
  var r = n + '<sup>';
  if (n == 1) {
    r += 'st';
  } else if (n == 2) {
    r += 'nd';
  } else if (n == 3) {
    r += 'rd';
  } else {
    r += 'th';
  }
  r += '</sup>';
  return r;
};

app.addCalculations = function(c) {
  var race = app.races[c.race.toLowerCase()];
  var subRace;
  if (c.subRace) {
    subRace = race.subRaces[c.subRace];
  }
  var playerClass = app.classes[c.class.toLowerCase()];
  var background = app.backgrounds[c.background.toLowerCase()];
  // level
  for (var i = 0; i < app.exp.length; i++) {
    if ( app.exp[i] >= c.experience) {
      break;
    }
  }
  c.level = i;
  // class description
  if (c.domain) {
    c.classDesc = c.class + ', ' + c.domain + ' Domain';
  } else if (c.archetype) {
    c.classDesc = c.class + ', ' + c.archetype;
  } else {
    c.classDesc = c.class;
  }

  // level postfix
  if (c.level == 1) {
    c.levelStr = 'st';
  } else if (c.level == 2) {
    c.levelStr = 'nd';
  } else if (c.level == 3) {
    c.levelStr = 'rd';
  } else {
    c.levelStr = 'th';
  }
  // next level experience
  c.nextLevel = app.exp[c.level];
  // proficiency Bonus
  c.profBonus = app.profBonus[c.level - 1];
  // ability modifier strings
  c.strStr = app.modStr(app.abilityMods[c.str - 1]);
  c.dexStr = app.modStr(app.abilityMods[c.dex - 1]);
  c.conStr = app.modStr(app.abilityMods[c.con - 1]);
  c.intStr = app.modStr(app.abilityMods[c.int - 1]);
  c.wisStr = app.modStr(app.abilityMods[c.wis - 1]);
  c.chaStr = app.modStr(app.abilityMods[c.cha - 1]);
  // race abilities
  c.speed = race.speed; // TODO: possibly affected by armor
  c.size = race.size;
  for (var i = 0; i < race.languages.length; i++) {
    if (c.languages.indexOf(race.languages[i]) == -1) {
      c.languages.push(race.languages[i]);
    }
  }
  // look for class specific languages
  if (playerClass.languages) {
    for (var i = 0; i < playerClass.languages.length; i++) {
      if (c.languages.indexOf(playerClass.languages[i]) == -1) {
        c.languages.push(playerClass.languages[i]);
      }
    }
  }
  c.languages.sort();
  c.languageStr = function() {
    var r = "";
    for (var i = 0; i < c.languages.length; i++) {
      r += c.languages[i];
      if (i < c.languages.length - 1) {
        r += ', ';
      }
    }
    return r;
  }
  // race string 
  c.raceStr = function() {
    var r = c.race;
    if (c.subRace) {
      r += ', ' + c.subRace;
    }
    return r;
  };
  // save proficiencies
  c.savingThrowProficiencies = {
    'str': app.uncheckedBox,
    'dex': app.uncheckedBox,
    'con': app.uncheckedBox,
    'int': app.uncheckedBox,
    'wis': app.uncheckedBox,
    'cha': app.uncheckedBox
  };
  for (var i = 0; i < playerClass.savingThrowProficiencies.length; i++) {
    c.savingThrowProficiencies[playerClass.savingThrowProficiencies[i]] = app.checkedBox;
  }
  // save numbers
  if (c.savingThrowProficiencies.str) {
    c.strSaveStr = app.modStr(app.abilityMods[c.str - 1] + c.profBonus);
  } else {
    c.strSaveStr = app.modStr(app.abilityMods[c.str - 1]);
  }
  if (c.savingThrowProficiencies.dex) {
    c.dexSaveStr = app.modStr(app.abilityMods[c.dex - 1] + c.profBonus);
  } else {
    c.dexSaveStr = app.modStr(app.abilityMods[c.dex - 1]);
  }
  if (c.savingThrowProficiencies.con) {
    c.conSaveStr = app.modStr(app.abilityMods[c.con- 1] + c.profBonus);
  } else {
    c.conSaveStr = app.modStr(app.abilityMods[c.con - 1]);
  }
  if (c.savingThrowProficiencies.int) {
    c.intSaveStr = app.modStr(app.abilityMods[c.int - 1] + c.profBonus);
  } else {
    c.intSaveStr = app.modStr(app.abilityMods[c.int - 1]);
  }
  if (c.savingThrowProficiencies.wis) {
    c.wisSaveStr = app.modStr(app.abilityMods[c.wis - 1] + c.profBonus);
  } else {
    c.wisSaveStr = app.modStr(app.abilityMods[c.wis - 1]);
  }
  if (c.savingThrowProficiencies.cha) {
    c.chaSaveStr = app.modStr(app.abilityMods[c.cha - 1] + c.profBonus);
  } else {
    c.chaSaveStr = app.modStr(app.abilityMods[c.cha - 1]);
  }
  // passive Perception
  c.passivePerception = 10 + app.abilityMods[c.wis - 1];
  // hit dice
  c.hitDice = c.level + 'd' + playerClass.hitDice;
  // skills
  c.allSkills = [];
  for (var skill in app.skills) {
    var s = app.skills[skill];
    if (c.skills.indexOf(s.name) != -1 || background.skills.indexOf(s.name) != -1) {
      s.checked = app.checkedBox;
      // if expertise, prof bonus x 2
      var profBonus = c.profBonus;
      if (c.expertise && c.expertise.indexOf(s.name) != -1) {
        profBonus = profBonus * 2;
      }
      s.modifier = app.modStr(app.abilityMods[c[s.ability] - 1] + profBonus);
    } else {
      s.checked = app.uncheckedBox;
      s.modifier = app.modStr(app.abilityMods[c[s.ability] - 1]);
    }
    c.allSkills.push(s);
  }
  // temporary hit dice
  // TODO: Wrap if high level
  c.currentHD = function() {
    var r = '';
    for (var i = 0; i < c.level; i++) {
      r += app.uncheckedBox;
    }
    return r;
  }
  // armor class
  if (c.armor) {
      c.armorObj = app.armor[c.armor];
  }
  c.ac = function() {
    // TODO: wearing armor you are not proficient in has serious repercussions on abilities and movement
    // also notes and limitations
    var ac = 0;
    // look for a base armor type first
    if (c.armorObj) {
      ac = c.armorObj.ac;
      var dexMod = app.abilityMods[c.dex - 1];
      if (c.armorObj.dex == 'modifier') {
        ac += dexMod;
      } else if (c.armorObj.dex = 'modifier max 2') {
        if (dexMod > 2) {
          dexMod = 2;
        }
        ac += dexMod;
      }
    } else {
      ac = 10 + app.abilityMods[c.dex - 1];
    }
    if (c.shield) {
      ac += app.armor['Shield'].acMod;
    }
    return ac;
  }
  // proficiencies, abilities and features
  c.features = [];
  var weaponProfs = [];
  // get the armor features
  app.calculateArmorFeatures(c, playerClass);
  // get the weapon features
  app.calculateWeaponFeatures(c, playerClass, weaponProfs)
  // get the tool proficiencies
  app.calculateToolFeatures(c, playerClass, background);
  if (c.armorObj) {
    if (c.armorObj.stealth == 'disadvantage') {
      c.features.push({'label': 'Not Stealthy', 'description': 'Disadvantage on stealth rules due to armor'});
    }
  }
  // race features
  app.getFeatures(c, race);
  // subrace features
  app.getFeatures(c, subRace);
  // class features
  app.getClassFeatures(c, playerClass);
  // background features
  if (background.features) {
    for (var i = 0; i < background.features.length; i++) {
      c.features.push(background.features[i]);
    }
  }
  // weapons
  c.weaponStats = function() {
    var r = [ ];
    for (var i = 0; i < c.weapons.length; i++) {
      var w = {};
      r.push(w);
      var weaponStats = app.weapons[c.weapons[i].name];
      w.name = weaponStats.name;
      if (c.weapons[i].ammo) {
        w.ammo = c.weapons[i].ammo;
      }
      w.hit = 0;
      w.dmgBonus = 0;
      // if proficient in this weapon or weapon class add prof bonus to hit
      if (weaponProfs.indexOf(weaponStats.name) != -1 || weaponProfs.indexOf(weaponStats.type) != -1) {
        w.hit += c.profBonus;
        w.dmgBonus += c.profBonus;
      }
      if (weaponStats.properties.finesse == true) {
        // add higher bonus of str or dex
        w.hit += Math.max(app.abilityMods[c.dex - 1], app.abilityMods[c.str - 1]);
        w.dmgBonus += Math.max(app.abilityMods[c.dex - 1], app.abilityMods[c.str - 1]);
      } else if (weaponStats.type.indexOf('Melee') != -1) {
        // add strength mod
        w.hit += app.abilityMods[c.str - 1];
        w.dmgBonus += app.abilityMods[c.str - 1];
      } else if (weaponStats.type.indexOf('Ranged') != -1) {
        // add dex mod
        w.hit += app.abilityMods[c.dex - 1]
        w.dmgBonus += app.abilityMods[c.dex - 1]
      }
      w.hit = app.modStr(w.hit);
      if (w.dmgBonus != 0) {
        w.damage = weaponStats.damage + app.modStr(w.dmgBonus);
      } else {
        w.damage = weaponStats.damage;
      }
      w.range = weaponStats.range;
      w.damageType = weaponStats.damageType;
      w.type = weaponStats.type;
      var notes = [];
      for (var note in weaponStats.properties) {
        var s = note;
        if (weaponStats.properties[note] != true) {
          s += ':' + weaponStats.properties[note];
        }
        notes.push(s);
      }
      notes.sort();
      w.notes = notes.join(', ');
    }
    return r;
  }
  // spell abilities
  if (Spells.isSpellcaster(c)) {
    c.castingAbility = playerClass.castingAbility;
    c.spellSaveDC = 8 + c.profBonus + app.abilityMods[c[c.castingAbility] - 1];
    c.spellAttackMod = c.profBonus + app.abilityMods[c[c.castingAbility] - 1];
    if (playerClass.preparedSpells) {
      c.preparedSpells = app.abilityMods[c[c.castingAbility] - 1] + c.level;
    }
  }
  // gather spell
  if (c.domain) {
    // add domain related spells (only for clerics)
    if (!c.spells) {
      c.spells = {};
    }
    var domain = playerClass.domains[c.domain];
    for (var i = 0; i <= c.level; i++) {
      var domainSpells = domain.knownDomainSpells[i.toString()];
      var spellLevel = c.spells[i.toString()];
      if (!spellLevel) {
        c.spells[i.toString()] = [];
        spellLevel = c.spells[i.toString()];
      }
      if (domainSpells) {
        for (var j = 0; j < domainSpells.length; j++) {
          spellLevel.push(domainSpells[j]);
        }
        spellLevel.sort(); 
      }
    }
  }
  // render the spell table
  c.spellTable = function() {
    // clerics have all spells at their disposal
    // TODO for other classes
    var r ='';
    var spells = Spells.getCastableSpells(c, playerClass);
    for (var i = 0; i < 10; i++) {
      var spellSlots = Spells.getSpellslots(c, playerClass, i);
      if (!spellSlots) {
        break;
      }

      var levelName;
      if (i == 0) {
        // cantrips
        levelName = 'Cantrips';
      } else {
        // level 1 to 9
        levelName = app.getNumericPrefix(i) + ' Level - ' + '<span style="font-weight: normal;">Spell Slots: ';
        for (var k = 0; k < spellSlots; k++) {
          levelName += app.uncheckedBox;
        }
        levelName += '</span></td></tr>'
      }

      var domain;
      if (c.domain) {
        domain = playerClass.domains[c.domain];
      }

      r += '<table><tr><td colspan="9" class="header" style="text-align:left">' + levelName + '</td></tr>';
      r += `<tr>
              <td class="medium"></td>
              <td class="medium">Name</td>
              <td class="medium">Cast</td>
              <td class="medium">Rng</td>
              <td class="medium">Dur</td>
              <td class="medium">Dmg</td>
              <td class="medium">Area</td>
              <td class="medium">Con.</td>
              <td class="medium">Higher</td>
              <td class="medium">Ritual</td>
            </tr>`;
      for (var j = 0; j < spells.length; j++) {
        // write out the details for each spell of this level
        var spell = spells[j];
        if ((i == 0 && Spells.castableCantrip(c, spell)) || 
          (i == parseInt(spell.level.substr(0,1)))) {
          r += '<tr>';
          // check to see if this spell is prepared
          var box = app.uncheckedBox;
          if (spell.level == 'Cantrip') {
            box = '';
          }
          if (spell.level != 'Cantrip' && domain) {
            var domainSpells = domain.knownDomainSpells[i.toString()];
            if (domainSpells.indexOf(spell.name) != -1) {
              box = app.checkedBox;
            }
          }
          r += '<td class="mediumRightPadding">' + box + '</td>';
          r += '<td class="mediumRightPadding">' + spell.name + '</td>';
          r += '<td class="mediumRightPadding">' + spell.casting_time + '</td>';
          r += '<td class="mediumRightPadding">' + spell.range + '</td>';
          r += '<td class="mediumRightPadding">' + spell.duration + '</td>';
          r += '<td class="mediumRightPadding">' + 'TBD' + '</td>';
          r += '<td class="mediumRightPadding">' + 'TBD' + '</td>';
          r += '<td class="mediumRightPadding">' + spell.concentration + '</td>';
          r += '<td class="mediumRightPadding">' + (spell.higher_level ? 'yes' : 'no') + '</td>';
          r += '<td class="mediumRightPadding">' + spell.ritual + '</td>';
          r += '</tr>';
        }
      }
      r += '</table>';
    }
    return r;
  };

  // render the spell book
  c.spellBook = function() {
    var spells = Spells.getSpellsForSpellbook(c, playerClass);
    var r = '<div class="newPage title center screenDivider">Spellbook</div>';
    r += '<table class="spellbook"><tr valign="top">';
    for (var i = 0; i < spells.length; i++) {
      var spell = spells[i];
      if ( i % 3 == 0 && i != 0) {
        r += '</tr>';
        r += '<tr valign="top">';
      }
      r += '<td class="spellbookBox">';
      r += '<div class="spellbookTitle">' + spell.name + '</div>';
      r += '<div>' + spell.level + ' ' + (spell.school ? spell.school : '') + '</div>';
      r += '<div >' + spell.class + '</div>';
      r += '<div><span class="spellbookLabel">Casting Time: </span>' + spell.casting_time + '</div>';
      r += '<div><span class="spellbookLabel">Range: </span>' + spell.range + '</div>';
      r += '<div><span class="spellbookLabel">Components: </span>' + spell.components + '</div>';
      if (spell.material) {
        r += '<div><span class="spellbookLabel">Material: </span>' + spell.material + '</div>';
      }
      r += '<div><span class="spellbookLabel">Duration: </span>' + spell.duration + '</div>';
      r += '<div><span class="spellbookLabel">Concentration: </span>' + spell.concentration + '</div>';
      r += '<div><span class="spellbookLabel">Ritual: </span>' + spell.ritual + '</div>';
      r += '<div>' + spell.desc + '</div>';
      if (spell.higher_level) {
        r += '<div><span class="spellbookLabel">Cast at Higher Level: </span>' + spell.higher_level + '</div>';
      }
      r += '</td>';
      if ( i == spells.length - 1) {
        r += '</tr>';
      }
    }
    r += '</table>';
    return r;
  };
};

app.modStr = function(mod) {
  if (mod > 0) {
    return '+' + mod;
  }
  return '' + mod;
}

// header
app.header = function() {
  return "<div class='center title'>The Life and Times of</div>";
}

// name
app.nameTable = function(character) {
  var template = `
  <table class="tableBox">
      <tr class="tableValueBox">
        <td>{{name}}</td>
      </tr>
      <tr>
        <td class="label">Name</td>
      </tr>
    </table>`;
  return mustache.render(template, character);
}

// intro block
app.introBlock = function(c) {
  var t = `
      <table class="tableBox">
      <tr class="tableValueBox">
        <td class="oneThird">{{level}}<sup>{{levelStr}}</sup> {{classDesc}}</td>
        <td class="oneThird">{{background}} {{background specialty}}</td>
        <td class="oneThird">{{playerName}}</td>
      </tr>
      <tr>
        <td class="label">Class &amp; Level</td>
        <td class="label">Background</td>
        <td class="label">Player Name</td>
       </tr>
    </table>
    <table class="tableBox">
      <tr class="tableValueBox">
        <td class="oneThird">{{raceStr}}</td>
        <td class="oneThird">{{alignment}}</td>
        <td class="oneThird">{{experience}} ({{nextLevel}})</td>
      </tr>
      <tr>
        <td class="label">Race</td>
        <td class="label">Alignment</td>
        <td class="label">Experience</td>
       </tr>
    </table>
    <table class="tableBox">
      <tr class="tableValueBox">
        <td>{{size}}</td>
        <td>{{languageStr}}</td>
      </tr>
      <tr>
        <td class="label">Size</td>
        <td class="label">Languages</td>
      </tr>
    </table>
`;
  return mustache.render(t, c);
};

// combat stats
app.combatStats = function(c) {
  var t = `
    <div class="header">Combat Stats</div>
    <table class="tableBox">
      <tr class="tableValueBox">
        <td class="oneEight">+{{profBonus}}</td>
        <td class="oneEight"></td>
        <td class="oneEight">{{dexStr}}</td>
        <td class="oneEight">{{hitDice}}</td>
        <td class="oneEight">{{hitPoints}}</td>
        <td class="oneEight">{{speed}}</td>
        <td class="oneEight">{{ac}}</td>
      </tr>
      <tr>
        <td class="label">Prof. Bonus</td>
        <td class="label">Inspiration</td>
        <td class="label">Initiative</td>
        <td class="label">HD</td>
        <td class="label">HP</td>
        <td class="label">Spd</td>
        <td class="label">AC</td>
      </tr>
    </table>
  `;
  return mustache.render(t, c);
};

// ability scores
app.abilityScoresSavingThrows = function(c) {
  var t = `
   <table class="tableBox">
      <tr>
        <td colspan="6"><div class="header">Ability Scores</div></td>
        <td colspan="6"><div class="header">Saving Throws</div></td>
      </tr>
      <tr class="tableValueBox">
        <td class="one12th">{{str}} ({{strStr}})</td>
        <td class="one12th">{{dex}} ({{dexStr}})</td>
        <td class="one12th">{{con}} ({{conStr}})</td>
        <td class="one12th">{{int}} ({{intStr}})</td>
        <td class="one12th">{{wis}} ({{wisStr}})</td>
        <td class="one12th">{{cha}} ({{chaStr}})</td>
        <td class="one12th">{{strSaveStr}}</td>
        <td class="one12th">{{dexSaveStr}}</td>
        <td class="one12th">{{conSaveStr}}</td>
        <td class="one12th">{{intSaveStr}}</td>
        <td class="one12th">{{wisSaveStr}}</td>
        <td class="one12th">{{chaSaveStr}}</td>
     </tr>
      <tr>
        <td class="label">Str</td>
        <td class="label">Dex</td>
        <td class="label">Con</td>
        <td class="label">Int</td>
        <td class="label">Wis</td>
        <td class="label">Cha</td>
        <td class="label"><div class="inline smallWidth">{{{savingThrowProficiencies.str}}}</div> Str</td>
        <td class="label"><div class="inline smallWidth">{{{savingThrowProficiencies.dex}}}</div> Dex</td>
        <td class="label"><div class="inline smallWidth">{{{savingThrowProficiencies.con}}}</div> Con</td>
        <td class="label"><div class="inline smallWidth">{{{savingThrowProficiencies.int}}}</div> Int</td>
        <td class="label"><div class="inline smallWidth">{{{savingThrowProficiencies.wis}}}</div> Wis</td>
        <td class="label"><div class="inline smallWidth">{{{savingThrowProficiencies.cha}}}</div> Cha</td>
      </tr>
    </table>
   `;
  return mustache.render(t, c);
};

app.drawSkills = function(c) {
  var t = `
    <table>
      <tr>
        <td><div class="header">Skills</div></td>
        <td style="width:100%" class="header">Proficiencies, Abilities &amp; Features</td>
        <td><div class="header">Current Stats</div></td>
      </tr>
      <tr>
        <td>
          <table class="tableBox">
            {{#allSkills}}
            <tr>
              <td>{{{checked}}}</td><td>{{modifier}}</td><td class="small">{{name}} ({{ability}})</td>
            </tr>
            {{/allSkills}}
            <tr><td></td><td>{{passivePerception}}<td class="small">Passive Perception (wis)</td></tr>
          </table>
        </td>
        <td valign="top">
          <table>
            {{#features}}
            <tr><td><b>{{label}}</b>: {{description}}</td></tr>
            {{/features}}
          </table>
        </td>
        <td valign="top">
          <table>
            <tr class="tableValueBox">
              <td></td>
            </tr>
            <tr>
              <td class="label">HP</td>
            </tr>
            <tr class="tableValueBox">
              <td>{{{currentHD}}}</td>
            </tr>
            <tr>
              <td class="label">HD</td>
            </tr>
            <tr class="tableValueBox">
              <td></td>
            </tr>
            <tr>
              <td class="label">Experience</td>
            </tr>
            <tr class="tableValueBox">
              <td>
                <table>
                  <tr>
                    <td class="small">Success:</td><td>&#9723;&#9723;&#9723;</td>
                  </tr>
                  <tr>
                    <td class="small">Failures:</td><td>&#9723;&#9723;&#9723;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="label">Death Saves</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  return mustache.render(t, c);
};

app.drawWeapons = function(c) {
  var t = `
  <div class="header">Weapons</div>
  <table>
    <tr>
      <td class="medium">Name</td>
      <td class="medium">Hit</td>
      <td class="medium">Dmg</td>
      <td class="medium">Ammo</td>
      <td class="medium">Rng</td>
      <td class="medium">Type</td>
      <td class="medium">Notes</td>
    </tr>
    {{#weaponStats}}
    <tr>
      <td class="mediumRightPadding">{{name}}</td>
      <td class="mediumRightPadding">{{hit}}</td>
      <td class="mediumRightPadding">{{damage}}</td>
      <td class="mediumRightPadding">{{ammo}}</td>
      <td class="mediumRightPadding">{{range}}</td>
      <td class="mediumRightPadding">{{type}} ({{damageType}})</td>
      <td class="mediumRightPadding">{{notes}}</td>
    </tr>
    {{/weaponStats}}
  </table>
  `;
  return mustache.render(t, c);
};

app.spells = function(c) {
  var playerClass = app.classes[c.class.toLowerCase()];
  if (!Spells.isSpellcaster(c)) {
    // not a spell casting class
    return '';
  }
  var t;
  if (playerClass.preparedSpells) {
    t = `
      <div class="newPage title center screenDivider">Spells</div>
      <table class="tableBox">
        <tr class="tableValueBox">
          <td class="oneQuarter">{{castingAbility}}</td>
          <td class="oneQuarter">{{spellSaveDC}}</td>
          <td class="oneQuarter">{{spellAttackMod}}</td>
          <td class="oneQuarter">{{preparedSpells}}</td>
        </tr>
        <tr>
          <td class="label">Spellcasting Ability</td>
          <td class="label">Spell Save DC</td>
          <td class="label">Spell Attack Mod</td>
          <td class="label">Prepared Spells</td>
        </tr>
    </table>
    {{{spellTable}}}
    `;
  } else {
    t = `
      <div class="newPage title center screenDivider">Spells</div>
      <table class="tableBox">
        <tr class="tableValueBox">
          <td class="oneQuarter">{{castingAbility}}</td>
          <td class="oneQuarter">{{spellSaveDC}}</td>
          <td class="oneQuarter">{{spellAttackMod}}</td>
        </tr>
        <tr>
          <td class="label">Spellcasting Ability</td>
          <td class="label">Spell Save DC</td>
          <td class="label">Spell Attack Mod</td>
        </tr>
    </table>
    {{{spellTable}}}
    `;
  }
  return mustache.render(t, c);
};

app.equipmentAndTreasure = function(c) {
  var t = `
    <div class="newPage title center screenDivider">Equipment and Treasure</div>
    <div class="header">Coins</div>
    <table class="tableBox">
      <tr class="tableValueBox">
        <td class="oneFifth">{{treasure.pp}}</td>
        <td class="oneFifth">{{treasure.ep}}</td>
        <td class="oneFifth">{{treasure.gp}}</td>
        <td class="oneFifth">{{treasure.sp}}</td>
        <td class="oneFifth">{{treasure.cp}}</td>
      </tr>
      <tr>
        <td class="label">Platinum (pp)</td>
        <td class="label">Electrum (ep)</td>
        <td class="label">Gold (gp)</td>
        <td class="label">Silver (sp)</td>
        <td class="label">Copper (cp)</td>
      </tr>
  </table>
  <div class="header">Items and Equipment</div>
  <table class="tableBox">
    {{#equipment}}
    <tr>
      <td>{{.}}</td>
    </tr>
    <tr>
      <td class="label"></td>
    </tr>
    {{/equipment}}
  </table>
  `;
  return mustache.render(t, c);
};

app.characterDescription = function(c) {
  var t = `
    <div class="newPage title center screenDivider">Character Description</div>
    <table class="tableBox">
      <tr class="tableValueBox">
        <td class="oneFifth">{{description.age}}</td>
        <td class="oneFifth">{{description.eyes}}</td>
        <td class="oneFifth">{{description.hair}}</td>
        <td class="oneFifth">{{description.weight}}</td>
        <td class="oneFifth">{{description.height}}</td>
      </tr>
      <tr>
        <td class="label">Age</td>
        <td class="label">Eyes</td>
        <td class="label">Hair</td>
        <td class="label">Weight</td>
        <td class="label">Height</td>
      </tr>
  </table>
  <table class="tableBox">
    <tr class="tableValueBox" valign="top">
      <td class="oneQuarter">{{description.personal trait}}</td>
      <td class="oneQuarter">{{description.ideal}}</td>
      <td class="oneQuarter">{{description.bond}}</td>
      <td class="oneQuarter">{{description.flaw}}</td>
    </tr>
    <tr>
        <td class="label">Personal Trait</td>
        <td class="label">Ideal</td>
        <td class="label">Bond</td>
        <td class="label">Flaw</td>
    </tr>
  </table>
  <table class="tableBox">
    <tr class="tableValueBox" valign="top">
      <td class="oneQuarter">{{description.backstory}}</td>
    </tr>
    <tr>
      <td class="label">Backstory</td>
    </tr>
  </table>
  <table class="tableBox">
    <tr class="tableValueBox" valign="top">
      <td class="oneQuarter">{{description.physical description}}</td>
    </tr>
    <tr>
      <td class="label">Physical Description</td>
    </tr>
  </table>
  `;
  return mustache.render(t, c);
};

app.renderSpellbook = function(c) {
    if (Spells.isSpellcaster(c)) {
      var t = '{{{spellBook}}}';
      return mustache.render(t,c);
    }
};

app.calculateArmorFeatures = function(c, playerClass) {
  var armorString = '';
  var armor = { light: false, medium: false, heavy: false, shield: false };

  for (var i = 0; i < playerClass.armorProficiencies.length; i++) {
    var a = playerClass.armorProficiencies[i];
    if (a == 'Light Armor') {
      armor.light = true;
    } else if (a == 'Medium Armor') {
      armor.medium = true;
    } else if (a == 'Heavy Armor') {
      armor.heavy = true;
    } else if (a == 'Shields') {
      armor.shield = true;
    } else {
      // just add a specific armor to the features list
      // TODO: eliminate if already covered by armor type proficiencies
      c.features.push({ 'label': 'armor', 'description': a});
    }
  }
  // check for domain armor proficiencies
  if (c.domain) {
    var domain = playerClass.domains[c.domain];
    if (domain.armorProficiencies) {
      for (var i = 0; i < domain.armorProficiencies.length; i++) {
        var a = domain.armorProficiencies[i];
        if (a == 'Light Armor') {
          armor.light = true;
        } else if (a == 'Medium Armor') {
          armor.medium = true;
        } else if (a == 'Heavy Armor') {
          armor.heavy = true;
        } else if (a == 'Shields') {
          armor.shield = true;
        } else {
          // just add a specific armor to the features list
          // TODO: eliminate if already covered by armor type proficiencies
          c.features.push({ 'label': 'armor', 'description': a});
        }
      }
    }
  }
  // build the armor string
  if (armor.light) {
    if (armorString.length > 0) {
      armorString += ', ';
    }
    armorString += 'Light';
  }
  if (armor.medium) {
    if (armorString.length > 0) {
      armorString += ', ';
    }
    armorString += 'Medium';
  }
  if (armor.heavy) {
    if (armorString.length > 0) {
      armorString += ', ';
    }
    armorString += 'Heavy';
  }
  if (armor.shield) {
    if (armorString.length > 0) {
      armorString += ' and ';
    }
    armorString += 'Shields';
  }
  if (armorString.length > 0) {
    c.features.push({ 'label': 'Armor', 'description': armorString});
  }
};

app.calculateWeaponFeatures = function(c, playerClass, weaponProfs) {
  var weaponStr = '';
  for (var i = 0; i < playerClass.weaponProficiencies.length; i++) {
    if (weaponStr.length > 0) {
      weaponStr += ', ';
    }
    weaponStr += playerClass.weaponProficiencies[i];
    weaponProfs.push(playerClass.weaponProficiencies[i]);
  }
  if (weaponStr.length > 0) {
    c.features.push({'label': 'Weapons', 'description': weaponStr});
  }
};

app.calculateToolFeatures = function(c, playerClass, background) {
  // class proficiencies
  var toolStr ='';
  for (var i = 0; i < playerClass.toolProficiencies.length; i++) {
    if (toolStr.length > 0) {
      toolStr += ', ';
    }
    toolStr += playerClass.toolProficiencies[i];
  }
  // background proficiencies
  if (background.toolProficiencies) {
    for (var i = 0; i < background.toolProficiencies.length; i++) {
      if (toolStr.indexOf(background.toolProficiencies[i]) == -1) {
        if (toolStr.length > 0) {
          toolStr += ', ';
        }
        toolStr += background.toolProficiencies[i];
      }
    }
  }
  if (toolStr.length > 0) {
    c.features.push({'label': 'Tools', 'description': toolStr});
  }
};

app.getClassFeatures = function(c, playerClass) {
  // TODO: make this look like the others
  for (var i = 0; i < playerClass.levelFeatures.length; i++) {
    // look through each level feature and look for ones that are appropriate
    var lf = playerClass.levelFeatures[i];
    if (lf.level <= c.level) {
      app.getFeatures(c, lf);
    }
  }
  // domain is for clerics
  if (c.domain) {
    var domain = playerClass.domains[c.domain];
    app.getLevelFeatures(c, domain);
  }
  // get the archetype features
  if (c.archetype && playerClass.archetypes[c.archetype]) {
    var at = playerClass.archetypes[c.archetype];
    app.getLevelFeatures(c, at);
  }
};

// generic feature getting, eliminates ones with the same label
app.getFeatures = function(c, o) {
  if (o && o.features) {
    for (var i = 0;  i < o.features.length; i++) {
      // assuming that features are added in order, that is level order
      // higher level features added last and replace lower level ones of the same label
      for (var j = 0; j < c.features.length; j++) {
        if (c.features[j].label == o.features[i].label) {
          // remove this feature since it will be replaced
          c.features.splice(j, 1);
        }
      }
      c.features.push(o.features[i]);
    }
  }
};

// get level dependent features
app.getLevelFeatures = function(c, o) {
    for (var i = 0; o.levelFeatures && i < o.levelFeatures.length; i++) {
      var lf = o.levelFeatures[i];
      if (lf && lf.level <= c.level) {
        app.getFeatures(c, lf);
      }
    }
};

var express = require('express');
var fs = require('fs');
var mustache = require('mustache');

// D&D data files
var races = [];
races['human'] = require('./rules/human.json');
var classes = [];
classes['cleric'] = require('./rules/cleric.json');
var skills = require('./rules/skills.json');
var backgrounds = require('./rules/backgrounds.json');

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
  console.log('Example app listening on port 3000!')
});

///////////////////////////
/// end of express code
///////////////////////////

// D&D data
// TODO: move to data files
app.exp = [
  0,
  300,
  900,
  2700,
  6500,
  14000,
  23000,
  34000,
  48000,
  64000,
  85000,
  100000,
  120000,
  140000,
  165000,
  195000,
  225000,
  265000,
  305000,
  355000
];

app.profBonus = [
  2, 2, 2, 2,
  3, 3, 3, 3,
  4, 4, 4, 4,
  5, 5, 5, 5,
  6, 6, 6, 6
];

app.abilityMods = [
  -5,
  -4, -4,
  -3, -3,
  -2, -2,
  -1, -1,
  0, 0,
  1, 1,
  2, 2,
  3, 3,
  4, 4,
  5, 5
];

// render function

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
  // skills
  output += app.skills(character);
  output += '</body>';
  output+= '</html>';
  res.send(output);
};

app.addCalculations = function(c) {
  var race = races[c.race.toLowerCase()];
  var playerClass = classes[c.class.toLowerCase()];
  var background = backgrounds[c.background.toLowerCase()];
  // level
  for (var i = 0; i < app.exp.length; i++) {
    if ( app.exp[i] >= c.experience) {
      break;
    }
  }
  c.level = i;

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
  c.speed = race.speed;
  c.size = race.size;
  for (var i = 0; i < race.languages.length; i++) {
    c.languages.push(race.languages[i]);
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
  // save proficiencies
  c.savingThrowProficiencies = {
    'str': '&#9723;',
    'dex': '&#9723;',
    'con': '&#9723;',
    'int': '&#9723;',
    'wis': '&#9723;',
    'cha': '&#9723;'
  };
  for (var i = 0; i < playerClass.savingThrowProficiencies.length; i++) {
    c.savingThrowProficiencies[playerClass.savingThrowProficiencies[i]] = '&#9724;';
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
  // hit dice
  c.hitDice = c.level + 'd' + playerClass.hitDice;
  // skills
  c.allSkills = [];
  for (var skill in skills) {
    var s = skills[skill];
    if (c.skills.indexOf(s.name) != -1 || background.skills.indexOf(s.name) != -1) {
      s.checked = '&#9724;';
      s.modifier = app.modStr(app.abilityMods[c[s.ability] - 1] + c.profBonus);
    } else {
      s.checked = '&#9723;';
      s.modifier = app.modStr(app.abilityMods[c[s.ability] - 1]);
    }
    c.allSkills.push(s);
  }
  // temporary hit dice
  // TODO: Wrap if high level
  c.currentHD = function() {
    var r = '';
    for (var i = 0; i < c.level; i++) {
      r += '&#9723;';
    }
    return r;
  }
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
        <td class="oneThird">{{level}}<sup>{{levelStr}}</sup> {{class}}</td>
        <td class="oneThird">{{background}}</td>
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
        <td class="oneThird">{{race}}</td>
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
        <td class="oneEight"></td>
        <td class="oneEight"></td>
      </tr>
      <tr>
        <td class="label">Prof. Bonus</td>
        <td class="label">Inspiration</td>
        <td class="label">Initiative</td>
        <td class="label">HD</td>
        <td class="label">Max HP</td>
        <td class="label">Spd</td>
        <td class="label">AC</td>
        <td class="label">Cur HP</td>
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

app.skills = function(c) {
  var t = `
    <table>
      <tr>
        <td><div class="header">Skills</div></td>
        <td style="width:100%"></td>
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
          </table>
        </td>
        <td></td>
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

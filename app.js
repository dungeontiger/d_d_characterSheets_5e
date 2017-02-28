var express = require('express');
var fs = require('fs');
var mustache = require('mustache');

// D&D data files
var races = [];
races['human'] = require('./human.json');
var classes = [];
classes['cleric'] = require('./cleric.json');

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
  output += '<link href="https://fonts.googleapis.com/css?family=Cinzel|Great+Vibes|Old+Standard+TT" rel="stylesheet">';
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
  output += '</body>';
  output+= '</html>';
  res.send(output);
};

app.addCalculations = function(c) {
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
  c.strStr = app.abilityMods[c.str - 1] > 0 ? '+' + app.abilityMods[c.str - 1] : app.abilityMods[c.str - 1];
  c.dexStr = app.abilityMods[c.dex - 1] > 0 ? '+' + app.abilityMods[c.dex - 1] : app.abilityMods[c.dex - 1];
  c.conStr = app.abilityMods[c.con - 1] > 0 ? '+' + app.abilityMods[c.con - 1] : app.abilityMods[c.con - 1];
  c.intStr = app.abilityMods[c.int - 1] > 0 ? '+' + app.abilityMods[c.int - 1] : app.abilityMods[c.int - 1];
  c.wisStr = app.abilityMods[c.wis - 1] > 0 ? '+' + app.abilityMods[c.wis - 1] : app.abilityMods[c.wis - 1];
  c.chaStr = app.abilityMods[c.cha - 1] > 0 ? '+' + app.abilityMods[c.cha - 1] : app.abilityMods[c.cha - 1];
  // race abilities
  var race = races[c.race.toLowerCase()];
  c.speed = race.speed;
};

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
        <td class="oneEight"></td>
        <td class="oneEight"></td>
        <td class="oneEight"></td>
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
        <td class="one12th"></td>
        <td class="one12th"></td>
        <td class="one12th"></td>
        <td class="one12th"></td>
        <td class="one12th"></td>
        <td class="one12th"></td>
     </tr>
      <tr>
        <td class="label">Str</td>
        <td class="label">Dex</td>
        <td class="label">Con</td>
        <td class="label">Int</td>
        <td class="label">Wis</td>
        <td class="label">Cha</td>
        <td class="label"><div class="inline smallWidth bottomBorder"></div> Str</td>
        <td class="label"><div class="inline smallWidth bottomBorder"></div> Dex</td>
        <td class="label"><div class="inline smallWidth bottomBorder"></div> Con</td>
        <td class="label"><div class="inline smallWidth bottomBorder"></div> Int</td>
        <td class="label"><div class="inline smallWidth bottomBorder"></div> Wis</td>
        <td class="label"><div class="inline smallWidth bottomBorder"></div> Cha</td>
      </tr>
    </table>
   `;
  return mustache.render(t, c);
};
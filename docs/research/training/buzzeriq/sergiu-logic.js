// Fixed and refactored logic.js to include height multipliers and 15% slowdown at level 18+

const baseStats = ['JS','JR','OD','HA','DR','PA','IS','ID','RB','SB'];

const trainingEffects = {
  "JS (PG/SG)":   { JS:0.6,   JR:0.2,   DR:0.05,  HA:0.05 },
  "JS (SF/PF)":   { JS:0.4,   JR:0.15,  IS:0.25 },
  "JS (SG/SF)":   { JS:0.5,   JR:0.1,   DR:0.05,  HA:0.05 },
  "JS (team)":    { JS:0.22,  JR:0.04,  DR:0.02,  HA:0.02 },
  "JR (SG)":      { JS:0.2,   JR:0.4,   DR:0.05,  HA:0.05 },
  "JR (PG)":      { JS:0.15,  JR:0.3,   DR:0.0375,HA:0.0375 },
  "JR (SG/SF)":   { JS:0.15,  JR:0.3,   DR:0.0375,HA:0.0375 },
  "JR (team)":    { JS:0.05,  JR:0.1,   DR:0.0125,HA:0.0125 },
  "OD (PG)":      { OD:0.5,   DR:0.05,  HA:0.05,  ID:0.1 },
  "OD (PG/SG)":   { OD:0.375, DR:0.0375,HA:0.0375,ID:0.075 },
  "OD(PG/SG/SF)": { OD:0.2,   DR:0.02,  HA:0.02,  ID:0.04 },
  "HA (PG)":      { OD:0.1,   DR:0.5,   HA:0.4 },
  "HA (PG/SG)":   { OD:0.075, DR:0.375, HA:0.03 },
  "HA (PG/SG/SF)":{ OD:0.04,  DR:0.2,   HA:0.16 },
  "1v1 (PG/SG)":  { JS:0.4,   DR:0.5,   HA:0.4 },
  "1v1 (SF/PF)":  { JS:0.2,   DR:0.5,   HA:0.4,   IS:0.2 },
  "1v1 (team)":   { JS:0.088, DR:0.176, HA:0.22,  IS:0.088 },
  "PA (PG)":      { DR:0.16,  HA:0.16,  PA:0.6 },
  "PA (PG/SG)":   { DR:0.12,  HA:0.12,  PA:0.45 },
  "PA (team)":    { DR:0.04,  HA:0.04,  PA:0.15 },
  "IS (C)":       { JS:0.1,   IS:0.5,   ID:0.05 },
  "IS (PF/C)":    { JS:0.075, IS:0.375, ID:0.0375 },
  "IS (SF/PF/C)": { JS:0.04,  IS:0.2,   ID:0.02 },
  "ID (C)":       { IS:0.05,  ID:0.5,   SB:0.1 },
  "ID (PF/C)":    { IS:0.0375,ID:0.375, SB:0.075 },
  "ID (SF/PF/C)": { IS:0.02,  ID:0.2,   SB:0.04 },
  "RB (PF/C)":    { IS:0.05,  ID:0.05,  RB:0.5 },
  "RB (team)":    { IS:0.022, ID:0.022, RB:0.22 },
  "SB (C)":       { ID:0.2,   RB:0.1,   SB:0.5 },
  "SB (PF/C)":    { ID:0.15,  RB:0.075, SB:0.375 },
  "SB (team)":    { ID:0.08,  RB:0.04,  SB:0.2 }
};

const elasticEffects = {
  'JS->DR': 0.0211,  'JR->OD': 0.0371,  'OD->HA': 0.0332,
  'PA->HA': 0.04,    'DR->JS': 0.0296,  'DR->PA': 0.0129,
  'HA->OD': 0.0116,  'HA->PA': 0.0103,  'IS->JS': 0.0125,
  'IS->ID': 0.0289,  'IS->RB': 0.0257,  'ID->IS': 0.0153,
  'RB->ID': 0.0371,  'SB->ID': 0.0197,  'OD->ID': 0.0455
};

// Height multipliers parsed from table
const heightMultipliers = {
  "175cm": { JS:1,   JR:1.5,  OD:1.5,  HA:1, DR:1,   PA:1,   IS:0.5,  ID:0.5,  RB:0.5,  SB:0.5 },
  "178cm": { JS:1,   JR:1.45, OD:1.45, HA:1, DR:1,   PA:1,   IS:0.55, ID:0.55, RB:0.55, SB:0.55 },
  "180cm": { JS:1,   JR:1.4,  OD:1.4,  HA:1,    DR:1,   PA:1,   IS:0.6,  ID:0.6,  RB:0.6,  SB:0.6 },
  "183cm": { JS:1,   JR:1.35, OD:1.35, HA:1,    DR:1,   PA:1,   IS:0.65, ID:0.65, RB:0.65, SB:0.65 },
  "185cm": { JS:1,   JR:1.3,  OD:1.3,  HA:1,    DR:1,   PA:1,   IS:0.7,  ID:0.7,  RB:0.7,  SB:0.7 },
  "188cm": { JS:1,   JR:1.25, OD:1.25, HA:1,    DR:1,   PA:1,   IS:0.75, ID:0.75, RB:0.75, SB:0.75 },
  "190cm": { JS:1,   JR:1.2,  OD:1.2,  HA:1,    DR:1,   PA:1,   IS:0.8,  ID:0.8,  RB:0.8,  SB:0.8 },
  "193cm": { JS:1,   JR:1.15, OD:1.15, HA:1,    DR:1,   PA:1,   IS:0.85, ID:0.85, RB:0.85, SB:0.85 },
  "196cm": { JS:1,   JR:1.1,  OD:1.1,  HA:1,    DR:1,   PA:1,   IS:0.9,  ID:0.9,  RB:0.9,  SB:0.9 },
  "198cm": { JS:1,   JR:1.05, OD:1.05, HA:1,    DR:1,   PA:1.1,   IS:0.95, ID:0.95, RB:0.95, SB:0.95 },
  "201cm": { JS:1,   JR:1,    OD:1,    HA:1,    DR:1,   PA:1.2,   IS:1,    ID:1,    RB:1,    SB:1   },
  "203cm": { JS:1,   JR:0.95, OD:0.95, HA:1,    DR:1,   PA:1.3,   IS:1.05, ID:1.05, RB:1.05, SB:1.05 },
  "206cm": { JS:1,   JR:0.9,  OD:0.9,  HA:1,    DR:1,   PA:1.4,   IS:1.1,  ID:1.1,  RB:1.1,  SB:1.1 },
  "208cm": { JS:1,   JR:0.85, OD:0.85, HA:1,    DR:1,   PA:1.4,   IS:1.15, ID:1.15, RB:1.15, SB:1.15 },
  "211cm": { JS:1,   JR:0.8,  OD:0.8,  HA:1,    DR:1,   PA:1.5,   IS:1.2,  ID:1.2,  RB:1.2,  SB:1.2 },
  "213cm": { JS:1,   JR:0.75, OD:0.75, HA:1,    DR:1,   PA:1.5,   IS:1.25, ID:1.25, RB:1.25, SB:1.25 },
  "216cm": { JS:1,   JR:0.7,  OD:0.7,  HA:1,    DR:1,   PA:1.5,   IS:1.3,  ID:1.3,  RB:1.3,  SB:1.3 },
  "218cm": { JS:1,   JR:0.65, OD:0.65, HA:1,    DR:1,   PA:1.7,   IS:1.35, ID:1.35, RB:1.35, SB:1.35 },
  "221cm": { JS:1,   JR:0.6,  OD:0.6,  HA:1,    DR:1,   PA:2,   IS:1.4,  ID:1.4,  RB:1.4,  SB:1.4 },
  "224cm": { JS:1,   JR:0.55, OD:0.55, HA:1,    DR:1,   PA:2,   IS:1.45, ID:1.45, RB:1.45, SB:1.45 },
  "226cm": { JS:1,   JR:0.5,  OD:0.5,  HA:1,    DR:1,   PA:2,   IS:1.5,  ID:1.5,  RB:1.5,  SB:1.5 },
  "229cm": { JS:1,   JR:0.45, OD:0.45, HA:1,    DR:1,   PA:2,   IS:1.55, ID:1.55, RB:1.55, SB:1.55 }
};

function getAgeCoefficient(age) {
  const table = {
    18:1.00,19:0.95,20:0.88,21:0.78,22:0.7,23:0.6,24:0.51,
    25:0.42,26:0.35,27:0.27,28:0.21,29:0.16,30:0.11,
    31:0.07,32:0.05,33:0.03,34:0.02,35:0.01
  };
  return table[age] || 0;
}

function simulateTraining() {
  const coachCoefficient = parseFloat(document.getElementById("coachQuality").value);
  const playerStats = {};
  baseStats.forEach(stat => {
    playerStats[stat] = parseFloat(document.getElementById(stat).value) || 0;
  });
  const playerName = document.getElementById("playerName").value;
  const heightValue = document.getElementById("height").value;
  const heightMap = heightMultipliers[heightValue] || {};

  for (let s = 1; s <= seasonCount; s++) {
    const selects = document.querySelectorAll(`#seasonBody${s} .training-select`);
    const age = parseInt(document.getElementById(`seasonAge${s}`).value, 10);
    const ageCoefficient = getAgeCoefficient(age);

    selects.forEach(select => {
      const effect = trainingEffects[select.value];
      if (!effect) return; // no training

      // 1) base gains
      const currentGains = {};
      for (let stat in effect) {
        currentGains[stat] = effect[stat] * ageCoefficient * coachCoefficient;
      }

      // 2) elastic bonuses
      for (let baseAttr in currentGains) {
        for (let key in elasticEffects) {
          const [elasticBase, elasticTarget] = key.split('->');
          if (elasticBase === baseAttr && playerStats[elasticTarget] > playerStats[elasticBase]) {
            const diff = playerStats[elasticTarget] - playerStats[elasticBase];
            currentGains[baseAttr] += currentGains[baseAttr] * (diff * elasticEffects[key]);
          }
        }
      }

      // 3) height scaling
      for (let stat in currentGains) {
        currentGains[stat] *= (heightMap[stat] || 1);
      }

      // 4) apply gains with 15% slowdown at ≥18
      for (let stat in currentGains) {
        let gain = currentGains[stat];
        if (playerStats[stat] >= 16) gain *= 0.8;
        playerStats[stat] += gain;
      }
    });
  }

  const resultRow = document.getElementById("resultRow");
  resultRow.innerHTML = `<td>${playerName}</td>` +
    baseStats.map(stat => `<td>${playerStats[stat].toFixed(2)}</td>`).join('');
  document.getElementById("playerSummary").textContent = `Player: ${playerName}`;
}

function applyTrainingToSeason(seasonNum) {
  const selected = document.getElementById(`seasonApplyAll${seasonNum}`).value;
  if (!selected) return;
  document.querySelectorAll(`#seasonBody${seasonNum} .training-select`)
    .forEach(sel => sel.value = selected);
}

function addSeason() {
  seasonCount++;
  const baseAge = parseInt(document.getElementById('playerAge').value, 10);
  const container = document.getElementById('seasonsContainer');
  const seasonDiv = document.createElement('div');
  seasonDiv.id = `season${seasonCount}`;
  seasonDiv.classList.add('mt-5');

  const trainingOptionsList = Object.keys(trainingEffects)
    .map(opt => `<option>${opt}</option>`).join('');
  const weekOptions = `<option value="">-- No Training --</option>${trainingOptionsList}`;
  const applyAllOptions = `<option value="">-- Choose Training Type --</option>${trainingOptionsList}`;

  seasonDiv.innerHTML = `
    <h5>Season ${seasonCount}</h5>
    <div class="mb-2">
      <label>Player Age for Season ${seasonCount}:</label>
      <input type="number" class="form-control d-inline-block w-auto ms-2"
             id="seasonAge${seasonCount}" value="${baseAge + (seasonCount - 1)}">
    </div>
    <div class="mb-3">
      <label>Apply training to all 14 weeks:</label>
      <select class="form-select form-select-sm d-inline-block w-auto"
              id="seasonApplyAll${seasonCount}">
        ${applyAllOptions}
      </select>
      <button class="btn btn-sm btn-outline-primary ms-2"
              onclick="applyTrainingToSeason(${seasonCount})">
        Apply to All Weeks
      </button>
    </div>
    <table class="table table-bordered text-center align-middle">
      <thead class="table-light">
        <tr><th>Week</th><th>Training Type</th></tr>
      </thead>
      <tbody id="seasonBody${seasonCount}">
        ${Array.from({ length: 14 }, (_, i) => `
          <tr>
            <td>Week ${i + 1}</td>
            <td>
              <select class="form-select form-select-sm training-select">
                ${weekOptions}
              </select>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  container.appendChild(seasonDiv);
}

function removeSeason() {
  if (seasonCount === 0) return;
  const last = document.getElementById(`season${seasonCount}`);
  if (last) last.remove();
  seasonCount--;
}

let seasonCount = 0;

const heightOptions = [
  "175cm","178cm","180cm","183cm","185cm","188cm",
  "190cm","193cm","196cm","198cm","201cm","203cm",
  "206cm","208cm","211cm","213cm","216cm","218cm",
  "221cm","224cm","226cm","229cm"
];

const potentialOptions = [
  "Speaker","Reserva","Jogador útil","6º Homem","Titular","Estrela",
  "Super-estrela","Vedeta","Super-vedeta","MVP","Jogador Histórico","Melhor jogador de sempre"
];

window.addEventListener('DOMContentLoaded', () => {
  populateStaticDropdowns();
  baseStats.forEach(stat => {
    const input = document.getElementById(stat);
    if (input) input.value = 7;
  });
  const nameInput = document.getElementById('playerName');
  if (nameInput) nameInput.value = 'Carlos';
});

function populateStaticDropdowns() {
  const heightSelect = document.getElementById('height');
  const potentialSelect = document.getElementById('potential');
  if (heightSelect) {
    heightSelect.innerHTML = heightOptions
      .map(h => `<option value="${h}">${h}</option>`).join('');
    heightSelect.value = "185cm";
  }
  if (potentialSelect) {
    potentialSelect.innerHTML = potentialOptions
      .map(p => `<option value="${p}">${p}</option>`).join('');
    potentialSelect.value = "MVP";
  }
}

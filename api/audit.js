// Dynamic Data Models for Active Pairs
const PAIR_DATA = {
  XAUUSD: {
    price: "2492.40",
    bias: "BULLISH",
    confidence: "85%",
    gate: "READY",
    rsi: "58.4",
    matrix: { d1: { status: "Bullish (85%)", val: 85 }, h4: { status: "Bullish (78%)", val: 78 }, h1: { status: "Bullish (72%)", val: 72 } },
    reasoning: "Gold (XAUUSD) maintains strong bullish momentum holding above the 4H Fair Value Gap (2480-2485). Lower timeframe liquidity sweep completed during London session."
  },
  EURUSD: {
    price: "1.0945",
    bias: "BEARISH",
    confidence: "78%",
    gate: "WAITING",
    rsi: "42.1",
    matrix: { d1: { status: "Bearish (78%)", val: 78 }, h4: { status: "Bearish (70%)", val: 70 }, h1: { status: "Neutral (50%)", val: 50 } },
    reasoning: "EURUSD rejected from Daily order block at 1.0980. Waiting for 15M market structure break before confirming short execution."
  },
  NASDAQ: {
    price: "19820.50",
    bias: "BULLISH",
    confidence: "90%",
    gate: "TRIGGERED",
    rsi: "64.8",
    matrix: { d1: { status: "Bullish (92%)", val: 92 }, h4: { status: "Bullish (88%)", val: 88 }, h1: { status: "Bullish (82%)", val: 82 } },
    reasoning: "NASDAQ expanding upwards following tech sector volume influx. Clean breakout of Asian session high with strong order flow."
  },
  US30: {
    price: "40850.10",
    bias: "NEUTRAL",
    confidence: "55%",
    gate: "STANDBY",
    rsi: "50.2",
    matrix: { d1: { status: "Neutral (55%)", val: 55 }, h4: { status: "Bullish (60%)", val: 60 }, h1: { status: "Bearish (48%)", val: 48 } },
    reasoning: "US30 rangebound between 40700 support and 41000 resistance ahead of high impact economic news. No high-probability setup."
  }
};

// Economic Calendar Dynamic Data (Forex Factory Style with PKT Time)
const CALENDAR_EVENTS = [
  { date: "Aug 18", time: "17:30 PKT", currency: "USD", impact: "HIGH", event: "Core CPI (MoM)", forecast: "0.2%", previous: "0.1%" },
  { date: "Aug 18", time: "17:30 PKT", currency: "USD", impact: "HIGH", event: "CPI (YoY)", forecast: "2.9%", previous: "3.0%" },
  { date: "Aug 19", time: "19:00 PKT", currency: "USD", impact: "HIGH", event: "FOMC Meeting Minutes", forecast: "-", previous: "-" },
  { date: "Aug 20", time: "18:30 PKT", currency: "EUR", impact: "HIGH", event: "ECB Monetary Policy Statement", forecast: "-", previous: "-" },
  { date: "Aug 21", time: "17:30 PKT", currency: "USD", impact: "HIGH", event: "Unemployment Claims", forecast: "232K", previous: "227K" }
];

let currentPair = "XAUUSD";

// Pair Switching Function
function changePair(pair) {
  currentPair = pair;

  // Update Buttons Highlight
  document.querySelectorAll('.pair-btn').forEach(btn => btn.classList.remove('active-pair'));
  const targetBtn = document.getElementById(`btn-${pair}`);
  if (targetBtn) targetBtn.classList.add('active-pair');

  // Update Dashboard Fields
  const data = PAIR_DATA[pair];
  if (!data) return;

  document.getElementById('pair-label').innerText = pair;
  document.getElementById('live-price').innerText = data.price;
  document.getElementById('bias-label').innerText = data.bias;
  document.getElementById('bias-confidence').innerText = `Confidence Score: ${data.confidence}`;
  document.getElementById('gate-status').innerText = data.gate;
  document.getElementById('rsi-val').innerText = data.rsi;

  // Update Color based on Bias
  const biasLabel = document.getElementById('bias-label');
  if (data.bias === "BULLISH") biasLabel.className = "text-2xl font-extrabold mt-1 text-emerald-400";
  else if (data.bias === "BEARISH") biasLabel.className = "text-2xl font-extrabold mt-1 text-red-400";
  else biasLabel.className = "text-2xl font-extrabold mt-1 text-amber-400";

  // Update Matrix
  document.getElementById('tf-1d-text').innerText = data.matrix.d1.status;
  document.getElementById('tf-1d-bar').style.width = `${data.matrix.d1.val}%`;
  document.getElementById('tf-4h-text').innerText = data.matrix.h4.status;
  document.getElementById('tf-4h-bar').style.width = `${data.matrix.h4.val}%`;
  document.getElementById('tf-1h-text').innerText = data.matrix.h1.status;
  document.getElementById('tf-1h-bar').style.width = `${data.matrix.h1.val}%`;

  // Update Reasoning Engine
  document.getElementById('ai-reasoning').innerText = data.reasoning;
}

// Navigation Tab Switcher
function switchTab(tab) {
  document.getElementById('view-dashboard').classList.add('hidden');
  document.getElementById('view-audit').classList.add('hidden');
  document.getElementById('view-calendar').classList.add('hidden');

  document.getElementById(`view-${tab}`).classList.remove('hidden');

  if (tab === 'calendar') {
    renderCalendar();
  }
}

// Economic Calendar Renderer
function renderCalendar() {
  const tbody = document.getElementById('economic-calendar-body');
  if (!tbody) return;
  
  tbody.innerHTML = CALENDAR_EVENTS.map(ev => `
    <tr class="hover:bg-slate-800/30 transition-colors">
      <td class="p-3 font-medium text-slate-300">${ev.date} | <span class="text-blue-400">${ev.time}</span></td>
      <td class="p-3 font-bold">${ev.currency}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30">${ev.impact}</span>
      </td>
      <td class="p-3 font-semibold text-slate-200">${ev.event}</td>
      <td class="p-3 text-slate-400">${ev.forecast}</td>
      <td class="p-3 text-slate-400">${ev.previous}</td>
    </tr>
  `).join('');
}

// AI Screenshot Audit Processor
function processScreenshot(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('audit-img-preview').src = e.target.result;
    document.getElementById('audit-preview-container').classList.remove('hidden');
    switchTab('audit');

    const reportContent = document.getElementById('audit-report-content');
    reportContent.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-blue-400"></i> AI model analyzing market structure, entry zones, and risk parameters...`;

    // Institutional Vision Report Simulation
    setTimeout(() => {
      reportContent.innerHTML = `
        <div class="space-y-2">
          <p><strong class="text-emerald-400">✓ Market Structure:</strong> Clean Market Structure Shift (MSS) identified on lower timeframes.</p>
          <p><strong class="text-emerald-400">✓ Confluence Zone:</strong> Entry aligns directly with Fair Value Gap (FVG) and Discount Liquidity.</p>
          <p><strong class="text-red-400">⚠ Risk Warning:</strong> Stop Loss is tight relative to recent London session sweep wicks.</p>
          <div class="p-2.5 bg-blue-950/50 rounded border border-blue-800/50 text-[11px] mt-2">
            <strong>Verdict / Recommendation:</strong> Grade A Setup. Recommendation: Adjust Stop Loss 5 pips below local swing low to prevent liquidity sweep hunt.
          </div>
        </div>
      `;
    }, 1800);
  };
  reader.readAsDataURL(file);
}

// Refresh Live Analysis Trigger
function refreshAnalysis() {
  const livePriceElem = document.getElementById('live-price');
  if (livePriceElem) {
    livePriceElem.classList.add('opacity-40');
    setTimeout(() => {
      livePriceElem.classList.remove('opacity-40');
      changePair(currentPair);
    }, 500);
  }
}

// Initial Load Handler
document.addEventListener('DOMContentLoaded', () => {
  changePair('XAUUSD');
});

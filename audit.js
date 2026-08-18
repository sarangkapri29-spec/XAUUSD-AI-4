const MARKET_DATA = {
  XAUUSD: {
    price: "2492.40",
    bias: "BULLISH",
    confidence: "85%",
    gate: "READY",
    rsi: "58.4",
    d1: "Bullish (85%)", d1Val: 85,
    h4: "Bullish (78%)", h4Val: 78,
    h1: "Bullish (72%)", h1Val: 72,
    reasoning: "Gold holds strong bullish structure above 4H Fair Value Gap. London session liquidity sweep complete."
  },
  EURUSD: {
    price: "1.0945",
    bias: "BEARISH",
    confidence: "78%",
    gate: "WAITING",
    rsi: "42.1",
    d1: "Bearish (78%)", d1Val: 78,
    h4: "Bearish (70%)", h4Val: 70,
    h1: "Neutral (50%)", h1Val: 50,
    reasoning: "EURUSD rejected at Daily Order Block. Awaiting 15M market structure shift before short execution."
  },
  NASDAQ: {
    price: "19820.50",
    bias: "BULLISH",
    confidence: "90%",
    gate: "TRIGGERED",
    rsi: "64.8",
    d1: "Bullish (92%)", d1Val: 92,
    h4: "Bullish (88%)", h4Val: 88,
    h1: "Bullish (82%)", h1Val: 82,
    reasoning: "NASDAQ expanding upwards following high volume Asian session breakout."
  },
  US30: {
    price: "40850.10",
    bias: "NEUTRAL",
    confidence: "55%",
    gate: "STANDBY",
    rsi: "50.2",
    d1: "Neutral (55%)", d1Val: 55,
    h4: "Bullish (60%)", h4Val: 60,
    h1: "Bearish (48%)", h1Val: 48,
    reasoning: "US30 consolidating between key levels ahead of major news release."
  }
};

const NEWS_EVENTS = [
  { date: "Aug 18", time: "18:30 PKT", currency: "USD", impact: "HIGH", event: "CPI Inflation Data", forecast: "3.1%", previous: "3.2%" },
  { date: "Aug 18", time: "21:00 PKT", currency: "USD", impact: "HIGH", event: "FOMC Minutes", forecast: "-", previous: "-" },
  { date: "Aug 19", time: "17:30 PKT", currency: "USD", impact: "HIGH", event: "Unemployment Claims", forecast: "230K", previous: "233K" }
];

let activeSymbol = "XAUUSD";

function selectPair(symbol) {
  activeSymbol = symbol;
  document.querySelectorAll('.pair-btn').forEach(b => {
    b.className = 'pair-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1e2638] text-slate-300 hover:bg-slate-700';
  });
  const btn = document.getElementById(`btn-${symbol}`);
  if (btn) btn.className = 'pair-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white';

  fetchLivePairData();
}

function fetchLivePairData() {
  const d = MARKET_DATA[activeSymbol] || MARKET_DATA['XAUUSD'];

  document.getElementById('ui-pair').innerText = activeSymbol;
  document.getElementById('ui-price').innerText = d.price;
  document.getElementById('ui-bias').innerText = d.bias;
  document.getElementById('ui-confidence').innerText = `Confidence Score: ${d.confidence}`;
  document.getElementById('ui-gate').innerText = d.gate;
  document.getElementById('ui-rsi').innerText = d.rsi;

  document.getElementById('d1-val').innerText = d.d1;
  document.getElementById('d1-bar').style.width = `${d.d1Val}%`;

  document.getElementById('h4-val').innerText = d.h4;
  document.getElementById('h4-bar').style.width = `${d.h4Val}%`;

  document.getElementById('h1-val').innerText = d.h1;
  document.getElementById('h1-bar').style.width = `${d.h1Val}%`;

  document.getElementById('ui-reasoning').innerText = d.reasoning;
}

function switchTab(tab) {
  document.getElementById('tab-dashboard-view').classList.add('hidden');
  document.getElementById('tab-audit-view').classList.add('hidden');
  document.getElementById('tab-calendar-view').classList.add('hidden');

  document.getElementById(`tab-${tab}-view`).classList.remove('hidden');

  if (tab === 'calendar') renderCalendar();
}

function renderCalendar() {
  const body = document.getElementById('calendar-rows');
  if (!body) return;
  body.innerHTML = NEWS_EVENTS.map(n => `
    
      ${n.date} | ${n.time}
      ${n.currency}
      ${n.impact}
      ${n.event}
      ${n.forecast}
      ${n.previous}
    
  `).join('');
}

function uploadScreenshot(e) {
  const file = e.target.files[0];
  if (!file) return;

  switchTab('audit');
  document.getElementById('audit-report-box').classList.remove('hidden');
  document.getElementById('audit-body').innerHTML = "AI Vision setup scanned. Clean Liquidity Sweep detected near Order Block.";
}

document.addEventListener('DOMContentLoaded', () => {
  selectPair('XAUUSD');
});

let activeSymbol = "XAUUSD";

async function fetchLivePairData() {
  const priceElem = document.getElementById('ui-price');
  if (priceElem) priceElem.innerText = "Loading...";

  try {
    const res = await fetch(`/api/analyze?symbol=${activeSymbol}`);
    const d = await res.json();

    document.getElementById('ui-pair').innerText = d.symbol;
    document.getElementById('ui-price').innerText = d.price;
    document.getElementById('ui-bias').innerText = d.bias;
    document.getElementById('ui-bias').className = `text-2xl font-extrabold mt-1 ${d.bias === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`;
    document.getElementById('ui-confidence').innerText = `Confidence Score: ${d.confidence}`;
    document.getElementById('ui-gate').innerText = d.gate;
    document.getElementById('ui-rsi').innerText = d.rsi;

    document.getElementById('d1-val').innerText = `${d.bias} (${d.d1Val}%)`;
    document.getElementById('d1-bar').style.width = `${d.d1Val}%`;

    document.getElementById('h4-val').innerText = `${d.bias} (${d.h4Val}%)`;
    document.getElementById('h4-bar').style.width = `${d.h4Val}%`;

    document.getElementById('h1-val').innerText = `${d.bias} (${d.h1Val}%)`;
    document.getElementById('h1-bar').style.width = `${d.h1Val}%`;

    document.getElementById('ui-reasoning').innerText = d.reasoning;
  } catch (err) {
    if (priceElem) priceElem.innerText = "Error Loading";
    console.error(err);
  }
}

function selectPair(symbol) {
  activeSymbol = symbol;
  document.querySelectorAll('.pair-btn').forEach(b => {
    b.className = 'pair-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1e2638] text-slate-300 hover:bg-slate-700';
  });
  const btn = document.getElementById(`btn-${symbol}`);
  if (btn) btn.className = 'pair-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white';

  fetchLivePairData();
}

function switchTab(tab) {
  document.getElementById('tab-dashboard-view').classList.add('hidden');
  document.getElementById('tab-audit-view').classList.add('hidden');
  document.getElementById('tab-calendar-view').classList.add('hidden');

  document.getElementById(`tab-${tab}-view`).classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  selectPair('XAUUSD');
  setInterval(fetchLivePairData, 10000);
});

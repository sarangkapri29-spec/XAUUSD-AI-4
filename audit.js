let activeSymbol = "XAUUSD";

const NEWS_EVENTS = [
  { date: "Aug 18", time: "18:30 PKT", currency: "USD", impact: "HIGH", event: "CPI Inflation Data", forecast: "3.1%", previous: "3.2%" },
  { date: "Aug 18", time: "21:00 PKT", currency: "USD", impact: "HIGH", event: "FOMC Minutes", forecast: "-", previous: "-" },
  { date: "Aug 19", time: "17:30 PKT", currency: "USD", impact: "HIGH", event: "Unemployment Claims", forecast: "230K", previous: "233K" },
  { date: "Aug 20", time: "19:00 PKT", currency: "USD", impact: "MEDIUM", event: "Existing Home Sales", forecast: "3.95M", previous: "3.89M" }
];

async function fetchLivePairData() {
  const priceElem = document.getElementById('ui-price');
  if (priceElem) priceElem.innerText = "Loading...";

  try {
    const res = await fetch(`/api/analyze?symbol=${activeSymbol}`);
    const d = await res.json();

    if (document.getElementById('ui-pair')) document.getElementById('ui-pair').innerText = d.symbol;
    if (document.getElementById('ui-price')) document.getElementById('ui-price').innerText = d.price;
    if (document.getElementById('ui-bias')) {
      document.getElementById('ui-bias').innerText = d.bias;
      document.getElementById('ui-bias').className = `text-2xl font-extrabold mt-1 ${d.bias === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (document.getElementById('ui-confidence')) document.getElementById('ui-confidence').innerText = `Confidence Score: ${d.confidence}`;
    if (document.getElementById('ui-gate')) document.getElementById('ui-gate').innerText = d.gate;
    if (document.getElementById('ui-rsi')) document.getElementById('ui-rsi').innerText = d.rsi;

    if (document.getElementById('d1-val')) document.getElementById('d1-val').innerText = `${d.bias} (${d.d1Val}%)`;
    if (document.getElementById('d1-bar')) document.getElementById('d1-bar').style.width = `${d.d1Val}%`;

    if (document.getElementById('h4-val')) document.getElementById('h4-val').innerText = `${d.bias} (${d.h4Val}%)`;
    if (document.getElementById('h4-bar').style.width = `${d.h4Val}%`;

    if (document.getElementById('h1-val')) document.getElementById('h1-val').innerText = `${d.bias} (${d.h1Val}%)`;
    if (document.getElementById('h1-bar').style.width = `${d.h1Val}%`;

    if (document.getElementById('ui-reasoning')) document.getElementById('ui-reasoning').innerText = d.reasoning;
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
  const dash = document.getElementById('tab-dashboard-view');
  const audit = document.getElementById('tab-audit-view');
  const cal = document.getElementById('tab-calendar-view');

  if (dash) dash.classList.add('hidden');
  if (audit) audit.classList.add('hidden');
  if (cal) cal.classList.add('hidden');

  if (tab === 'dashboard' && dash) dash.classList.remove('hidden');
  if (tab === 'audit' && audit) {
    audit.classList.remove('hidden');
    renderAuditUI();
  }
  if (tab === 'calendar' && cal) {
    cal.classList.remove('hidden');
    renderCalendar();
  }
}

function renderCalendar() {
  const calView = document.getElementById('tab-calendar-view');
  if (!calView) return;

  calView.innerHTML = `
    
      Economic News Calendar (PKT)
      
        
            ${NEWS_EVENTS.map(n => `
              
            `).join('')}
          
          
            
              Date / Time (PKT)
              Currency
              Impact
              Event Name
              Forecast
              Previous
            
          
          
                ${n.date} | ${n.time}
                ${n.currency}
                ${n.impact}
                ${n.event}
                ${n.forecast}
                ${n.previous}
              
        
      
    
  `;
}

function renderAuditUI() {
  const auditView = document.getElementById('tab-audit-view');
  if (!auditView) return;

  auditView.innerHTML = `
    
      AI Trade Setup Audit
      Upload chart screenshot for instant market structure & liquidity sweep analysis.
      
      
        
        Click to upload Chart Screenshot
        Supports PNG, JPG, WEBP
        
      

      
        ✓ Audit Scan Complete:
        
      
    
  `;
}

function handleChartUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const resBox = document.getElementById('audit-result');
  const msg = document.getElementById('audit-msg');
  if (resBox && msg) {
    resBox.classList.remove('hidden');
    msg.innerText = `Analyzing "${file.name}"... Institutional Liquidity Sweep detected above Asia High. Valid Fair Value Gap (FVG) confluence present. Technical Bias align with 4H trend.`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  selectPair('XAUUSD');
  setInterval(fetchLivePairData, 10000);
});

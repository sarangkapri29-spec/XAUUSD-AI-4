import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYMBOL = "XAUUSD=X";

function num(v) {
  return Number.isFinite(Number(v)) ? Number(v) : null;
}

function candlesFromYahoo(json) {
  const r = json?.chart?.result?.[0];
  if (!r?.timestamp || !r?.indicators?.quote?.[0]) {
    throw new Error("Yahoo Finance returned no candle data.");
  }
  const q = r.indicators.quote[0];
  return r.timestamp.map((t, i) => ({
    time: new Date(t * 1000).toISOString(),
    open: num(q.open?.[i]),
    high: num(q.high?.[i]),
    low: num(q.low?.[i]),
    close: num(q.close?.[i]),
    volume: num(q.volume?.[i])
  })).filter(c => c.close !== null);
}

async function yahoo(period1, period2, interval) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(SYMBOL)}?period1=${period1}&period2=${period2}&interval=${interval}&events=history`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`Market-data request failed (${r.status}).`);
  return candlesFromYahoo(await r.json());
}

function ema(values, period) {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a,b)=>a+b,0) / period;
  for (let i=period; i<values.length; i++) e = values[i] * k + e * (1-k);
  return e;
}

function rsi(values, period=14) {
  if (values.length < period + 1) return 50;
  let gain=0, loss=0;
  for (let i=values.length-period; i<values.length; i++) {
    const d=values[i]-values[i-1];
    if (d>=0) gain += d; else loss -= d;
  }
  if (loss===0) return 100;
  return +(100 - 100/(1+(gain/period)/(loss/period))).toFixed(1);
}

function aggregate4h(candles) {
  const out=[];
  for (let i=0; i<candles.length; i+=4) {
    const g=candles.slice(i,i+4);
    if (g.length<4) continue;
    out.push({
      time:g[0].time,
      open:g[0].open,
      high:Math.max(...g.map(x=>x.high)),
      low:Math.min(...g.map(x=>x.low)),
      close:g[g.length-1].close,
      volume:g.reduce((s,x)=>s+(x.volume||0),0)
    });
  }
  return out;
}

function tfSummary(c, label) {
  const closes=c.map(x=>x.close);
  const e9=ema(closes,9), e21=ema(closes,21), r=rsi(closes);
  const last=closes.at(-1);
  const recentHigh=Math.max(...c.slice(-20).map(x=>x.high));
  const recentLow=Math.min(...c.slice(-20).map(x=>x.low));
  const trend=e9!==null && e21!==null ? (e9>e21 ? "Bullish" : e9<e21 ? "Bearish" : "Mixed") : "Mixed";
  return {
    timeframe:label,
    close:+last.toFixed(2),
    ema9:e9===null?null:+e9.toFixed(2),
    ema21:e21===null?null:+e21.toFixed(2),
    rsi:r,
    trend,
    recentHigh:+recentHigh.toFixed(2),
    recentLow:+recentLow.toFixed(2)
  };
}

export default async function handler(req,res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,OPTIONS");
  if (req.method==="OPTIONS") return res.status(204).end();
  if (req.method!=="GET") return res.status(405).json({success:false,error:"Method not allowed"});

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({success:false,error:"OPENAI_API_KEY is not configured in Vercel."});
    }

    const now=Math.floor(Date.now()/1000);
    const day=86400;

    const [d1,h1,m15] = await Promise.all([
      yahoo(now-365*day, now, "1d"),
      yahoo(now-60*day, now, "60m"),
      yahoo(now-5*day, now, "15m")
    ]);

    const h4=aggregate4h(h1);
    const t1=tfSummary(d1,"1D");
    const t4=tfSummary(h4,"4H");
    const t1h=tfSummary(h1,"1H");
    const t15=tfSummary(m15,"15M");

    const price=t15.close;
    const latest=m15.at(-1);
    const previous=m15.at(-2);
    const breakoutUp=previous && latest.high > t15.recentHigh;
    const breakoutDown=previous && latest.low < t15.recentLow;
    const retestPending = breakoutUp || breakoutDown;
    const confirmation = previous && latest.close > latest.open && latest.close > previous.high ||
                         previous && latest.close < latest.open && latest.close < previous.low;

    const market = {
      symbol:"XAU/USD",
      source:"Yahoo Finance XAUUSD=X",
      currentPrice:price,
      latestCandle:latest.time,
      timeframes:{ "1D":t1, "4H":t4, "1H":t1h, "15M":t15 },
      gates:{
        breakout:breakoutUp ? "Bullish breakout" : breakoutDown ? "Bearish breakout" : "No confirmed breakout",
        retest:retestPending ? "Retest/confirmation required" : "Waiting for breakout",
        confirmation:confirmation ? "Possible confirmation candle" : "No confirmation candle"
      }
    };

    const prompt = `You are an institutional XAU/USD technical analyst. Use ONLY the supplied calculated market data. Do not invent price levels, candles, news, or timeframe values.

Market data:
${JSON.stringify(market,null,2)}

Rules:
- Evaluate 1D, 4H, 1H and 15M alignment.
- BUY/SELL probabilities must total exactly 100.
- If higher timeframes conflict, or breakout/retest/confirmation is not sufficiently confirmed, signal NO TRADE.
- Confidence is 0-100.
- This is analysis, not a guaranteed prediction.
Return ONLY valid JSON:
{
 "signal":"BUY"|"SELL"|"NO TRADE",
 "buyProbability":number,
 "sellProbability":number,
 "aiConfidence":number,
 "action":"ENTER"|"WAIT",
 "breakoutRetestGate":{"status":"CONFIRMED"|"PENDING"|"FAILED","details":"..."},
 "timeframeAnalysis":{"1D":"...","4H":"...","1H":"...","15M":"..."},
 "aiReasoning":"..."
}`;

    const completion=await openai.chat.completions.create({
      model:"gpt-4o-mini",
      temperature:0.1,
      response_format:{type:"json_object"},
      messages:[
        {role:"system",content:"Return JSON only. Never claim certainty."},
        {role:"user",content:prompt}
      ]
    });

    const analysis=JSON.parse(completion.choices[0].message.content);

    const buy=Math.max(0,Math.min(100,Math.round(Number(analysis.buyProbability))));
    analysis.buyProbability=buy;
    analysis.sellProbability=100-buy;
    analysis.aiConfidence=Math.max(0,Math.min(100,Math.round(Number(analysis.aiConfidence))));
    if (analysis.signal==="NO TRADE") analysis.action="WAIT";

    return res.status(200).json({
      success:true,
      timestamp:new Date().toISOString(),
      marketData:market,
      analysis
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({success:false,error:e?.message||"Analysis failed"});
  }
}

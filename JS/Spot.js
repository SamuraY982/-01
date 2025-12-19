(() => {
  // ---------- helpers ----------
  const fmt = (n, d=2) => Number(n).toLocaleString("en-US", {minimumFractionDigits:d, maximumFractionDigits:d});
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const nowTime = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const hh = String(d.getHours()).padStart(2,"0");
    const mi = String(d.getMinutes()).padStart(2,"0");
    return `${dd}/${mm} ${hh}:${mi}`;
  };

  // ---------- state ----------
  // price direction control
// "up" | "down" | "auto"
let priceDirection = "auto";

  
  // chart zoom / pan
  let visibleCandles = 40;
  let minCandles = 10;
  let maxVisibleCandles = 120;
  let candleOffset = 0;

  let pair = "BTC/USDT";
  let base = "BTC";
  let quote = "USDT";

  // balances (mock)
  let bal = { USDT: 2500.00, BTC: 0.03500000 };

  // candle series (mock)
  const candles = [];
  const maxCandles = 60;
  let last = 115186.99;
  let open24 = last / 1.0262; // approximate so change ~2.62%
  let hi24 = last * 1.010;
  let lo24 = last * 0.985;
  let vol24 = 2152.0;
  let vol24q = 246_843_008;

  // markets list (mock)
  const markets = [
    { sym:"BTC/USDT", last:115186.99, chg: 2.62 },
    { sym:"ETH/USDT", last:4146.10,   chg: 4.67 },
    { sym:"BNB/USDT", last:1168.34,   chg: 2.38 },
    { sym:"SOL/USDT", last:199.28,    chg: 2.65 },
    { sym:"USDC/USDT",last:0.9999,    chg: 0.01 },
    { sym:"XRP/USDT", last:2.6239,    chg:-0.24 },
    { sym:"DOGE/USDT",last:0.20234,   chg: 2.10 },
    { sym:"TON/USDT", last:2.209,     chg: 2.21 },
    { sym:"TRX/USDT", last:0.2991,    chg: 1.01 },
    { sym:"ADA/USDT", last:0.6739,    chg: 2.22 },
    { sym:"AVAX/USDT",last:20.41,     chg: 2.90 },
  ];

  // orderbook (mock)
  const book = { asks: [], bids: [] };

  // trades (mock)
  const trades = [];

  // ---------- DOM ----------
  const el = (id) => document.getElementById(id);

  const asksEl = el("asks");
  const bidsEl = el("bids");
  const markEl = el("markPrice");
  const lastEl = el("lastPrice");
  const obSpreadEl = el("obSpread");

  const kLast = el("kLast");
  const kChg  = el("kChg");
  const kHigh = el("kHigh");
  const kLow  = el("kLow");
  const kVol  = el("kVol");
  const kVolQ = el("kVolQ");

  const pairName = el("pairName");
  const pairUsd = el("pairUsd");

  const balUsdt = el("balUsdt");
  const balBtc = el("balBtc");
  const availBuy = el("availBuy");
  const availSell = el("availSell");

  const buyAmount = el("buyAmount");
  const sellAmount = el("sellAmount");
  const buyGet = el("buyGet");
  const sellGet = el("sellGet");

  const tradeRows = el("tradeRows");
  const marketRows = el("marketRows");
  const marketSearch = el("marketSearch");

  // chart
  const canvas = el("chart");
  const ctx = canvas.getContext("2d");

  const resizeCanvas = () => {
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
  };

  // ---------- init ----------
  function seedCandles() {
    candles.length = 0;
    let p = last;
    for (let i=0; i<maxCandles; i++){
      const o = p;
      const drift = (Math.random()-0.48) * (last*0.0018);
      const c = Math.max(1, o + drift);
      const h = Math.max(o,c) + Math.random()*(last*0.0012);
      const l = Math.min(o,c) - Math.random()*(last*0.0012);
      const v = 20 + Math.random()*120;
      candles.push({ o, h, l, c, v });
      p = c;
    }
    last = candles[candles.length-1].c;
  }

  function genBook() {
    book.asks = [];
    book.bids = [];
    const spread = last * 0.00008;
    const midAsk = last + spread/2;
    const midBid = last - spread/2;

    let askP = midAsk;
    let bidP = midBid;

    for (let i=0;i<18;i++){
      askP += (last*0.00005) * (0.7 + Math.random());
      const size = (Math.random() * 0.18) + 0.0005;
      book.asks.push({ p: askP, s: size });
    }
    for (let i=0;i<18;i++){
      bidP -= (last*0.00005) * (0.7 + Math.random());
      const size = (Math.random() * 0.18) + 0.0005;
      book.bids.push({ p: bidP, s: size });
    }
  }

  function pushTrade(price, size, dir) {
    trades.unshift({ price, size, dir, time: nowTime() });
    if (trades.length > 80) trades.pop();
  }

  function seedTrades() {
    trades.length=0;
    for (let i=0;i<22;i++){
      const dir = Math.random() > 0.5 ? "up" : "down";
      const price = last + (Math.random()-0.5) * (last*0.0009);
      const size = (Math.random()*0.45) + 0.00009;
      pushTrade(price, size, dir);
    }
  }

  // ---------- renderers ----------
  function renderBalances() {
    balUsdt.textContent = fmt(bal.USDT, 2);
    balBtc.textContent  = fmt(bal.BTC, 8);
    availBuy.textContent = `${fmt(bal.USDT, 2)} ${quote}`;
    availSell.textContent = `${fmt(bal.BTC, 8)} ${base}`;
  }

  function renderKPIs() {
    const chg = ((last - open24) / open24) * 100;
    kLast.textContent = fmt(last, 2);
    kChg.textContent = `${chg >= 0 ? "+" : ""}${fmt(chg, 2)}%`;
    kChg.style.color = chg >= 0 ? "var(--green)" : "var(--red)";
    kHigh.textContent = fmt(hi24, 0);
    kLow.textContent  = fmt(lo24, 2);
    kVol.textContent  = fmt(vol24, 0);
    kVolQ.textContent = fmt(vol24q, 2);

    pairName.textContent = pair;
    pairUsd.textContent = `≈ $${fmt(last, 2)}`;

    lastEl.textContent = fmt(last, 2);
    markEl.textContent = fmt(last, 2);
  }

  function renderBook() {
    // compute max totals for bar widths
    const asksTotals = book.asks.map(x => x.p * x.s);
    const bidsTotals = book.bids.map(x => x.p * x.s);
    const maxTotal = Math.max(...asksTotals, ...bidsTotals, 1);

    asksEl.innerHTML = "";
    // asks show from top (higher) down (like many exchanges)
    [...book.asks].reverse().forEach(x => {
      const total = x.p * x.s;
      const row = document.createElement("div");
      row.className = "row ask";
      row.innerHTML = `
        <div class="price ask">${fmt(x.p, 2)}</div>
        <div>${fmt(x.s, 8)}</div>
        <div>${fmt(total, 2)}</div>
        <div class="bgbar"></div>
      `;
      const bg = row.querySelector(".bgbar");
      bg.style.width = `${(total/maxTotal)*100}%`;
      asksEl.appendChild(row);
    });

    bidsEl.innerHTML = "";
    book.bids.forEach(x => {
      const total = x.p * x.s;
      const row = document.createElement("div");
      row.className = "row bid";
      row.innerHTML = `
        <div class="price bid">${fmt(x.p, 2)}</div>
        <div>${fmt(x.s, 8)}</div>
        <div>${fmt(total, 2)}</div>
        <div class="bgbar"></div>
      `;
      const bg = row.querySelector(".bgbar");
      bg.style.width = `${(total/maxTotal)*100}%`;
      bidsEl.appendChild(row);
    });

    const bestAsk = book.asks[0]?.p ?? last;
    const bestBid = book.bids[0]?.p ?? last;
    const spread = Math.max(0, bestAsk - bestBid);
    obSpreadEl.textContent = `Spread: ${fmt(spread, 2)}`;
  }

  function renderTrades() {
    tradeRows.innerHTML = "";
    trades.slice(0, 40).forEach(t => {
      const row = document.createElement("div");
      row.className = "tRow";
      row.innerHTML = `
        <div class="p ${t.dir}">${fmt(t.price, 2)}</div>
        <div>${fmt(t.size, 8)}</div>
        <div>${t.time}</div>
      `;
      tradeRows.appendChild(row);
    });
  }

  function renderMarkets(filter="") {
    const f = filter.trim().toUpperCase();
    marketRows.innerHTML = "";
    markets
      .filter(m => !f || m.sym.toUpperCase().includes(f))
      .forEach(m => {
        const row = document.createElement("div");
        row.className = "mRow" + (m.sym === pair ? " active" : "");
        const up = m.chg >= 0;
        row.innerHTML = `
          <div style="font-family:var(--sans); font-weight:800">${m.sym}</div>
          <div>${fmt(m.last, m.last < 10 ? 4 : 2)}</div>
          <div class="chg ${up ? "up" : "down"}">${up ? "+" : ""}${fmt(m.chg, 2)}%</div>
        `;
        row.onclick = () => switchPair(m.sym);
        marketRows.appendChild(row);
      });
  }

  // ---------- chart ----------
  function drawChart() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // background
    ctx.clearRect(0,0,w,h);

    // margins
    const padL = 52, padR = 10, padT = 10, padB = 26;
    const vh = 70; // volume height
    const ph = h - padT - padB - vh;

    // visible window
    const end = candles.length - candleOffset;
    const start = Math.max(0, end - visibleCandles);
    const data = candles.slice(start, end);
    const highs = data.map(d => d.h);
    const lows  = data.map(d => d.l);
    const maxP = Math.max(...highs);
    const minP = Math.min(...lows);
    const range = Math.max(1e-9, maxP - minP);

    const maxV = Math.max(...data.map(d => d.v), 1);

    // grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#eef2f7";
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px var(--mono)";

    const gridY = 6;
    for (let i=0;i<=gridY;i++){
      const y = padT + (ph/gridY)*i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w-padR, y);
      ctx.stroke();

      const p = maxP - (range/gridY)*i;
      ctx.fillText(fmt(p, 0), 6, y+4);
    }

    // candle geometry
    const n = data.length;
    const plotW = (w - padL - padR);
    const step = plotW / n;
    const cw = Math.max(4, step*0.62);

    function yPrice(p){
      return padT + (maxP - p) / range * ph;
    }

    // candles
    for (let i=0;i<n;i++){
      const d = data[i];
      const x = padL + i*step + step/2;

      const yO = yPrice(d.o);
      const yC = yPrice(d.c);
      const yH = yPrice(d.h);
      const yL = yPrice(d.l);

      const up = d.c >= d.o;
      const col = up ? getComputedStyle(document.documentElement).getPropertyValue('--green').trim()
                     : getComputedStyle(document.documentElement).getPropertyValue('--red').trim();

      // wick
      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.moveTo(x, yH);
      ctx.lineTo(x, yL);
      ctx.stroke();

      // body
      const top = Math.min(yO, yC);
      const bot = Math.max(yO, yC);
      const bh = Math.max(2, bot - top);
      ctx.fillStyle = col;
      ctx.fillRect(x - cw/2, top, cw, bh);

      // volume
      const vH = (d.v / maxV) * (vh-10);
      const vy = padT + ph + (vh-6) - vH;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(x - cw/2, vy, cw, vH);
      ctx.globalAlpha = 1;
    }

    // last price line
    const yLpx = yPrice(last);
    ctx.setLineDash([4,4]);
    ctx.strokeStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.moveTo(padL, yLpx);
    ctx.lineTo(w-padR, yLpx);
    ctx.stroke();
    ctx.setLineDash([]);

    // last label
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#e5e7eb";
    const label = fmt(last, 2);
    const tw = ctx.measureText(label).width + 14;
    const lx = w - padR - tw;
    const ly = clamp(yLpx-12, padT+6, padT+ph-22);
    ctx.fillStyle = "rgba(239,68,68,.92)";
    ctx.fillRect(lx, ly, tw, 22);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, lx+8, ly+15);
  }

  // ---------- trading interactions ----------
  function recalcFormHints() {
    const buyUSDT = Number(buyAmount.value || 0);
    const sellBTC = Number(sellAmount.value || 0);

    const buyBTC = buyUSDT > 0 ? buyUSDT / last : 0;
    const sellUSDT = sellBTC > 0 ? sellBTC * last : 0;

    buyGet.textContent = buyBTC ? fmt(buyBTC, 8) : "0";
    sellGet.textContent = sellUSDT ? fmt(sellUSDT, 2) : "0";
  }

  function buyMarket() {
    const usdt = Number(buyAmount.value || 0);
    if (!(usdt > 0)) return alert("Введите сумму USDT для покупки.");
    if (usdt > bal.USDT) return alert("Недостаточно USDT.");

    const btc = usdt / last;
    bal.USDT -= usdt;
    bal.BTC  += btc;

    pushTrade(last, btc, "up");
    renderBalances();
    renderTrades();
    recalcFormHints();
  }

  function sellMarket() {
    const btc = Number(sellAmount.value || 0);
    if (!(btc > 0)) return alert("Введите количество BTC для продажи.");
    if (btc > bal.BTC) return alert("Недостаточно BTC.");

    const usdt = btc * last;
    bal.BTC  -= btc;
    bal.USDT += usdt;

    pushTrade(last, btc, "down");
    renderBalances();
    renderTrades();
    recalcFormHints();
  }

  // ---------- pair switching ----------
  function switchPair(sym) {
    pair = sym;
    [base, quote] = sym.split("/");
    // set last according to market
    const m = markets.find(x => x.sym === sym);
    if (m) last = m.last;

    // change header icon roughly
    const coin = document.querySelector(".coin");
    coin.textContent = base === "BTC" ? "₿" : base[0];

    // reset 24h stats
    open24 = last / (1 + (m?.chg ?? 0)/100);
    hi24 = last * (1.006 + Math.random()*0.01);
    lo24 = last * (0.985 - Math.random()*0.01);
    vol24 = 1200 + Math.random()*2600;
    vol24q = vol24 * last;

    seedCandles();
    genBook();
    seedTrades();

    renderKPIs();
    renderBook();
    renderTrades();
    renderMarkets(marketSearch.value);
    drawChart();

    // update form labels/buttons
    document.getElementById("btnBuy").textContent = `Buy ${base}`;
    document.getElementById("btnSell").textContent = `Sell ${base}`;
    document.querySelectorAll(".suffix").forEach(s => {
      // first suffix in buy is USDT, second in sell is base — already OK
    });

    // reset inputs
    buyAmount.value = "";
    sellAmount.value = "";
    recalcFormHints();
  }

  // ---------- live updates (mock) ----------
  function stepMarket() {
    // random walk with small volatility
    const drift = (Math.random()-0.48) * (last * 0.0009);
    const next = Math.max(0.0001, last + drift);

    // update current candle (last candle in series)
    const cur = candles[candles.length-1];
    cur.c = next;
    cur.h = Math.max(cur.h, next);
    cur.l = Math.min(cur.l, next);
    cur.v += 2 + Math.random()*8;

    last = next;

    // occasional new candle
    if (Math.random() < 0.12){
      const o = last;
      const c = last + (Math.random()-0.5)*(last*0.0013);
      const h = Math.max(o,c) + Math.random()*(last*0.0008);
      const l = Math.min(o,c) - Math.random()*(last*0.0008);
      const v = 20 + Math.random()*120;
      candles.push({o,h,l,c,v});
      while (candles.length > maxCandles) candles.shift();
    }

    // update book + trades
    genBook();

    const dir = (Math.random() > 0.5) ? "up" : "down";
    const size = (Math.random()*0.35) + 0.00009;
    pushTrade(last, size, dir);

    // update market list slightly
    markets.forEach(m => {
      const mult = (Math.random()-0.5) * 0.0022;
      m.last = Math.max(0.0001, m.last * (1+mult));
      m.chg = clamp(m.chg + (Math.random()-0.5)*0.12, -12, 12);
      if (m.sym === pair) {
        m.last = last;
      }
    });

    // update 24h hi/lo
    hi24 = Math.max(hi24, last);
    lo24 = Math.min(lo24, last);
    vol24 += size*10;
    vol24q = vol24 * last;

    renderKPIs();
    renderBook();
    renderTrades();
    renderMarkets(marketSearch.value);
    drawChart();
  }

  // ---------- tabs (visual only) ----------
  document.querySelectorAll(".tab").forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      // for mock: keep Market Price only (как на скрине можно просто переключать вкладки)
    });
  });

  // percent buttons
  document.querySelectorAll(".pctBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const pct = Number(btn.dataset.pct) / 100;
      const side = btn.dataset.side;
      if (side === "buy") {
        const v = bal.USDT * pct;
        buyAmount.value = (Math.floor(v*100)/100).toFixed(2);
      } else {
        const v = bal.BTC * pct;
        sellAmount.value = v.toFixed(8);
      }
      recalcFormHints();
    });
  });

  buyAmount.addEventListener("input", recalcFormHints);
  sellAmount.addEventListener("input", recalcFormHints);

  el("btnBuy").addEventListener("click", buyMarket);
  el("btnSell").addEventListener("click", sellMarket);

  marketSearch.addEventListener("input", (e) => renderMarkets(e.target.value));

  window.addEventListener("resize", () => {
    resizeCanvas();
    drawChart();
  });

  // ---------- boot ----------
  
  seedCandles();
  genBook();
  seedTrades();
  resizeCanvas();
  canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  visibleCandles += Math.sign(e.deltaY) * 4;
  visibleCandles = clamp(visibleCandles, minCandles, maxVisibleCandles);

  drawChart();
}, { passive: false });
let isDragging = false;
let lastX = 0;

canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const dx = e.clientX - lastX;
  lastX = e.clientX;

  candleOffset += Math.round(dx / 8);
  candleOffset = clamp(
    candleOffset,
    0,
    Math.max(0, candles.length - visibleCandles)
  );

  drawChart();
});

canvas.addEventListener("dblclick", () => {
  visibleCandles = 40;
  candleOffset = 0;
  drawChart();
});



  renderBalances();
  renderKPIs();
  renderBook();
  renderTrades();
  renderMarkets();
  recalcFormHints();
  drawChart();

function updatePriceOnly() {
  let directionFactor = 0;

if (priceDirection === "up") directionFactor = Math.random();
else if (priceDirection === "down") directionFactor = -Math.random();
else directionFactor = Math.random() - 0.5;

const drift = directionFactor * (last * 0.0007);


  const next = Math.max(0.0001, last + drift);

  const cur = candles[candles.length - 1];
  cur.c = next;
  cur.h = Math.max(cur.h, next);
  cur.l = Math.min(cur.l, next);
  cur.v += 1 + Math.random() * 5;

  last = next;

  if (Math.random() < 0.08) {
    const o = last;
    const c = last + (Math.random() - 0.5) * (last * 0.001);
    const h = Math.max(o, c) + Math.random() * (last * 0.0006);
    const l = Math.min(o, c) - Math.random() * (last * 0.0006);
    const v = 20 + Math.random() * 100;
    candles.push({ o, h, l, c, v });
    while (candles.length > maxCandles) candles.shift();
  }
}



  // live loop
  // price + chart (часто)
setInterval(() => {
  updatePriceOnly();
  drawChart();
  renderKPIs();
}, 900);

// order book (медленнее)
setInterval(() => {
  genBook();
  renderBook();
}, 3000);

// trades
setInterval(() => {
  const dir = Math.random() > 0.5 ? "up" : "down";
  const size = (Math.random() * 0.35) + 0.00009;
  pushTrade(last, size, dir);
  renderTrades();
}, 2000);

// markets
setInterval(() => {
  markets.forEach(m => {
    const mult = (Math.random() - 0.5) * 0.0015;
    m.last = Math.max(0.0001, m.last * (1 + mult));
    m.chg = clamp(m.chg + (Math.random() - 0.5) * 0.08, -12, 12);
    if (m.sym === pair) m.last = last;
  });
  renderMarkets(marketSearch.value);
}, 5000);

})();
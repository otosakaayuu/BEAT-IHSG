/* ===================================================
   BEAT IT — App Logic
   Checklist state, calculators, signal bars
   =================================================== */

// ─── Tier Navigation ───────────────────────────────
document.querySelectorAll('.tier-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tier-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tier-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.target;
    const section = document.getElementById(target);
    if (section) {
      section.classList.add('active');
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── Sub Strategy Tabs ─────────────────────────────
document.querySelectorAll('.sub-strategy-tabs').forEach(tabGroup => {
  tabGroup.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const card = tab.closest('.strategy-body');
      tabGroup.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.sub;
      card.querySelectorAll('.sub-content').forEach(c => c.classList.remove('active'));
      const targetEl = document.getElementById('sub-' + target);
      if (targetEl) targetEl.classList.add('active');
    });
  });
});

// ─── Tier Hold Advisor ─────────────────────────────
const holdAdvice = {
  '1': { icon: '⚡', text: 'Hold harian hingga mingguan. Aktif monitor dan exit agresif saat sinyal exhaustion.' },
  '2': { icon: '📅', text: 'Hold per event (IPO max Hari 7, Dividen sampai Cum-Date). Jangan nikahi aset.' },
  '3': { icon: '🎯', text: 'Hold 3–9 bulan. Matikan layar setelah akumulasi. Zero-churn adalah aturan mutlak.' },
  '4': { icon: '🔒', text: 'Hold 30–45 hari (MTO) atau sampai berita M&A publik. Win rate ~100% jika dieksekusi tepat.' }
};

document.querySelectorAll('.tier-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tier = btn.dataset.tier;
    const advice = holdAdvice[tier];
    document.getElementById('hold-advice').querySelector('.hold-icon').textContent = advice.icon;
    document.getElementById('hold-text').textContent = advice.text;
  });
});

// ─── Formatter ─────────────────────────────────────
const fmt = {
  pct: (v) => v.toFixed(2) + '%',
  rp: (v) => 'Rp ' + v.toLocaleString('id-ID'),
  lot: (v) => v.toLocaleString('id-ID') + ' lot',
  x: (v) => v.toFixed(1) + 'x'
};

function setVerdict(el, type, msg) {
  if (!el) return;
  el.className = 'verdict-box ' + type;
  el.textContent = msg;
}

// ─── DEFENSE: Capacity Calculator ──────────────────
document.getElementById('adtv-input').addEventListener('input', function () {
  const adtv = parseFloat(this.value);
  if (!adtv || adtv <= 0) {
    document.getElementById('cap-low').textContent = '—';
    document.getElementById('cap-high').textContent = '—';
    return;
  }
  const low = adtv * 0.05;
  const high = adtv * 0.10;
  document.getElementById('cap-low').textContent = 'Rp ' + low.toFixed(1) + ' M';
  document.getElementById('cap-high').textContent = 'Rp ' + high.toFixed(1) + ' M';
});

// ─── DEFENSE: Hurdle Rate Calculator ───────────────
function calcHurdle() {
  const entry = parseFloat(document.getElementById('entry-price').value);
  const resist = parseFloat(document.getElementById('resist-price').value);
  if (!entry || !resist || entry <= 0 || resist <= entry) return;

  const gap = ((resist - entry) / entry) * 100;
  const afterFee = gap - 0.40;
  const afterSlippage = afterFee - 1.5;

  const gapEl = document.getElementById('hurdle-gap');
  const netEl = document.getElementById('hurdle-net');
  const finalEl = document.getElementById('hurdle-final');
  const verdict = document.getElementById('hurdle-verdict');

  gapEl.textContent = fmt.pct(gap);
  gapEl.className = 'result-val ' + (gap >= 5 ? 'text-green' : 'text-red');

  netEl.textContent = fmt.pct(afterFee);
  netEl.className = 'result-val ' + (afterFee >= 4 ? 'text-green' : 'text-red');

  finalEl.textContent = fmt.pct(afterSlippage);
  finalEl.className = 'result-val ' + (afterSlippage >= 3 ? 'text-green' : 'text-red');

  if (afterSlippage >= 3 && gap >= 5) {
    setVerdict(verdict, 'go', '✅ LAYAK ENTRY — Net yield memenuhi batas minimum >3%');
  } else if (afterSlippage >= 0) {
    setVerdict(verdict, 'warn', '⚠️ MARGIN TIPIS — Net yield <3%. Pertimbangkan ulang.');
  } else {
    setVerdict(verdict, 'no-go', '🚫 NO ENTRY — Setelah fee + slippage, posisi RUGI. Skip!');
  }
}

document.getElementById('entry-price').addEventListener('input', calcHurdle);
document.getElementById('resist-price').addEventListener('input', calcHurdle);

// ─── S1: Volume Anomaly Calculator ─────────────────
function calcS1() {
  const ma20 = parseFloat(document.getElementById('s1-ma20').value);
  const vol = parseFloat(document.getElementById('s1-vol').value);
  if (!ma20 || !vol || ma20 <= 0) return;

  const mult = vol / ma20;
  const thresh = ma20 * 3;

  const multEl = document.getElementById('s1-mult');
  const threshEl = document.getElementById('s1-thresh');
  const verdict = document.getElementById('s1-verdict');

  multEl.textContent = mult.toFixed(1) + 'x MA20';
  multEl.className = 'result-val ' + (mult >= 3 ? 'text-green' : 'text-red');

  threshEl.textContent = fmt.lot(thresh) + ' (min untuk valid)';
  threshEl.className = 'result-val text-gold';

  if (mult >= 3) {
    setVerdict(verdict, 'go', '✅ BREAKOUT VALID — Volume ≥300% MA20. Anomaly terkonfirmasi!');
  } else if (mult >= 2) {
    setVerdict(verdict, 'warn', '⚠️ VOLUME LEMAH — ' + mult.toFixed(1) + 'x MA20. Belum mencapai 300% threshold.');
  } else {
    setVerdict(verdict, 'no-go', '🚫 VOLUME RENDAH — ' + mult.toFixed(1) + 'x MA20. Tidak ada sinyal institusi.');
  }
}

document.getElementById('s1-ma20').addEventListener('input', calcS1);
document.getElementById('s1-vol').addEventListener('input', calcS1);

// ─── S3: IPO Penjatahan Calculator ─────────────────
function calcIPO() {
  const lot = parseFloat(document.getElementById('ipo-lot').value);
  const alloc = parseFloat(document.getElementById('ipo-alloc').value);
  if (!lot || !alloc || lot <= 0) return;

  const pct = (alloc / lot) * 100;
  const pctEl = document.getElementById('ipo-pct');
  const verdict = document.getElementById('ipo-verdict');

  pctEl.textContent = fmt.pct(pct);
  pctEl.className = 'result-val ' + (pct < 2 ? 'text-green' : pct > 30 ? 'text-red' : 'text-gold');

  if (pct < 2) {
    setVerdict(verdict, 'go', '🟢 SQUEEZE! Alokasi <2% = OVERSUBSCRIBED EKSTREM. Suplai sangat langka. HOLD & tunggu squeeze!');
  } else if (pct <= 30) {
    setVerdict(verdict, 'warn', '⚠️ NORMAL — Alokasi ' + fmt.pct(pct) + '. Monitor day-1 action sebelum memutuskan hold/jual.');
  } else {
    setVerdict(verdict, 'no-go', '🔴 TOXIC! Alokasi >30% = Ritel terjebak, suplai berlimpah. CUT LOSS di hari pertama!');
  }
}

document.getElementById('ipo-lot').addEventListener('input', calcIPO);
document.getElementById('ipo-alloc').addEventListener('input', calcIPO);

// ─── S4: Dividend Trap Calculator ──────────────────
function calcDiv() {
  const buy = parseFloat(document.getElementById('div-buy').value);
  const sell = parseFloat(document.getElementById('div-sell').value);
  const div = parseFloat(document.getElementById('div-amount').value);
  if (!buy || buy <= 0) return;

  const gainEl = document.getElementById('div-gain');
  const yieldEl = document.getElementById('div-yield');
  const netEl = document.getElementById('div-net');
  const verdict = document.getElementById('div-verdict');

  if (sell && sell > buy) {
    const gain = ((sell - buy) / buy) * 100;
    gainEl.textContent = '+' + fmt.pct(gain) + ' (' + fmt.rp(sell - buy) + '/saham)';
    gainEl.className = 'result-val text-green';
  } else {
    gainEl.textContent = '—';
    gainEl.className = 'result-val';
  }

  if (div && buy) {
    const grossYield = (div / buy) * 100;
    const netDiv = div * 0.9;
    const netYield = (netDiv / buy) * 100;
    yieldEl.textContent = fmt.pct(grossYield);
    yieldEl.className = 'result-val text-gold';
    netEl.textContent = fmt.pct(netYield) + ' (pajak 10% = ' + fmt.rp(div - netDiv) + '/saham)';
    netEl.className = 'result-val text-muted';

    if (sell && sell > buy) {
      const gain = ((sell - buy) / buy) * 100;
      if (gain > netYield) {
        setVerdict(verdict, 'go', '✅ CAPITAL GAIN (' + fmt.pct(gain) + ') > DIVIDEN NET (' + fmt.pct(netYield) + '). Strategi exit sebelum Ex-Date lebih optimal!');
      } else {
        setVerdict(verdict, 'warn', '⚠️ Dividen net lebih tinggi dari capital gain. Pertimbangkan risiko ARB di Ex-Date.');
      }
    }
  }
}

document.getElementById('div-buy').addEventListener('input', calcDiv);
document.getElementById('div-sell').addEventListener('input', calcDiv);
document.getElementById('div-amount').addEventListener('input', calcDiv);

// ─── S5: Rights Issue Dilution Calculator ──────────────
function calcRI() {
  const oldShares = parseFloat(document.getElementById('ri-old').value);
  const newShares = parseFloat(document.getElementById('ri-new').value);
  if (!oldShares || !newShares || oldShares <= 0) return;

  const total = oldShares + newShares;
  const ownership = (oldShares / total) * 100;
  const dilution = 100 - ownership;

  const ownerEl = document.getElementById('ri-ownership');
  const dilEl = document.getElementById('ri-dilution');
  const verdict = document.getElementById('ri-verdict');

  ownerEl.textContent = fmt.pct(ownership) + ' dari total saham';
  ownerEl.className = 'result-val text-red';
  dilEl.textContent = '-' + fmt.pct(dilution) + ' dari posisi awal';
  dilEl.className = 'result-val text-red';

  const ratio = newShares / oldShares;
  if (ratio >= 3) {
    setVerdict(verdict, 'no-go', '🔴 DILUSI EKSTREM! Rasio 1:' + ratio.toFixed(0) + '. Kepemilikan publik tersisa hanya ' + fmt.pct(ownership) + '. Konglo merebut kendali penuh.');
  } else if (ratio >= 1) {
    setVerdict(verdict, 'warn', '⚠️ DILUSI SIGNIFIKAN. Rasio 1:' + ratio.toFixed(1) + '. Monitor apakah Konglo standby buyer.');
  } else {
    setVerdict(verdict, 'warn', '⚠️ Dilusi ringan. Cek kembali prospektus untuk konfirmasi.');
  }
}

document.getElementById('ri-old').addEventListener('input', calcRI);
document.getElementById('ri-new').addEventListener('input', calcRI);

// ─── S6: FCA Risk/Reward Calculator ────────────────
function calcFCA() {
  const buy = parseFloat(document.getElementById('fca-buy').value);
  const target = parseFloat(document.getElementById('fca-target').value);
  if (!buy || !target || buy <= 0 || target <= buy) return;

  const upside = ((target - buy) / buy) * 100;
  const rr = upside / 5; // assume 5% downside max from floor

  document.getElementById('fca-upside').textContent = '+' + upside.toFixed(0) + '%';
  document.getElementById('fca-upside').className = 'result-val text-green';
  document.getElementById('fca-rr').textContent = rr.toFixed(0) + ':1';
  document.getElementById('fca-rr').className = 'result-val text-gold';

  const verdict = document.getElementById('fca-verdict');
  if (upside >= 200) {
    setVerdict(verdict, 'go', '🟢 ASIMETRI LUAR BIASA! Potensi +' + upside.toFixed(0) + '% dengan downside ~0%. Setup ideal Sleeping Dragon.');
  } else if (upside >= 50) {
    setVerdict(verdict, 'go', '✅ Setup asimetris bagus. Potensi upside ' + upside.toFixed(0) + '% saat FCA dicabut.');
  } else {
    setVerdict(verdict, 'warn', '⚠️ Upside hanya ' + upside.toFixed(0) + '%. Tetap asimetris tapi cek ulang katalis realistis.');
  }
}

document.getElementById('fca-buy').addEventListener('input', calcFCA);
document.getElementById('fca-target').addEventListener('input', calcFCA);

// ─── S7: MTO Spread Calculator ─────────────────────
function calcMTO() {
  const buy = parseFloat(document.getElementById('mto-buy').value);
  const offer = parseFloat(document.getElementById('mto-offer').value);
  const days = parseFloat(document.getElementById('mto-days').value);
  if (!buy || !offer || buy <= 0 || offer <= buy) return;

  const spread = ((offer - buy) / buy) * 100;
  const net = spread - 0.40;
  const annual = days > 0 ? (net / days) * 365 : 0;

  const spreadEl = document.getElementById('mto-spread');
  const netEl = document.getElementById('mto-net');
  const annualEl = document.getElementById('mto-annual');
  const verdict = document.getElementById('mto-verdict');

  spreadEl.textContent = '+' + fmt.pct(spread) + ' (' + fmt.rp(offer - buy) + '/saham)';
  spreadEl.className = 'result-val text-green';

  netEl.textContent = '+' + fmt.pct(net);
  netEl.className = 'result-val ' + (net > 0 ? 'text-green' : 'text-red');

  if (days > 0) {
    annualEl.textContent = '+' + fmt.pct(annual) + '/tahun';
    annualEl.className = 'result-val text-gold';
  }

  if (net >= 3) {
    setVerdict(verdict, 'go', '🔒 ARBITRASE TERKUNCI! Net yield ' + fmt.pct(net) + ' dalam ' + days + ' hari. Risk-free (MTO bersifat wajib oleh OJK).');
  } else if (net > 0) {
    setVerdict(verdict, 'warn', '⚠️ Yield kecil (' + fmt.pct(net) + '). Tetap risk-free tapi oportunitas modal bisa lebih baik di tempat lain.');
  } else {
    setVerdict(verdict, 'no-go', '🚫 RUGI setelah fee. Spread tidak cukup menutup biaya transaksi. Skip!');
  }
}

document.getElementById('mto-buy').addEventListener('input', calcMTO);
document.getElementById('mto-offer').addEventListener('input', calcMTO);
document.getElementById('mto-days').addEventListener('input', calcMTO);

// ─── S8: Dark Pool Premium/Discount Calculator ─────
function calcDP() {
  const reg = parseFloat(document.getElementById('dp-reg').value);
  const cross = parseFloat(document.getElementById('dp-cross').value);
  if (!reg || !cross || reg <= 0) return;

  const pct = ((cross - reg) / reg) * 100;
  const pctEl = document.getElementById('dp-pct');
  const verdict = document.getElementById('dp-verdict');

  if (pct > 0) {
    pctEl.textContent = '+' + fmt.pct(pct) + ' PREMIUM';
    pctEl.className = 'result-val text-green';
    if (pct >= 20) {
      setVerdict(verdict, 'go', '🟢 STRONG BUY! Premium ' + fmt.pct(pct) + ' di Negosiasi = sinyal M&A / akuisisi strategis. Beli di pasar reguler!');
    } else {
      setVerdict(verdict, 'warn', '⚠️ Premium kecil (' + fmt.pct(pct) + '). Bisa noise atau block trade biasa. Perlu konfirmasi lanjutan.');
    }
  } else if (pct < 0) {
    pctEl.textContent = fmt.pct(pct) + ' DISKON';
    pctEl.className = 'result-val text-red';
    if (pct <= -20) {
      setVerdict(verdict, 'no-go', '🔴 DANGER! Diskon ' + fmt.pct(Math.abs(pct)) + ' = Sinyal bailout/gagal bayar. Harga reguler ILUSI. AVOID / SHORT!');
    } else {
      setVerdict(verdict, 'warn', '⚠️ Diskon ringan (' + fmt.pct(pct) + '). Monitor lebih lanjut, bisa posisi teknikal biasa.');
    }
  }
}

document.getElementById('dp-reg').addEventListener('input', calcDP);
document.getElementById('dp-cross').addEventListener('input', calcDP);

// ─── Checklist State Tracker ───────────────────────

// Defense checklist completions
const defenseChecks = {
  capacity: ['chk-capacity'],
  hurdle: ['chk-hurdle'],
  churn: ['chk-churn']
};

function updateDefenseCard(key, ids) {
  const allChecked = ids.every(id => document.getElementById(id)?.checked);
  const card = document.getElementById('card-' + key);
  const bar = document.getElementById('bar-' + key);
  if (allChecked) {
    card?.classList.add('complete');
    if (bar) bar.style.background = 'var(--green)';
  } else {
    card?.classList.remove('complete');
    if (bar) bar.style.background = 'var(--muted)';
  }
  updateFooter();
}

// Strategy checklist signal bars
const strategyChecks = {
  s1: ['s1-c1', 's1-c2', 's1-c3', 's1-c4'],
  s2: ['s2-ara1', 's2-ara2', 's2-ara3'],
  s3: ['s3-c1', 's3-c2', 's3-c3', 's3-c4', 's3-c5', 's3-c6', 's3-c7', 's3-c8'],
  s4: ['s4-c1', 's4-c2', 's4-c3'],
  s5: ['s5-opp1', 's5-opp2', 's5-opp3', 's5-opp4'],
  s6: ['s6-c1', 's6-c2', 's6-c3', 's6-c4'],
  s7: ['s7-c1', 's7-c2', 's7-c3', 's7-c4'],
  s8: ['s8-p1', 's8-p2', 's8-p3']
};

const statusMessages = {
  go: '🟢 SEMUA KONDISI TERPENUHI — Siap eksekusi!',
  partial: '⚠️ Sebagian checklist terpenuhi — Lanjutkan verifikasi.',
  idle: 'Checklist belum lengkap'
};

function updateStrategyCard(id) {
  const checks = strategyChecks[id];
  if (!checks) return;
  const total = checks.length;
  const checked = checks.filter(cid => document.getElementById(cid)?.checked).length;
  const card = document.getElementById(id);
  const status = document.getElementById(id + '-status');
  const bar = card?.querySelector('.strategy-signal-bar');

  card?.classList.remove('go', 'partial', 'no-go');
  status?.classList.remove('go', 'no-go');

  if (checked === total) {
    card?.classList.add('go');
    if (bar) bar.style.background = 'var(--green)';
    if (status) {
      status.classList.add('go');
      status.innerHTML = '<span class="dot go"></span><span>' + statusMessages.go + '</span>';
    }
  } else if (checked > 0) {
    card?.classList.add('partial');
    if (bar) bar.style.background = 'var(--gold)';
    if (status) {
      status.innerHTML = '<span class="dot partial"></span><span>' + checked + '/' + total + ' terpenuhi — ' + statusMessages.partial + '</span>';
    }
  } else {
    if (bar) bar.style.background = 'var(--border)';
    if (status) {
      status.innerHTML = '<span class="dot idle"></span><span>' + statusMessages.idle + '</span>';
    }
  }
  updateFooter();
}

// Wire up defense checkboxes
Object.entries(defenseChecks).forEach(([key, ids]) => {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => updateDefenseCard(key, ids));
  });
});

// Wire up strategy checkboxes
Object.keys(strategyChecks).forEach(id => {
  strategyChecks[id].forEach(cid => {
    const el = document.getElementById(cid);
    if (el) el.addEventListener('change', () => updateStrategyCard(id));
  });
});

// ─── Footer Dashboard ──────────────────────────────
function updateFooter() {
  // Defense
  const defTotal = Object.values(defenseChecks).flat().length;
  const defChecked = Object.values(defenseChecks).flat().filter(id => document.getElementById(id)?.checked).length;
  updateReadiness('defense', defChecked, defTotal);

  // Tier 1
  const t1ids = [...strategyChecks.s1, ...strategyChecks.s2];
  const t1checked = t1ids.filter(id => document.getElementById(id)?.checked).length;
  updateReadiness('t1', t1checked, t1ids.length);

  // Tier 2
  const t2ids = [...strategyChecks.s3, ...strategyChecks.s4];
  const t2checked = t2ids.filter(id => document.getElementById(id)?.checked).length;
  updateReadiness('t2', t2checked, t2ids.length);

  // Tier 3 + 4
  const t34ids = [...strategyChecks.s5, ...strategyChecks.s6, ...strategyChecks.s7, ...strategyChecks.s8];
  const t34checked = t34ids.filter(id => document.getElementById(id)?.checked).length;
  updateReadiness('t34', t34checked, t34ids.length);

  // Global status
  const allIds = Object.values(strategyChecks).flat().concat(Object.values(defenseChecks).flat());
  const allChecked = allIds.filter(id => document.getElementById(id)?.checked).length;
  const allTotal = allIds.length;
  const statusEl = document.getElementById('global-status');
  if (allChecked === 0) {
    statusEl.textContent = 'IDLE';
    statusEl.className = 'stat-val';
  } else if (allChecked === allTotal) {
    statusEl.textContent = 'READY';
    statusEl.className = 'stat-val ready';
  } else {
    statusEl.textContent = 'ACTIVE (' + Math.round((allChecked / allTotal) * 100) + '%)';
    statusEl.className = 'stat-val warning';
  }
}

function updateReadiness(key, checked, total) {
  const fill = document.getElementById('rf-' + key);
  const text = document.getElementById('rt-' + key);
  const pct = total > 0 ? (checked / total) * 100 : 0;
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = checked + '/' + total;
}

// Init footer
updateFooter();

// ─── IPO Waran Warning ─────────────────────────────
const waranCheck = document.getElementById('s3-c2');
const waranWarning = document.getElementById('ipo-warning');

if (waranCheck && waranWarning) {
  // Show warning when user UNchecks the "no waran" box
  waranCheck.addEventListener('change', () => {
    waranWarning.style.display = waranCheck.checked ? 'none' : 'block';
  });
}

// ─── Subtle entrance animation for cards ───────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.strategy-card, .defense-card').forEach(card => {
  card.style.animationPlayState = 'paused';
  observer.observe(card);
});

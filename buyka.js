/* ═══════════════════════════════════════════════════════════════
   API ХАЯГ — зөвхөн энд л өөрчилнө, бусад газар автоматаар дагана
   Локал ашиглахад:   'http://localhost:3000'
   Интернэтээр:       'https://1e68lck4aw.localto.net'
   ═══════════════════════════════════════════════════════════════ */
const API_BASE = window.location.origin;

document.addEventListener('DOMContentLoaded', function () {
  const status = document.getElementById('status');
  const serverSelect = document.getElementById('serverSelect');
  const dbSelect = document.getElementById('dbSelect');
  const filePicker = document.getElementById('filePicker');
  const connectBtn = document.getElementById('connectBtn');
  const getAssetBtn = document.getElementById('getAssetBtn');
  const assetResult = document.getElementById('assetResult');
  const getTotalsBtn = document.getElementById('getTotalsBtn');
  const totalsResult = document.getElementById('totalsResult');
  const previewBtn = document.getElementById('previewBtn');
  const previewResult = document.getElementById('previewResult');
  const combinedBtn = document.getElementById('combinedBtn');
  const combinedResult = document.getElementById('combinedResult');
  let _selectedAccounts = [];
  window._selectedAccounts = _selectedAccounts;
  let _accountFilterMode = 'any';
  const applyFilterBtn = document.getElementById('applyFilterBtn');
  const spinner = document.getElementById('spinner');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const ledgerStatusToggle = document.getElementById('ledgerStatusToggle');
  const serverModal = document.getElementById('serverModal');
  const serverModalBody = document.getElementById('serverModalBody');
  const serverModalClose = document.getElementById('serverModalClose');
  const serverConnectPanel = document.getElementById('serverConnectPanel');
  const serverConnectToggleBtn = document.getElementById('serverConnectToggle');
  const connectProgressWrap = document.getElementById('connectProgressWrap');
  const connectProgressBar = document.getElementById('connectProgressBar');
  const connectProgressPercent = document.getElementById('connectProgressPercent');
  const connectStatus = document.getElementById('connectStatus');
  const accountFilterDropdown = document.getElementById('accountFilterDropdown');
  const filterPositiveOnly = document.getElementById('filterPositiveOnly');
  const filterValueOnly = document.getElementById('filterValueOnly');
  
  let _serverPanelPrevDisplay = null;
  let _otherControlsPrevDisplay = null;

  // Chart dark-mode засвар + light mode KPI засвар
  (function() {
    const cs = document.createElement('style');
    cs.textContent = `
      .donut-svg circle[stroke="var(--main-border, #e2e8f0)"] { stroke: var(--main-border); }
      .dark-mode .donut-svg circle { stroke: var(--main-border); }
      .chart-card { backdrop-filter: none; }
      .hbar-bg { background: var(--main-border); border-radius: 4px; overflow: hidden; }
      .hbar-fill { border-radius: 4px; }
      canvas { image-rendering: auto !important; }
      /* Light mode: KPI тоо харагдахгүй байвал засна */
      body:not(.dark-mode) .kpi-val { color: #0f172a !important; }
      body:not(.dark-mode) .kpi-label { color: #475569 !important; }
      body:not(.dark-mode) .kpi-sub { color: #64748b !important; }
      body:not(.dark-mode) .kpi-card { background: #fff; border-color: #e2e8f0; }
      body:not(.dark-mode) .top-table td, body:not(.dark-mode) .top-table th { color: #0f172a; }
      body:not(.dark-mode) .chart-card { background: #fff; border-color: #e2e8f0; }
      body:not(.dark-mode) .chart-card-title { color: #0f172a; }
      body:not(.dark-mode) .chart-card-sub { color: #64748b; }
      body:not(.dark-mode) .legend-label { color: #475569; }
      body:not(.dark-mode) .legend-val { color: #0f172a; }
      body:not(.dark-mode) .hbar-label { color: #0f172a; }
      body:not(.dark-mode) .hbar-sub { color: #64748b; }
    `;
    document.head.appendChild(cs);
  })();

  // Calibri фонт бүх элементэд хэрэглэх
  (function() {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        font-family: 'Calibri', 'Calibri Regular', Arial, sans-serif !important;
      }
      input, select, button, textarea, th, td, .f-input, .dt-table, .kpi-val, .kpi-sub, .kpi-label {
        font-family: 'Calibri', 'Calibri Regular', Arial, sans-serif !important;
      }
    `;
    document.head.appendChild(style);
  })();

  function setStatus(text) { status.textContent = text; }
  function showProgress(text) {
    if (text) setStatus(text);
    if (spinner) { spinner.classList.remove('hidden'); spinner.setAttribute('aria-hidden','false'); }
    if (previewBtn) previewBtn.disabled = true;
    if (applyFilterBtn) applyFilterBtn.disabled = true;
    if (connectBtn) connectBtn.disabled = true;
  }
  function hideProgress(text) {
    if (spinner) { spinner.classList.add('hidden'); spinner.setAttribute('aria-hidden','true'); }
    if (previewBtn) previewBtn.disabled = false;
    if (applyFilterBtn) applyFilterBtn.disabled = false;
    if (connectBtn) connectBtn.disabled = false;
    if (text) { if (text === 'Asset ledger displayed' && window._showLedgerStatus === false) {} else { setStatus(text); } }
  }
  function startConnectProgress() {
    if (!connectProgressWrap || !connectProgressBar) return;
    connectProgressWrap.style.display = 'block'; connectProgressBar.style.width = '0%'; let p = 0;
    if (connectProgressPercent) connectProgressPercent.textContent = '0%';
    window._connectProgressInterval = setInterval(() => {
      if (p < 95) { p += Math.random() * 6; if (p > 95) p = 95; connectProgressBar.style.width = Math.round(p) + '%'; if (connectProgressPercent) connectProgressPercent.textContent = Math.round(p) + '%'; }
    }, 150);
  }
  function stopConnectProgress(success = false, errorMsg = '') {
    if (!connectProgressWrap || !connectProgressBar) return;
    if (window._connectProgressInterval) clearInterval(window._connectProgressInterval);
    if (!success) {
      // Алдаа — progress bar-г улаан болго, нуухгүй
      connectProgressBar.style.width = '100%';
      connectProgressBar.style.background = 'linear-gradient(90deg,#ef4444,#f87171)';
      if (connectProgressPercent) connectProgressPercent.textContent = '✕';
      if (connectStatus) {
        connectStatus.style.display = 'block';
        connectStatus.textContent = errorMsg || '✕ Алдаа гарлаа';
        connectStatus.style.color = '#dc2626';
        connectStatus.style.background = 'rgba(239,68,68,0.08)';
        connectStatus.style.border = '1px solid rgba(239,68,68,0.3)';
      }
      // Progress bar-г 2 секундийн дараа нуу, алдаа мессеж үлд
      setTimeout(() => {
        connectProgressWrap.style.display = 'none';
        connectProgressBar.style.width = '0%';
        connectProgressBar.style.background = '';
        if (connectProgressPercent) connectProgressPercent.textContent = '0%';
      }, 2000);
    } else {
      // Амжилт
      connectProgressBar.style.width = '100%';
      connectProgressBar.style.background = 'linear-gradient(90deg,#10b981,#34d399)';
      if (connectProgressPercent) connectProgressPercent.textContent = '100%';
      if (connectStatus) {
        connectStatus.style.display = 'block';
        connectStatus.textContent = '✓ Амжилттай холбогдлоо';
        connectStatus.style.color = '#059669';
        connectStatus.style.background = 'rgba(16,185,129,0.08)';
        connectStatus.style.border = '1px solid rgba(16,185,129,0.3)';
      }
      setTimeout(() => {
        connectProgressWrap.style.display = 'none';
        connectProgressBar.style.width = '0%';
        connectProgressBar.style.background = '';
        if (connectProgressPercent) connectProgressPercent.textContent = '0%';
        if (connectStatus) connectStatus.style.display = 'none';
        if (serverConnectPanel) serverConnectPanel.style.display = 'none';
      }, 1500);
    }
  }
  function getServer() { if (serverSelect && serverSelect.style.display !== 'none') return serverSelect.value || ''; const inp = document.getElementById('serverInput'); return inp ? inp.value.trim() : ''; }
  function getDatabase() { if (dbSelect && dbSelect.style.display !== 'none') return dbSelect.value || ''; const inp = document.getElementById('dbInput'); return inp ? inp.value.trim() : ''; }
  function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function loadFile() {
    try {
      setStatus('Loading data file...');
      const res = await fetch('../data/servers.txt');
      if (!res.ok) throw new Error('Failed');
      populateFromText(await res.text());
      setStatus('Data loaded');
    } catch (err) { setStatus('Сервер болон Датабааз сонгоно уу!'); showManualInputs(); }
  }

  try {
    const saved = localStorage.getItem('show_ledger_status');
    window._showLedgerStatus = saved !== null ? saved === '1' : true;
  } catch (e) { window._showLedgerStatus = true; }

  // ── Detail Panel ──
  function openDetailPanel(row) {
    const overlay = document.getElementById('detailOverlay');
    const panel   = document.getElementById('detailPanel');
    const dpCode  = document.getElementById('dp-code');
    const dpName  = document.getElementById('dp-name');
    const dpBody  = document.getElementById('dp-body');
    if (!panel) return;

    dpCode.textContent = row['Хөрөнгийн код'] || '—';
    dpName.textContent = row['Хөрөнгийн нэр'] || '—';

    const fmtN = v => (v===null||v===undefined||isNaN(Number(v))) ? '—' : Number(v).toLocaleString('mn-MN');
    const numCols = ['Анхны өртөг','Элэгдэл тооцох өртөг','Тоо хэмжээ','Хуримтлагдсан элэгдэл','Сүүлийн элэгдэл','Нийт элэгдэл','Одоогийн өртөг'];

    dpBody.innerHTML = `
      <div class="detail-section-title">Үндсэн мэдээлэл:</div>
      ${[
        ['Дансны нэр', row.AccountDescription||'—', false],
        ['Тоо хэмжээ', fmtN(row['Тоо хэмжээ']), true],
      ].map(([l,v,num])=>`
        <div class="detail-row">
          <span class="detail-lbl">${escapeHtml(l)}</span>
          <span class="detail-val">${escapeHtml(String(v))}</span>
        </div>`).join('')}

      <div class="detail-section-title">Өртөгийн мэдээлэл:</div>
      ${[
        ['Анхны өртөг',          row['Анхны өртөг']],
        ['Элэгдэл тооцох өртөг', row['Элэгдэл тооцох өртөг']],
        ['Хуримтлагдсан элэгдэл',row['Хуримтлагдсан элэгдэл']],
        ['Сүүлийн элэгдэл',      row['Сүүлийн элэгдэл']],
        ['Нийт элэгдэл',         row['Нийт элэгдэл']],
        ['Одоогийн өртөг',       row['Одоогийн өртөг']],
      ].map(([l,v])=>{
        const n = Number(v);
        const cls = isNaN(n)||v===null?'':'pos';
        return `<div class="detail-row">
          <span class="detail-lbl">${escapeHtml(l)}</span>
          <span class="detail-val ${cls}">₮${escapeHtml(fmtN(v))}</span>
        </div>`;
      }).join('')}

      <div class="detail-section-title">Гүйлгээний бичилтүүд:</div>
      <div id="dp-ledger-content" style="color:var(--main-text2);font-size:0.82rem;padding:8px 0;">
        <span style="opacity:0.6;">⏳ Уншиж байна...</span>
      </div>`;

    overlay.classList.add('open');
    panel.classList.add('open');

    // Load ledger rows into detail panel
    const ledgerContainer = document.getElementById('dp-ledger-content');
    loadDetailLedger(String(row['Хөрөнгийн код']||''), ledgerContainer);
  }

  function closeDetailPanel() {
    const overlay = document.getElementById('detailOverlay');
    const panel   = document.getElementById('detailPanel');
    if (overlay) overlay.classList.remove('open');
    if (panel)   panel.classList.remove('open');
    document.querySelectorAll('.dt-table tbody tr.inv-row.detail-active').forEach(el=>el.classList.remove('detail-active'));
  }

  async function loadDetailLedger(assetid, container) {
    const server=getServer(), db=getDatabase();
    const username=usernameInput?usernameInput.value:'', password=passwordInput?passwordInput.value:'';
    const fmtN = v => (v===null||v===undefined||isNaN(Number(v))) ? '—' : Number(v).toLocaleString('mn-MN');
    try {
      let combinedRows = window._combinedRows||null;
      if (!combinedRows) {
        const res = await fetch(API_BASE + '/combined', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({server,database:db,username,password})});
        const json = await res.json(); combinedRows=json.rows||[]; window._combinedRows=combinedRows;
      }
      const assetRows = combinedRows.filter(r => String(r.Assetid||'').trim()===assetid.trim());
      function getAmt(row) {
        for (const k of ['InlistTaxedAmt','InAmt','InListAmt','Inamt','inamt','Amount','TaxedAmt','amt']) {
          if (row[k]!==null&&row[k]!==undefined&&row[k]!==''&&!isNaN(Number(row[k]))) return Number(row[k]);
        }
        return (Number(row['Inqty'])||0)*(Number(row['CurrentCost'])||0);
      }
      function getEndBal(row) {
        const c2=row['C2'];
        if (c2!==null&&c2!==undefined&&c2!==''&&!isNaN(Number(c2))) return Number(c2);
        const rep=Number(row['Replist']);
        if (!isNaN(rep)&&rep!==0) return rep;
        return (Number(row['Bbl'])||0)+(Number(row['Inqty'])||0)-(Number(row['Outqty'])||0)-(Number(row['DisQty'])||0);
      }
      if (!assetRows.length) { container.innerHTML='<span style="color:#9ca3af;">Бичилт олдсонгүй</span>'; return; }
      const cols=[
        {label:'Дансны нэр',       key:'AccountDescription',num:false,calc:null},
        {label:'Орлогын тоо',      key:'Inqty',             num:true, calc:null},
        {label:'Татан авалтын тоо',key:'Replist',            num:true, calc:null},
        {label:'Зарлагын тоо',     key:'Outqty',            num:true, calc:null},
        {label:'Акталсан',         key:'DisQty',            num:true, calc:null},
        {label:'Эхний үлдэгдэл',  key:'Bbl',               num:true, calc:null},
        {label:'Эцсийн үлдэгдэл', key:null,                num:true, calc:getEndBal},
        {label:'Орлогын дүн',      key:null,                num:true, calc:getAmt},
        {label:'Анхны өртөг',      key:'CurrentCost',       num:true, calc:null},
      ];
      const wrap = document.createElement('div');
      wrap.className = 'dp-ledger-wrap';
      const tbl = document.createElement('table');
      tbl.className = 'dp-ledger-table';
      const thead=document.createElement('thead'); const htr=document.createElement('tr');
      cols.forEach(c=>{ const th=document.createElement('th'); if(c.num) th.classList.add('num'); th.textContent=c.label; htr.appendChild(th); });
      thead.appendChild(htr); tbl.appendChild(thead);
      const tbody=document.createElement('tbody');
      assetRows.forEach(row=>{
        const tr=document.createElement('tr');
        cols.forEach(c=>{
          const td=document.createElement('td'); if(c.num) td.classList.add('num');
          const v=c.calc?c.calc(row):row[c.key];
          td.textContent=c.num?fmtN(v):(v===null||v===undefined?'':String(v));
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody); wrap.appendChild(tbl);
      container.innerHTML=''; container.appendChild(wrap);
    } catch(err) { container.innerHTML=`<span style="color:#dc2626;">Алдаа: ${escapeHtml(String(err))}</span>`; }
  }

  // Wire detail panel close
  const detailOverlayEl = document.getElementById('detailOverlay');
  const detailCloseBtn  = document.getElementById('detailClose');
  if (detailOverlayEl) detailOverlayEl.addEventListener('click', closeDetailPanel);
  if (detailCloseBtn)  detailCloseBtn.addEventListener('click', closeDetailPanel);
  document.addEventListener('keydown', e => { if (e.key==='Escape') closeDetailPanel(); });

  // ── Theme Toggle ──
  const themeBtn = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeToggleLabel');
  const themeIconMoon = document.getElementById('themeIconMoon');
  const themeIconSun  = document.getElementById('themeIconSun');
  let _isDark = false;
  try { _isDark = localStorage.getItem('buyka_theme')==='dark'; } catch(e){}
  function applyTheme(dark) {
    _isDark = dark;
    document.body.classList.toggle('dark-mode', dark);
    if (themeLabel) themeLabel.textContent = dark ? 'Dark' : 'Light';
    if (themeIconMoon) themeIconMoon.style.display = dark ? 'none' : '';
    if (themeIconSun)  themeIconSun.style.display  = dark ? '' : 'none';
    try { localStorage.setItem('buyka_theme', dark?'dark':'light'); } catch(e){}
  }
  applyTheme(_isDark);
  if (themeBtn) themeBtn.addEventListener('click', () => applyTheme(!_isDark));

  function parseLines(txt) {
    const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(l => l.length);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      let parts = lines[i].split('\t');
      if (parts.length < 3) parts = lines[i].split(/\s{2,}/);
      if (parts.length >= 3) rows.push({ server: parts[0].trim(), name: parts[1].trim(), selection: parts[2].trim() });
    }
    return rows;
  }

  // Dropdown-ээс дансыг дүүргэх функц
  function populateAccountDropdown() {
    try {
      const rows = window._combinedRows || window._calculatedRows || [];
      const set = new Set();
      rows.forEach(r => { 
        const v = r.AccountDescription; 
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          set.add(String(v).trim()); 
        }
      });
      
      if (!accountFilterDropdown) return;
      
      // Сүүлийн сонгогдсон утгыг хадгалаа
      const lastValue = accountFilterDropdown.value;
      
      // Dropdown-ийг дүүргэнэ
      accountFilterDropdown.innerHTML = '<option value="">-- Бүгд --</option>';
      Array.from(set).sort().forEach(account => {
        const option = document.createElement('option');
        option.value = account;
        option.textContent = account;
        accountFilterDropdown.appendChild(option);
      });
      
      // Өмнөх сонгогдсон утгыг сэргээнэ
      if (lastValue) {
        accountFilterDropdown.value = lastValue;
      }
    } catch (e) {}
  }

  // Dropdown өөрчлөгдөхөд хэрэглэгдэх функц
  function applyDropdownFilter() {
    try {
      // Multi-select: сонгогдсон бүх данс авна
      let selectedAccounts = [];
      if (accountFilterDropdown) {
        selectedAccounts = Array.from(accountFilterDropdown.options)
          .filter(o => o.selected && o.value !== '')
          .map(o => o.value);
      }
      // filterPositiveOnly (Тоо хэмжээ) болон filterValueOnly (Өртөг) хоёрыг авна
      const qtyMode  = filterPositiveOnly ? (filterPositiveOnly.value  || 'all') : 'all';
      const valMode  = filterValueOnly    ? (filterValueOnly.value     || 'all') : 'all';
      // Нэгтгэсэн горим: qty + val хослуулна
      const filterMode = qtyMode !== 'all' && valMode !== 'all'
        ? qtyMode + '|' + valMode
        : qtyMode !== 'all' ? qtyMode : valMode;
      _selectedAccounts = selectedAccounts;
      _accountFilterMode = filterMode;
      applyFilter();
    } catch (e) {}
  }

  // Dropdown change эвент
  if (accountFilterDropdown) {
    accountFilterDropdown.addEventListener('change', applyDropdownFilter);
  }

  // Checkbox change эвент
  if (filterPositiveOnly) {
    filterPositiveOnly.addEventListener('change', applyDropdownFilter);
  }
  if (filterValueOnly) {
    filterValueOnly.addEventListener('change', applyDropdownFilter);
  }

  function openServerModal() {
    try {
      if (!serverConnectPanel) return;
      serverConnectPanel.style.display = 'flex';
    } catch (e) {}
  }
  function closeServerModal() {
    try {
      if (!serverConnectPanel) return;
      serverConnectPanel.style.display = 'none';
      if (serverModal) { serverModal.style.display = 'none'; serverModal.classList.add('hidden'); }
    } catch (e) {}
  }
  if (serverModalClose) serverModalClose.addEventListener('click', closeServerModal);
  if (serverConnectToggleBtn) { serverConnectToggleBtn.addEventListener('click', (ev) => { ev.preventDefault(); openServerModal(); }); }

  // ── Файл оруулсан үед: dropdown харуулна
  // ── Файл оруулаагүй үед: text input харуулна
  function showManualInputs() {
    const si = document.getElementById('serverInput');
    const di = document.getElementById('dbInput');
    const sw = si && si.parentElement;
    const dw = di && di.parentElement;
    if (si) { si.style.display = ''; }
    if (di) { di.style.display = ''; }
    serverSelect.style.display = 'none';
    dbSelect.style.display = 'none';
  }

  function showDropdowns() {
    const si = document.getElementById('serverInput');
    const di = document.getElementById('dbInput');
    if (si) si.style.display = 'none';
    if (di) di.style.display = 'none';
    serverSelect.style.display = '';
    dbSelect.style.display = '';
  }

  function populateFromText(txt) {
    const rows = parseLines(txt).filter(r => r.selection === '1');
    const servers = Array.from(new Set(rows.map(r => r.server))).sort();
    if (!servers.length) {
      showManualInputs();
      return;
    }
    // Файл байна → dropdown харуулна
    showDropdowns();
    serverSelect.innerHTML = '';
    servers.forEach(s => serverSelect.appendChild(new Option(s, s)));
    serverSelect.onchange = () => {
      const dbs = rows.filter(r => r.server === serverSelect.value).map(r => r.name).sort();
      dbSelect.innerHTML = '';
      dbs.forEach(d => dbSelect.appendChild(new Option(d, d)));
    };
    serverSelect.value = servers[0];
    serverSelect.onchange();
  }

  filePicker.addEventListener('change', (ev) => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = e => {
      populateFromText(e.target.result);
      setStatus('ҮНДСЭН ХӨРӨНГИЙН БҮХ ГҮЙЛГЭЭ АМЖИЛТТАЙ ТАТАГДЛАА: ');
      // Арилгах товч харуулна
      const clearBtn = document.getElementById('clearFileBtn');
      if (clearBtn) clearBtn.style.display = '';
    };
    reader.onerror = () => setStatus('Failed to read file');
    reader.readAsText(f);
  });

  // Файл арилгах товч
  const clearFileBtn = document.getElementById('clearFileBtn');
  if (clearFileBtn) {
    clearFileBtn.addEventListener('click', () => {
      filePicker.value = '';
      clearFileBtn.style.display = 'none';
      // Text input руу буцаана
      showManualInputs();
      const si = document.getElementById('serverInput');
      const di = document.getElementById('dbInput');
      if (si) si.value = '';
      if (di) di.value = '';
      serverSelect.innerHTML = '';
      dbSelect.innerHTML = '';
      setStatus('Сервер болон Датабааз сонгоно уу!');
    });
  }

  if (connectBtn) connectBtn.style.display = 'none';

  getAssetBtn.addEventListener('click', async () => {
    const server = getServer(); const db = getDatabase(); const username = usernameInput.value||''; const password = passwordInput.value||'';
    if (!server || !db) { setStatus('Select server and database first'); return; }
    setStatus('Requesting unique Assetid...'); assetResult.textContent = '';
    try {
      const res = await fetch(API_BASE + '/unique-assetids', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({server, database:db, username, password}) });
      const json = await res.json();
      setStatus(json.message || (json.success ? 'Амжилттай' : 'Error'));
      assetResult.textContent = json.success ? `Count: ${json.count}\n\n${json.assetids.join('\n')}` : json.message;
    } catch (err) { setStatus('Failed: ' + err.message); }
  });

  getTotalsBtn.addEventListener('click', async () => {
    const server = getServer(); const db = getDatabase(); const username = usernameInput.value||''; const password = passwordInput.value||'';
    if (!server || !db) { setStatus('Select server and database first'); return; }
    setStatus('Requesting totals...'); totalsResult.textContent = '';
    try {
      const res = await fetch(API_BASE + '/totals', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({server, database:db, username, password}) });
      const json = await res.json();
      if (!json.success) { totalsResult.textContent = json.message; return; }
      const labels = { faInvIncomeListBuffer:'Income DtQty', faInvOutcomeListBuffer:'Outcome Ktqty', faInvDisposalListBuffer:'Disposal DisposalQty', faInvBeginBalanceBuffer:'BeginBalance DtQty', faInvReplenishmentListBuffer:'Replenishment TotalQty' };
      totalsResult.textContent = Object.keys(labels).map(k => `${labels[k]}: ${json.totals[k] ?? '(error)'}`).join('\n');
    } catch (err) { setStatus('Failed: ' + err.message); }
  });

  async function fetchPreview() {
    try { const el = document.getElementById('ledgerResult'); if (el) el.style.display='none'; const btn = document.getElementById('ledgerBtn'); if (btn) btn.textContent='Asset Ledger'; window._focusLedgerAsset=null; } catch(e){}
    const server = getServer(); const db = getDatabase(); const username = usernameInput.value||''; const password = passwordInput.value||'';
    if (!server || !db) { setStatus('Select server and database first'); return; }
    const prevServer = window._lastServer||''; const prevDb = window._lastDatabase||'';
    if (prevServer !== server || prevDb !== db) { window._originalCalculatedRows=null; window._originalCalculatedCols=null; window._originalDisplayedRows=null; window._originalDisplayedCols=null; window._calculatedRows=null; window._combinedRows=null; window._deprFetchDiagnostics=null; window._debugAccountMap=null; window._ledgerLastServer=null; window._ledgerLastDb=null; }
    window._lastServer=server; window._lastDatabase=db;
    if (connectStatus) { connectStatus.textContent=''; connectStatus.style.display='none'; connectStatus.style.display='block'; connectStatus.textContent='Системд холбогдлоо...'; connectStatus.style.color='#333'; }
    startConnectProgress(); previewResult.innerHTML='';
    try { previewResult.style.display='block'; } catch(e){}
    try {
      const res = await fetch(API_BASE + '/combined', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({server, database:db, username, password}) });
      if (!res.ok) {
        let errMsg = '';
        try { const ej = await res.json(); errMsg = ej.message || ''; } catch(e) { errMsg = await res.text().catch(()=>''); }
        if (res.status === 401) {
          const label = errMsg || 'Нэвтрэх нэр эсвэл нууц үг буруу байна';
          stopConnectProgress(false, '✕ ' + label);
        } else {
          stopConnectProgress(false, '✕ Алдаа ' + res.status + (errMsg ? ': ' + errMsg : ''));
        }
        return;
      }
      const json = await res.json();
      if (!json.success) { stopConnectProgress(false, '✕ ' + (json.message||'Алдаа гарлаа')); return; }
      const rows = json.rows||[];
      if (!rows.length) { previewResult.textContent='(no rows)'; return; }
      window._combinedRows = rows;
      if (connectStatus) connectStatus.textContent='Жагсаалтыг бэлдэж байна...';
      const assetids = Array.from(new Set(rows.map(r => String(r.Assetid||'').trim()).filter(x=>x)));
      let deprMap = {};
      try {
        const dr = await fetch(API_BASE + '/depr-latest', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({server:getServer(), database:getDatabase(), username, password, assetids}) });
        if (dr.ok) {
          const dj = await dr.json();
          if (dj && dj.success && dj.info) {
            deprMap = dj.info;
            const missing = assetids.filter(a => !Object.prototype.hasOwnProperty.call(deprMap, a));
            window._deprFetchDiagnostics = { missingCount:missing.length, total:assetids.length, sampleMissing:missing.slice(0,5) };
            const debugMap = {};
            for (const aid of missing.slice(0,50)) {
              try {
                const r = await fetch(API_BASE + '/debug-account', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({server:getServer(), database:getDatabase(), username, password, assetid:aid}) });
                if (r.ok) { const dj2=await r.json(); debugMap[aid]=dj2.success&&Array.isArray(dj2.rows) ? dj2.rows.filter(x=>x.hasAssetid).map(x=>x.table) : []; } else debugMap[aid]=[];
              } catch(e) { debugMap[aid]=[]; }
            }
            window._debugAccountMap = debugMap;
          } else { window._deprFetchDiagnostics={missingCount:assetids.length, total:assetids.length, error:dj&&dj.message?dj.message:'no info'}; }
        }
      } catch(e) { window._deprFetchDiagnostics={missingCount:assetids.length, total:assetids.length, error:String(e)}; }

      const calcRows = rows.map(r => {
        const aid = String(r.Assetid||'');
        const orig = (r.CurrentCost===null||r.CurrentCost===undefined||r.CurrentCost==='') ? null : Number(r.CurrentCost);
        const qty = (r.C2===null||r.C2===undefined||r.C2==='') ? 0 : Number(r.C2);
        const hasDepr = Object.prototype.hasOwnProperty.call(deprMap, aid);
        let endAmt=null, accumulated=null, last=null, totalDep=null, current=null;
        if (hasDepr) {
          const d = deprMap[aid]||{};
          endAmt = d.EndAmt!=null&&d.EndAmt!=='' ? Number(d.EndAmt) : null;
          accumulated = d.EndDeprAmt!=null&&d.EndDeprAmt!=='' ? Number(d.EndDeprAmt) : null;
          last = d.CurrentDeprAmt!=null&&d.CurrentDeprAmt!=='' ? Number(d.CurrentDeprAmt) : null;
          totalDep = last===null ? (accumulated===null?null:accumulated) : (accumulated||0)+last;
          const base = endAmt!==null ? endAmt : orig;
          if (base!==null && totalDep!==null) current = base - totalDep;
        }
        return { Assetid:aid, AssetDesc:r.AssetDesc||'', AccountDescription:r.AccountDescription||'', 'Хөрөнгийн код':aid, 'Хөрөнгийн нэр':r.AssetDesc||'', 'Анхны өртөг':orig, 'Элэгдэл тооцох өртөг':endAmt, 'Тоо хэмжээ':qty, 'Хуримтлагдсан элэгдэл':accumulated, 'Сүүлийн элэгдэл':last, 'Нийт элэгдэл':totalDep, 'Одоогийн өртөг':current, Depr_Found:!!hasDepr };
      });
      window._calculatedRows = calcRows;
      window._originalCalculatedRows = calcRows.slice();
      renderDashboard(calcRows);
      renderCalculatedTable(calcRows, previewResult);
      populateAccountDropdown();
      showDataTabs();
      switchTab('dash');
      stopConnectProgress(true);
    } catch (err) {
      stopConnectProgress(false, '✕ Серверт холбогдож чадсангүй');
    }
  }
  previewBtn.addEventListener('click', fetchPreview);

  // ── Dashboard Detail Modal ──
  function openDashDetailModal(row) {
    closeDashModal();
    const fmtN = v => (v===null||v===undefined||isNaN(Number(v))) ? '—' : Number(v).toLocaleString('mn-MN');
    const overlay = document.createElement('div');
    overlay.id = 'dashModalOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:8000;backdrop-filter:blur(2px);';
    const modal = document.createElement('div');
    modal.id = 'dashModal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:8001;background:var(--main-bg2);border:1px solid var(--main-border);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:min(520px,92vw);max-height:80vh;display:flex;flex-direction:column;overflow:hidden;';
    const numFields = [
      ['Анхны өртөг','Анхны өртөг'],
      ['Элэгдэл тооцох өртөг','Элэгдэл тооцох өртөг'],
      ['Хуримтлагдсан элэгдэл','Хуримтлагдсан элэгдэл'],
      ['Сүүлийн элэгдэл','Сүүлийн элэгдэл'],
      ['Нийт элэгдэл','Нийт элэгдэл'],
      ['Одоогийн өртөг','Одоогийн өртөг'],
    ];
    modal.innerHTML = `
      <div style="padding:18px 20px 14px;border-bottom:1px solid var(--main-border);display:flex;align-items:flex-start;gap:12px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.75rem;font-family:monospace;color:var(--accent);margin-bottom:2px;">${escapeHtml(row['Хөрөнгийн код']||'—')}</div>
          <div style="font-size:1rem;font-weight:700;color:var(--main-text);line-height:1.3;">${escapeHtml(row['Хөрөнгийн нэр']||'—')}</div>
          <div style="font-size:0.78rem;color:var(--main-text);margin-top:3px;">${escapeHtml(row.AccountDescription||'')}</div>
        </div>
        <button id="dashModalClose" style="background:none;border:none;cursor:pointer;color:var(--main-text2);padding:4px;border-radius:6px;font-size:1.1rem;flex-shrink:0;">✕</button>
      </div>
      <div style="overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--main-border);">
          <span style="font-size:0.78rem;color:var(--main-text);">Тоо хэмжээ</span>
          <span style="font-size:0.82rem;font-weight:600;color:var(--main-text);">${fmtN(row['Тоо хэмжээ'])}</span>
        </div>
        ${numFields.map(([lbl,key]) => {
          const v = Number(row[key]);
          const clr = isNaN(v) ? 'var(--main-text)' : v > 0 ? '#059669' : v < 0 ? '#7c3aed' : '#dc2626';
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--main-border);">
            <span style="font-size:0.78rem;color:var(--main-text2)">${escapeHtml(lbl)}</span>
            <span style="font-size:0.85rem;font-weight:700;font-family:monospace;color:${clr};">₮${fmtN(row[key])}</span>
          </div>`;
        }).join('')}
        <div id="dashModalLedger" style="margin-top:8px;"><span style="color:var(--main-text2);font-size:0.82rem;opacity:0.7;">⏳ Гүйлгээ уншиж байна...</span></div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    overlay.addEventListener('click', closeDashModal);
    modal.querySelector('#dashModalClose').addEventListener('click', closeDashModal);
    document.addEventListener('keydown', _dashEscHandler = e => { if (e.key==='Escape') closeDashModal(); });
    // Load ledger
    const lc = modal.querySelector('#dashModalLedger');
    loadDetailLedger(String(row['Хөрөнгийн код']||''), lc);
  }

  function openDashAccountModal(accountName, allRows, fmtM, fmtN, esc) {
    closeDashModal();
    const acctRows = allRows.filter(r => r.AccountDescription === accountName);
    const overlay = document.createElement('div');
    overlay.id = 'dashModalOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:8000;backdrop-filter:blur(2px);';
    const modal = document.createElement('div');
    modal.id = 'dashModal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:8001;background:var(--main-bg2);border:1px solid var(--main-border);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:min(700px,94vw);max-height:82vh;display:flex;flex-direction:column;overflow:hidden;';
    modal.innerHTML = `
      <div style="padding:16px 20px 12px;border-bottom:1px solid var(--main-border);display:flex;align-items:center;gap:12px;">
        <div style="flex:1;">
          <div style="font-size:0.72rem;color:var(--main-text2);text-transform:uppercase;letter-spacing:0.05em;">Дансны дэлгэрэнгүй</div>
          <div style="font-size:0.95rem;font-weight:700;color:var(--main-text);margin-top:2px;">${esc(accountName)}</div>
          <div style="font-size:0.78rem;color:var(--main-text);margin-top:2px;">${acctRows.length} хөрөнгө</div>
        </div>
        <button id="dashModalClose" style="background:none;border:none;cursor:pointer;color:var(--main-text2);padding:4px;border-radius:6px;font-size:1.1rem;">✕</button>
      </div>
      <div style="overflow:auto;padding:12px 16px;">
        <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
          <thead>
            <tr style="border-bottom:2px solid var(--main-border);">
              <th style="text-align:left;padding:6px 8px;color:var(--main-text2);font-weight:600;white-space:nowrap;">Код</th>
              <th style="text-align:left;padding:6px 8px;color:var(--main-text2);font-weight:600;">Нэр</th>
              <th style="text-align:right;padding:6px 8px;color:var(--main-text2);font-weight:600;white-space:nowrap;">Анхны өртөг</th>
              <th style="text-align:right;padding:6px 8px;color:var(--main-text2);font-weight:600;white-space:nowrap;">Одоогийн өртөг</th>
              <th style="text-align:right;padding:6px 8px;color:var(--main-text2);font-weight:600;">Тоо</th>
            </tr>
          </thead>
          <tbody>
            ${acctRows.map(r => `
              <tr class="dash-acct-row" data-code="${esc(r['Хөрөнгийн код']||'')}" style="border-bottom:1px solid var(--main-border);cursor:pointer;">
                <td style="padding:6px 8px;font-family:monospace;font-size:0.75rem;color:var(--accent);white-space:nowrap;">${esc(r['Хөрөнгийн код']||'')}</td>
                <td style="padding:6px 8px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r['Хөрөнгийн нэр']||'')}">${esc(String(r['Хөрөнгийн нэр']||'').substring(0,36))}</td>
                <td style="padding:6px 8px;text-align:right;font-family:monospace;color:#3b82f6;">₮${fmtM(r['Анхны өртөг'])}</td>
                <td style="padding:6px 8px;text-align:right;font-family:monospace;color:#059669;">₮${fmtM(r['Одоогийн өртөг'])}</td>
                <td style="padding:6px 8px;text-align:right;">${fmtN(r['Тоо хэмжээ'])}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    overlay.addEventListener('click', closeDashModal);
    modal.querySelector('#dashModalClose').addEventListener('click', closeDashModal);
    document.addEventListener('keydown', _dashEscHandler = e => { if (e.key==='Escape') closeDashModal(); });
    // Row click → asset detail
    modal.querySelectorAll('.dash-acct-row').forEach((tr, i) => {
      const r = acctRows[i];
      tr.addEventListener('mouseenter', () => tr.style.background = 'rgba(59,130,246,0.07)');
      tr.addEventListener('mouseleave', () => tr.style.background = '');
      tr.addEventListener('click', () => { closeDashModal(); setTimeout(() => openDashDetailModal(r), 80); });
    });
  }

  let _dashEscHandler = null;
  function closeDashModal() {
    const ov = document.getElementById('dashModalOverlay');
    const mo = document.getElementById('dashModal');
    if (ov) ov.remove();
    if (mo) mo.remove();
    if (_dashEscHandler) { document.removeEventListener('keydown', _dashEscHandler); _dashEscHandler = null; }
  }

  // ── Render Smart Dashboard ──
  function renderDashboard(rows) {
    const dashResult = document.getElementById('dashResult');
    if (!dashResult) return;
    const numCols = ['Анхны өртөг','Элэгдэл тооцох өртөг','Тоо хэмжээ','Хуримтлагдсан элэгдэл','Сүүлийн элэгдэл','Нийт элэгдэл','Одоогийн өртөг'];
    const totals = { count: rows.length };
    numCols.forEach(c => totals[c] = rows.reduce((s,r) => s+(Number(r[c])||0), 0));
    const fmtN = v => (v===null||v===undefined||isNaN(Number(v))) ? '—' : Number(v).toLocaleString('mn-MN');
    const fmtM = v => { const n = Number(v)||0; if (n>=1e9) return (n/1e9).toFixed(1)+'T'; if (n>=1e6) return (n/1e6).toFixed(1)+'M'; return n.toLocaleString('mn-MN'); };
    const deprPct = totals['Анхны өртөг']>0 ? (totals['Нийт элэгдэл']/totals['Анхны өртөг']*100) : 0;
    const covCount = rows.filter(r=>r.Depr_Found).length;
    const covPct = rows.length>0 ? Math.round(covCount/rows.length*100) : 0;
    const covClass = covPct>=90?'cov-ok':covPct>=50?'cov-warn':'cov-bad';

    dashResult.innerHTML = '';
    dashResult.style.cssText = 'display:block;width:100%;';

    // Header
    const hdr = document.createElement('div');
    hdr.className = 'dash-header';
    hdr.innerHTML = `
      <div>
        <div class="dash-title">Хөрөнгийн тойм</div>
        <div class="dash-subtitle">${rows.length} хөрөнгө · Элэгдлийн хамрагдалт <span class="cov-badge ${covClass}">${covPct}%</span></div>
      </div>`;
    dashResult.appendChild(hdr);

    // KPI grid
    const kpiData = [
      { k:'k-blue',   icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="15" rx="2" stroke="#3b82f6" stroke-width="1.8"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round"/></svg>', label:'Нийт хөрөнгө', val: totals.count.toLocaleString(), sub: 'Бүртгэлтэй тоо' },
      { k:'k-green',  icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#10b981" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"/></svg>', label:'Анхны өртөг', val: fmtM(totals['Анхны өртөг']), sub: '₮ ' + fmtN(totals['Анхны өртөг']) },
      { k:'k-cyan',   icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#06b6d4" stroke-width="1.8" stroke-linecap="round"/></svg>', label:'Тооцох өртөг', val: fmtM(totals['Элэгдэл тооцох өртөг']), sub: '₮ ' + fmtN(totals['Элэгдэл тооцох өртөг']) },
      { k:'k-red',    icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><polyline points="17 6 23 6 23 12" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>', label:'Нийт элэгдэл', val: fmtM(totals['Нийт элэгдэл']), sub: `${deprPct.toFixed(1)}% элэгдсэн` },
      { k:'k-orange', icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="#f59e0b" stroke-width="1.8"/><path d="M8 21h8M12 17v4" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round"/></svg>', label:'Одоогийн өртөг', val: fmtM(totals['Одоогийн өртөг']), sub: '₮ ' + fmtN(totals['Одоогийн өртөг']) },
      { k:'k-purple', icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="#8b5cf6" stroke-width="1.8" stroke-linecap="round"/><path d="M7 16l4-4 4 4 4-5" stroke="#8b5cf6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>', label:'Сүүлийн элэгдэл', val: fmtM(totals['Сүүлийн элэгдэл']), sub: '₮ ' + fmtN(totals['Сүүлийн элэгдэл']) },
    ];

    const kpiGrid = document.createElement('div');
    kpiGrid.className = 'dash-kpi-grid';
    kpiData.forEach(d => {
      kpiGrid.innerHTML += `
        <div class="kpi-card ${d.k}">
          <div class="kpi-icon-box">${d.icon}</div>
          <div class="kpi-label">${d.label}</div>
          <div class="kpi-val">${escapeHtml(String(d.val))}</div>
          <div class="kpi-sub">${escapeHtml(d.sub)}</div>
        </div>`;
    });
    dashResult.appendChild(kpiGrid);

    // Chart row
    const chartRow = document.createElement('div');
    chartRow.className = 'dash-row';

    // Left: Account breakdown bar chart
    const acctMap = {};
    rows.forEach(r => {
      const a = r.AccountDescription || '(данс байхгүй)';
      if (!acctMap[a]) acctMap[a] = { count:0, original:0, current:0 };
      acctMap[a].count++;
      acctMap[a].original += Number(r['Анхны өртөг'])||0;
      acctMap[a].current  += Number(r['Одоогийн өртөг'])||0;
    });
    const acctArr = Object.entries(acctMap).map(([k,v])=>({name:k,...v})).sort((a,b)=>b.original-a.original);
    const top8 = acctArr.slice(0,8);
    const maxOrig = top8.length ? top8[0].original : 1;

    const barColors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#f97316'];
    const leftCard = document.createElement('div');
    leftCard.className = 'chart-card';
    leftCard.innerHTML = `
      <div class="chart-card-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 12v4M12 8v8M16 10v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        Дансаар ангилсан
      </div>
      <div class="chart-card-sub">Анхны өртөгөөр — дээд 8 данс</div>
      <div class="hbar-list" id="dashHbar"></div>`;
    chartRow.appendChild(leftCard);

    // Right: Top assets by original cost
    const topAssets = rows.slice().sort((a,b)=>(Number(b['Анхны өртөг'])||0)-(Number(a['Анхны өртөг'])||0)).slice(0,8);
    const rightCard = document.createElement('div');
    rightCard.className = 'chart-card';
    rightCard.innerHTML = `
      <div class="chart-card-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Шилдэг хөрөнгө
      </div>
      <div class="chart-card-sub">Анхны өртөгөөр — дээд 8</div>
      <table class="top-table">
        <thead><tr><th>#</th><th>Нэр</th><th class="num">Өртөг</th></tr></thead>
        <tbody>${topAssets.map((r,i)=>`
          <tr>
            <td><span class="rank-badge rank-${i<3?i+1:'n'}">${i+1}</span></td>
            <td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(r['Хөрөнгийн нэр']||'')}">
              <div style="font-size:0.72rem;color:var(--main-text2);font-family:monospace;">${escapeHtml(r['Хөрөнгийн код']||'')}</div>
              <div style="font-size:0.78rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(String(r['Хөрөнгийн нэр']||'').substring(0,32))}</div>
            </td>
            <td class="num">₮${fmtM(r['Анхны өртөг'])}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    chartRow.appendChild(rightCard);
    dashResult.appendChild(chartRow);

    // Шилдэг хөрөнгө table-д click handler нэмнэ
    setTimeout(() => {
      rightCard.querySelectorAll('tbody tr').forEach((tr, i) => {
        const r = topAssets[i];
        if (!r) return;
        tr.style.cursor = 'pointer';
        tr.title = 'Дэлгэрэнгүй харах';
        tr.addEventListener('click', () => {
          openDashDetailModal(r);
        });
        tr.addEventListener('mouseenter', () => tr.style.background = 'var(--main-hover, rgba(59,130,246,0.08))');
        tr.addEventListener('mouseleave', () => tr.style.background = '');
      });
    }, 50);

    // Render hbars after DOM inserted
    setTimeout(() => {
      const hbarList = document.getElementById('dashHbar');
      if (!hbarList) return;
      top8.forEach((a, i) => {
        const pct = maxOrig > 0 ? (a.original / maxOrig * 100) : 0;
        const item = document.createElement('div');
        item.className = 'hbar-item';
        item.innerHTML = `
          <div class="hbar-top">
            <div class="hbar-name" title="${escapeHtml(a.name)}">${escapeHtml(a.name.length>28?a.name.substring(0,28)+'…':a.name)}</div>
            <div class="hbar-num">${a.count} хөрөнгө · ₮${fmtM(a.original)}</div>
          </div>
          <div class="hbar-bg"><div class="hbar-fill" style="width:${pct.toFixed(1)}%;background:${barColors[i%barColors.length]};"></div></div>`;
        item.style.cursor = 'pointer';
        item.title = a.name + ' — дэлгэрэнгүй харах';
        item.addEventListener('click', () => {
          openDashAccountModal(a.name, rows, fmtM, fmtN, escapeHtml);
        });
        hbarList.appendChild(item);
      });
    }, 0);

    // Depreciation donut row
    const donutRow = document.createElement('div');
    donutRow.className = 'dash-row-3';

    const withDepr = rows.filter(r=>r.Depr_Found).length;
    const noDepr   = rows.length - withDepr;
    const deprRatio = totals['Анхны өртөг']>0 ? deprPct : 0;
    const deprDash = 2*Math.PI*44;
    const deprOffset = deprDash * (1 - deprRatio/100);

    const donutCard = document.createElement('div');
    donutCard.className = 'chart-card';
    donutCard.innerHTML = `
      <div class="chart-card-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/></svg>
        Элэгдлийн харьцаа
      </div>
      <div class="chart-card-sub">Анхны өртөгт харьцуулсан</div>
      <div class="donut-wrap">
        <svg width="100" height="100" viewBox="0 0 100 100" class="donut-svg">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--main-border, #e2e8f0)" stroke-width="12"/>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#ef4444" stroke-width="12"
            stroke-dasharray="${deprDash.toFixed(1)}"
            stroke-dashoffset="${deprOffset.toFixed(1)}"
            stroke-linecap="round" transform="rotate(-90 50 50)"/>
          <text x="50" y="46" text-anchor="middle" font-size="14" font-weight="800" fill="var(--main-text)">${deprRatio.toFixed(0)}%</text>
          <text x="50" y="60" text-anchor="middle" font-size="8" fill="var(--main-text2)">элэгдсэн</text>
        </svg>
        <div class="donut-legend">
          <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div><span class="legend-label">Одоогийн өртөг</span><span class="legend-val">₮${fmtM(totals['Одоогийн өртөг'])}</span></div>
          <div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div><span class="legend-label">Нийт элэгдэл</span><span class="legend-val">₮${fmtM(totals['Нийт элэгдэл'])}</span></div>
          <div class="legend-item"><div class="legend-dot" style="background:#3b82f6"></div><span class="legend-label">Анхны өртөг</span><span class="legend-val">₮${fmtM(totals['Анхны өртөг'])}</span></div>
        </div>
      </div>`;
    donutRow.appendChild(donutCard);

    // Coverage card
    const covCard = document.createElement('div');
    covCard.className = 'chart-card';
    const covDash = 2*Math.PI*44;
    const covOffset = covDash * (1 - covPct/100);
    const covColor = covPct>=90?'#10b981':covPct>=50?'#f59e0b':'#ef4444';
    covCard.innerHTML = `
      <div class="chart-card-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Элэгдлийн хамрагдалт
      </div>
      <div class="chart-card-sub">Тооцогдсон vs тооцогдоогүй</div>
      <div class="donut-wrap">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--main-border, #e2e8f0)" stroke-width="12"/>
          <circle cx="50" cy="50" r="44" fill="none" stroke="${covColor}" stroke-width="12"
            stroke-dasharray="${covDash.toFixed(1)}"
            stroke-dashoffset="${covOffset.toFixed(1)}"
            stroke-linecap="round" transform="rotate(-90 50 50)"/>
          <text x="50" y="46" text-anchor="middle" font-size="14" font-weight="800" fill="var(--main-text)">${covPct}%</text>
          <text x="50" y="60" text-anchor="middle" font-size="8" fill="var(--main-text2)">хамрагдсан</text>
        </svg>
        <div class="donut-legend">
          <div class="legend-item"><div class="legend-dot" style="background:${covColor}"></div><span class="legend-label">Элэгдэл тооцогдсон</span><span class="legend-val">${withDepr}</span></div>
          <div class="legend-item"><div class="legend-dot" style="background:#e2e8f0"></div><span class="legend-label">Тооцогдоогүй</span><span class="legend-val">${noDepr}</span></div>
        </div>
      </div>`;
    donutRow.appendChild(covCard);

    // Summary stats card
    const statsCard = document.createElement('div');
    statsCard.className = 'chart-card';
    const avgOrig = rows.length ? totals['Анхны өртөг']/rows.length : 0;
    const avgCurr = rows.length ? totals['Одоогийн өртөг']/rows.length : 0;
    statsCard.innerHTML = `
      <div class="chart-card-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M7 16l4-4 4 4 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Дундаж үзүүлэлт
      </div>
      <div class="chart-card-sub">Нэг хөрөнгөд ногдох дундаж</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px;">
        ${[
          ['Дундаж анхны өртөг', fmtM(avgOrig), '#3b82f6'],
          ['Дундаж одоогийн', fmtM(avgCurr), '#10b981'],
          ['Дундаж элэгдэл', fmtM(rows.length?totals['Нийт элэгдэл']/rows.length:0), '#ef4444'],
          ['Нийт данс', Object.keys(acctMap).length + ' данс', '#8b5cf6'],
        ].map(([lbl,val,clr])=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--main-border);">
            <span style="font-size:0.75rem;color:var(--main-text2);">${escapeHtml(lbl)}</span>
            <span style="font-size:0.82rem;font-weight:700;font-family:monospace;color:${clr};">₮${escapeHtml(String(val))}</span>
          </div>`).join('')}
      </div>`;
    donutRow.appendChild(statsCard);
    dashResult.appendChild(donutRow);

    // ── Элэгдэлд хамрагдаагүй хөрөнгийн жагсаалт ──
    const noDeprRows = rows.filter(r => !r.Depr_Found && (Number(r['Анхны өртөг'])||0) > 0);
    if (noDeprRows.length > 0) {
      const noDeprCard = document.createElement('div');
      noDeprCard.className = 'chart-card';
      noDeprCard.style.cssText = 'margin-top:0;';
      const topNoDepr = noDeprRows.slice().sort((a,b)=>(Number(b['Анхны өртөг'])||0)-(Number(a['Анхны өртөг'])||0)).slice(0,15);
      noDeprCard.innerHTML = `
        <div class="chart-card-title" style="color:#f59e0b;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/></svg>
          Элэгдэлд хамрагдаагүй хөрөнгө
          <span style="margin-left:auto;font-size:0.72rem;font-weight:600;background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);border-radius:5px;padding:2px 8px;">${noDeprRows.length} хөрөнгө</span>
        </div>
        <div class="chart-card-sub">Элэгдлийн бүртгэл олдоогүй — анхны өртөгөөр эрэмбэлсэн дээд 15</div>
        <div style="overflow-x:auto;margin-top:8px;">
          <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
            <thead>
              <tr style="border-bottom:1px solid var(--main-border);">
                <th style="text-align:left;padding:6px 8px;color:var(--main-text2);font-weight:600;white-space:nowrap;">#</th>
                <th style="text-align:left;padding:6px 8px;color:var(--main-text2);font-weight:600;">Код</th>
                <th style="text-align:left;padding:6px 8px;color:var(--main-text2);font-weight:600;">Нэр</th>
                <th style="text-align:left;padding:6px 8px;color:var(--main-text2);font-weight:600;white-space:nowrap;">Данс</th>
                <th style="text-align:right;padding:6px 8px;color:var(--main-text2);font-weight:600;white-space:nowrap;">Анхны өртөг</th>
                <th style="text-align:right;padding:6px 8px;color:var(--main-text2);font-weight:600;white-space:nowrap;">Тоо</th>
              </tr>
            </thead>
            <tbody>
              ${topNoDepr.map((r,i)=>`
                <tr style="border-bottom:1px solid var(--main-border);cursor:pointer;" class="no-depr-row" data-idx="${i}">
                  <td style="padding:6px 8px;color:var(--main-text2);">${i+1}</td>
                  <td style="padding:6px 8px;font-family:monospace;font-size:0.75rem;color:#0ea5e9;">${escapeHtml(r['Хөрөнгийн код']||'')}</td>
                  <td style="padding:6px 8px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(r['Хөрөнгийн нэр']||'')}">${escapeHtml(String(r['Хөрөнгийн нэр']||'').substring(0,40))}</td>
                  <td style="padding:6px 8px;font-size:0.75rem;color:var(--main-text2);max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(r.AccountDescription||'')}</td>
                  <td style="padding:6px 8px;text-align:right;font-weight:600;color:#f59e0b;">₮${fmtM(r['Анхны өртөг'])}</td>
                  <td style="padding:6px 8px;text-align:right;">${fmtN(r['Тоо хэмжээ'])}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      dashResult.appendChild(noDeprCard);
      // Click → detail panel
      setTimeout(() => {
        noDeprCard.querySelectorAll('.no-depr-row').forEach((tr, i) => {
          const r = topNoDepr[i];
          if (!r) return;
          tr.addEventListener('mouseenter', () => tr.style.background='var(--main-hover,rgba(255,255,255,0.04))');
          tr.addEventListener('mouseleave', () => tr.style.background='');
          tr.addEventListener('click', () => openDetailPanel(r));
        });
      }, 0);
    }
  }

  function renderCalculatedTable(rows, container, preserveOriginal=false) {
    container.innerHTML = '';
    container.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;';
    const numCols = ['Анхны өртөг','Элэгдэл тооцох өртөг','Тоо хэмжээ','Хуримтлагдсан элэгдэл','Сүүлийн элэгдэл','Нийт элэгдэл','Одоогийн өртөг'];
    const cols = ['Хөрөнгийн код','Хөрөнгийн нэр','Анхны өртөг','Элэгдэл тооцох өртөг','Тоо хэмжээ','Хуримтлагдсан элэгдэл','Сүүлийн элэгдэл','Нийт элэгдэл','Одоогийн өртөг'];
    const allCols = cols;
    if (!window._tableColVisibility) window._tableColVisibility = new Set(allCols);
    const getVisibleCols = () => allCols.filter(c => window._tableColVisibility.has(c));
    const dtColDefs = allCols.map(c => ({ label: c, key: c, num: numCols.includes(c) }));
    let dtSortColKey = null;

 
    const dtWrap = document.createElement('div');
    dtWrap.className = 'dt-wrapper';

    let dtPageSize = 10, dtSearch = '', dtSortAsc = true, dtCurrentPage = 0;

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'dt-scroll';

    const table = document.createElement('table');
    table.className = 'dt-table';

    const thead = document.createElement('thead');
    const htr = document.createElement('tr');
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    scrollWrap.appendChild(table);
    dtWrap.appendChild(scrollWrap);

    const bottomBar = document.createElement('div');
    bottomBar.className = 'dt-bottombar';
    const dtInfo = document.createElement('span');
    dtInfo.className = 'dt-info';
    const dtPaging = document.createElement('div');
    dtPaging.className = 'dt-pagination';
    bottomBar.appendChild(dtInfo);
    bottomBar.appendChild(dtPaging);
    dtWrap.appendChild(bottomBar);
    container.appendChild(dtWrap);

    function getFilteredSorted() {
      let out = rows.slice();
      if (dtSearch) {
        const q = dtSearch.toLowerCase();
        out = out.filter(r => Object.values(r).some(v => String(v||'').toLowerCase().includes(q)));
      }
      if (dtSortColKey) {
        const c = dtSortColKey;
        out.sort((a, b) => {
          let va = a[c], vb = b[c];
          if (numCols.includes(c)) { va = Number(va)||0; vb = Number(vb)||0; }
          else { va = String(va||'').toLowerCase(); vb = String(vb||'').toLowerCase(); }
          return dtSortAsc ? (va>vb?1:va<vb?-1:0) : (va<vb?1:va>vb?-1:0);
        });
      }
      return out;
    }

    function renderPage() {
      const filtered = getFilteredSorted();
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / dtPageSize));
      if (dtCurrentPage >= totalPages) dtCurrentPage = totalPages - 1;
      const start = dtCurrentPage * dtPageSize;
      const pageRows = filtered.slice(start, start + dtPageSize);

      const visibleCols = getVisibleCols();
      if (dtSortColKey && !visibleCols.includes(dtSortColKey)) dtSortColKey = null;

      htr.innerHTML = '';
      visibleCols.forEach((c, ci) => {
        const th = document.createElement('th');
        if (numCols.includes(c)) th.classList.add('num');
        const label = document.createElement('span');
        label.textContent = c;
        const icon = document.createElement('span');
        icon.className = 'sort-icon';
        icon.style.cssText = 'display:inline-flex;align-items:center;margin-left:5px;opacity:0.35;vertical-align:middle;transition:opacity 0.15s;';
        icon.innerHTML = '<svg width="10" height="14" viewBox="0 0 10 14" fill="none"><path d="M5 1v12M1.5 4.5L5 1l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.5 9.5L5 13l3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        th.appendChild(label);
        th.appendChild(icon);
        th.style.cssText += 'cursor:pointer;user-select:none;white-space:nowrap;';
        th.addEventListener('mouseenter', () => { if (dtSortColKey !== c) icon.style.opacity = '0.6'; });
        th.addEventListener('mouseleave', () => { if (dtSortColKey !== c) icon.style.opacity = '0.35'; });
        th.addEventListener('click', () => {
          if (dtSortColKey === c) dtSortAsc = !dtSortAsc;
          else { dtSortColKey = c; dtSortAsc = true; }
          dtCurrentPage = 0;
          renderPage();
        });
        if (dtSortColKey === c) {
          icon.style.opacity = '1';
          icon.innerHTML = dtSortAsc
            ? '<svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M5 1v10M1.5 4.5L5 1l3.5 3.5" stroke="var(--accent,#6366f1)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M5 11V1M1.5 7.5L5 11l3.5-3.5" stroke="var(--accent,#6366f1)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          th.classList.add(dtSortAsc ? 'sort-asc' : 'sort-desc');
        }
        htr.appendChild(th);
      });

      tbody.innerHTML = '';
      if (!pageRows.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = visibleCols.length;
        td.className = 'dt-empty';
        td.textContent = 'Өгөгдөл олдсонгүй';
        tr.appendChild(td); tbody.appendChild(tr);
      }

      pageRows.forEach((r, ri) => {
        const tr = document.createElement('tr');
        tr.className = 'inv-row';
        visibleCols.forEach((c, ci) => {
          const td = document.createElement('td');
          if (numCols.includes(c)) td.classList.add('num');
          if (ci === 0) {
            const code = document.createElement('span');
            code.className = 'dt-asset-code';
            code.textContent = String(r[c]||'');
            td.appendChild(code);
          } else if (numCols.includes(c)) {
            const n = Number(r[c]);
            const span = document.createElement('span');
            span.textContent = (r[c]===null||r[c]===undefined||isNaN(n)) ? '' : n.toLocaleString('mn-MN');
            if (!isNaN(n)) span.style.color = n>0?'#059669':n<0?'#7c3aed':'#dc2626';
            td.appendChild(span);
          } else {
            td.textContent = r[c]===null||r[c]===undefined ? '' : String(r[c]);
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);

        tr.addEventListener('click', () => {
          document.querySelectorAll('.dt-table tbody tr.inv-row.detail-active').forEach(el=>el.classList.remove('detail-active'));
          tr.classList.add('detail-active');
          openDetailPanel(r);
        });
      });

      const s = total === 0 ? 0 : start + 1;
      const e = Math.min(start + dtPageSize, total);
      dtInfo.textContent = `${s}–${e} / ${total} мөр харуулж байна`;

      dtPaging.innerHTML = '';
      const mkBtn = (label, page, disabled, active) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.className = 'dt-page-btn' + (active ? ' active' : '');
        btn.disabled = disabled;
        if (!disabled) btn.addEventListener('click', (ev) => { ev.stopPropagation(); dtCurrentPage = page; renderPage(); });
        return btn;
      };
      dtPaging.appendChild(mkBtn('Previous', dtCurrentPage-1, dtCurrentPage===0, false));
      const maxShow = Math.min(totalPages, 7);
      let startPage = Math.max(0, dtCurrentPage - 3);
      if (startPage + maxShow > totalPages) startPage = Math.max(0, totalPages - maxShow);
      for (let p = startPage; p < startPage + Math.min(maxShow, totalPages); p++) {
        dtPaging.appendChild(mkBtn(p+1, p, false, p===dtCurrentPage));
      }
      dtPaging.appendChild(mkBtn('Next', dtCurrentPage+1, dtCurrentPage>=totalPages-1, false));
    }

    const dtPageSelEl  = document.getElementById('dtPageSel');
    const dtSearchBoxEl = document.getElementById('dtSearchBox');
    if (dtPageSelEl) {
      dtPageSelEl.value = String(dtPageSize);
      dtPageSelEl.onchange = e => { dtPageSize = Number(e.target.value); dtCurrentPage = 0; renderPage(); };
    }
    if (dtSearchBoxEl) {
      dtSearchBoxEl.value = dtSearch;
      dtSearchBoxEl.oninput = e => { dtSearch = e.target.value; dtCurrentPage = 0; renderPage(); };
    }

    renderPage();
    populateColSelector('dtColsSel', dtColDefs, window._tableColVisibility, renderPage);
    if (!preserveOriginal) window._calculatedRows = rows;
    window._lastRenderedRows=rows; window._lastRenderedCols=cols;
    if (!preserveOriginal && !window._originalCalculatedRows) {
      window._originalCalculatedRows=rows.slice(); window._originalCalculatedCols=cols.slice();
    }
  }

  async function loadInlineLedger(assetid, container, calcRow) {
    const server=getServer(), db=getDatabase(), username=usernameInput?usernameInput.value:'', password=passwordInput?passwordInput.value:'';
    const fmt = v => (v===null||v===undefined||isNaN(Number(v))) ? '—' : Number(v).toLocaleString('en-US');
    try {
      let combinedRows = window._combinedRows||null;
      if (!combinedRows) {
        const res = await fetch(API_BASE + '/combined', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({server,database:db,username,password})});
        const json = await res.json(); combinedRows=json.rows||[]; window._combinedRows=combinedRows;
      }
      const assetRows = combinedRows.filter(r => String(r.Assetid||'').trim()===assetid.trim());
      function getAmt(row) {
        const candidates = ['InlistTaxedAmt','InAmt','InListAmt','Inamt','inamt','Amount','TaxedAmt','amt'];
        for (const k of candidates) {
          if (row[k] !== null && row[k] !== undefined && row[k] !== '' && !isNaN(Number(row[k]))) return Number(row[k]);
        }
        const qty = Number(row['Inqty']) || 0;
        const cost = Number(row['CurrentCost']) || 0;
        if (qty && cost) return qty * cost;
        return 0;
      }
      function getReplist(row) {
        const c2 = row['C2'];
        if (c2 !== null && c2 !== undefined && c2 !== '' && !isNaN(Number(c2))) return Number(c2);
        const rep = Number(row['Replist']);
        if (!isNaN(rep) && rep !== 0) return rep;
        return (Number(row['Bbl'])||0) + (Number(row['Inqty'])||0) - (Number(row['Outqty'])||0) - (Number(row['DisQty'])||0);
      }
      const ledgerCols = [
        {label:'Дансны нэр',        key:'AccountDescription', num:false, calc:null},
        {label:'Татан авалын тоо',  key:'Replist',            num:true,  calc:null},
        {label:'Орлогын тоо',       key:'Inqty',              num:true,  calc:null},
        {label:'Зарлагын тоо',      key:'Outqty',             num:true,  calc:null},
        {label:'Акталсан',          key:'DisQty',             num:true,  calc:null},
        {label:'Эхний үлдэгдэл',   key:'Bbl',                num:true,  calc:null},
        {label:'Эцсийн үлдэгдэл',  key:null,                 num:true,  calc: r => getReplist(r)},
        {label:'Орлогын дүн',       key:null,                 num:true,  calc: r => getAmt(r)},
        {label:'Анхны өртөг',       key:'CurrentCost',        num:true,  calc:null},
      ];
      if (assetRows.length > 0) {
        const tbl = document.createElement('table');
        tbl.className = 'dt-ledger-table';
        const thead = document.createElement('thead');
        const htr = document.createElement('tr');
        ledgerCols.forEach(c => {
          const th = document.createElement('th');
          if (c.num) th.classList.add('num');
          th.textContent = c.label;
          htr.appendChild(th);
        });
        thead.appendChild(htr); tbl.appendChild(thead);
        const tbody = document.createElement('tbody');
        assetRows.forEach(row => {
          const tr = document.createElement('tr');
          ledgerCols.forEach(c => {
            const td = document.createElement('td');
            if (c.num) td.classList.add('num');
            if (c.calc) {
              const v = c.calc(row);
              td.textContent = (v === null || v === undefined) ? '—' : Number(v).toLocaleString('en-US');
            } else {
              td.textContent = c.num ? fmt(row[c.key]) : String(row[c.key]||'');
            }
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        container.innerHTML = '';
        container.appendChild(tbl);
      } else {
        container.innerHTML = `<span style="color:#9ca3af;font-size:0.82rem;">Бичилт олдсонгүй</span>`;
      }
    } catch(err) {
      container.innerHTML = `<span style="color:#dc3545;font-size:0.82rem;">Алдаа: ${escapeHtml(String(err))}</span>`;
    }
  }

  function renderTable(rows, cols, container) {
    container.innerHTML = '';
    const table = document.createElement('table'); table.style.cssText='border-collapse:collapse;width:100%;';
    const thead=document.createElement('thead'); const htr=document.createElement('tr');
    cols.forEach(c=>{ const th=document.createElement('th'); th.textContent=c; th.style.cssText='border:2px solid #89a58b;padding:6px;background:#27fac5e3;'; htr.appendChild(th); });
    thead.appendChild(htr); table.appendChild(thead);
    const tbody=document.createElement('tbody');
    rows.forEach(r=>{ const tr=document.createElement('tr'); cols.forEach(c=>{ const td=document.createElement('td'); td.textContent=(r[c]===null||r[c]===undefined)?'':r[c]; td.style.cssText='border:1px solid #48b451;padding:8px;'; tr.appendChild(td); }); tbody.appendChild(tr); });
    table.appendChild(tbody); container.appendChild(table);
    window._lastRenderedRows=rows; window._lastRenderedCols=cols;
    if (!window._originalDisplayedRows) { window._originalDisplayedRows=rows.slice(); window._originalDisplayedCols=cols.slice(); }
  }

  async function applyFilter() {
    const selected = _selectedAccounts.slice();
    if (!window._calculatedRows) { try { await fetchPreview(); } catch(e){ return; } }
    const base = window._originalCalculatedRows || window._calculatedRows || null;
    if (!base) return;
    setTimeout(() => {
      let out = base.slice();
      // Данс шүүлт (multi-select)
      if (selected.length) out = out.filter(r => selected.includes(String(r.AccountDescription)));
      // Өртөгийн шүүлт
      const mode = _accountFilterMode || 'all';
      // Хослуулсан горим шалгах туслах функц
      function matchesQty(r, m) {
        if (m === 'qty0')    return Number(r['Тоо хэмжээ']) === 0;
        if (m === 'qty_gt0') return Number(r['Тоо хэмжээ']) > 0;
        if (m === 'qty1')    return Number(r['Тоо хэмжээ']) === 1;
        if (m === 'qty_gt1') return Number(r['Тоо хэмжээ']) > 1;
        return true;
      }
      function matchesVal(r, m) {
        const v = Number(r['Одоогийн өртөг']);
        if (m === 'val0')    return !isNaN(v) && v === 0;
        if (m === 'val_gt0') return !isNaN(v) && v > 0;
        return true;
      }
      if (mode.includes('|')) {
        const [qm, vm] = mode.split('|');
        out = out.filter(r => matchesQty(r, qm) && matchesVal(r, vm));
      } else if (mode === 'qty_gt0_val0') {
        out = out.filter(r => Number(r['Тоо хэмжээ']) > 0 && Number(r['Одоогийн өртөг']) === 0);
      } else if (['qty0','qty_gt0','qty1','qty_gt1'].includes(mode)) {
        out = out.filter(r => matchesQty(r, mode));
      } else if (['val0','val_gt0'].includes(mode)) {
        out = out.filter(r => matchesVal(r, mode));
      }
      renderDashboard(out);
      renderCalculatedTable(out, previewResult, true);
      hideProgress('Шүүлт амжилттай.');
    }, 50);
  }

  const topSearchInput=document.getElementById('topSearchInput'), exportBtn=document.getElementById('exportBtn');

  function topSearch() {
    const q=(topSearchInput?topSearchInput.value:'').trim().toLowerCase();
    const dtBox = document.getElementById('dtSearchBox');
    if (dtBox) { dtBox.value = q; dtBox.dispatchEvent(new Event('input')); }
  }
  function topClear() {
    if (topSearchInput) topSearchInput.value='';
    const dtBox = document.getElementById('dtSearchBox');
    if (dtBox) { dtBox.value=''; dtBox.dispatchEvent(new Event('input')); }
  }
  function exportCSV() {
    const rows=window._lastRenderedRows||window._calculatedRows||[];
    const cols=window._lastRenderedCols||(window._calculatedRows?['Хөрөнгийн код','Хөрөнгийн нэр','Анхны өртөг','Элэгдэл тооцох өртөг','Тоо хэмжээ','Хуримтлагдсан элэгдэл','Сүүлийн элэгдэл','Нийт элэгдэл','Одоогийн өртөг']:[]);
    if (!rows.length) { setStatus('No rows to export'); return; }
    const esc=v=>'"'+String(v===null||v===undefined?'':v).replace(/"/g,'""')+'"';
    const lines=[cols.map(c=>esc(c)).join(',')];
    rows.forEach(r=>lines.push(cols.map(c=>esc(r[c]!==undefined?r[c]:'')).join(',')));
    const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;
    const dt=new Date(); a.download=`asset_export_${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,'0')}${String(dt.getDate()).padStart(2,'0')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setStatus('Exported '+a.download);
  }
  if (exportBtn) exportBtn.addEventListener('click', exportCSV);

  combinedBtn.addEventListener('click', async () => {
    const server=getServer(), db=getDatabase(), username=usernameInput.value||'', password=passwordInput.value||'';
    if (!server||!db){setStatus('Select server and database first');return;}
    setStatus('Requesting combined view...'); combinedResult.innerHTML='';
    try {
      const res=await fetch(API_BASE + '/combined',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({server,database:db,username,password})});
      const json=await res.json(); if (!json.success){setStatus('Error');combinedResult.textContent=json.message||'';return;}
      setStatus(json.message||'Амжилттай');
      const cols=json.columns||[], rows=json.rows||[];
      if (!rows.length){combinedResult.textContent='(no rows)';return;}
      const table=document.createElement('table'); table.style.cssText='border-collapse:collapse;width:100%;';
      const thead=document.createElement('thead'); const htr=document.createElement('tr');
      cols.forEach(c=>{const th=document.createElement('th');th.textContent=c;th.style.cssText='border:1px solid #ccc;padding:4px;';htr.appendChild(th);});
      thead.appendChild(htr); table.appendChild(thead);
      const tbody=document.createElement('tbody');
      rows.forEach(r=>{const tr=document.createElement('tr');cols.forEach(c=>{const td=document.createElement('td');td.textContent=r[c]??'';td.style.cssText='border:1px solid #55009b;padding:4px;';tr.appendChild(td);});tbody.appendChild(tr);});
      table.appendChild(tbody); combinedResult.appendChild(table);
    } catch(err){setStatus('Failed: '+err.message);}
  });

  // ── Tab switching ──
  const tabPanelDash   = document.getElementById('tabPanelDash');
  const tabPanelTable  = document.getElementById('tabPanelTable');
  const tabDashBtn     = document.getElementById('tabDashBtn');
  const tabTableBtn    = document.getElementById('tabTableBtn');

  const tabPanelAssets = document.getElementById('tabPanelAssets');
  const tabAssetBtn    = document.getElementById('tabAssetBtn');

function updateStatusForTab(tab, dbName) {
  const statusEl = document.getElementById('status');
  const statusDot = document.getElementById('statusDot');
  if (tab === 'assets') {
    if (statusEl) { 
      statusEl.innerHTML = 'Техникийн нэгдсэн дата · MYASSETS ' +
        '<span style="color:#0ea5e9;font-family:monospace;">' + escapeHtml(dbName) + '</span>';
      statusEl.style.color = '#10b981'; 
    }
    if (statusDot) { 
      statusDot.style.background = '#10b981'; 
      statusDot.style.boxShadow = '0 0 6px rgba(16,185,129,0.6)'; 
    }
  } else if (tab === 'dash' || tab === 'table') {
    if (statusEl) { 
      statusEl.innerHTML = 'Гүйлгээний жагсаалт амжилттай татагдлаа ' +
        '<span style="color:#0ea5e9;font-family:monospace;">' + escapeHtml(dbName) + '</span>';
      statusEl.style.color = '#10b981'; 
    }
    if (statusDot) { 
      statusDot.style.background = '#10b981'; 
      statusDot.style.boxShadow = '0 0 6px rgba(16,185,129,0.6)'; 
    }
  }
}


  function showDataTabs() {
    // Дата ачаалсаны дараа tab button-уудыг харуулна
    if (tabDashBtn)  tabDashBtn.style.display  = '';
    if (tabTableBtn) tabTableBtn.style.display = '';
    // Sidebar: зөвхөн "Холбогдлоо" харуул
    const sbDot = document.getElementById('sbConnectDot');
    const sbLine = document.getElementById('sbStatusLine');
    const sbSub  = document.getElementById('sbConnectSub');
    if (sbDot)  { sbDot.style.background = '#10b981'; sbDot.style.boxShadow = '0 0 6px #10b981'; }
    if (sbLine) { sbLine.innerHTML = '<div style="width:6px;height:6px;border-radius:50%;background:#10b981;flex-shrink:0;box-shadow:0 0 6px #10b981;"></div><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#10b981;">Холбогдлоо</span>'; }
    
  }
  function showAssetTab() {
    if (tabAssetBtn) tabAssetBtn.style.display = '';
  }

  function switchTab(tab) {
    if (tabPanelDash)   { tabPanelDash.style.display   = tab==='dash'   ? 'flex' : 'none'; }
    if (tabPanelTable)  { tabPanelTable.style.display   = tab==='table'  ? 'flex' : 'none'; }
    if (tabPanelAssets) { tabPanelAssets.style.display  = tab==='assets' ? 'flex' : 'none'; }
    if (tabDashBtn)  tabDashBtn.classList.toggle('tab-active',  tab === 'dash');
    if (tabTableBtn) tabTableBtn.classList.toggle('tab-active', tab === 'table');
    if (tabAssetBtn) tabAssetBtn.classList.toggle('tab-active', tab === 'assets');
    const isTable = tab === 'table';
    document.querySelectorAll('.table-only-control').forEach(el => { el.style.display = isTable ? '' : 'none'; });
    if (isTable) { document.querySelectorAll('.col-toggle-wrap').forEach(el=>el.style.display='inline-block'); }
    if (!isTable) {
      const fp = document.getElementById('dtFilterPanel');
      const fb = document.getElementById('filterToggleBtn');
      if (fp) fp.style.display = 'none';
      if (fb) fb.classList.remove('active');
    }
    window._activeTab = tab;
    updateStatusForTab(tab, getDatabase());
  }

  if (tabDashBtn)  tabDashBtn.addEventListener('click',  () => switchTab('dash'));
  if (tabTableBtn) tabTableBtn.addEventListener('click', () => switchTab('table'));
  if (tabAssetBtn) tabAssetBtn.addEventListener('click', () => switchTab('assets'));

  // (fetchLedger removed — ledger view replaced by detail panel)

  function exportLedgerCsv(rows) {
    if(!rows||!rows.length){setStatus('No data to export');return;}
    const cm={'Хөрөнгийн код':'Assetid','Хөрөнгийн нэр':'AssetDesc','Дансны нэр':'AccountDescription','Орлогын тоо':'Inqty','Зарлагын тоо':'Outqty','Акталсан':'DisQty','Эхний үлдэгдэл':'Bbl','Эцсийн үлдэгдэл':'Replist','Орлогын дүн':'InlistTaxedAmt','Анхны өртөг':'CurrentCost','Эцсийн тоо':'C2'};
    const cols=Object.keys(cm); let csv=cols.join(',')+'\n';
    rows.forEach(r=>{const vs=cols.map(c=>{const v=r[cm[c]];const s=v===null||v===undefined?'':String(v);return s.includes(',')||s.includes('"')?'"'+s.replace(/"/g,'""')+'"':s;});csv+=vs.join(',')+'\n';});
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const link=document.createElement('a'); const url=URL.createObjectURL(blob);
    link.href=url; link.download='ledger_'+Date.now()+'.csv'; link.style.visibility='hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setStatus('File exported');
  }

  function getLdAmt(row) {
    const candidates = ['InlistTaxedAmt','InAmt','InListAmt','Inamt','inamt','Amount','TaxedAmt','amt'];
    for (const k of candidates) {
      if (row[k] !== null && row[k] !== undefined && row[k] !== '' && !isNaN(Number(row[k]))) return Number(row[k]);
    }
    const qty = Number(row['Inqty']) || 0;
    const cost = Number(row['CurrentCost']) || 0;
    if (qty && cost) return qty * cost;
    return 0;
  }
  function getLdEndBal(row) {
    const c2 = row['C2'];
    if (c2 !== null && c2 !== undefined && c2 !== '' && !isNaN(Number(c2))) return Number(c2);
    const rep = Number(row['Replist']);
    if (!isNaN(rep) && rep !== 0) return rep;
    return (Number(row['Bbl'])||0) + (Number(row['Inqty'])||0) - (Number(row['Outqty'])||0) - (Number(row['DisQty'])||0);
  }

  const ldColDefs = [
      {label:'Хөрөнгийн код',     key:'Assetid',            num:false, calc:null},
      {label:'Хөрөнгийн нэр',     key:'AssetDesc',          num:false, calc:null},
      {label:'Дансны нэр',        key:'AccountDescription', num:false, calc:null},
      {label:'Татан авалын тоо',  key:'Replist',            num:true,  calc:null},
      {label:'Орлогын тоо',       key:'Inqty',              num:true,  calc:null},
      {label:'Зарлагын тоо',      key:'Outqty',             num:true,  calc:null},
      {label:'Акталсан',          key:'DisQty',             num:true,  calc:null},
      {label:'Эхний үлдэгдэл',   key:'Bbl',                num:true,  calc:null},
      {label:'Эцсийн үлдэгдэл',  key:null,                 num:true,  calc: r => getLdEndBal(r)},
      {label:'Орлогын дүн',       key:null,                 num:true,  calc: r => getLdAmt(r)},
      {label:'Анхны өртөг',       key:'CurrentCost',        num:true,  calc:null},
  ];

  function renderLedgerRows(allRows) {
    if (!ledgerResult) return;
    window._lastLedgerRows = allRows;
    if (!window._ledgerColVisibility) {
      window._ledgerColVisibility = new Set(ldColDefs.map(d => d.label));
    }
    const fmt = v => (v===null||v===undefined||isNaN(Number(v))) ? '—' : Number(v).toLocaleString('en-US');
    const visibleDefs = ldColDefs.filter(d => window._ledgerColVisibility.has(d.label));
    const cols = visibleDefs.map(d => d.label);
    const numKeys = new Set(visibleDefs.filter(d => d.num).map(d => d.label));
    const cm = {}; visibleDefs.forEach(c => { if (c.key) cm[c.label] = c.key; });

    let ldSearch = '', ldPageSize = 25, ldPage = 0, ldSortCol = -1, ldSortAsc = true;

    ledgerResult.innerHTML = '';

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'ld-scroll';

    const table = document.createElement('table');
    table.className = 'ld-table';

    const thead = document.createElement('thead');
    const htr = document.createElement('tr');
    cols.forEach((c, ci) => {
      const def = visibleDefs[ci];
      const th = document.createElement('th');
      if (def.num) th.classList.add('num');
      const label = document.createElement('span'); label.textContent = c;
      const icon = document.createElement('span'); icon.className = 'ld-sort-icon'; icon.textContent = ' ↕';
      th.appendChild(label); th.appendChild(icon);
      th.addEventListener('click', () => {
        if (ldSortCol===ci) ldSortAsc=!ldSortAsc; else { ldSortCol=ci; ldSortAsc=true; }
        ldPage=0; renderLdPage();
      });
      htr.appendChild(th);
    });
    thead.appendChild(htr); table.appendChild(thead);

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    scrollWrap.appendChild(table);
    ledgerResult.appendChild(scrollWrap);

    const bottomBar = document.createElement('div');
    bottomBar.className = 'ld-bottombar';
    const ldInfoEl = document.createElement('div'); ldInfoEl.className = 'ld-info';
    const ldPagEl  = document.createElement('div'); ldPagEl.className = 'ld-pagination';
    bottomBar.appendChild(ldInfoEl); bottomBar.appendChild(ldPagEl);
    ledgerResult.appendChild(bottomBar);

    function getFiltered() {
      let out = allRows.slice();
      if (ldSearch) { const q=ldSearch.toLowerCase(); out=out.filter(r=>cols.some(c=>String(r[cm[c]]||'').toLowerCase().includes(q))); }
      if (ldSortCol >= 0) {
        const key = cm[cols[ldSortCol]]; const isNum = numKeys.has(key);
        out.sort((a,b) => {
          let va=a[key], vb=b[key];
          if (isNum) { va=Number(va)||0; vb=Number(vb)||0; }
          else { va=String(va||'').toLowerCase(); vb=String(vb||'').toLowerCase(); }
          return ldSortAsc ? (va>vb?1:va<vb?-1:0) : (va<vb?1:va>vb?-1:0);
        });
      }
      return out;
    }

    function renderLdPage() {
      const filtered = getFiltered();
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / ldPageSize));
      if (ldPage >= totalPages) ldPage = totalPages - 1;
      const start = ldPage * ldPageSize;
      const pageRows = filtered.slice(start, start + ldPageSize);

      htr.querySelectorAll('th').forEach((th, ci) => {
        const icon = th.querySelector('.ld-sort-icon');
        if (!icon) return;
        if (ci === ldSortCol) { icon.textContent = ldSortAsc ? ' ↑' : ' ↓'; icon.style.color='#495057'; }
        else { icon.textContent = ' ↕'; icon.style.color='#adb5bd'; }
      });

      tbody.innerHTML = '';
      if (!pageRows.length) {
        const tr=document.createElement('tr'); const td=document.createElement('td');
        td.colSpan=cols.length; td.style.cssText='text-align:center;padding:28px;color:#9ca3af;font-size:0.88rem;';
        td.textContent='Өгөгдөл олдсонгүй'; tr.appendChild(td); tbody.appendChild(tr);
      }
      pageRows.forEach((row, ri) => {
        const tr = document.createElement('tr');
        cols.forEach((c, ci) => {
          const def = visibleDefs[ci];
          const isNum = def.num;
          const td = document.createElement('td');
          if (isNum) td.classList.add('num');
          let v;
          if (def.calc) {
            try { v = def.calc(row); } catch(e) { v = null; }
          } else {
            v = row[def.key];
          }
          if (ci === 0) {
            const a = document.createElement('a');
            a.href='#'; a.className='ld-asset-code';
            a.textContent = String(v||'');
            const arr = document.createElement('span');
            arr.className='dt-expand-arrow'; arr.textContent='▶';
            arr.style.marginRight='6px';
            td.appendChild(arr); td.appendChild(a);
            tr.addEventListener('click', () => {
              const existing = tr.nextElementSibling;
              if (existing && existing.classList.contains('ld-detail-row')) {
                existing.remove(); arr.textContent='▶'; tr.classList.remove('row-expanded');
              } else {
                arr.textContent='▼'; tr.classList.add('row-expanded');
                const detailTr = document.createElement('tr');
                detailTr.className='ld-detail-row';
                const detailTd = document.createElement('td');
                detailTd.colSpan = cols.length;
                detailTd.style.cssText='padding:0;background:#fff;';
                const inner = document.createElement('div');
                inner.style.cssText='padding:14px 20px;border-left:3px solid #0d6efd;background:#f8faff;';
                inner.innerHTML='<span style="color:#94a3b8;font-size:0.82rem;">Уншиж байна...</span>';
                detailTd.appendChild(inner); detailTr.appendChild(detailTd);
                tr.insertAdjacentElement('afterend', detailTr);
                loadInlineLedger(String(v||''), inner, row);
              }
            });
            a.addEventListener('click', ev => ev.stopPropagation());
          } else {
            td.textContent = isNum ? fmt(v) : (v===null||v===undefined?'':String(v));
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

      const s = total===0?0:start+1, e = Math.min(start+ldPageSize, total);
      ldInfoEl.textContent = `Showing ${s} to ${e} of ${total} entries`;

      ldPagEl.innerHTML = '';
      const mkBtn = (label, page, disabled, active) => {
        const btn = document.createElement('button');
        btn.textContent=label; btn.disabled=disabled;
        btn.className='dt-page-btn'+(active?' active':'');
        if (!disabled) btn.addEventListener('click', ()=>{ ldPage=page; renderLdPage(); });
        return btn;
      };
      ldPagEl.appendChild(mkBtn('Previous', ldPage-1, ldPage===0, false));
      const maxShow = Math.min(totalPages, 7);
      let sp = Math.max(0, ldPage-3);
      if (sp+maxShow > totalPages) sp = Math.max(0, totalPages-maxShow);
      for (let p=sp; p<sp+Math.min(maxShow,totalPages); p++) ldPagEl.appendChild(mkBtn(p+1, p, false, p===ldPage));
      ldPagEl.appendChild(mkBtn('Next', ldPage+1, ldPage>=totalPages-1, false));
    }

    const ldPageSelEl   = document.getElementById('ldPageSel');
    const ldSearchBoxEl = document.getElementById('ldSearchBox');
    if (ldPageSelEl) {
      ldPageSelEl.value = String(ldPageSize);
      ldPageSelEl.onchange = e => { ldPageSize=Number(e.target.value); ldPage=0; renderLdPage(); };
    }
    if (ldSearchBoxEl) {
      ldSearchBoxEl.value = ldSearch;
      ldSearchBoxEl.oninput = e => { ldSearch=e.target.value; ldPage=0; renderLdPage(); };
    }

    renderLdPage();
    // Wire column chooser after rendering
    populateColSelector('ldColsSel', ldColDefs, window._ledgerColVisibility, () => {
      if (window._lastLedgerRows) renderLedgerRows(window._lastLedgerRows);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  populateColSelector — Шинэ загвар: floating panel, custom checkboxes
  //  All / Deselect / Clear товчтой
  // ═══════════════════════════════════════════════════════════════
  function populateColSelector(selId, colDefs, visibility, callback) {
    const sel = document.getElementById(selId);
    if (!sel) return;

    // Native <select multiple> нуугдана
    sel.style.display = 'none';

    // ── dtColsSel → parts.html загварын col-toggle-menu dropdown ──
    if (selId === 'dtColsSel') {
      const wrap = document.getElementById('colToggleWrap');
      const btn  = document.getElementById('colToggleBtn');
      if (!wrap || !btn) return;

      // colMenu div үүсгэх (эсвэл байгааг ашиглах)
      let menu = document.getElementById('colMenu');
      if (!menu) {
        menu = document.createElement('div');
        menu.id = 'colMenu';
        menu.className = 'col-toggle-menu';
        wrap.appendChild(menu);
      }

      // Checkbox жагсаалт байгуулах
      function rebuildMenu() {
        menu.innerHTML = colDefs.map(d => `
          <label class="col-item">
            <input type="checkbox" ${visibility.has(d.label) ? 'checked' : ''} data-col="${escapeHtml(d.label)}">
            ${escapeHtml(d.label)}
          </label>`).join('');
        menu.querySelectorAll('input[type=checkbox]').forEach(cb => {
          cb.onchange = () => {
            if (cb.checked) visibility.add(cb.dataset.col);
            else visibility.delete(cb.dataset.col);
            if (callback) callback();
            // Товчны өнгийг шинэчлэх — нуугдсан багана байвал шар өнгөтэй болно
            const allVis = colDefs.every(d => visibility.has(d.label));
            btn.style.borderColor = allVis ? '' : 'var(--warning, #f59e0b)';
            btn.style.color       = allVis ? '' : 'var(--warning, #f59e0b)';
          };
        });
      }

      rebuildMenu();

      // Toggle товч дарахад нээх/хаах
      btn.onclick = (e) => {
        e.stopPropagation();
        rebuildMenu(); // visibility өөрчлөгдсөн тохиолдолд дахин байгуулна
        const isOpen = menu.classList.toggle('open');
        btn.classList.toggle('active', isOpen);
      };

      // Гадна дарвал хаах (нэг удаа л bind хийнэ)
      if (!wrap.dataset.colMenuInit) {
        wrap.dataset.colMenuInit = '1';
        document.addEventListener('click', e => {
          if (!wrap.contains(e.target)) {
            menu.classList.remove('open');
            btn.classList.remove('active');
          }
        });
      }
      return; // ── Энд дуусна, доорх legacy код ажиллахгүй ──
    }

    // Panel болон toggle button ID-г тодорхойлно
    const btnId   = selId === 'dtColsSel' ? 'dtColsToggleBtn' : 'ldColsToggleBtn';
    const panelId = selId === 'dtColsSel' ? 'dtColsPanelUI'   : 'ldColsPanelUI';

    // Toggle button — байхгүй бол үүсгэж selector-ийн өмнө оруулна
    let toggleBtn = document.getElementById(btnId);
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = btnId;
      toggleBtn.type = 'button';
      toggleBtn.className = 'cols-toggle-btn';
      toggleBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M3 6h18M7 12h10M10 18h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
        Баганууд
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      sel.parentNode.insertBefore(toggleBtn, sel);
    }

    // Floating panel DOM — body-д нэмнэ (overflow: hidden асуудлаас зайлсхийхийн тулд)
    let panel = document.getElementById(panelId);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = panelId;
      panel.className = 'cols-panel';
      panel.style.display = 'none';
      document.body.appendChild(panel);
    }

    function openPanel() {
      rebuildPanel();
      panel.style.display = 'block';
      const rect = toggleBtn.getBoundingClientRect();
      const panelW = 270;
      let left = rect.left + window.scrollX;
      if (left + panelW > window.innerWidth - 10) left = window.innerWidth - panelW - 10;
      panel.style.top  = (rect.bottom + window.scrollY + 6) + 'px';
      panel.style.left = Math.max(6, left) + 'px';
      toggleBtn.classList.add('active');
    }

    function closePanel() {
      panel.style.display = 'none';
      toggleBtn.classList.remove('active');
    }

    // Panel-г дахин байгуулна (visibility өөрчлөгдсөн тохиолдолд)
    function rebuildPanel() {
      const totalCount = colDefs.length;
      const visCount = colDefs.filter(d => visibility.has(d.label)).length;

      panel.innerHTML = `
        <div class="cols-panel-header">
          <span class="cols-panel-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M7 12h10M10 18h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
            Баганууд сонгох
          </span>
          <button class="cols-panel-close" id="${panelId}_close" type="button">✕</button>
        </div>
        <div class="cols-panel-actions">
          <button class="cols-btn-all"  id="${panelId}_all"  type="button">✓ Бүгд</button>
          <button class="cols-btn-none" id="${panelId}_none" type="button">○ Болих</button>
          <button class="cols-btn-clear" id="${panelId}_clear" type="button">↺ Reset</button>
        </div>
        <div class="cols-panel-list" id="${panelId}_list"></div>
        <div class="cols-panel-footer">
          <span class="cols-panel-count" id="${panelId}_count">${visCount}/${totalCount} сонгогдсон</span>
          <button class="cols-btn-apply" id="${panelId}_apply" type="button">Хэрэглэх</button>
        </div>`;

      const list = document.getElementById(`${panelId}_list`);

      // Checkbox мөрүүд
      colDefs.forEach(def => {
        const item = document.createElement('div');
        item.className = 'cols-check-item' + (visibility.has(def.label) ? ' checked' : '');
        item.dataset.col = def.label;
        item.innerHTML = `<div class="cols-check-box"></div><span class="cols-check-label">${escapeHtml(def.label)}</span>`;
        item.addEventListener('click', () => {
          if (visibility.has(def.label)) visibility.delete(def.label);
          else visibility.add(def.label);
          item.classList.toggle('checked', visibility.has(def.label));
          updateCount();
        });
        list.appendChild(item);
      });

      function updateCount() {
        const cnt = colDefs.filter(d => visibility.has(d.label)).length;
        const el = document.getElementById(`${panelId}_count`);
        if (el) el.textContent = `${cnt}/${totalCount} сонгогдсон`;
        // Toggle button-г ч шинэчлэнэ
        if (cnt < totalCount) {
          toggleBtn.style.borderColor = '#f59e0b';
          toggleBtn.style.color = '#d97706';
        } else {
          toggleBtn.style.borderColor = '';
          toggleBtn.style.color = '';
        }
      }

      // Бүгд сонгох
      panel.querySelector('.cols-btn-all').addEventListener('click', (ev) => {
        ev.stopPropagation();
        colDefs.forEach(d => visibility.add(d.label));
        panel.querySelectorAll('.cols-check-item').forEach(i => i.classList.add('checked'));
        updateCount();
      });

      // Бүгдийг болих
      panel.querySelector('.cols-btn-none').addEventListener('click', (ev) => {
        ev.stopPropagation();
        visibility.clear();
        panel.querySelectorAll('.cols-check-item').forEach(i => i.classList.remove('checked'));
        updateCount();
      });

      // Reset — анхны байдалд (бүгд сонгогдсон)
      panel.querySelector('.cols-btn-clear').addEventListener('click', (ev) => {
        ev.stopPropagation();
        visibility.clear();
        colDefs.forEach(d => visibility.add(d.label));
        panel.querySelectorAll('.cols-check-item').forEach(i => i.classList.add('checked'));
        updateCount();
      });

      // Хаах товч — getElementById биш querySelector ашиглана
      // (innerHTML дахин бичигдэх бүрт шинэ DOM элемент үүсдэг тул)
      const closeBtn = panel.querySelector('.cols-panel-close');
      if (closeBtn) closeBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closePanel();
      });

      // Хэрэглэх товч
      const applyBtn = panel.querySelector('.cols-btn-apply');
      if (applyBtn) applyBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (callback) callback();
        closePanel();
      });
    }

    // Toggle товч
    toggleBtn.onclick = (ev) => {
      ev.stopPropagation();
      if (panel.style.display === 'none') openPanel();
      else closePanel();
    };

    // Panel-ийн гадна дарвал хаана
    if (!panel.dataset.outsideInit) {
      panel.dataset.outsideInit = '1';
      document.addEventListener('click', ev => {
        if (panel.style.display !== 'none' && !panel.contains(ev.target) && ev.target !== toggleBtn && !toggleBtn.contains(ev.target)) {
          closePanel();
        }
      });
      // Panel дотор дарвал тархахгүй
      panel.addEventListener('click', ev => ev.stopPropagation());
    }
  }

  function setupColumnControls(btnId, panelId, colDefs, visibility, onChange) {
    const btnEl = document.getElementById(btnId);
    const panelEl = document.getElementById(panelId);
    if (!btnEl || !panelEl) return;
    if (btnEl.dataset.colsInit) return;
    btnEl.dataset.colsInit = '1';
    const defs = colDefs || ldColDefs;
    const vis = visibility || window._ledgerColVisibility;
    const refresh = onChange || (() => { if (window._lastLedgerRows) renderLedgerRows(window._lastLedgerRows); });
    btnEl.addEventListener('click', (ev) => {
      ev.stopPropagation();
      panelEl.innerHTML = '';
      const btnBar = document.createElement('div');
      btnBar.style.marginBottom = '8px';
      const selectAllBtn = document.createElement('button');
      selectAllBtn.textContent = 'Select All';
      selectAllBtn.style.cssText = 'padding:4px 8px;margin-right:4px;background:#0d6efd;color:white;border:none;cursor:pointer;border-radius:3px;font-size:0.85rem;';
      selectAllBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        defs.forEach(def => vis.add(def.label));
        panelEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        refresh();
      });
      const deselectAllBtn = document.createElement('button');
      deselectAllBtn.textContent = 'Deselect All';
      deselectAllBtn.style.cssText = 'padding:4px 8px;background:#6c757d;color:white;border:none;cursor:pointer;border-radius:3px;font-size:0.85rem;';
      deselectAllBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        vis.clear();
        panelEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        refresh();
      });
      btnBar.appendChild(selectAllBtn);
      btnBar.appendChild(deselectAllBtn);
      panelEl.appendChild(btnBar);
      defs.forEach(def => {
        const id = 'colchk_' + def.label.replace(/\s+/g,'_');
        const wrap = document.createElement('div');
        wrap.style.margin = '4px 0';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = id;
        cb.checked = vis ? vis.has(def.label) : true;
        cb.addEventListener('change', () => {
          if (cb.checked) vis.add(def.label);
          else vis.delete(def.label);
          refresh();
        });
        const lbl = document.createElement('label'); lbl.htmlFor = id; lbl.style.marginLeft = '4px'; lbl.textContent = def.label;
        wrap.appendChild(cb); wrap.appendChild(lbl);
        panelEl.appendChild(wrap);
      });
      panelEl.classList.remove('hidden');
      const rect = btnEl.getBoundingClientRect();
      panelEl.style.top = (rect.bottom + window.scrollY) + 'px';
      panelEl.style.left = (rect.left + window.scrollX - 40) + 'px';
    });
    document.addEventListener('click', ev => {
      if (panelEl && !panelEl.classList.contains('hidden')) {
        if (!panelEl.contains(ev.target) && ev.target !== btnEl) {
          panelEl.classList.add('hidden');
        }
      }
    });
    panelEl.addEventListener('click', ev => ev.stopPropagation());
  }

  function setupLedgerColumnControls() {
    if (!window._ledgerColVisibility) window._ledgerColVisibility = new Set(ldColDefs.map(d => d.label));
    setupColumnControls(
      'ldColsBtn',
      'ldColsPanel',
      ldColDefs,
      window._ledgerColVisibility,
      () => { if (window._lastLedgerRows) renderLedgerRows(window._lastLedgerRows); }
    );
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const cb=document.getElementById('ledgerCloseAllBtn');
    if(cb){cb.addEventListener('click',(ev)=>{ev.preventDefault();if(ledgerResult)ledgerResult.style.display='none';window._focusLedgerAsset=null;try{setStatus('');}catch(e){}});}
  });

  try {
    const handle=document.getElementById('ledgerResizeHandle'); const minH=120,maxH=Math.max(300,window.innerHeight-120);
    if(handle&&ledgerResult){
      try{const s=localStorage.getItem('ledger_height');if(s)ledgerResult.style.height=s;}catch(e){}
      let dragging=false,startY=0,startH=0;
      const onMove=cy=>{let nH=startH+(startY-cy);if(nH<minH)nH=minH;if(nH>maxH)nH=maxH;ledgerResult.style.height=nH+'px';};
      const stop=()=>{if(!dragging)return;dragging=false;document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',stop);document.removeEventListener('touchmove',tm);document.removeEventListener('touchend',stop);try{localStorage.setItem('ledger_height',ledgerResult.style.height);}catch(e){}};
      const mm=ev=>{if(dragging)onMove(ev.clientY);};
      const tm=ev=>{if(dragging&&ev.touches&&ev.touches[0])onMove(ev.touches[0].clientY);};
      handle.addEventListener('mousedown',ev=>{ev.preventDefault();dragging=true;startY=ev.clientY;startH=parseInt(window.getComputedStyle(ledgerResult).height,10)||360;document.addEventListener('mousemove',mm);document.addEventListener('mouseup',stop);});
      handle.addEventListener('touchstart',ev=>{ev.preventDefault();dragging=true;startY=ev.touches[0].clientY;startH=parseInt(window.getComputedStyle(ledgerResult).height,10)||360;document.addEventListener('touchmove',tm);document.addEventListener('touchend',stop);},{passive:false});
    }
  } catch(e){}

  const savedChoice=JSON.parse(localStorage.getItem('sql_choice')||'null');
  if(savedChoice)usernameInput.value=savedChoice.username||'';
  loadFile();

  // ═══════════════════════════════════════════════════════════
  // ТЕХНИКИЙН НЭГДСЭН ДАТА — Modal + myassets query
  // username/password → main form-оос авна (.env-ийн SA_USER/SA_PASSWORD серверт хадгалтай)
  // ═══════════════════════════════════════════════════════════
  (function() {
    const techDataBtn        = document.getElementById('techDataBtn');
    const techDataModal      = document.getElementById('techDataModal');
    const techDataModalClose = document.getElementById('techDataModalClose');
    const tdServerInput      = document.getElementById('tdServerInput');
    const tdServerSelect     = document.getElementById('tdServerSelect');
    const tdDbInput          = document.getElementById('tdDbInput');
    const tdDbSelect         = document.getElementById('tdDbSelect');
    const tdFetchBtn         = document.getElementById('tdFetchBtn');
    const tdSpinner          = document.getElementById('tdSpinner');
    const tdBtnIcon          = document.getElementById('tdBtnIcon');
    const tdBtnText          = document.getElementById('tdBtnText');
    const tdProgressWrap     = document.getElementById('tdProgressWrap');
    const tdProgressBar      = document.getElementById('tdProgressBar');
    const tdProgressPercent  = document.getElementById('tdProgressPercent');
    const tdStatusEl         = document.getElementById('tdStatus');
    const myassetsResult     = document.getElementById('myassetsResult');

    if (!techDataBtn || !techDataModal) return;

    /* ── helper-үүд ── */
    function tdGetServer()   { return (tdServerSelect && tdServerSelect.style.display !== 'none') ? (tdServerSelect.value||'') : (tdServerInput ? tdServerInput.value.trim() : ''); }
    function tdGetDatabase() { return (tdDbSelect    && tdDbSelect.style.display    !== 'none') ? (tdDbSelect.value   ||'') : (tdDbInput    ? tdDbInput.value.trim()    : ''); }

    function tdShowStatus(msg, color, bg, border) {
      if (!tdStatusEl) return;
      tdStatusEl.style.display  = 'block';
      tdStatusEl.style.color    = color  || 'var(--main-text2)';
      tdStatusEl.style.background = bg   || 'transparent';
      tdStatusEl.style.border   = border ? '1px solid ' + border : 'none';
      tdStatusEl.style.borderRadius = '7px';
      tdStatusEl.style.padding  = bg ? '8px 12px' : '0';
      tdStatusEl.textContent    = msg;
    }

    function tdStartProgress() {
      if (!tdProgressWrap || !tdProgressBar) return;
      tdProgressWrap.style.display = 'block';
      tdProgressBar.style.width    = '0%';
      tdProgressBar.style.background = 'linear-gradient(90deg,#0ea5e9,#38bdf8)';
      let p = 0;
      window._tdProgressInterval = setInterval(() => {
        if (p < 92) { p += Math.random() * 7; if (p > 92) p = 92; }
        tdProgressBar.style.width = Math.round(p) + '%';
        if (tdProgressPercent) tdProgressPercent.textContent = Math.round(p) + '%';
      }, 150);
    }

    function tdStopProgress(success) {
      if (window._tdProgressInterval) clearInterval(window._tdProgressInterval);
      if (!tdProgressBar) return;
      tdProgressBar.style.width      = '100%';
      tdProgressBar.style.background = success ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#f87171)';
      if (tdProgressPercent) tdProgressPercent.textContent = success ? '100%' : '✕';
      setTimeout(() => {
        if (tdProgressWrap) tdProgressWrap.style.display = 'none';
        if (tdProgressBar)  { tdProgressBar.style.width = '0%'; tdProgressBar.style.background = 'linear-gradient(90deg,#0ea5e9,#38bdf8)'; }
        if (tdProgressPercent) tdProgressPercent.textContent = '0%';
      }, 1600);
    }

    function tdSetLoading(on) {
      if (tdFetchBtn)  tdFetchBtn.disabled        = on;
      if (tdFetchBtn)  tdFetchBtn.style.opacity   = on ? '0.75' : '1';
      if (tdSpinner)   tdSpinner.style.display    = on ? 'inline-block' : 'none';
      if (tdBtnIcon)   tdBtnIcon.style.display    = on ? 'none' : '';
      if (tdBtnText)   tdBtnText.textContent      = on ? 'Уншиж байна...' : 'Дата татах';
    }

    /* ── servers.txt авто уншилт → dropdown ── */
    function tdParseLines(txt) {
      return txt.split(/\r?\n/).map(l => l.trim()).filter(l => l).slice(1)
        .map(l => { let p = l.split('\t'); if (p.length < 3) p = l.split(/\s{2,}/); return p.length >= 3 ? { server: p[0].trim(), name: p[1].trim(), selection: p[2].trim() } : null; })
        .filter(Boolean);
    }
    function tdShowManual()   { if (tdServerInput) tdServerInput.style.display=''; if (tdDbInput) tdDbInput.style.display=''; if (tdServerSelect) tdServerSelect.style.display='none'; if (tdDbSelect) tdDbSelect.style.display='none'; }
    function tdShowDropdown() { if (tdServerInput) tdServerInput.style.display='none'; if (tdDbInput) tdDbInput.style.display='none'; if (tdServerSelect) tdServerSelect.style.display=''; if (tdDbSelect) tdDbSelect.style.display=''; }

    function tdPopulateFromText(txt) {
      const rows = tdParseLines(txt).filter(r => r.selection === '1');
      const servers = Array.from(new Set(rows.map(r => r.server))).sort();
      if (!servers.length) { tdShowManual(); return; }
      tdShowDropdown();
      tdServerSelect.innerHTML = '';
      servers.forEach(s => tdServerSelect.appendChild(new Option(s, s)));
      tdServerSelect.onchange = () => {
        const dbs = rows.filter(r => r.server === tdServerSelect.value).map(r => r.name).sort();
        tdDbSelect.innerHTML = '';
        dbs.forEach(d => tdDbSelect.appendChild(new Option(d, d)));
      };
      tdServerSelect.value = servers[0];
      tdServerSelect.onchange();
    }

    /* ── Modal нээх / хаах ── */
    function openTechDataModal() {
      techDataModal.style.display = 'flex';
      techDataModal.classList.remove('hidden');
      if (tdStatusEl) { tdStatusEl.style.display = 'none'; tdStatusEl.textContent = ''; }
      // DB credential талбаруудыг цэвэрлэхгүй — хэрэглэгч өөрөө оруулна
      // servers.txt авто ачааллах
      fetch('../data/servers.txt')
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(txt => tdPopulateFromText(txt))
        .catch(() => tdShowManual());
    }
    function closeTechDataModal() {
      techDataModal.style.display = 'none';
      techDataModal.classList.add('hidden');
    }

    techDataBtn.addEventListener('click', openTechDataModal);
    if (techDataModalClose) techDataModalClose.addEventListener('click', closeTechDataModal);
    techDataModal.querySelector('.modal-backdrop').addEventListener('click', closeTechDataModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && techDataModal.style.display !== 'none') closeTechDataModal(); });

    /* ── myassets дата татах ──
       requireAuth → main form-ын APP username/password шалгана
       SQL холболт → modal-д оруулсан dbUser / dbPassword-ийг ашиглана (шууд SQL нэвтрэлт) */
    const tdUsernameEl = document.getElementById('tdUsername');
    const tdPasswordEl = document.getElementById('tdPassword');

    // App нэвтрэлтийн утгыг pre-fill хийхгүй — DB credential тусдаа
    function tdPrefillCreds() {
      // DB нэвтрэх мэдээлэл app-ийн нэвтрэлтээс ялгаатай тул pre-fill хийхгүй
    }

    async function fetchMyAssets() {
      const server   = tdGetServer();
      const database = tdGetDatabase();

      // Modal дотроос авна — sidebar Тохиргооноос бүрэн тусдаа
      const dbUser     = tdUsernameEl ? tdUsernameEl.value.trim() : '';
      const dbPassword = tdPasswordEl ? tdPasswordEl.value : '';

      // App auth (requireAuth) — modal-ын нэвтрэх мэдээллийг ашиглана
      // Sidebar-ын username/password-с хамаарахгүй
      const username = dbUser;
      const password = dbPassword;

      if (!server || !database) {
        tdShowStatus('⚠ Сервер болон Мэдээллийн бааз оруулна уу!', '#92400e', 'rgba(251,191,36,0.1)', '#fbbf24');
        return;
      }
      if (!dbUser) {
        tdShowStatus('⚠ Нэвтрэх нэр оруулна уу!', '#92400e', 'rgba(251,191,36,0.1)', '#fbbf24');
        return;
      }
      if (!dbPassword) {
        tdShowStatus('⚠ Нууц үг оруулна уу!', '#92400e', 'rgba(251,191,36,0.1)', '#fbbf24');
        return;
      }

      tdSetLoading(true);
      tdStartProgress();
      if (tdStatusEl) tdStatusEl.style.display = 'none';

      try {
        const res = await fetch(API_BASE + '/myassets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ server, database, username, password, dbUser, dbPassword })
        });

        let json;
        try { json = await res.json(); } catch(e) { json = { success: false, message: res.statusText }; }

        if (!res.ok || !json.success) {
          tdStopProgress(false);
          tdSetLoading(false);
          tdShowStatus('✕ ' + (json.message || 'Алдаа гарлаа'), '#dc2626', 'rgba(239,68,68,0.08)', '#fca5a5');
          return;
        }

        const rows = json.rows || [];
        tdStopProgress(true);
        tdShowStatus('✓ ' + rows.length + ' мөр амжилттай татлаа', '#059669', 'rgba(16,185,129,0.08)', '#6ee7b7');
        tdSetLoading(false);

        setTimeout(() => {
          closeTechDataModal();
          renderMyAssetsTable(rows, database);
        }, 900);

      } catch(err) {
        tdStopProgress(false);
        tdSetLoading(false);
        tdShowStatus('✕ Серверт холбогдож чадсангүй', '#dc2626', 'rgba(239,68,68,0.08)', '#fca5a5');
      }
    }

    if (tdFetchBtn) tdFetchBtn.addEventListener('click', fetchMyAssets);

    /* ── myassets хүснэгт рендер — Хөрөнгийн жагсаалттай адил pagination ── */
    function renderMyAssetsTable(rows, dbName) {
      if (!myassetsResult) return;
      window._myassetsRows = rows;
      window._myassetsDbName = dbName;

      const fmtN = v => (v===null||v===undefined||isNaN(Number(v)))?'—':Number(v).toLocaleString('mn-MN');
      const numCols = new Set(['InitialCost','AccumulatedDepreciation','RemainingCost','Blance']);
      const cols = [
        { key:'assetid',                 label:'Asset ID' },
        { key:'assetcode',               label:'Хөрөнгийн код' },
        { key:'assetname',               label:'Хөрөнгийн нэр' },
        { key:'InitialCost',             label:'Анхны өртөг',           num:true },
        { key:'AccumulatedDepreciation', label:'Хуримтлагдсан элэгдэл', num:true },
        { key:'RemainingCost',           label:'Үлдэгдэл өртөг',        num:true },
        { key:'Blance',                  label:'Баланс'          },
        { key:'BlanceCheck',             label:'BlanceCheck'     },
        { key:'ServerName',              label:'Серверийн нэр' },
      ];

      showAssetTab();
      switchTab('assets');

      myassetsResult.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;';
      myassetsResult.innerHTML = '';

      // Header toolbar
      const header = document.createElement('div');
      header.style.cssText = 'padding:10px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;border-bottom:1px solid var(--main-border);flex-shrink:0;';
      header.innerHTML = `<div>
         
          <div style="font-size:0.92rem;font-weight:700;color:var(--main-text);">            
            <span id="maRowCount" style="font-size:0.78rem;font-weight:400;color:var(--main-text2);margin-left:8px;">${rows.length} мөр</span>
          </div></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <div class="icon-input-wrap"><span class="input-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </span><input type="text" id="maSearchBox" class="f-input" placeholder="Хайх..." style="padding-left:33px;min-width:150px;"/></div>
          <div class="icon-input-wrap"><span class="input-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </span><select id="maPageSel" class="f-input" style="min-width:100px;padding-left:33px;">
            <option value="25">25 мөр</option><option value="50">50 мөр</option>
            <option value="100">100 мөр</option><option value="200">200 мөр</option>
          </select></div>
          <button id="maRefreshBtn" class="btn" type="button" title="Myassets дата дахин татах" style="font-size:0.82rem;padding:6px 12px;display:flex;align-items:center;gap:5px;background:rgba(14,165,233,0.12);color:#0ea5e9;border:1px solid rgba(14,165,233,0.3);border-radius:7px;cursor:pointer;">
            <svg id="maRefreshIcon" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 20v-6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Шинэчлэх
          </button>
          <button id="maSyncBtn" class="btn" type="button" style="font-size:0.82rem;padding:6px 12px;display:flex;align-items:center;gap:5px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;border-radius:7px;cursor:pointer;">
           
            <span id="maSyncBtnText">Хөрөнгийн жагсаалтаас шинэчлэх</span>
          </button>
          <button id="maExportBtn" class="btn btn-success" type="button" style="font-size:0.82rem;padding:6px 12px;display:flex;align-items:center;gap:5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Excel татах
          </button>
        </div>`;
      myassetsResult.appendChild(header);

      // Sync status bar
      const syncBar = document.createElement('div');
      syncBar.id = 'maSyncBar';
      syncBar.style.cssText = 'display:none;padding:8px 16px;font-size:0.8rem;border-bottom:1px solid var(--main-border);flex-shrink:0;';
      myassetsResult.appendChild(syncBar);

      const scrollWrap = document.createElement('div');
      scrollWrap.style.cssText = 'overflow:auto;flex:1;min-height:0;';
      const table = document.createElement('table'); table.className = 'dt-table';
      const thead = document.createElement('thead'); const htr = document.createElement('tr');
      thead.appendChild(htr); table.appendChild(thead);
      const tbody = document.createElement('tbody'); table.appendChild(tbody);
      scrollWrap.appendChild(table); myassetsResult.appendChild(scrollWrap);

      const bottomBar = document.createElement('div'); bottomBar.className = 'dt-bottombar';
      const maInfo = document.createElement('span'); maInfo.className = 'dt-info';
      const maPaging = document.createElement('div'); maPaging.className = 'dt-pagination';
      bottomBar.appendChild(maInfo); bottomBar.appendChild(maPaging);
      myassetsResult.appendChild(bottomBar);

      let maSearch='', maPageSize=25, maPage=0, maSortKey=null, maSortAsc=true;

      function getFiltered() {
        let out = rows.slice();
        if (maSearch) { const q=maSearch.toLowerCase(); out=out.filter(r=>cols.some(c=>{const v=r[c.key];return v!=null&&String(v).toLowerCase().includes(q);})); }
        if (maSortKey) {
          const isNum=numCols.has(maSortKey);
          out.sort((a,b)=>{let va=a[maSortKey],vb=b[maSortKey];if(isNum){va=Number(va)||0;vb=Number(vb)||0;}else{va=String(va||'').toLowerCase();vb=String(vb||'').toLowerCase();}return maSortAsc?(va>vb?1:va<vb?-1:0):(va<vb?1:va>vb?-1:0);});
        }
        return out;
      }

      function renderPage() {
        const filtered=getFiltered(), total=filtered.length;
        const totalPages=Math.max(1,Math.ceil(total/maPageSize));
        if (maPage>=totalPages) maPage=totalPages-1;
        const start=maPage*maPageSize, pageRows=filtered.slice(start,start+maPageSize);
        htr.innerHTML='';
        cols.forEach(c=>{
          const th=document.createElement('th'); if(c.num) th.classList.add('num');
          th.style.cssText='cursor:pointer;user-select:none;white-space:nowrap;';
          const lbl=document.createElement('span'); lbl.textContent=c.label;
          const ico=document.createElement('span');
          ico.style.cssText='display:inline-flex;align-items:center;margin-left:5px;vertical-align:middle;'+(maSortKey===c.key?'opacity:1;':'opacity:0.35;');
          ico.innerHTML=maSortKey===c.key?(maSortAsc?'<svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M5 1v10M1.5 4.5L5 1l3.5 3.5" stroke="var(--accent,#6366f1)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>':'<svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M5 11V1M1.5 7.5L5 11l3.5-3.5" stroke="var(--accent,#6366f1)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'):'<svg width="10" height="14" viewBox="0 0 10 14" fill="none"><path d="M5 1v12M1.5 4.5L5 1l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.5 9.5L5 13l3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          th.appendChild(lbl); th.appendChild(ico);
          th.addEventListener('click',()=>{if(maSortKey===c.key)maSortAsc=!maSortAsc;else{maSortKey=c.key;maSortAsc=true;}maPage=0;renderPage();});
          htr.appendChild(th);
        });
        tbody.innerHTML='';
        if (!pageRows.length) {
          const tr=document.createElement('tr'),td=document.createElement('td');
          td.colSpan=cols.length;td.className='dt-empty';td.textContent='Өгөгдөл олдсонгүй';tr.appendChild(td);tbody.appendChild(tr);
        }
        pageRows.forEach(row=>{
          const tr=document.createElement('tr'); tr.className='inv-row';
          cols.forEach((c,ci)=>{
            const td=document.createElement('td'); if(c.num)td.classList.add('num');
            const v=row[c.key];
            if(c.num){const n=Number(v);const sp=document.createElement('span');sp.textContent=(v===null||v===undefined||isNaN(n))?'':n.toLocaleString('mn-MN');if(!isNaN(n))sp.style.color=n>0?'#059669':n<0?'#7c3aed':'#dc2626';td.appendChild(sp);}
            else if(ci===0){const code=document.createElement('span');code.className='dt-asset-code';code.textContent=v==null?'':String(v);td.appendChild(code);}
            else{td.textContent=v==null?'':String(v);}
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        const s=total===0?0:start+1, e=Math.min(start+maPageSize,total);
        maInfo.textContent=`${s}–${e} / ${total} мөр харуулж байна`;
        const cnt=document.getElementById('maRowCount');
        if(cnt)cnt.textContent=total+' мөр'+(total<rows.length?' (шүүсэн)':'');
        maPaging.innerHTML='';
        const mkBtn=(label,page,disabled,active)=>{const btn=document.createElement('button');btn.textContent=label;btn.className='dt-page-btn'+(active?' active':'');btn.disabled=disabled;if(!disabled)btn.addEventListener('click',ev=>{ev.stopPropagation();maPage=page;renderPage();});return btn;};
        maPaging.appendChild(mkBtn('Previous',maPage-1,maPage===0,false));
        const maxShow=Math.min(totalPages,7);let startPage=Math.max(0,maPage-3);
        if(startPage+maxShow>totalPages)startPage=Math.max(0,totalPages-maxShow);
        for(let p=startPage;p<startPage+Math.min(maxShow,totalPages);p++)maPaging.appendChild(mkBtn(p+1,p,false,p===maPage));
        maPaging.appendChild(mkBtn('Next',maPage+1,maPage>=totalPages-1,false));
      }

      renderPage();

      setTimeout(()=>{
        const sb=document.getElementById('maSearchBox');
        if(sb)sb.addEventListener('input',()=>{maSearch=sb.value;maPage=0;renderPage();});
        const ps=document.getElementById('maPageSel');
        if(ps)ps.addEventListener('change',()=>{maPageSize=Number(ps.value);maPage=0;renderPage();});
        const eb=document.getElementById('maExportBtn');
        if(eb)eb.addEventListener('click',()=>{const data=getFiltered();const csv=[cols.map(c=>c.label).join(','),...data.map(row=>cols.map(c=>{const v=row[c.key];return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));a.download='myassets_'+dbName+'.csv';a.click();});

        // ── Хөрөнгийн жагсаалтаас шинэчлэх (Preview → Батлах → Update) ──
        // ЗАСВАР: Хуучин modal-г устгана — дахин render хийхэд шинэ closure-тай холбоно
        const _staleModal = document.getElementById('bk-sync-preview-modal');
        if (_staleModal) _staleModal.remove();

        const syncBtn = document.getElementById('maSyncBtn');
        const syncBar = document.getElementById('maSyncBar');

        function syncShowBar(msg, color, bg) {
          if (!syncBar) return;
          syncBar.style.display = 'block';
          syncBar.style.color = color || 'var(--main-text)';
          syncBar.style.background = bg || 'transparent';
          syncBar.style.borderRadius = '0';
          syncBar.innerHTML = msg;
        }

        function getConnInfo() {
          const tdU      = document.getElementById('tdUsername');
          const tdP      = document.getElementById('tdPassword');
          const tdSrv    = document.getElementById('tdServerInput');
          const tdSrvSel = document.getElementById('tdServerSelect');
          const tdDb     = document.getElementById('tdDbInput');
          const tdDbSel  = document.getElementById('tdDbSelect');
          const dbSel    = document.getElementById('dbSelect');
          const dbInp    = document.getElementById('dbInput');
          return {
            asServer:   (tdSrvSel && tdSrvSel.style.display !== 'none') ? tdSrvSel.value : (tdSrv ? tdSrv.value.trim() : ''),
            asDatabase: (tdDbSel  && tdDbSel.style.display  !== 'none') ? tdDbSel.value  : (tdDb  ? tdDb.value.trim()  : ''),
            asUser:     tdU ? tdU.value.trim() : '',
            asPass:     tdP ? tdP.value : '',
            mainDb:     (dbSel && dbSel.style.display !== 'none') ? dbSel.value : (dbInp ? dbInp.value.trim() : ''),
          };
        }

        function buildUpdates(calcRows, maRows, mainDb) {
          const calcMap = {};
          calcRows.forEach(r => {
            const code = String(r['Хөрөнгийн код'] || '').trim();
            if (code) calcMap[code] = r;
          });
          const updates = [];
          // mainDb тохирох мөрүүдийг эхлээд шүүнэ
          const mainDbLower = mainDb.toLowerCase();
          const matchedRows = maRows.filter(ma => {
            const maSrv = String(ma.ServerName || '').trim();
            return maSrv.toLowerCase() === mainDbLower;
          });
          // Хэрэв ServerName-тай тохирох мөр байхгүй бол бүх мөрийг ашиглана (fallback)
          const rowsToProcess = matchedRows.length > 0 ? matchedRows : maRows;
          rowsToProcess.forEach(ma => {
            const maCode = String(ma.assetcode  || '').trim();
            if (!maCode) return;
            const calc = calcMap[maCode];
            if (!calc) return;
            updates.push({
              assetcode:               maCode,
              assetname:               ma.assetname || '',
              old_InitialCost:             ma.InitialCost             == null ? null : Number(ma.InitialCost),
              old_AccumulatedDepreciation: ma.AccumulatedDepreciation == null ? null : Number(ma.AccumulatedDepreciation),
              old_RemainingCost:           ma.RemainingCost           == null ? null : Number(ma.RemainingCost),
              // Анхны өртөг (шинэ) = Элэгдэл тооцох өртөг (Хөрөнгийн жагсаалт view)
              InitialCost:             calc['Элэгдэл тооцох өртөг'] == null ? null : Number(calc['Элэгдэл тооцох өртөг']),
              AccumulatedDepreciation: calc['Нийт элэгдэл']         == null ? null : Number(calc['Нийт элэгдэл']),
              // Одоогийн өртөг (шинэ) = Элэгдэл тооцох өртөг − Нийт элэгдэл
              RemainingCost: (calc['Элэгдэл тооцох өртөг'] == null || calc['Нийт элэгдэл'] == null)
                ? null
                : Math.round(Number(calc['Элэгдэл тооцох өртөг']) - Number(calc['Нийт элэгдэл'])),
            });
          });
          return updates;
        }

        // ── Төлөв хувьсагчид — modal event listener-уудын ӨМНӨ зарлана ──
        let _pendingUpdates = [], _pendingConn = {};
        let _selectedCodes = new Set();
        let _previewSearch = '';
        let _previewFilterMode = 'changed';

        const fmtV = v => (v === null || v === undefined || isNaN(Number(v))) ? '—' : Number(v).toLocaleString('mn-MN');
        const isChanged = (a, b) => {
          if (a === null && b === null) return false;
          if (a === null || b === null) return true;
          return Math.round(Number(a)) !== Math.round(Number(b));
        };

        function updateSelectedCount() {
          const el = previewModal.querySelector('#syncSelectedCount');
          const allCb = previewModal.querySelectorAll('.sync-row-cb');
          const checkedCnt = previewModal.querySelectorAll('.sync-row-cb:checked').length;
          if (el) el.textContent = checkedCnt ? checkedCnt + ' мөр сонгогдсон' : '';
          const selAll = previewModal.querySelector('#syncSelectAll');
          if (selAll) {
            selAll.indeterminate = checkedCnt > 0 && checkedCnt < allCb.length;
            selAll.checked = allCb.length > 0 && checkedCnt === allCb.length;
          }
          const confirmTxt = previewModal.querySelector('#syncConfirmBtnText');
          if (confirmTxt) confirmTxt.textContent = checkedCnt ? checkedCnt + ' мөр шинэчлэх' : 'Сонгосныг шинэчлэх';
        }

        function renderPreviewTable(filterMode) {
          if (filterMode !== undefined) _previewFilterMode = filterMode;
          const body = previewModal.querySelector('#syncPreviewBody');
          const countEl = previewModal.querySelector('#syncPreviewCount');
          const footerEl = previewModal.querySelector('#syncPreviewFooterInfo');
          if (!body) return;
          const changedRows = _pendingUpdates.filter(u =>
            isChanged(u.old_InitialCost, u.InitialCost) ||
            isChanged(u.old_AccumulatedDepreciation, u.AccumulatedDepreciation) ||
            isChanged(u.old_RemainingCost, u.RemainingCost));
          const sameRows = _pendingUpdates.filter(u =>
            !isChanged(u.old_InitialCost, u.InitialCost) &&
            !isChanged(u.old_AccumulatedDepreciation, u.AccumulatedDepreciation) &&
            !isChanged(u.old_RemainingCost, u.RemainingCost));
          let shown = _previewFilterMode === 'changed' ? changedRows
                      : _previewFilterMode === 'same'    ? sameRows
                      : _pendingUpdates;
          // Search filter
          if (_previewSearch) {
            const q = _previewSearch.toLowerCase();
            shown = shown.filter(u =>
              String(u.assetcode||'').toLowerCase().includes(q) ||
              String(u.assetname||'').toLowerCase().includes(q));
          }
          const changedCount = changedRows.length;
          const sameCount = _pendingUpdates.length - changedCount;
          if (countEl) countEl.textContent = shown.length + ' / ' + _pendingUpdates.length + ' мөр харуулж байна';
          if (footerEl) footerEl.innerHTML = 'Нийт <strong>' + _pendingUpdates.length + '</strong> тохирох мөр &nbsp;·&nbsp; <span style="color:#f59e0b"><strong>' + changedCount + '</strong> өөрчлөгдөх</span> &nbsp;·&nbsp; <span style="color:#64748b">' + sameCount + ' ижил</span>';
          body.innerHTML = '';
          if (!shown.length) {
            body.innerHTML = '<tr><td colspan="9" style="padding:24px;text-align:center;color:var(--main-text2);font-size:0.85rem;">Тохирох мөр олдсонгүй</td></tr>';
            updateSelectedCount();
            return;
          }
          const hlBg = 'rgba(245,158,11,0.1)';
          shown.forEach(u => {
            const f1 = isChanged(u.old_InitialCost, u.InitialCost);
            const f2 = isChanged(u.old_AccumulatedDepreciation, u.AccumulatedDepreciation);
            const f3 = isChanged(u.old_RemainingCost, u.RemainingCost);
            const isSelected = _selectedCodes.has(u.assetcode);
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--main-border)';
            if (isSelected) tr.style.background = 'rgba(245,158,11,0.04)';
            const cbTd = document.createElement('td');
            cbTd.style.cssText = 'padding:7px 10px;text-align:center;';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'sync-row-cb';
            cb.dataset.code = u.assetcode;
            cb.checked = isSelected;
            cb.style.cssText = 'accent-color:#f59e0b;width:15px;height:15px;cursor:pointer;';
            cb.addEventListener('change', function() {
              if (this.checked) _selectedCodes.add(u.assetcode);
              else _selectedCodes.delete(u.assetcode);
              tr.style.background = this.checked ? 'rgba(245,158,11,0.04)' : '';
              updateSelectedCount();
            });
            cbTd.appendChild(cb);
            tr.appendChild(cbTd);
            tr.insertAdjacentHTML('beforeend',
              '<td style="padding:7px 12px;font-family:monospace;font-size:0.8rem;color:#38bdf8;white-space:nowrap;">' + escapeHtml(u.assetcode) + '</td>' +
              '<td style="padding:7px 12px;color:var(--main-text);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escapeHtml(u.assetname) + '">' + escapeHtml(u.assetname) + '</td>' +
              '<td style="padding:7px 12px;text-align:right;font-family:monospace;color:#94a3b8;' + (f1?'':'opacity:0.45;') + '">' + fmtV(u.old_InitialCost) + '</td>' +
              '<td style="padding:7px 12px;text-align:right;font-family:monospace;font-weight:' + (f1?'700':'400') + ';color:' + (f1?'#f59e0b':'#94a3b8') + ';background:' + (f1?hlBg:'transparent') + ';">' + fmtV(u.InitialCost) + '</td>' +
              '<td style="padding:7px 12px;text-align:right;font-family:monospace;color:#94a3b8;' + (f2?'':'opacity:0.45;') + '">' + fmtV(u.old_AccumulatedDepreciation) + '</td>' +
              '<td style="padding:7px 12px;text-align:right;font-family:monospace;font-weight:' + (f2?'700':'400') + ';color:' + (f2?'#f59e0b':'#94a3b8') + ';background:' + (f2?hlBg:'transparent') + ';">' + fmtV(u.AccumulatedDepreciation) + '</td>' +
              '<td style="padding:7px 12px;text-align:right;font-family:monospace;color:#94a3b8;' + (f3?'':'opacity:0.45;') + '">' + fmtV(u.old_RemainingCost) + '</td>' +
              '<td style="padding:7px 12px;text-align:right;font-family:monospace;font-weight:' + (f3?'700':'400') + ';color:' + (f3?'#f59e0b':'#94a3b8') + ';background:' + (f3?hlBg:'transparent') + ';">' + fmtV(u.RemainingCost) + '</td>'
            );
            body.appendChild(tr);
          });
          updateSelectedCount();
        }

        function openPreviewModal(updates, conn, mainDb) {
          _pendingUpdates = updates;
          _pendingConn = conn;
          _previewSearch = '';
          _previewFilterMode = 'changed';
          _selectedCodes = new Set(
            updates
              .filter(u =>
                isChanged(u.old_InitialCost, u.InitialCost) ||
                isChanged(u.old_AccumulatedDepreciation, u.AccumulatedDepreciation) ||
                isChanged(u.old_RemainingCost, u.RemainingCost))
              .map(u => u.assetcode)
          );
          const sub = previewModal.querySelector('#syncPreviewSub');
          if (sub) sub.textContent = 'myassets.ServerName = "' + mainDb + '" · ' + updates.length + ' тохирох мөр';
          // Reset search box if visible
          const si = previewModal.querySelector('#syncPreviewSearch');
          if (si) si.value = '';
          previewModal.style.display = 'flex';
          const hasChanged = updates.some(u =>
            isChanged(u.old_InitialCost, u.InitialCost) ||
            isChanged(u.old_AccumulatedDepreciation, u.AccumulatedDepreciation) ||
            isChanged(u.old_RemainingCost, u.RemainingCost)
          );
          const defaultMode = hasChanged ? 'changed' : 'all';
          previewModal.querySelectorAll('.sync-filter-btn').forEach(b => {
            const isActive = b.dataset.filter === defaultMode;
            b.style.background = isActive ? '#f59e0b' : 'transparent';
            b.style.color      = isActive ? '#000'   : 'var(--main-text2)';
            b.style.fontWeight = isActive ? '600'    : '500';
          });
          renderPreviewTable(defaultMode);
        }

        function closePreviewModal() {
          previewModal.style.display = 'none';
          _pendingUpdates = [];
          _selectedCodes = new Set();
          _previewSearch = '';
        }

        // Preview modal — хуучныг устгасан тул шинээр үүсгэнэ
        let previewModal = document.getElementById('bk-sync-preview-modal');
        if (!previewModal) {
          previewModal = document.createElement('div');
          previewModal.id = 'bk-sync-preview-modal';
          previewModal.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;';
          previewModal.innerHTML = `
            <div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(3px);" id="syncPreviewBackdrop"></div>
            <div style="position:relative;z-index:1;background:var(--main-card,#1e2433);border:1px solid var(--main-border);border-radius:14px;width:min(980px,95vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(0,0,0,0.5);">
              <div style="padding:18px 22px 14px;border-bottom:1px solid var(--main-border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                <div>
                  <div style="font-size:1rem;font-weight:700;color:var(--main-text);display:flex;align-items:center;gap:10px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#f59e0b" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="#f59e0b" stroke-width="1.8"/></svg>
                    Шинэчлэлтийн урьдчилсан харагдац
                  </div>
                  <div id="syncPreviewSub" style="font-size:0.78rem;color:var(--main-text2);margin-top:3px;"></div>
                </div>
                <button id="syncPreviewClose" style="background:rgba(255,255,255,0.07);border:none;color:var(--main-text2);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">✕</button>
              </div>
              <div style="padding:10px 22px;border-bottom:1px solid var(--main-border);display:flex;align-items:center;gap:14px;flex-shrink:0;flex-wrap:wrap;">
                <div id="syncFilterGroup" style="display:flex;align-items:center;gap:4px;background:rgba(0,0,0,0.2);border:1px solid var(--main-border);border-radius:8px;padding:3px;">
                  <button data-filter="all"     class="sync-filter-btn" style="padding:4px 12px;border-radius:6px;border:none;font-size:0.78rem;cursor:pointer;font-weight:500;background:transparent;color:var(--main-text2);transition:all 0.15s;">Бүгд</button>
                  <button data-filter="changed" class="sync-filter-btn" style="padding:4px 12px;border-radius:6px;border:none;font-size:0.78rem;cursor:pointer;font-weight:600;background:#f59e0b;color:#000;transition:all 0.15s;">Ялгаатай</button>
                  <button data-filter="same"    class="sync-filter-btn" style="padding:4px 12px;border-radius:6px;border:none;font-size:0.78rem;cursor:pointer;font-weight:500;background:transparent;color:var(--main-text2);transition:all 0.15s;">Ижил</button>
                </div>
                <div style="position:relative;flex:1;min-width:160px;max-width:260px;">
                  <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--main-text2);pointer-events:none;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  </span>
                  <input type="text" id="syncPreviewSearch" placeholder="Код, нэрээр хайх..." style="width:100%;box-sizing:border-box;padding:5px 10px 5px 28px;border:1px solid var(--main-border);border-radius:7px;background:var(--main-bg);color:var(--main-text);font-size:0.8rem;outline:none;"/>
                </div>
                <button id="syncPreviewExport" title="Excel / CSV татах" style="display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:7px;border:1px solid rgba(16,185,129,0.35);background:rgba(16,185,129,0.1);color:#10b981;font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><polyline points="10 9 9 9 8 9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                  Excel
                </button>
                <div style="display:flex;align-items:center;gap:10px;margin-left:auto;flex-wrap:wrap;">
                  <span id="syncSelectedCount" style="font-size:0.78rem;color:#f59e0b;font-weight:600;"></span>
                  <div id="syncPreviewCount" style="font-size:0.78rem;color:var(--main-text2);"></div>
                </div>
              </div>
              <div style="overflow:auto;flex:1;min-height:0;">
                <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
                  <thead>
                    <tr style="position:sticky;top:0;background:var(--main-card,#1e2433);z-index:1;">
                      <th style="padding:8px 10px;border-bottom:1px solid var(--main-border);width:36px;">
                        <input type="checkbox" id="syncSelectAll" title="Бүгдийг сонгох" style="accent-color:#f59e0b;width:15px;height:15px;cursor:pointer;"/>
                      </th>
                      <th style="padding:8px 12px;text-align:left;color:var(--main-text2);font-weight:600;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--main-border);white-space:nowrap;">Хөрөнгийн код</th>
                      <th style="padding:8px 12px;text-align:left;color:var(--main-text2);font-weight:600;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--main-border);">Хөрөнгийн нэр</th>
                      <th style="padding:8px 12px;text-align:right;color:#94a3b8;font-weight:500;font-size:0.7rem;border-bottom:1px solid var(--main-border);white-space:nowrap;">Анхны өртөг (одоо)</th>
                      <th style="padding:8px 12px;text-align:right;color:#f59e0b;font-weight:700;font-size:0.7rem;border-bottom:1px solid var(--main-border);white-space:nowrap;">Анхны өртөг (шинэ)</th>
                      <th style="padding:8px 12px;text-align:right;color:#94a3b8;font-weight:500;font-size:0.7rem;border-bottom:1px solid var(--main-border);white-space:nowrap;">Нийт элэгдэл (одоо)</th>
                      <th style="padding:8px 12px;text-align:right;color:#f59e0b;font-weight:700;font-size:0.7rem;border-bottom:1px solid var(--main-border);white-space:nowrap;">Нийт элэгдэл (шинэ)</th>
                      <th style="padding:8px 12px;text-align:right;color:#94a3b8;font-weight:500;font-size:0.7rem;border-bottom:1px solid var(--main-border);white-space:nowrap;">Одоогийн өртөг (одоо)</th>
                      <th style="padding:8px 12px;text-align:right;color:#f59e0b;font-weight:700;font-size:0.7rem;border-bottom:1px solid var(--main-border);white-space:nowrap;">Одоогийн өртөг (шинэ)</th>
                    </tr>
                  </thead>
                  <tbody id="syncPreviewBody"></tbody>
                </table>
              </div>
              <div style="padding:14px 22px;border-top:1px solid var(--main-border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;gap:12px;flex-wrap:wrap;">
                <div id="syncPreviewFooterInfo" style="font-size:0.8rem;color:var(--main-text2);"></div>
                <div style="display:flex;gap:10px;">
                  <button id="syncPreviewCancelBtn" style="padding:8px 20px;border-radius:8px;border:1px solid var(--main-border);background:transparent;color:var(--main-text);font-size:0.85rem;cursor:pointer;">Болих</button>
                  <button id="syncPreviewConfirmBtn" style="padding:8px 22px;border-radius:8px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:0.85rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span id="syncConfirmBtnText">Сонгосныг шинэчлэх</span>
                  </button>
                </div>
              </div>
            </div>`;
          document.body.appendChild(previewModal);

          // ── Event listeners — зөвхөн нэг удаа бүртгэнэ ──
          previewModal.querySelector('#syncPreviewClose').addEventListener('click', () => closePreviewModal());
          previewModal.querySelector('#syncPreviewCancelBtn').addEventListener('click', () => closePreviewModal());
          previewModal.querySelector('#syncPreviewBackdrop').addEventListener('click', () => closePreviewModal());

          // Search input
          const searchInp = previewModal.querySelector('#syncPreviewSearch');
          if (searchInp) {
            searchInp.addEventListener('input', () => {
              _previewSearch = searchInp.value;
              renderPreviewTable();
            });
          }

          // Excel export
          const exportBtn2 = previewModal.querySelector('#syncPreviewExport');
          if (exportBtn2) {
            exportBtn2.addEventListener('click', () => {
              const fmtVe = v => (v===null||v===undefined||isNaN(Number(v)))?'':Number(v).toLocaleString('mn-MN');
              const esc2 = v => '"' + String(v==null?'':v).replace(/"/g,'""') + '"';
              const headers = ['Хөрөнгийн код','Хөрөнгийн нэр','Анхны өртөг (одоо)','Анхны өртөг (шинэ)','Нийт элэгдэл (одоо)','Нийт элэгдэл (шинэ)','Одоогийн өртөг (одоо)','Одоогийн өртөг (шинэ)','Ялгаатай эсэх'];
              const rows2 = _pendingUpdates;
              const lines = [headers.map(h=>esc2(h)).join(',')];
              rows2.forEach(u => {
                const changed = (isChanged(u.old_InitialCost,u.InitialCost)||isChanged(u.old_AccumulatedDepreciation,u.AccumulatedDepreciation)||isChanged(u.old_RemainingCost,u.RemainingCost)) ? 'Тийм' : '';
                lines.push([u.assetcode,u.assetname,fmtVe(u.old_InitialCost),fmtVe(u.InitialCost),fmtVe(u.old_AccumulatedDepreciation),fmtVe(u.AccumulatedDepreciation),fmtVe(u.old_RemainingCost),fmtVe(u.RemainingCost),changed].map(v=>esc2(v)).join(','));
              });
              const blob = new Blob(['\uFEFF'+lines.join('\n')],{type:'text/csv;charset=utf-8;'});
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = 'sync_preview_' + new Date().toISOString().slice(0,10) + '.csv';
              a.click();
            });
          }

          previewModal.querySelectorAll('.sync-filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              previewModal.querySelectorAll('.sync-row-cb').forEach(cb => {
                if (cb.checked) _selectedCodes.add(cb.dataset.code);
                else _selectedCodes.delete(cb.dataset.code);
              });
              const mode = this.dataset.filter;
              previewModal.querySelectorAll('.sync-filter-btn').forEach(b => {
                const isActive = b.dataset.filter === mode;
                b.style.background = isActive ? '#f59e0b' : 'transparent';
                b.style.color      = isActive ? '#000'   : 'var(--main-text2)';
                b.style.fontWeight = isActive ? '600'    : '500';
              });
              renderPreviewTable(mode);
            });
          });

          // Select All checkbox
          previewModal.querySelector('#syncSelectAll').addEventListener('change', function() {
            const checked = this.checked;
            previewModal.querySelectorAll('.sync-row-cb').forEach(cb => {
              cb.checked = checked;
              const code = cb.dataset.code;
              if (checked) _selectedCodes.add(code); else _selectedCodes.delete(code);
            });
            updateSelectedCount();
          });

          // Confirm & Update
          previewModal.querySelector('#syncPreviewConfirmBtn').addEventListener('click', async () => {
            const toUpdate = _pendingUpdates.filter(u => _selectedCodes.has(u.assetcode));
            if (!toUpdate.length) {
              alert('Шинэчлэх мөр сонгоогүй байна. Checkbox-оор мөр сонгоно уу.');
              return;
            }
            const confirmBtn = previewModal.querySelector('#syncPreviewConfirmBtn');
            const confirmTxt = previewModal.querySelector('#syncConfirmBtnText');
            confirmBtn.disabled = true;
            if (confirmTxt) confirmTxt.textContent = 'Шинэчилж байна...';
            const { asServer, asDatabase, asUser, asPass, mainDb } = _pendingConn;
            const payload = toUpdate.map(u => ({
              assetcode:               u.assetcode,
              InitialCost:             u.InitialCost             === null ? null : Math.round(Number(u.InitialCost)),
              AccumulatedDepreciation: u.AccumulatedDepreciation === null ? null : Math.round(Number(u.AccumulatedDepreciation)),
              RemainingCost:           u.RemainingCost           === null ? null : Math.round(Number(u.RemainingCost)),
            }));
            try {
              const res = await fetch(API_BASE + '/myassets-update', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ server: asServer, database: asDatabase, dbUser: asUser, dbPassword: asPass, mainDatabase: mainDb, updates: payload })
              });
              const json = await res.json();
              // ── Цонхыг хаана ──
              closePreviewModal();
              if (json.success) {
                syncShowBar('✓ ' + json.updated + ' мөр амжилттай шинэчлэгдлээ' + (json.skipped ? ' &nbsp;·&nbsp; ' + json.skipped + ' мөр тохирохгүй' : '') + '. Дата дахин татаж байна...', '#059669', 'rgba(16,185,129,0.08)');
                // ── Update хийсний дараа myassets дата автоматаар дахин татна ──
                // _pendingConn-г хадгалж авна (closePreviewModal хийсний дараа ч ашиглах)
                const refreshConn = { asServer, asDatabase, asUser, asPass };
                setTimeout(async () => {
                  const tdFetchBtnEl = document.getElementById('tdFetchBtn');
                  if (tdFetchBtnEl) {
                    tdFetchBtnEl.click();
                  } else {
                    // Fallback: шууд fetch хийнэ
                    try {
                      const rfRes = await fetch(API_BASE + '/myassets', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ server: refreshConn.asServer, database: refreshConn.asDatabase, username: refreshConn.asUser, password: refreshConn.asPass, dbUser: refreshConn.asUser, dbPassword: refreshConn.asPass })
                      });
                      const rfJson = await rfRes.json();
                      if (rfJson.success && rfJson.rows) {
                        // window._myassetsRows шинэчилнэ — дараагийн sync-д шинэ дата ашиглана
                        window._myassetsRows = rfJson.rows;
                        renderMyAssetsTable(rfJson.rows, refreshConn.asDatabase);
                        syncShowBar('✓ Дата амжилттай шинэчлэгдлээ (' + rfJson.rows.length + ' мөр).', '#059669', 'rgba(16,185,129,0.08)');
                      }
                    } catch(e) {}
                  }
                }, 600);
              } else {
                syncShowBar('✕ ' + escapeHtml(json.message || 'Алдаа гарлаа'), '#dc2626', 'rgba(239,68,68,0.08)');
              }
            } catch(err) {
              closePreviewModal();
              syncShowBar('✕ Серверт холбогдож чадсангүй: ' + escapeHtml(err.message), '#dc2626', 'rgba(239,68,68,0.08)');
            } finally {
              confirmBtn.disabled = false;
              if (confirmTxt) confirmTxt.textContent = 'Сонгосныг шинэчлэх';
            }
          });
        }

        const maRefreshBtn = document.getElementById('maRefreshBtn');
        if (maRefreshBtn) {
          maRefreshBtn.addEventListener('click', async () => {
            const conn = getConnInfo();
            if (!conn.asServer || !conn.asDatabase) {
              syncShowBar('⚠ Холболтын мэдээлэл байхгүй. <strong>Connect asset data</strong> дээр нэвтэрнэ үү.', '#92400e', 'rgba(251,191,36,0.1)');
              return;
            }
            const icon = document.getElementById('maRefreshIcon');
            maRefreshBtn.disabled = true;
            if (icon) { if (!document.getElementById('ma-spin-style')) { const s=document.createElement('style');s.id='ma-spin-style';s.textContent='@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';document.head.appendChild(s);} icon.style.animation='spin 0.8s linear infinite'; }
            try {
              const res = await fetch(API_BASE + '/myassets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({server:conn.asServer,database:conn.asDatabase,username:conn.asUser,password:conn.asPass,dbUser:conn.asUser,dbPassword:conn.asPass}) });
              const json = await res.json();
              if (json.success && json.rows) {
                window._myassetsRows = json.rows;
                renderMyAssetsTable(json.rows, conn.asDatabase);
                syncShowBar('✓ Myassets дата шинэчлэгдлээ (' + json.rows.length + ' мөр).', '#059669', 'rgba(16,185,129,0.08)');
              } else { syncShowBar('✕ ' + (json.message || 'Алдаа гарлаа'), '#dc2626', 'rgba(239,68,68,0.08)'); }
            } catch(e) { syncShowBar('✕ Серверт холбогдож чадсангүй: ' + escapeHtml(e.message), '#dc2626', 'rgba(239,68,68,0.08)'); }
            finally { maRefreshBtn.disabled=false; if(icon) icon.style.animation=''; }
          });
        }

        if (syncBtn) syncBtn.addEventListener('click', () => {
          const calcRows = window._calculatedRows || window._lastRenderedRows || null;
          if (!calcRows || !calcRows.length) {
            syncShowBar('⚠ Эхлээд <strong>Тохиргоо</strong> хэсгээс өгөгдлөө татна уу (Calculate data).', '#92400e', 'rgba(251,191,36,0.1)');
            return;
          }
          const conn = getConnInfo();
          if (!conn.asServer || !conn.asDatabase) {
            syncShowBar('⚠ Техникийн дата холболтын сервер/датабааз тохируулаагүй. <strong>Connect asset data</strong> дээр нэвтэрнэ үү.', '#92400e', 'rgba(251,191,36,0.1)');
            return;
          }
          if (!conn.asUser || !conn.asPass) {
            syncShowBar('⚠ Техникийн дата нэвтрэх мэдээлэл байхгүй. <strong>Connect asset data</strong> дээр нэвтэрнэ үү.', '#92400e', 'rgba(251,191,36,0.1)');
            return;
          }
          if (!conn.mainDb) {
            syncShowBar('⚠ Тохиргооны мэдээллийн бааз олдсонгүй. Тохиргоо хэсгээс холбогдоно уу.', '#92400e', 'rgba(251,191,36,0.1)');
            return;
          }
          // window._myassetsRows нь хамгийн сүүлийн fetch-н дата (update хийсний дараа шинэчлэгдсэн)
          const maRows = window._myassetsRows || rows;
          // buildUpdates-д шинэ дата дамжуулна — old_* утгуудыг шинэ дататай харьцуулна
          const updates = buildUpdates(calcRows, maRows, conn.mainDb);
          if (!updates.length) {
            syncShowBar('⚠ Тохирох мөр олдсонгүй. myassets.ServerName = "<strong>' + escapeHtml(conn.mainDb) + '</strong>" болон Хөрөнгийн жагсаалтын кодтой тохирох мөр байхгүй.', '#92400e', 'rgba(251,191,36,0.1)');
            return;
          }
          openPreviewModal(updates, conn, conn.mainDb);
        });
      },0);
    }
  })(); // end tech data IIFE

  // ═══════════════════════════════════════════════════════════════
  //  ХЯНАЛТ — Данс сонгон Myassets + Blance/Blancecheck шалгалт
  // ═══════════════════════════════════════════════════════════════
  (function() {
    const khyanalBtn = document.getElementById('khyanalBtn');
    if (!khyanalBtn) return;

    let kModal = null;

    /* ── Modal бүтэц ── */
    function ensureModal() {
      if (document.getElementById('khyanalModal')) {
        kModal = document.getElementById('khyanalModal');
        return;
      }
      kModal = document.createElement('div');
      kModal.id = 'khyanalModal';
      kModal.style.cssText = 'display:none;position:fixed;inset:0;z-index:9900;';
      kModal.innerHTML = `
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);" id="kmBackdrop"></div>
        <div id="kmPanel" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1;background:var(--main-card,#1e2433);border:1px solid var(--main-border);border-radius:14px;width:880px;max-width:96vw;height:580px;max-height:92vh;min-width:380px;min-height:260px;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(0,0,0,0.55);overflow:hidden;">
          <!-- Header (drag handle) -->
          <div id="kmHeader" style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:13px 18px 11px;border-radius:14px 14px 0 0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;cursor:grab;user-select:none;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:32px;height:32px;background:rgba(255,255,255,0.18);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11l3 3L22 4" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <div style="font-size:0.9rem;font-weight:700;color:#fff;">Хяналт</div>
                <div style="font-size:0.66rem;color:rgba(255,255,255,0.55);">Хөрөнгийн кодын зөрүү шалгах</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <button id="kmMinimize" title="Жижигрүүлэх" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;line-height:1;">─</button>
              <button id="kmMaximize" title="Дэлгэцийн хэмжээ" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;line-height:1;">⛶</button>
              <button id="kmClose" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>
            </div>
          </div>
          <!-- Tabs -->
          <div style="display:flex;border-bottom:1px solid var(--main-border);flex-shrink:0;background:var(--main-bg2);">
            <button class="km-tab-btn" data-tab="check1"
              style="padding:9px 18px;border:none;background:transparent;color:var(--main-text);font-size:0.82rem;font-weight:600;cursor:pointer;border-bottom:2px solid #6366f1;margin-bottom:-1px;">
              📋 Хөрөнгийн кодын шалгалт
            </button>
            <button class="km-tab-btn" data-tab="check2"
              style="padding:9px 18px;border:none;background:transparent;color:var(--main-text2);font-size:0.82rem;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;">
              ⚖️ Данс шалгалт
            </button>
          </div>
          <!-- Body -->
          <div id="kmBody" style="flex:1;overflow:auto;min-height:0;display:flex;flex-direction:column;gap:0;">
            <div id="kmBody1" style="padding:16px 20px;display:flex;flex-direction:column;gap:12px;"></div>
            <div id="kmBody2" style="padding:16px 20px;display:none;flex-direction:column;gap:12px;"></div>
          </div>
          <!-- Resize handle -->
          <div id="kmResize" style="position:absolute;bottom:0;right:0;width:18px;height:18px;cursor:se-resize;opacity:0.4;display:flex;align-items:flex-end;justify-content:flex-end;padding:2px;">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M11 1L1 11M11 6L6 11M11 11" stroke="var(--main-text2)" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
        </div>`;
      document.body.appendChild(kModal);

      /* ── Drag ── */
      const kmPanel = kModal.querySelector('#kmPanel');
      const kmHeader = kModal.querySelector('#kmHeader');
      const kmResize = kModal.querySelector('#kmResize');

      function panelToFixed() {
        const r = kmPanel.getBoundingClientRect();
        kmPanel.style.transform = 'none';
        kmPanel.style.left = r.left + 'px';
        kmPanel.style.top  = r.top  + 'px';
      }

      let _drag = null;
      kmHeader.addEventListener('mousedown', function(e) {
        if (e.target.closest('button')) return;
        panelToFixed();
        const r = kmPanel.getBoundingClientRect();
        _drag = { ox: e.clientX - r.left, oy: e.clientY - r.top };
        kmHeader.style.cursor = 'grabbing';
        e.preventDefault();
      });
      document.addEventListener('mousemove', function(e) {
        if (!_drag) return;
        const nx = Math.max(0, Math.min(e.clientX - _drag.ox, window.innerWidth  - 80));
        const ny = Math.max(0, Math.min(e.clientY - _drag.oy, window.innerHeight - 60));
        kmPanel.style.left = nx + 'px';
        kmPanel.style.top  = ny + 'px';
      });
      document.addEventListener('mouseup', function() {
        if (_drag) { _drag = null; kmHeader.style.cursor = 'grab'; }
      });

      /* ── Resize ── */
      let _res = null;
      kmResize.addEventListener('mousedown', function(e) {
        panelToFixed();
        const r = kmPanel.getBoundingClientRect();
        _res = { startX: e.clientX, startY: e.clientY, startW: r.width, startH: r.height };
        e.preventDefault(); e.stopPropagation();
      });
      document.addEventListener('mousemove', function(e) {
        if (!_res) return;
        const nw = Math.max(380, _res.startW + (e.clientX - _res.startX));
        const nh = Math.max(260, _res.startH + (e.clientY - _res.startY));
        kmPanel.style.width  = nw + 'px';
        kmPanel.style.height = nh + 'px';
      });
      document.addEventListener('mouseup', function() { _res = null; });

      /* ── Minimize / Maximize ── */
      const kmBodyWrap = kModal.querySelector('#kmBody');
      const kmTabs  = kModal.querySelector('[data-tab]') && kModal.querySelector('[data-tab]').parentElement;
      kModal.querySelector('#kmMinimize').addEventListener('click', function() {
        const isMin = kmPanel.dataset.minimized === '1';
        if (isMin) {
          kmPanel.style.height = (kmPanel.dataset.prevH || '580px');
          kmBodyWrap.style.display = '';
          if (kmTabs) kmTabs.style.display = '';
          kmPanel.dataset.minimized = '0';
          this.textContent = '─';
        } else {
          kmPanel.dataset.prevH = kmPanel.style.height || '580px';
          kmPanel.style.height = '52px';
          kmBodyWrap.style.display = 'none';
          if (kmTabs) kmTabs.style.display = 'none';
          kmPanel.dataset.minimized = '1';
          this.textContent = '□';
        }
      });
      kModal.querySelector('#kmMaximize').addEventListener('click', function() {
        const isMax = kmPanel.dataset.maximized === '1';
        if (isMax) {
          kmPanel.style.left = kmPanel.dataset.prevL || '50%';
          kmPanel.style.top  = kmPanel.dataset.prevT || '50%';
          kmPanel.style.width  = kmPanel.dataset.prevW || '880px';
          kmPanel.style.height = kmPanel.dataset.prevH2 || '580px';
          kmPanel.style.transform = kmPanel.dataset.prevTr || 'none';
          kmPanel.style.borderRadius = '14px';
          kmPanel.dataset.maximized = '0';
        } else {
          panelToFixed();
          const r = kmPanel.getBoundingClientRect();
          kmPanel.dataset.prevL  = kmPanel.style.left;
          kmPanel.dataset.prevT  = kmPanel.style.top;
          kmPanel.dataset.prevW  = kmPanel.style.width  || r.width  + 'px';
          kmPanel.dataset.prevH2 = kmPanel.style.height || r.height + 'px';
          kmPanel.dataset.prevTr = kmPanel.style.transform;
          kmPanel.style.left = '0'; kmPanel.style.top = '0';
          kmPanel.style.width = '100vw'; kmPanel.style.height = '100vh';
          kmPanel.style.borderRadius = '0';
          kmPanel.dataset.maximized = '1';
        }
      });

      kModal.querySelector('#kmBackdrop').addEventListener('click', closeKModal);
      kModal.querySelector('#kmClose').addEventListener('click', closeKModal);
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && kModal && kModal.style.display === 'flex') closeKModal();
      });
      kModal.querySelectorAll('.km-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          kModal.querySelectorAll('.km-tab-btn').forEach(b => {
            const a = b === this;
            b.style.color      = a ? 'var(--main-text)' : 'var(--main-text2)';
            b.style.fontWeight = a ? '600' : '500';
            b.style.borderBottom = a ? '2px solid #6366f1' : '2px solid transparent';
          });
          renderTab(this.dataset.tab);
        });
      });
    }

    function closeKModal() { if (kModal) kModal.style.display = 'none'; }

    /* ═══════════════════════════════════════════════════════
       TAB 1 — Данс сонгон, тэр дансны хөрөнгүүдийг
                Myassets-тэй харьцуулах
       ═══════════════════════════════════════════════════════ */
    function renderTab1(container) {
      const calcRows = window._originalCalculatedRows || window._calculatedRows || [];
      const maRows   = window._myassetsRows || [];

      /* Дансуудын жагсаалт */
      const accounts = Array.from(new Set(
        calcRows.map(r => String(r.AccountDescription || '')).filter(Boolean)
      )).sort();

      container.innerHTML = `
        <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;">
          <div style="flex:1;min-width:220px;position:relative;">
            <label style="display:block;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--main-text2);margin-bottom:6px;">
              Данс сонгох
            </label>
            <div id="km1DropWrap" style="position:relative;">
              <button id="km1DropBtn" type="button" style="width:100%;padding:8px 32px 8px 12px;border:1px solid var(--main-border);border-radius:8px;background:var(--main-bg);color:var(--main-text);font-size:0.84rem;outline:none;cursor:pointer;text-align:left;position:relative;">
                <span id="km1DropLabel">-- Бүгд сонгох --</span>
                <svg style="position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </button>
              <div id="km1DropPanel" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:200;background:var(--main-card,#1e2433);border:1px solid var(--main-border);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.35);max-height:220px;display:flex;flex-direction:column;">
                <div style="padding:6px 8px;border-bottom:1px solid var(--main-border);display:flex;gap:6px;">
                  <input id="km1DropSearch" type="text" placeholder="Хайх..." style="flex:1;background:var(--main-bg);border:1px solid var(--main-border);border-radius:4px;color:var(--main-text);font-size:0.82rem;padding:4px 7px;outline:none;"/>
                  <button type="button" id="km1DropClearAll" style="font-size:0.75rem;color:#ef4444;background:none;border:none;cursor:pointer;padding:2px 4px;white-space:nowrap;">Цэвэрлэх</button>
                </div>
                <div id="km1DropList" style="overflow-y:auto;flex:1;padding:4px 0;"></div>
              </div>
            </div>
            <div id="km1AccInfo" style="font-size:0.7rem;color:var(--main-text2);margin-top:3px;"></div>
          </div>
          <button id="km1CheckBtn" style="padding:8px 14px;border-radius:8px;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:0.85rem;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px;height:38px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#fff" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
            Шалгах
          </button>
        </div>
        <div id="km1Result" style="display:flex;flex-direction:column;gap:10px;"></div>`;

      if (!calcRows.length || !maRows.length) {
        const warns = [];
        if (!calcRows.length) warns.push('⚠ Хөрөнгийн жагсаалт татагдаагүй. Тохиргоо → Calculate data хийнэ үү.');
        if (!maRows.length)   warns.push('⚠ Myassets дата байхгүй. Техникийн нэгдсэн дата хэсгээс татна уу.');
        const res = container.querySelector('#km1Result');
        if (res) res.innerHTML = warns.map(w =>
          `<div style="padding:10px 14px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;color:#f59e0b;font-size:0.82rem;">${escapeHtml(w)}</div>`
        ).join('');
      }

      const resultEl   = container.querySelector('#km1Result');
      const checkBtn   = container.querySelector('#km1CheckBtn');
      const accInfo    = container.querySelector('#km1AccInfo');
      const dropBtn    = container.querySelector('#km1DropBtn');
      const dropPanel  = container.querySelector('#km1DropPanel');
      const dropList   = container.querySelector('#km1DropList');
      const dropSearch = container.querySelector('#km1DropSearch');
      const dropClear  = container.querySelector('#km1DropClearAll');
      const dropLabel  = container.querySelector('#km1DropLabel');

      /* ── Tab switch хийхэд сонголт хадгалах ── */
      if (!window._kmTab1SelectedAccs) window._kmTab1SelectedAccs = new Set();
      let selectedAccs = window._kmTab1SelectedAccs;

      function renderDropList(filter) {
        dropList.innerHTML = '';
        accounts
          .filter(a => !filter || a.toLowerCase().includes(filter.toLowerCase()))
          .forEach(a => {
            const row = document.createElement('label');
            row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 12px;cursor:pointer;font-size:0.85rem;color:var(--main-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
            row.onmouseenter = function(){ this.style.background='var(--main-hover,rgba(255,255,255,0.06))'; };
            row.onmouseleave = function(){ this.style.background=''; };
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = a;
            cb.checked = selectedAccs.has(a);
            cb.style.cssText = 'accent-color:#6366f1;cursor:pointer;width:14px;height:14px;flex-shrink:0;';
            cb.addEventListener('change', function() {
              if (this.checked) selectedAccs.add(a); else selectedAccs.delete(a);
              updateDropLabel();
            });
            const sp = document.createElement('span');
            sp.textContent = a;
            sp.style.cssText = 'overflow:hidden;text-overflow:ellipsis;';
            row.appendChild(cb); row.appendChild(sp);
            dropList.appendChild(row);
          });
      }

      function updateDropLabel() {
        if (selectedAccs.size === 0) {
          dropLabel.textContent = '-- Данс сонгох --';
        } else {
          dropLabel.textContent = selectedAccs.size + ' данс сонгогдсон';
        }
        if (accInfo) accInfo.textContent = '';  // button label хангалттай, давхардуулахгүй
      }

      if (dropBtn) dropBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const open = dropPanel.style.display === 'block';
        if (open) { dropPanel.style.display = 'none'; return; }
        // Position relative to button using fixed coords
        const rect = dropBtn.getBoundingClientRect();
        dropPanel.style.position = 'fixed';
        dropPanel.style.top  = (rect.bottom + 4) + 'px';
        dropPanel.style.left = rect.left + 'px';
        dropPanel.style.width = Math.max(rect.width, 320) + 'px';
        dropPanel.style.right = 'auto';
        dropPanel.style.display = 'flex';
        dropSearch.value = ''; renderDropList(''); dropSearch.focus();
      });

      if (dropSearch) dropSearch.addEventListener('input', function() { renderDropList(this.value); });

      if (dropClear) dropClear.addEventListener('click', function(e) {
        e.stopPropagation();
        selectedAccs.clear();
        updateDropLabel();
        renderDropList(dropSearch ? dropSearch.value : '');
      });

      document.addEventListener('click', function kmDropClose(e) {
        const wrap = container.querySelector('#km1DropWrap');
        if (wrap && !wrap.contains(e.target)) {
          if (dropPanel) dropPanel.style.display = 'none';
        }
      });

      renderDropList('');
      updateDropLabel(); // Өмнөх сонголтын label сэргээнэ
      // Move dropdown panel to body to avoid clipping by modal overflow
      dropPanel.style.zIndex = '99999';
      document.body.appendChild(dropPanel);

      if (checkBtn) {
        checkBtn.addEventListener('click', function() {
          window._kmTab1WasChecked = true;
          if (dropPanel) dropPanel.style.display = 'none';
          if (selectedAccs.size === 0) {
            resultEl.innerHTML = `<div style="padding:10px 14px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;color:#f59e0b;font-size:0.82rem;">⚠ Дор хаяж нэг данс сонгоно уу!</div>`;
            return;
          }

          /* Сонгосон дансны хөрөнгүүд */
          const accRows = calcRows.filter(r => selectedAccs.has(String(r.AccountDescription || '')));

          /* Тоо ширхэг > 0 буюу үлдэгдэлтэй хөрөнгийг шалгана */
          const qtyRows    = accRows.filter(r => Number(r['Тоо хэмжээ'] || 0) > 0);
          const qtyZeroRows = accRows.filter(r => Number(r['Тоо хэмжээ'] || 0) === 0);

          const maCodes = new Set(maRows.map(r => String(r.assetcode || '').trim()).filter(Boolean));

          /* ── Blancecheck map: assetcode → bc утга ── */
          const bcMap1 = new Map();
          maRows.forEach(r => {
            const code = String(r.assetcode || '').trim();
            if (!code) return;
            const bcKey = Object.keys(r).find(k => k.toLowerCase().replace(/[_\s-]/g,'') === 'blancecheck') || 'BlanceCheck';
            bcMap1.set(code, r[bcKey]);
          });
          function isBcTrue1(v) {
            if (v === true || v === 1) return true;
            if (typeof v === 'string') { const s = v.trim().toLowerCase(); return s === 'true' || s === '1' || s === 'yes'; }
            return false;
          }
          function isBcFalse1(v) {
            if (v === false || v === 0) return true;
            if (v === null || v === undefined) return true;
            if (typeof v === 'string') { const s = v.trim().toLowerCase(); return s === 'false' || s === '0' || s === 'no' || s === ''; }
            return false;
          }
          function getBcLabel1(r) {
            const bc = bcMap1.get(String(r['Хөрөнгийн код'] || '').trim());
            if (isBcTrue1(bc)) return 'true';
            if (isBcFalse1(bc)) return 'false';
            return 'unknown';
          }

          const found    = qtyRows.filter(r => maCodes.has(String(r['Хөрөнгийн код'] || '').trim()));
          const notFound = qtyRows.filter(r => !maCodes.has(String(r['Хөрөнгийн код'] || '').trim()));

          /* found болон qtyZeroRows-г blancecheck-р хуваана */
          const found_bcTrue  = found.filter(r => isBcTrue1(bcMap1.get(String(r['Хөрөнгийн код']||'').trim())));
          const found_bcFalse = found.filter(r => isBcFalse1(bcMap1.get(String(r['Хөрөнгийн код']||'').trim())));
          const zero_bcTrue   = qtyZeroRows.filter(r => isBcTrue1(bcMap1.get(String(r['Хөрөнгийн код']||'').trim())));
          const zero_bcFalse  = qtyZeroRows.filter(r => isBcFalse1(bcMap1.get(String(r['Хөрөнгийн код']||'').trim())));

          const selAccArr = Array.from(selectedAccs);
          const selAccNames = selAccArr.join(', ');

          let html = `
            <div style="font-size:0.74rem;color:var(--main-text2);padding:4px 0 4px;">
              Сонгосон <strong style="color:var(--main-text);">${selAccArr.length}</strong> данс:
              <div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:4px;">
                ${selAccArr.map(a => `<span style="display:inline-block;padding:2px 8px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:12px;font-size:0.72rem;color:#818cf8;">${escapeHtml(a)}</span>`).join('')}
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <div style="flex:1;min-width:110px;padding:12px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.3);border-radius:9px;text-align:center;">
                <div style="font-size:1.6rem;font-weight:800;color:#6366f1;">${accRows.length}</div>
                <div style="font-size:0.7rem;color:#6366f1;margin-top:2px;">Нийт хөрөнгө</div>
              </div>
              <div style="flex:1;min-width:110px;padding:12px;background:rgba(100,116,139,0.08);border:1px solid rgba(100,116,139,0.3);border-radius:9px;text-align:center;">
                <div style="font-size:1.6rem;font-weight:800;color:#94a3b8;">${qtyRows.length}</div>
                <div style="font-size:0.7rem;color:#94a3b8;margin-top:2px;">Үлдэгдэлтэй (шалгах)</div>
              </div>
              <div style="flex:1;min-width:110px;padding:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:9px;text-align:center;">
                <div style="font-size:1.6rem;font-weight:800;color:#10b981;">${found.length}</div>
                <div style="font-size:0.7rem;color:#10b981;margin-top:2px;">Myassets-д байна</div>
              </div>
              <div style="flex:1;min-width:110px;padding:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:9px;text-align:center;">
                <div style="font-size:1.6rem;font-weight:800;color:#ef4444;">${notFound.length}</div>
                <div style="font-size:0.7rem;color:#ef4444;margin-top:2px;">Myassets-д байхгүй</div>
              </div>
              ${qtyZeroRows.length > 0 ? `
              <div style="flex:1;min-width:110px;padding:12px;background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.22);border-radius:9px;text-align:center;">
                <div style="font-size:1.6rem;font-weight:800;color:#f59e0b;">${qtyZeroRows.length}</div>
                <div style="font-size:0.7rem;color:#f59e0b;margin-top:2px;">Үлдэгдэлгүй (орхисон)</div>
              </div>` : ''}
            </div>`;

          if (notFound.length) {
            html += `
              <div>
                <div style="font-size:0.78rem;font-weight:700;color:#ef4444;margin-bottom:6px;">✕ Myassets-д байхгүй — үлдэгдэлтэй хөрөнгө (${notFound.length})</div>
                <div style="overflow:auto;max-height:200px;border:1px solid var(--main-border);border-radius:8px;">
                  <table style="width:100%;border-collapse:collapse;font-size:0.79rem;">
                    <thead><tr style="position:sticky;top:0;background:var(--main-card,#1e2433);border-bottom:1px solid var(--main-border);">
                      <th style="padding:6px 8px;text-align:left;color:var(--main-text2);font-weight:600;">#</th>
                      <th style="padding:6px 12px;text-align:left;color:var(--main-text2);font-weight:600;">Хөрөнгийн код</th>
                      <th style="padding:6px 12px;text-align:left;color:var(--main-text2);font-weight:600;">Хөрөнгийн нэр</th>
                      <th style="padding:6px 12px;text-align:right;color:var(--main-text2);font-weight:600;">Тоо</th>
                      <th style="padding:6px 12px;text-align:left;color:var(--main-text2);font-weight:600;">Данс</th>
                    </tr></thead>
                    <tbody>${notFound.map((r, i) => `
                      <tr style="border-bottom:1px solid var(--main-border);">
                        <td style="padding:5px 8px;color:var(--main-text2);">${i + 1}</td>
                        <td style="padding:5px 12px;font-family:monospace;color:#ef4444;">${escapeHtml(String(r['Хөрөнгийн код'] || ''))}</td>
                        <td style="padding:5px 12px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(String(r['Хөрөнгийн нэр'] || ''))}</td>
                        <td style="padding:5px 12px;text-align:right;font-weight:600;">${Number(r['Тоо хэмжээ'] || 0)}</td>
                        <td style="padding:5px 12px;font-size:0.74rem;color:var(--main-text2);white-space:nowrap;">${escapeHtml(String(r.AccountDescription || ''))}</td>
                      </tr>`).join('')}
                    </tbody>
                  </table>
                </div>
                <button id="km1Export" style="margin-top:8px;padding:6px 14px;border-radius:7px;border:1px solid rgba(239,68,68,0.35);background:rgba(239,68,68,0.08);color:#ef4444;font-size:0.78rem;font-weight:600;cursor:pointer;">⬇ Excel татах</button>
              </div>`;
          }

          if (found.length) {
            const foundRowsHtml = found.map((r, i) => {
              const bcVal = getBcLabel1(r);
              const bcBadge = bcVal === 'true'
                ? `<span style="color:#10b981;font-weight:700;">✓ true</span>`
                : `<span style="color:#ef4444;font-weight:700;">✕ false</span>`;
              return `<tr data-bc="${bcVal}" style="border-bottom:1px solid var(--main-border);">
                <td style="padding:5px 8px;color:var(--main-text2);">${i+1}</td>
                <td style="padding:5px 12px;font-family:monospace;color:#10b981;">${escapeHtml(String(r['Хөрөнгийн код']||''))}</td>
                <td style="padding:5px 12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(String(r['Хөрөнгийн нэр']||''))}">${escapeHtml(String(r['Хөрөнгийн нэр']||''))}</td>
                <td style="padding:5px 12px;text-align:right;font-weight:600;">${Number(r['Тоо хэмжээ']||0)}</td>
                <td style="padding:5px 12px;font-size:0.74rem;color:var(--main-text2);white-space:nowrap;">${escapeHtml(String(r.AccountDescription||''))}</td>
                <td style="padding:5px 12px;text-align:center;font-size:0.76rem;">${bcBadge}</td>
              </tr>`;
            }).join('');
            html += `
              <details open>
                <summary style="cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;font-size:0.78rem;font-weight:700;color:#10b981;padding:8px 12px;background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.25);border-radius:8px;user-select:none;">
                  <span>✓ Myassets-д байгаа — үлдэгдэлтэй (${found.length})
                    &nbsp;<span style="font-weight:400;font-size:0.7rem;">
                      <span style="color:#10b981;">true: ${found_bcTrue.length}</span>
                      <span style="color:#94a3b8;margin:0 3px;">·</span>
                      <span style="color:#ef4444;">false: ${found_bcFalse.length}</span>
                    </span>
                  </span>
                  <span style="font-size:0.72rem;opacity:0.7;">▼ дэлгэх</span>
                </summary>
                <div style="padding:6px 8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;border:1px solid rgba(16,185,129,0.2);border-top:none;background:var(--main-bg);">
                  <button class="km1-found-filter" data-f="all"   style="padding:3px 10px;border-radius:5px;border:1px solid #10b981;background:rgba(16,185,129,0.15);color:#10b981;font-size:0.73rem;font-weight:700;cursor:pointer;">Бүгд (${found.length})</button>
                  <button class="km1-found-filter" data-f="true"  style="padding:3px 10px;border-radius:5px;border:1px solid var(--main-border);background:none;color:#10b981;font-size:0.73rem;cursor:pointer;">✓ true (${found_bcTrue.length})</button>
                  <button class="km1-found-filter" data-f="false" style="padding:3px 10px;border-radius:5px;border:1px solid var(--main-border);background:none;color:#ef4444;font-size:0.73rem;cursor:pointer;">✕ false (${found_bcFalse.length})</button>
                  <button id="km1FoundExport" style="margin-left:auto;padding:3px 10px;border-radius:5px;border:1px solid rgba(16,185,129,0.4);background:rgba(16,185,129,0.1);color:#10b981;font-size:0.72rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    CSV татах
                  </button>
                </div>
                <div style="overflow:auto;max-height:240px;border:1px solid rgba(16,185,129,0.2);border-top:none;border-radius:0 0 8px 8px;">
                  <table id="km1FoundTable" style="width:100%;border-collapse:collapse;font-size:0.79rem;">
                    <thead><tr style="position:sticky;top:0;background:var(--main-card,#1e2433);border-bottom:1px solid var(--main-border);">
                      <th style="padding:6px 8px;color:var(--main-text2);">#</th>
                      <th style="padding:6px 12px;color:var(--main-text2);">Хөрөнгийн код</th>
                      <th style="padding:6px 12px;color:var(--main-text2);">Хөрөнгийн нэр</th>
                      <th style="padding:6px 12px;text-align:right;color:var(--main-text2);">Тоо</th>
                      <th style="padding:6px 12px;color:var(--main-text2);">Данс</th>
                      <th style="padding:6px 12px;text-align:center;color:var(--main-text2);">Blancecheck</th>
                    </tr></thead>
                    <tbody>${foundRowsHtml}</tbody>
                  </table>
                </div>
              </details>`;
          }

          if (qtyZeroRows.length) {
            const zeroRowsHtml = qtyZeroRows.map((r, i) => {
              const bcVal = getBcLabel1(r);
              const bcBadge = bcVal === 'true'
                ? `<span style="color:#10b981;font-weight:700;">✓ true</span>`
                : `<span style="color:#ef4444;font-weight:700;">✕ false</span>`;
              return `<tr data-bc="${bcVal}" style="border-bottom:1px solid var(--main-border);background:rgba(245,158,11,0.03);">
                <td style="padding:5px 8px;color:var(--main-text2);">${i+1}</td>
                <td style="padding:5px 12px;font-family:monospace;color:#f59e0b;">${escapeHtml(String(r['Хөрөнгийн код']||''))}</td>
                <td style="padding:5px 12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(String(r['Хөрөнгийн нэр']||''))}">${escapeHtml(String(r['Хөрөнгийн нэр']||''))}</td>
                <td style="padding:5px 12px;text-align:right;font-weight:700;color:#f59e0b;">0</td>
                <td style="padding:5px 12px;font-size:0.74rem;color:var(--main-text2);white-space:nowrap;">${escapeHtml(String(r.AccountDescription||''))}</td>
                <td style="padding:5px 12px;text-align:center;font-size:0.76rem;">${bcBadge}</td>
              </tr>`;
            }).join('');
            html += `
              <details open>
                <summary style="cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;font-size:0.78rem;font-weight:700;color:#f59e0b;padding:8px 12px;background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.25);border-radius:8px;user-select:none;">
                  <span>⚠ Үлдэгдэлгүй — орхисон хөрөнгө (${qtyZeroRows.length})
                    &nbsp;<span style="font-weight:400;font-size:0.7rem;">
                      <span style="color:#10b981;">true: ${zero_bcTrue.length}</span>
                      <span style="color:#94a3b8;margin:0 3px;">·</span>
                      <span style="color:#ef4444;">false: ${zero_bcFalse.length}</span>
                    </span>
                  </span>
                  <span style="font-size:0.72rem;opacity:0.7;">▼ дэлгэх</span>
                </summary>
                <div style="padding:6px 8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;border:1px solid rgba(245,158,11,0.2);border-top:none;background:var(--main-bg);">
                  <button class="km1-zero-filter" data-f="all"   style="padding:3px 10px;border-radius:5px;border:1px solid #f59e0b;background:rgba(245,158,11,0.15);color:#f59e0b;font-size:0.73rem;font-weight:700;cursor:pointer;">Бүгд (${qtyZeroRows.length})</button>
                  <button class="km1-zero-filter" data-f="true"  style="padding:3px 10px;border-radius:5px;border:1px solid var(--main-border);background:none;color:#10b981;font-size:0.73rem;cursor:pointer;">✓ true (${zero_bcTrue.length})</button>
                  <button class="km1-zero-filter" data-f="false" style="padding:3px 10px;border-radius:5px;border:1px solid var(--main-border);background:none;color:#ef4444;font-size:0.73rem;cursor:pointer;">✕ false (${zero_bcFalse.length})</button>
                  <button id="km1ZeroExport" style="margin-left:auto;padding:3px 10px;border-radius:5px;border:1px solid rgba(245,158,11,0.4);background:rgba(245,158,11,0.1);color:#f59e0b;font-size:0.72rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    CSV татах
                  </button>
                </div>
                <div style="overflow:auto;max-height:240px;border:1px solid rgba(245,158,11,0.2);border-top:none;border-radius:0 0 8px 8px;">
                  <table id="km1ZeroTable" style="width:100%;border-collapse:collapse;font-size:0.79rem;">
                    <thead><tr style="position:sticky;top:0;background:var(--main-card,#1e2433);border-bottom:2px solid rgba(245,158,11,0.3);">
                      <th style="padding:6px 8px;text-align:left;color:var(--main-text2);font-weight:600;">#</th>
                      <th style="padding:6px 12px;text-align:left;color:var(--main-text2);font-weight:600;">Хөрөнгийн код</th>
                      <th style="padding:6px 12px;text-align:left;color:var(--main-text2);font-weight:600;">Хөрөнгийн нэр</th>
                      <th style="padding:6px 12px;text-align:right;color:var(--main-text2);font-weight:600;">Тоо</th>
                      <th style="padding:6px 12px;text-align:left;color:var(--main-text2);font-weight:600;">Данс</th>
                      <th style="padding:6px 12px;text-align:center;color:var(--main-text2);font-weight:600;">Blancecheck</th>
                    </tr></thead>
                    <tbody>${zeroRowsHtml}</tbody>
                  </table>
                </div>
              </details>`;
          }

          resultEl.innerHTML = html;

          /* ── Export helper (bc багана нэмсэн) ── */
          function exportCsv(rows, filename, rowFn) {
            const hdrs = ['Хөрөнгийн код', 'Хөрөнгийн нэр', 'Тоо хэмжээ', 'Данс'];
            const esc2 = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
            const lines = [hdrs.map(h => esc2(h)).join(','), ...rows.map(rowFn)];
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
            a.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.csv';
            a.click();
          }
          function exportCsvWithBc(rows, filename) {
            const hdrs = ['Хөрөнгийн код', 'Хөрөнгийн нэр', 'Тоо хэмжээ', 'Данс', 'Blancecheck'];
            const esc2 = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
            const lines = [hdrs.map(h => esc2(h)).join(','), ...rows.map(r => {
              const bc = getBcLabel1(r);
              return [r['Хөрөнгийн код'], r['Хөрөнгийн нэр'], r['Тоо хэмжээ'], r.AccountDescription, bc].map(v => esc2(v)).join(',');
            })];
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
            a.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.csv';
            a.click();
          }
          const rowFn = r => {
            const esc2 = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
            return [r['Хөрөнгийн код'], r['Хөрөнгийн нэр'], r['Тоо хэмжээ'], r.AccountDescription].map(v => esc2(v)).join(',');
          };
          const expBtn = resultEl.querySelector('#km1Export');
          if (expBtn) expBtn.addEventListener('click', () => exportCsv(notFound, 'myassets_байхгүй', rowFn));

          /* ── found filter buttons ── */
          let _foundFilter = 'all';
          resultEl.querySelectorAll('.km1-found-filter').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault(); e.stopPropagation();
              _foundFilter = this.dataset.f;
              resultEl.querySelectorAll('.km1-found-filter').forEach(b => {
                const a2 = b === this;
                const col = b.dataset.f === 'false' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)';
                const bc2 = b.dataset.f === 'false' ? '#ef4444' : b.dataset.f === 'true' ? '#10b981' : '#10b981';
                b.style.background  = a2 ? col : 'none';
                b.style.borderColor = a2 ? bc2 : 'var(--main-border)';
                b.style.fontWeight  = a2 ? '700' : '400';
              });
              const tbl = resultEl.querySelector('#km1FoundTable');
              if (!tbl) return;
              tbl.querySelectorAll('tbody tr').forEach(tr => {
                tr.style.display = (_foundFilter === 'all' || tr.dataset.bc === _foundFilter) ? '' : 'none';
              });
            });
          });
          const foundExpBtn = resultEl.querySelector('#km1FoundExport');
          if (foundExpBtn) foundExpBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const rows = _foundFilter === 'true' ? found_bcTrue : _foundFilter === 'false' ? found_bcFalse : found;
            const lbl  = _foundFilter === 'all' ? 'myassets_байгаа_бүгд' : `myassets_байгаа_bc_${_foundFilter}`;
            exportCsvWithBc(rows, lbl);
          });

          /* ── zero filter buttons ── */
          let _zeroFilter = 'all';
          resultEl.querySelectorAll('.km1-zero-filter').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault(); e.stopPropagation();
              _zeroFilter = this.dataset.f;
              resultEl.querySelectorAll('.km1-zero-filter').forEach(b => {
                const a2 = b === this;
                const col = b.dataset.f === 'false' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)';
                const bc2 = b.dataset.f === 'false' ? '#ef4444' : b.dataset.f === 'true' ? '#10b981' : '#f59e0b';
                b.style.background  = a2 ? col : 'none';
                b.style.borderColor = a2 ? bc2 : 'var(--main-border)';
                b.style.fontWeight  = a2 ? '700' : '400';
              });
              const tbl = resultEl.querySelector('#km1ZeroTable');
              if (!tbl) return;
              tbl.querySelectorAll('tbody tr').forEach(tr => {
                tr.style.display = (_zeroFilter === 'all' || tr.dataset.bc === _zeroFilter) ? '' : 'none';
              });
            });
          });
          const zeroExpBtn = resultEl.querySelector('#km1ZeroExport');
          if (zeroExpBtn) zeroExpBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const rows = _zeroFilter === 'true' ? zero_bcTrue : _zeroFilter === 'false' ? zero_bcFalse : qtyZeroRows;
            const lbl  = _zeroFilter === 'all' ? 'үлдэгдэлгүй_бүгд' : `үлдэгдэлгүй_bc_${_zeroFilter}`;
            exportCsvWithBc(rows, lbl);
          });
        });
      }

      /* ── Өмнөх сонголт байвал автоматаар харуулна ── */
      if (window._kmTab1WasChecked && selectedAccs.size > 0 && checkBtn) {
        checkBtn.click();
      }
    }

    /* ═══════════════════════════════════════════════════════
       TAB 2 — ServerName=Тохиргоо(МЭДЭЭЛЛИЙН БААЗ) мөрүүдийг авч
                Blancecheck true/false-р шүүж → жагсаалтад байгаа
                хэд нь тоо ширхэг ≥1, хэд нь 0 болсон харах
       ═══════════════════════════════════════════════════════ */
    function renderTab2(container) {
      const maRows   = window._myassetsRows || [];
      const calcRows = window._originalCalculatedRows || window._calculatedRows || [];

      /* Тохиргооноос mainDb авна */
      const dbSel  = document.getElementById('dbSelect');
      const dbInp  = document.getElementById('dbInput');
      const mainDb = (dbSel && dbSel.style.display !== 'none') ? dbSel.value.trim() : (dbInp ? dbInp.value.trim() : '');

      /* ServerName=mainDb мөрүүдийг шүүнэ */
      const mainDbLower = mainDb.toLowerCase();
      const serverRows = mainDb
        ? maRows.filter(r => String(r.ServerName || '').trim().toLowerCase() === mainDbLower)
        : maRows.slice();

      /* Blancecheck field нэрийг автоматаар тодорхойлно
         SQL Server nvarchar: 'TRUE'/'FALSE' string утгыг дэмжинэ */
      const bcFieldKey = (function() {
        const allRows = serverRows.length > 0 ? serverRows : maRows;
        if (allRows.length > 0) {
          const sample = allRows[0];
          const keys = Object.keys(sample);
          console.log('[bcFieldKey] бодит баганууд:', keys);
          console.log('[bcFieldKey] анхны мөр:', sample);
          // Case-insensitive + бүх тусгай тэмдэгтийг орхиж хайна (BlanceCheck, blancecheck, Blance_check гэх мэт)
          const ci = keys.find(k => k.toLowerCase().replace(/[_\s-]/g,'') === 'blancecheck');
          if (ci) {
            console.log('[bcFieldKey] олдсон:', ci, '→ утга:', sample[ci]);
            return ci;
          }
          // Heuristic: TRUE/FALSE string утгатай баганыг хайна
          const boolLike = v => {
            if (v === true || v === false || v === 0 || v === 1) return true;
            if (v === null || v === undefined) return true;
            if (typeof v === 'string') {
              const s = v.trim().toLowerCase();
              return s === 'true' || s === 'false' || s === '1' || s === '0' || s === 'yes' || s === 'no';
            }
            return false;
          };
          const sample20 = allRows.slice(0, Math.min(20, allRows.length));
          const boolField = keys.find(k => sample20.every(r => boolLike(r[k])));
          if (boolField) {
            console.log('[bcFieldKey] heuristic олдсон:', boolField);
            return boolField;
          }
        }
        console.warn('[bcFieldKey] олдсонгүй, default ашиглана');
        return 'BlanceCheck';
      })();

      function isTrue(bc) {
        if (bc === true || bc === 1) return true;
        if (typeof bc === 'number' && !isNaN(bc) && bc > 0) return true;
        if (typeof bc === 'string') {
          const s = bc.trim().toLowerCase();
          return s === 'true' || s === '1' || s === 'yes';
        }
        return false;
      }
      function isFalse(bc) {
        if (bc === false || bc === 0) return true;
        if (bc === null || bc === undefined) return true;
        if (typeof bc === 'string') {
          const s = bc.trim().toLowerCase();
          return s === 'false' || s === '0' || s === 'no' || s === '';
        }
        return false;
      }
      function getBc(r) {
        // 1. bcFieldKey-р шууд хайна
        const direct = r[bcFieldKey];
        if (direct !== undefined) return direct;
        // 2. Case-insensitive + underscore-г орхиж хайна
        const key = Object.keys(r).find(k => k.toLowerCase().replace(/_/g,'') === 'blancecheck');
        if (key) return r[key];
        return undefined;
      }

      const trueRows  = serverRows.filter(r => isTrue(getBc(r)));
      const falseRows = serverRows.filter(r => isFalse(getBc(r)));

      /* Хөрөнгийн жагсаалтаас кодын map авна (код → тоо хэмжээ) */
      const assetQtyMap = new Map();
      calcRows.forEach(r => {
        const code = String(r['Хөрөнгийн код'] || '').trim();
        if (code) assetQtyMap.set(code, Number(r['Тоо хэмжээ'] || 0));
      });

      container.innerHTML = `
        <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:4px;">
          <div style="flex:1;min-width:180px;">
            <label style="display:block;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--main-text2);margin-bottom:6px;">Blancecheck</label>
            <select id="km2CheckSel" class="f-input" style="width:100%;padding:8px 12px;border:1px solid var(--main-border);border-radius:8px;background:var(--main-bg);color:var(--main-text);font-size:0.85rem;outline:none;">
              <option value="">— Бүгд —</option>
              <option value="true">✓ true — дансанд байгаа</option>
              <option value="false">✕ false — хасагдсан</option>
            </select>
          </div>
          <button id="km2CheckBtn" style="padding:8px 20px;border-radius:8px;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:0.85rem;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px;height:38px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#fff" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
            Шалгах
          </button>
        </div>
        ${mainDb ? `<div style="font-size:0.73rem;color:var(--main-text2);padding:2px 0 6px;">
          ServerName шүүлт: <strong style="color:#0ea5e9;">${escapeHtml(mainDb)}</strong> · нийт <strong>${serverRows.length}</strong> мөр
          &nbsp;·&nbsp; <span style="color:#10b981;">true: ${trueRows.length}</span>
          &nbsp;·&nbsp; <span style="color:#ef4444;">false: ${falseRows.length}</span>
          
        </div>` : `<div style="font-size:0.73rem;color:#f59e0b;padding:2px 0 6px;">⚠ Тохиргоо → Мэдээллийн бааз оруулаагүй байна. Бүх мөр харагдаж байна.</div>`}
        <div id="km2Result" style="display:flex;flex-direction:column;gap:10px;"></div>`;

      if (!maRows.length || !calcRows.length) {
        const warns = [];
        if (!maRows.length)   warns.push('⚠ Myassets дата байхгүй. Техникийн нэгдсэн дата хэсгээс татна уу.');
        if (!calcRows.length) warns.push('⚠ Хөрөнгийн жагсаалт татагдаагүй. Тохиргоо → Calculate data хийнэ үү.');
        const res = container.querySelector('#km2Result');
        if (res) res.innerHTML = warns.map(w =>
          `<div style="padding:10px 14px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;color:#f59e0b;font-size:0.82rem;">${escapeHtml(w)}</div>`
        ).join('');
      }

      const checkBtn = container.querySelector('#km2CheckBtn');
      const checkSel = container.querySelector('#km2CheckSel');
      const resultEl = container.querySelector('#km2Result');

      /* ── Өмнөх шүүлтийн утгыг сэргээнэ ── */
      if (checkSel && window._kmTab2CheckSel !== undefined) checkSel.value = window._kmTab2CheckSel;

      if (!checkBtn) return;

      checkBtn.addEventListener('click', function() {
        const selCheck = checkSel ? checkSel.value.trim() : '';
        /* Шүүлтийн утгыг хадгална */
        window._kmTab2CheckSel = selCheck;
        window._kmTab2WasChecked = true;

        /* ServerName шүүгдсэн мөрүүдээс Blancecheck-р дахин шүүнэ */
        let filtered = serverRows.slice();
        if (selCheck === 'true') {
          filtered = filtered.filter(r => isTrue(getBc(r)));
        } else if (selCheck === 'false') {
          filtered = filtered.filter(r => isFalse(getBc(r)));
        }

        /* Хөрөнгийн жагсаалтад байгаа эсэх + тоо хэмжээ */
        const inListQty1  = filtered.filter(r => { const q = assetQtyMap.get(String(r.assetcode || '').trim()); return q !== undefined && q >= 1; });
        const inListQty0  = filtered.filter(r => { const q = assetQtyMap.get(String(r.assetcode || '').trim()); return q !== undefined && q === 0; });
        const notInList   = filtered.filter(r => !assetQtyMap.has(String(r.assetcode || '').trim()));

        const fmtBC = v => {
          if (isTrue(v))  return '<span style="color:#10b981;font-weight:700;">✓ true</span>';
          if (isFalse(v)) return '<span style="color:#ef4444;font-weight:700;">✕ false</span>';
          return escapeHtml(String(v));
        };

        const lblCheck = selCheck ? `Blancecheck: <strong>${selCheck === 'true' ? '✓ true' : '✕ false'}</strong>` : 'Blancecheck: <strong>Бүгд</strong>';
        const lblSrv   = mainDb ? `ServerName: <strong>${escapeHtml(mainDb)}</strong>` : 'ServerName: <strong>Бүгд</strong>';

        let html = `
          <div style="font-size:0.75rem;color:var(--main-text2);padding:2px 0;">${lblSrv} &nbsp;·&nbsp; ${lblCheck}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <div style="flex:1;min-width:120px;padding:12px;background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.3);border-radius:9px;text-align:center;">
              <div style="font-size:1.6rem;font-weight:800;color:#0ea5e9;">${filtered.length}</div>
              <div style="font-size:0.7rem;color:#0ea5e9;margin-top:2px;">Нийт шүүгдсэн</div>
            </div>
            <div style="flex:1;min-width:120px;padding:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:9px;text-align:center;">
              <div style="font-size:1.6rem;font-weight:800;color:#10b981;">${inListQty1.length}</div>
              <div style="font-size:0.7rem;color:#10b981;margin-top:2px;">Жагсаалтад · Тоо ≥1</div>
            </div>
            <div style="flex:1;min-width:120px;padding:12px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:9px;text-align:center;">
              <div style="font-size:1.6rem;font-weight:800;color:#f59e0b;">${inListQty0.length}</div>
              <div style="font-size:0.7rem;color:#f59e0b;margin-top:2px;">Жагсаалтад · Тоо=0</div>
            </div>
            <div style="flex:1;min-width:120px;padding:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:9px;text-align:center;">
              <div style="font-size:1.6rem;font-weight:800;color:#ef4444;">${notInList.length}</div>
              <div style="font-size:0.7rem;color:#ef4444;margin-top:2px;">Жагсаалтад байхгүй</div>
            </div>
          </div>`;

        /* ── Helper: нэг хүснэгт үүсгэх ── */
        function makeTable(rows, title, color, csvId) {
          if (!rows.length) return '';
          const rowsHtml = rows.map((r, i) => {
            const code = String(r.assetcode || '').trim();
            const qty  = assetQtyMap.has(code) ? assetQtyMap.get(code) : null;
            const qtyColor = qty === null ? '#94a3b8' : qty >= 1 ? '#10b981' : '#f59e0b';
            const qtyLabel = qty === null ? '—' : qty;
            return `<tr style="border-bottom:1px solid var(--main-border);">
              <td style="padding:5px 8px;color:var(--main-text2);">${i + 1}</td>
              <td style="padding:5px 12px;font-family:monospace;font-size:0.78rem;color:#38bdf8;white-space:nowrap;">${escapeHtml(code)}</td>
              <td style="padding:5px 12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(String(r.assetname || ''))}">${escapeHtml(String(r.assetname || ''))}</td>
              <td style="padding:5px 12px;font-size:0.76rem;color:var(--main-text2);white-space:nowrap;">${escapeHtml(String(r.ServerName || ''))}</td>
              <td style="padding:5px 12px;text-align:center;">${fmtBC(getBc(r))}</td>
              <td style="padding:5px 12px;text-align:center;font-weight:700;color:${qtyColor};">${qtyLabel}</td>
            </tr>`;
          }).join('');
          return `
            <details open>
              <summary style="cursor:pointer;user-select:none;list-style:none;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(0,0,0,0.12);border:1px solid ${color}44;border-radius:8px;margin-bottom:4px;">
                <span style="font-size:0.8rem;font-weight:700;color:${color};">${title} <span style="font-weight:400;opacity:0.7;">(${rows.length})</span></span>
                <button data-csvid="${csvId}" class="km2-csv-btn" style="padding:4px 10px;border-radius:5px;border:1px solid ${color}55;background:${color}12;color:${color};font-size:0.72rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  CSV
                </button>
              </summary>
              <div style="overflow:auto;max-height:260px;border:1px solid var(--main-border);border-radius:8px;">
                <table style="width:100%;border-collapse:collapse;font-size:0.79rem;">
                  <thead>
                    <tr style="position:sticky;top:0;background:var(--main-card,#1e2433);border-bottom:2px solid var(--main-border);">
                      <th style="padding:6px 8px;text-align:left;color:var(--main-text2);font-weight:600;">#</th>
                      <th style="padding:6px 12px;text-align:left;color:var(--main-text2);font-weight:600;">Asset код</th>
                      <th style="padding:6px 12px;text-align:left;color:var(--main-text2);font-weight:600;">Хөрөнгийн нэр</th>
                      <th style="padding:6px 12px;text-align:left;color:var(--main-text2);font-weight:600;">ServerName</th>
                      <th style="padding:6px 12px;text-align:center;color:var(--main-text2);font-weight:600;">Blancecheck</th>
                      <th style="padding:6px 12px;text-align:center;color:var(--main-text2);font-weight:600;">Тоо</th>
                    </tr>
                  </thead>
                  <tbody>${rowsHtml}</tbody>
                </table>
              </div>
            </details>`;
        }

        html += makeTable(inListQty1, '✓ Жагсаалтад байна — Үлдэгдэлтэй', '#10b981', 'qty1');
        html += makeTable(inListQty0, '⚠ Жагсаалтад байна — Үлдэгдэлгүй [Зөрүү 1: myassets true · жагсаалт тоо=0]', '#f59e0b', 'qty0');
        html += makeTable(notInList,  '✕ Жагсаалтад байхгүй', '#ef4444', 'nolist');

        /* ── Зөрүү 2: Хөрөнгийн жагсаалт тоо≥1 байхад myassets blancecheck=false ── */
        {
          const maCodes_false = new Set(falseRows.map(r => String(r.assetcode || '').trim()).filter(Boolean));
          const discrepancy2 = calcRows
            .filter(r => Number(r['Тоо хэмжээ'] || 0) > 0)
            .filter(r => maCodes_false.has(String(r['Хөрөнгийн код'] || '').trim()));
          window._kmTab2Disc2Rows = discrepancy2;
          if (discrepancy2.length) {
            const d2Rows = discrepancy2.map((r, i) => `<tr style="border-bottom:1px solid var(--main-border);">
              <td style="padding:5px 8px;color:var(--main-text2);">${i + 1}</td>
              <td style="padding:5px 12px;font-family:monospace;font-size:0.78rem;color:#f97316;white-space:nowrap;">${escapeHtml(String(r['Хөрөнгийн код'] || ''))}</td>
              <td style="padding:5px 12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(String(r['Хөрөнгийн нэр'] || ''))}">${escapeHtml(String(r['Хөрөнгийн нэр'] || ''))}</td>
              <td style="padding:5px 12px;text-align:center;font-weight:700;color:#10b981;">${Number(r['Тоо хэмжээ'] || 0)}</td>
              <td style="padding:5px 12px;text-align:center;"><span style="color:#ef4444;font-weight:700;">✕ false</span></td>
            </tr>`).join('');
            html += `
              <details open>
                <summary style="cursor:pointer;user-select:none;list-style:none;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.4);border-radius:8px;margin-bottom:4px;">
                  <span style="font-size:0.8rem;font-weight:700;color:#f97316;">⚡ Зөрүү 2: Жагсаалт тоо≥1 · Myassets false <span style="font-weight:400;opacity:0.7;">(${discrepancy2.length})</span></span>
                  <button class="km2-d2csv-btn" style="padding:4px 10px;border-radius:5px;border:1px solid rgba(249,115,22,0.4);background:rgba(249,115,22,0.1);color:#f97316;font-size:0.72rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    CSV
                  </button>
                </summary>
                <div style="overflow:auto;max-height:260px;border:1px solid var(--main-border);border-radius:8px;">
                  <table style="width:100%;border-collapse:collapse;font-size:0.79rem;">
                    <thead><tr style="position:sticky;top:0;background:var(--main-card,#1e2433);border-bottom:2px solid var(--main-border);">
                      <th style="padding:6px 8px;text-align:left;color:var(--main-text2);font-weight:600;">#</th>
                      <th style="padding:6px 12px;text-align:left;color:var(--main-text2);font-weight:600;">Asset код</th>
                      <th style="padding:6px 12px;text-align:left;color:var(--main-text2);font-weight:600;">Хөрөнгийн нэр</th>
                      <th style="padding:6px 12px;text-align:center;color:var(--main-text2);font-weight:600;">Жагсаалт тоо</th>
                      <th style="padding:6px 12px;text-align:center;color:var(--main-text2);font-weight:600;">Myassets BC</th>
                    </tr></thead>
                    <tbody>${d2Rows}</tbody>
                  </table>
                </div>
              </details>`;
          }
        }

        if (!filtered.length) {
          html += `<div style="padding:20px;text-align:center;color:var(--main-text2);font-size:0.84rem;">Тохирох мөр олдсонгүй</div>`;
        }

        resultEl.innerHTML = html;

        /* ── Per-table CSV export ── */
        const tableMap = { qty1: inListQty1, qty0: inListQty0, nolist: notInList };
        const labelMap = { qty1: 'тоо_1дээш', qty0: 'тоо_тэг', nolist: 'жагсаалтад_байхгүй' };
        resultEl.querySelectorAll('.km2-csv-btn').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            const id = this.dataset.csvid;
            const rows = tableMap[id] || [];
            if (!rows.length) return;
            const esc2  = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
            const bcStr = v => isTrue(v) ? 'true' : 'false';
            const headers = ['Assetcode', 'Хөрөнгийн нэр', 'ServerName', 'Blancecheck', 'Тоо ширхэг'];
            const lines = [
              headers.map(h => esc2(h)).join(','),
              ...rows.map(r => {
                const code = String(r.assetcode || '').trim();
                const qty  = assetQtyMap.has(code) ? assetQtyMap.get(code) : '';
                return [r.assetcode, r.assetname, r.ServerName, bcStr(getBc(r)), qty].map(v => esc2(v)).join(',');
              })
            ];
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
            a.download = 'blance_' + (labelMap[id] || id) + '_' + (mainDb || 'all') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
            a.click();
          });
        });

        /* ── Зөрүү 2 CSV export ── */
        const d2CsvBtn = resultEl.querySelector('.km2-d2csv-btn');
        if (d2CsvBtn && window._kmTab2Disc2Rows && window._kmTab2Disc2Rows.length) {
          d2CsvBtn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            const rows = window._kmTab2Disc2Rows;
            const esc2 = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
            const headers = ['Хөрөнгийн код', 'Хөрөнгийн нэр', 'Тоо хэмжээ', 'Myassets BC'];
            const lines = [headers.map(h => esc2(h)).join(','), ...rows.map(r => [r['Хөрөнгийн код'], r['Хөрөнгийн нэр'], r['Тоо хэмжээ'], 'false'].map(v => esc2(v)).join(','))];
            const a2 = document.createElement('a');
            a2.href = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
            a2.download = 'зөрүү2_жагсаалт_true_myassets_false_' + (mainDb || 'all') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
            a2.click();
          });
        }
      });

      /* ── Өмнөх шалгалт байвал автоматаар дахин харуулна ── */
      if (window._kmTab2WasChecked && checkBtn) {
        checkBtn.click();
      }
    }

    /* ── Tab dispatcher — аль ч tab руу шилжихэд үргэлж дахин render хийнэ ── */
    function renderTab(tab) {
      const body1 = document.getElementById('kmBody1');
      const body2 = document.getElementById('kmBody2');
      if (!body1 || !body2) return;
      if (tab === 'check1') {
        body1.style.display = 'flex';
        body2.style.display = 'none';
        body1.innerHTML = '';
        renderTab1(body1);
      } else {
        body1.style.display = 'none';
        body2.style.display = 'flex';
        body2.innerHTML = '';
        renderTab2(body2);
      }
    }

    /* ── Sidebar товч ── */
    khyanalBtn.addEventListener('click', () => {
      ensureModal();
      const body1 = document.getElementById('kmBody1');
      const body2 = document.getElementById('kmBody2');
      if (body1) body1.innerHTML = '';
      if (body2) body2.innerHTML = '';
      kModal.style.display = 'flex';
      kModal.querySelectorAll('.km-tab-btn').forEach(b => {
        const a = b.dataset.tab === 'check1';
        b.style.color        = a ? 'var(--main-text)' : 'var(--main-text2)';
        b.style.fontWeight   = a ? '600' : '500';
        b.style.borderBottom = a ? '2px solid #6366f1' : '2px solid transparent';
      });
      renderTab('check1');
    });

  })(); // end Хяналт IIFE

});

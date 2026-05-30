/* ══════════════════════════════════════════
   TALLYLEARN — script.js
   All logic: navigation, bill entry,
   GST/IRN generators, practice questions
══════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const STATES = {
  TN: { name: 'Tamil Nadu',     code: '33' },
  KL: { name: 'Kerala',         code: '32' },
  MH: { name: 'Maharashtra',    code: '27' },
  KT: { name: 'Karnataka',      code: '29' },
  DL: { name: 'Delhi',          code: '07' },
  GJ: { name: 'Gujarat',        code: '24' },
  AP: { name: 'Andhra Pradesh', code: '37' },
  TS: { name: 'Telangana',      code: '36' }
};

const PRODUCTS = [
  { n: 'Office Chair',      h: '9401', g: 18, p: 3500  },
  { n: 'Laptop',            h: '8471', g: 18, p: 45000 },
  { n: 'Printer Paper A4',  h: '4802', g: 12, p: 420   },
  { n: 'Steel Almirah',     h: '9403', g: 18, p: 8500  },
  { n: 'Mobile Phone',      h: '8517', g: 18, p: 15000 },
  { n: 'Refrigerator',      h: '8418', g: 18, p: 22000 },
  { n: 'Rice 10kg',         h: '1006', g: 0,  p: 650   },
  { n: 'Wheat Flour 5kg',   h: '1101', g: 5,  p: 210   },
  { n: 'Cement Bag 50kg',   h: '2523', g: 28, p: 380   },
  { n: 'Electric Fan',      h: '8414', g: 12, p: 2200  }
];

const GST_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const IRN_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';

let bills   = [];          // saved bills store
let billNo  = 1001;        // auto-increment bill counter
let billItems = [];        // current bill rows

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function randStr(len, chars) {
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function genGSTIN(stateKey) {
  const st = STATES[stateKey] || STATES['TN'];
  const pan = randStr(5, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') +
              randStr(4, '0123456789') +
              randStr(1, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  return `${st.code}${pan}1Z${randStr(1, GST_CHARS)}`;
}

function genIRN() {
  return '454646554' + randStr(10, IRN_CHARS);
}

function nextBillNo(type) {
  return `${type === 'S' ? 'SB' : 'PB'}-${new Date().getFullYear()}-${String(billNo++).padStart(4, '0')}`;
}

function fmt(n) {
  return '₹' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function todayDisplay() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function stateOptions(selected) {
  return Object.entries(STATES)
    .map(([k, v]) => `<option value="${k}"${selected === k ? ' selected' : ''}>${k} — ${v.name}</option>`)
    .join('');
}

/* ─────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────── */
const PAGE_TITLES = {
  dashboard : 'GATEWAY — DASHBOARD',
  sales     : 'ACCOUNTING VOUCHERS — SALES',
  purchase  : 'ACCOUNTING VOUCHERS — PURCHASE',
  gst       : 'GST NUMBER GENERATOR',
  irn       : 'IRN GENERATOR — E-INVOICE',
  practice  : 'PRACTICE QUESTIONS'
};

function navigate(page) {
  // Sidebar highlight
  document.querySelectorAll('.sb-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Title bar
  document.getElementById('mb-title').textContent =
    'TALLYLEARN — ' + (PAGE_TITLES[page] || page.toUpperCase());

  // Render page
  const renders = {
    dashboard : renderDashboard,
    sales     : () => renderBill('S'),
    purchase  : () => renderBill('P'),
    gst       : renderGST,
    irn       : renderIRN,
    practice  : renderPractice
  };

  (renders[page] || renderDashboard)();
}

/* ─────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────── */
function renderDashboard() {
  const salesBills    = bills.filter(b => b.t === 'S');
  const purchBills    = bills.filter(b => b.t === 'P');
  const totalSales    = salesBills.reduce((s, b) => s + b.total, 0);
  const totalPurchase = purchBills.reduce((s, b) => s + b.total, 0);
  const totalGST      = bills.reduce((s, b) => s + b.gst, 0);

  const recentHTML = bills.length
    ? `<div class="recent-wrap">
        <div class="recent-hdr">RECENT VOUCHERS</div>
        <table class="recent-tbl">
          <thead><tr>
            <th>Voucher No</th><th>Type</th><th>Party</th>
            <th>Date</th><th>Taxable</th><th>GST</th><th>Grand Total</th>
          </tr></thead>
          <tbody>
            ${bills.slice(-8).reverse().map(b => `
            <tr>
              <td class="text-blue fw-bold">${b.no}</td>
              <td><span class="tag ${b.t === 'S' ? 'tag-sales' : 'tag-purchase'}">${b.t === 'S' ? 'SALES' : 'PURCHASE'}</span></td>
              <td>${b.party}</td>
              <td>${b.date}</td>
              <td>${fmt(b.taxable)}</td>
              <td>${fmt(b.gst)}</td>
              <td class="text-green fw-bold">${fmt(b.total)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`
    : `<div class="no-bills-msg">No vouchers yet — create a Sales or Purchase bill to begin practice</div>`;

  document.getElementById('content-area').innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-num text-green">${fmt(totalSales)}</div>
        <div class="kpi-label">Total Sales</div>
        <div class="kpi-sub">${salesBills.length} voucher(s)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num text-amber">${fmt(totalPurchase)}</div>
        <div class="kpi-label">Total Purchase</div>
        <div class="kpi-sub">${purchBills.length} voucher(s)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num text-navy">${fmt(totalGST)}</div>
        <div class="kpi-label">Total GST</div>
        <div class="kpi-sub">CGST + SGST + IGST</div>
      </div>
    </div>

    <div class="quick-grid">
      <div class="quick-panel">
        <div class="quick-hdr">VOUCHER ENTRY</div>
        <button class="quick-btn" onclick="navigate('sales')">F8 &nbsp; Sales Voucher →</button>
        <button class="quick-btn" onclick="navigate('purchase')">F9 &nbsp; Purchase Voucher →</button>
        <button class="quick-btn" onclick="navigate('gst')">Alt+G &nbsp; GST Generator →</button>
        <button class="quick-btn" onclick="navigate('irn')">Ctrl+I &nbsp; IRN Generator →</button>
      </div>
      <div class="quick-panel">
        <div class="quick-hdr">PRACTICE</div>
        <button class="quick-btn practice" onclick="navigate('practice')">✎ &nbsp; Practice Questions →</button>
        <div style="font-size:10px;color:#556;margin-top:7px;line-height:1.7">
          4 categories · 5 questions each<br>
          Click any question → entry form opens below it<br>
          Sales · Purchase · GST · IRN
        </div>
      </div>
    </div>

    ${recentHTML}
  `;
}

/* ─────────────────────────────────────────
   BILL ENTRY (Sales / Purchase)
───────────────────────────────────────── */
function newItem() {
  return { name: '', hsn: '', qty: 1, price: 0, gst: 18, tax: 0, cgst: 0, sgst: 0, tot: 0 };
}

function calcItem(it) {
  it.tax  = it.qty * it.price;
  it.cgst = it.tax * it.gst / 200;
  it.sgst = it.tax * it.gst / 200;
  it.tot  = it.tax + it.cgst + it.sgst;
}

function grandTotals() {
  return {
    tax:  billItems.reduce((s, x) => s + x.tax,  0),
    cgst: billItems.reduce((s, x) => s + x.cgst, 0),
    sgst: billItems.reduce((s, x) => s + x.sgst, 0),
    tot:  billItems.reduce((s, x) => s + x.tot,  0)
  };
}

function renderBill(type) {
  billItems = [newItem()];
  const bno    = nextBillNo(type);
  const pLabel = type === 'S' ? 'Customer' : 'Supplier';

  document.getElementById('content-area').innerHTML = `
    <div class="tscreen">
      <div class="tscreen-head">
        ${type === 'S' ? 'SALES VOUCHER' : 'PURCHASE VOUCHER'} — NEW ENTRY
        <span class="hint">Tab = next field &nbsp;|&nbsp; F5 = generate GSTIN &nbsp;|&nbsp; F6 = add row &nbsp;|&nbsp; Ctrl+A = save</span>
      </div>

      <!-- Voucher Type -->
      <div class="tfield section-row">
        <div class="tf-label">Voucher Type</div>
        <div class="tf-colon">:</div>
        <div class="tf-value" style="padding:4px 8px; font-weight:700; color:#1c3a5e; font-size:11px;">
          ${type === 'S' ? 'Sales' : 'Purchase'}
        </div>
      </div>

      <!-- Voucher No -->
      <div class="tfield">
        <div class="tf-label">Voucher No.</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="f-vno" value="${bno}" style="font-weight:700;" onkeydown="tabNext(event,'f-date')" />
        </div>
      </div>

      <!-- Date -->
      <div class="tfield">
        <div class="tf-label">Date</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="f-date" type="date" value="${todayISO()}" onkeydown="tabNext(event,'f-co')" />
        </div>
      </div>

      <!-- OUR COMPANY section -->
      <div class="tfield section-row">
        <div class="tf-label">Our Company Details</div>
        <div class="tf-note">OUR / SUPPLIER DETAILS</div>
      </div>

      <div class="tfield">
        <div class="tf-label">Company Name</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="f-co" value="Demo Traders Pvt Ltd" onkeydown="tabNext(event,'f-our-gst')" />
        </div>
      </div>

      <div class="tfield">
        <div class="tf-label">Our GSTIN</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="f-our-gst" placeholder="Type or press F5 to generate"
            onkeydown="gstKeyHandler(event,'f-our-gst','f-our-st','f-party')" />
          <button class="gen-btn" onclick="document.getElementById('f-our-gst').value = genGSTIN(document.getElementById('f-our-st').value || 'TN')">F5 Generate</button>
        </div>
      </div>

      <div class="tfield">
        <div class="tf-label">Our State</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <select id="f-our-st" onkeydown="tabNext(event,'f-party')" style="font-size:11px;color:#00008b;">
            ${stateOptions('TN')}
          </select>
        </div>
      </div>

      <!-- PARTY section -->
      <div class="tfield section-row">
        <div class="tf-label">${pLabel} Details</div>
        <div class="tf-note">${pLabel.toUpperCase()} / PARTY DETAILS</div>
      </div>

      <div class="tfield">
        <div class="tf-label">${pLabel} Name</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="f-party" placeholder="Enter ${pLabel.toLowerCase()} name..." onkeydown="tabNext(event,'f-pgst')" />
        </div>
      </div>

      <div class="tfield">
        <div class="tf-label">${pLabel} GSTIN</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="f-pgst" placeholder="Type or press F5 to generate"
            onkeydown="gstKeyHandler(event,'f-pgst','f-pst',null)" />
          <button class="gen-btn" onclick="document.getElementById('f-pgst').value = genGSTIN(document.getElementById('f-pst').value || 'TN')">F5 Generate</button>
        </div>
      </div>

      <div class="tfield">
        <div class="tf-label">${pLabel} State</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <select id="f-pst" style="font-size:11px;color:#00008b;">
            ${stateOptions('TN')}
          </select>
        </div>
      </div>

      <!-- STOCK ITEMS section -->
      <div class="tfield section-row">
        <div class="tf-label">Stock Items</div>
        <div class="tf-note">ENTER ITEM · HSN · QTY · RATE · GST% &nbsp;|&nbsp; TAB THROUGH COLUMNS &nbsp;|&nbsp; F6 ADD ROW</div>
      </div>

      <!-- Items Table -->
      <div class="itbl-wrap">
        <table class="itbl">
          <thead>
            <tr>
              <th style="width:24px">#</th>
              <th style="width:170px">Item / Description</th>
              <th style="width:62px">HSN/SAC</th>
              <th style="width:40px">Qty</th>
              <th style="width:80px" class="num">Rate (₹)</th>
              <th style="width:88px" class="num">Taxable</th>
              <th style="width:44px" class="num">GST%</th>
              <th style="width:82px" class="num">CGST (₹)</th>
              <th style="width:82px" class="num">SGST (₹)</th>
              <th style="width:88px" class="num">Total (₹)</th>
              <th style="width:20px"></th>
            </tr>
          </thead>
          <tbody id="bill-tbody"></tbody>
        </table>
      </div>
      <button class="add-row-btn" onclick="addBillRow()">+ Add Item Row &nbsp;[ F6 ]</button>

      <!-- Totals Bar -->
      <div class="totals-bar">
        <div class="tot-cell"><div class="tot-label">TAXABLE AMOUNT</div><div class="tot-val" id="t-tax">₹0.00</div></div>
        <div class="tot-cell"><div class="tot-label">CGST</div><div class="tot-val" id="t-cgst">₹0.00</div></div>
        <div class="tot-cell"><div class="tot-label">SGST</div><div class="tot-val" id="t-sgst">₹0.00</div></div>
        <div class="tot-cell"><div class="tot-label">GRAND TOTAL</div><div class="tot-val grand" id="t-tot">₹0.00</div></div>
      </div>

      <!-- Narration -->
      <div class="tfield">
        <div class="tf-label">Narration</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="f-nar" placeholder="Optional narration..." />
        </div>
      </div>

      <!-- Buttons -->
      <div class="btn-row">
        <button class="btn btn-primary" onclick="saveBill('${type}')">Ctrl+A &nbsp; Accept &amp; Save</button>
        <button class="btn btn-secondary" onclick="addBillRow()">F6 &nbsp; Add Row</button>
        <button class="btn btn-danger" onclick="billItems=[newItem()]; renderBillRows()">Alt+D &nbsp; Clear Items</button>
        <button class="btn btn-danger" onclick="navigate('dashboard')">Esc &nbsp; Cancel</button>
      </div>

      <!-- Save output -->
      <div id="bill-save-out"></div>
    </div>
  `;

  setupFieldFocus('content-area');
  renderBillRows();
  document.getElementById('f-vno').focus();
}

function renderBillRows() {
  const tbody = document.getElementById('bill-tbody');
  if (!tbody) return;

  const g = grandTotals();

  tbody.innerHTML = billItems.map((it, i) => `
    <tr id="brow-${i}">
      <td class="num">${i + 1}</td>
      <td>
        <input list="prod-dl" value="${it.name}" placeholder="Item name..."
          onchange="billItemProduct(${i}, this.value)"
          onfocus="billRowFocus(${i})"
          style="width:165px;" />
        <datalist id="prod-dl">
          ${PRODUCTS.map(p => `<option value="${p.n}">`).join('')}
        </datalist>
      </td>
      <td>
        <input value="${it.hsn}" placeholder="HSN"
          onchange="billItems[${i}].hsn = this.value"
          onfocus="billRowFocus(${i})"
          style="width:56px;" />
      </td>
      <td>
        <input type="number" value="${it.qty}" min="0" step="1"
          onchange="billItems[${i}].qty = +this.value; billRecalc(${i})"
          onfocus="billRowFocus(${i})"
          style="width:36px;" />
      </td>
      <td class="num">
        <input type="number" value="${it.price || ''}" placeholder="0.00"
          onchange="billItems[${i}].price = +this.value; billRecalc(${i})"
          onfocus="billRowFocus(${i})"
          style="width:76px; text-align:right;" />
      </td>
      <td class="num" style="color:#333; font-size:11px;">${it.tax ? fmt(it.tax) : '—'}</td>
      <td class="num">
        <select onchange="billItems[${i}].gst = +this.value; billRecalc(${i})"
          onfocus="billRowFocus(${i})"
          style="border:none; background:transparent; font-size:11px; color:#00008b; width:40px;">
          ${[0, 5, 12, 18, 28].map(r => `<option value="${r}"${it.gst === r ? ' selected' : ''}>${r}%</option>`).join('')}
        </select>
      </td>
      <td class="num" style="color:#1c3a5e;">${it.cgst ? fmt(it.cgst) : '—'}</td>
      <td class="num" style="color:#1c3a5e;">${it.sgst ? fmt(it.sgst) : '—'}</td>
      <td class="num text-green fw-bold">${it.tot ? fmt(it.tot) : '—'}</td>
      <td style="text-align:center;">
        <span onclick="deleteBillRow(${i})" style="cursor:pointer; color:#880000; font-size:14px;" title="Delete row">×</span>
      </td>
    </tr>
  `).join('') + `
    <tr class="total-row">
      <td colspan="5" style="text-align:right; padding:3px 8px; font-size:11px;">TOTAL</td>
      <td class="num">${fmt(g.tax)}</td>
      <td></td>
      <td class="num">${fmt(g.cgst)}</td>
      <td class="num">${fmt(g.sgst)}</td>
      <td class="num">${fmt(g.tot)}</td>
      <td></td>
    </tr>
  `;

  updateTotalsBar();
}

function updateTotalsBar() {
  const g = grandTotals();
  const els = { 't-tax': g.tax, 't-cgst': g.cgst, 't-sgst': g.sgst, 't-tot': g.tot };
  Object.entries(els).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = fmt(val);
  });
}

function billItemProduct(i, val) {
  billItems[i].name = val;
  const p = PRODUCTS.find(x => x.n === val);
  if (p) { billItems[i].hsn = p.h; billItems[i].gst = p.g; billItems[i].price = p.p; }
  billRecalc(i);
}

function billRecalc(i) {
  calcItem(billItems[i]);
  renderBillRows();
}

function billRowFocus(i) {
  document.querySelectorAll('#bill-tbody tr').forEach((r, j) => {
    r.classList.toggle('row-active', j === i);
  });
}

function addBillRow() {
  billItems.push(newItem());
  renderBillRows();
  setTimeout(() => {
    const rows = document.querySelectorAll('#bill-tbody tr:not(.total-row)');
    rows[rows.length - 1]?.querySelector('input')?.focus();
  }, 30);
}

function deleteBillRow(i) {
  if (billItems.length > 1) {
    billItems.splice(i, 1);
    renderBillRows();
  }
}

function saveBill(type) {
  const party  = document.getElementById('f-party')?.value || 'Unknown Party';
  const date   = document.getElementById('f-date')?.value  || todayISO();
  const bno    = document.getElementById('f-vno')?.value;
  const g      = grandTotals();
  const irn    = genIRN();

  bills.push({ t: type, no: bno, party, date, taxable: g.tax, gst: g.cgst + g.sgst, total: g.tot, irn });

  document.getElementById('bill-save-out').innerHTML = `
    <div class="saved-grid">
      <div class="saved-box">
        <div class="saved-lbl">✓ VOUCHER SAVED SUCCESSFULLY</div>
        <div style="font-size:11px; color:#004400; line-height:1.9;">
          No: <b>${bno}</b> &nbsp;|&nbsp; Party: <b>${party}</b><br>
          Taxable: <b>${fmt(g.tax)}</b> &nbsp; GST: <b>${fmt(g.cgst + g.sgst)}</b><br>
          Grand Total: <b>${fmt(g.tot)}</b>
        </div>
      </div>
      <div class="irn-box">
        <div class="irn-lbl">IRN GENERATED (FAKE — PRACTICE ONLY)</div>
        <div class="irn-val">${irn}</div>
        <div style="font-size:9px; color:#885500; margin-top:3px;">
          454646554 + 10 random chars &nbsp;|&nbsp; ${new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────
   GST GENERATOR PAGE
───────────────────────────────────────── */
function renderGST() {
  const sampleRows = Object.entries(STATES).map(([k, v]) => `
    <tr>
      <td>${v.name}</td>
      <td class="text-navy fw-bold">${k}</td>
      <td class="text-amber">${v.code}</td>
      <td class="text-blue font-mono" style="font-size:11px; letter-spacing:1px;">${genGSTIN(k)}</td>
    </tr>
  `).join('');

  document.getElementById('content-area').innerHTML = `
    <div class="gst-screen">
      <div class="tscreen-head">
        GST NUMBER GENERATOR
        <span class="hint">Fake GSTIN for practice use only</span>
      </div>

      <div class="tfield section-row">
        <div class="tf-label">Select State</div>
        <div class="tf-note">CHOOSE STATE TO GENERATE GSTIN</div>
      </div>

      <div class="tfield">
        <div class="tf-label">State</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <select id="gst-state" onchange="document.getElementById('gst-out').value = genGSTIN(this.value)"
            style="font-size:11px; color:#00008b;">
            ${stateOptions('TN')}
          </select>
        </div>
      </div>

      <div class="tfield">
        <div class="tf-label">Generated GSTIN</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="gst-out" readonly value="${genGSTIN('TN')}"
            style="font-weight:700; font-size:12px; letter-spacing:2px; color:#00008b;" />
          <button class="gen-btn" onclick="document.getElementById('gst-out').value = genGSTIN(document.getElementById('gst-state').value)">
            F5 Regenerate
          </button>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" onclick="document.getElementById('gst-out').value = genGSTIN(document.getElementById('gst-state').value)">F5 &nbsp; Regenerate</button>
        <button class="btn btn-secondary" onclick="gstBulkGenerate()">Generate 5 GSTINs</button>
      </div>
      <div id="gst-bulk-out"></div>
    </div>

    <div class="state-ref-wrap">
      <div class="state-ref-hdr">STATE CODE REFERENCE TABLE</div>
      <table class="state-ref-tbl">
        <thead>
          <tr><th>State</th><th>Short Code</th><th>GST State Code</th><th>Sample GSTIN (Fake)</th></tr>
        </thead>
        <tbody>${sampleRows}</tbody>
      </table>
    </div>

    <div class="note-box">
      <b>GSTIN Format:</b> &nbsp;
      [State Code 2 digits] + [PAN 10 chars] + [Entity No 1] + [Z default] + [Checksum 1] = <b>15 characters total</b><br>
      Tamil Nadu example: <b class="text-blue ls-wide">33</b>ABCDE1234F<b class="text-green ls-wide">1Z5</b>
    </div>
  `;
}

function gstBulkGenerate() {
  const st = document.getElementById('gst-state').value;
  const rows = Array.from({ length: 5 }, (_, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="text-blue font-mono" style="letter-spacing:1px;">${genGSTIN(st)}</td>
      <td>${STATES[st].name}</td>
      <td style="color:#888; font-size:10px;">${new Date().toLocaleTimeString()}</td>
    </tr>
  `).join('');

  document.getElementById('gst-bulk-out').innerHTML = `
    <table class="state-ref-tbl" style="margin:0;">
      <thead><tr><th>#</th><th>GSTIN (Fake)</th><th>State</th><th>Generated At</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/* ─────────────────────────────────────────
   IRN GENERATOR PAGE
───────────────────────────────────────── */
function renderIRN() {
  document.getElementById('content-area').innerHTML = `
    <div class="gst-screen">
      <div class="tscreen-head">
        IRN — INVOICE REFERENCE NUMBER GENERATOR
        <span class="hint">Fake IRN for practice only</span>
      </div>

      <div class="tfield">
        <div class="tf-label">Bill Reference</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="irn-ref" placeholder="e.g. SB-2024-0001 (optional)" style="font-size:11px; color:#00008b;" />
        </div>
      </div>

      <div class="tfield">
        <div class="tf-label">Party Name</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="irn-party" placeholder="Customer / Supplier (optional)" style="font-size:11px; color:#00008b;" />
        </div>
      </div>

      <div class="tfield">
        <div class="tf-label">Generated IRN</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="irn-out" readonly value="${genIRN()}"
            style="font-weight:700; font-size:12px; letter-spacing:2px; color:#553300; font-family:'Courier New';" />
          <button class="gen-btn" onclick="document.getElementById('irn-out').value = genIRN()">
            F5 Regenerate
          </button>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" onclick="document.getElementById('irn-out').value = genIRN()">F5 &nbsp; Regenerate</button>
        <button class="btn btn-secondary" onclick="irnBulkGenerate()">Generate 10 IRNs</button>
      </div>
      <div id="irn-bulk-out"></div>
    </div>

    <div class="note-box">
      <b>IRN Structure (Practice / Fake):</b> &nbsp;
      Fixed prefix <b class="text-blue">454646554</b> (9 digits) + 10 random alphanumeric chars = <b>19 chars total</b><br>
      <b>Real IRN:</b> 64-character SHA-256 hash generated by India's IRP portal (einvoice1.gst.gov.in)<br>
      Mandatory for businesses with annual turnover <b>&gt; ₹5 crore</b>
    </div>
  `;
}

function irnBulkGenerate() {
  const rows = Array.from({ length: 10 }, (_, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="text-amber font-mono" style="letter-spacing:1px;">${genIRN()}</td>
      <td style="color:#888; font-size:10px;">${new Date().toLocaleTimeString()}</td>
    </tr>
  `).join('');

  document.getElementById('irn-bulk-out').innerHTML = `
    <table class="state-ref-tbl" style="margin:0;">
      <thead><tr><th>#</th><th>IRN (Fake)</th><th>Generated At</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/* ─────────────────────────────────────────
   PRACTICE QUESTIONS DATA
───────────────────────────────────────── */
const PRACTICE_QUESTIONS = {
  sales: [
    {
      title: 'Intra-state Sales — Office Chair (18% GST)',
      preview: 'Ram Stores (TN) sells Office Chairs to Priya Traders (TN). Intra-state — CGST + SGST applies.',
      scenario: 'M/s Ram Stores (GSTIN: 33ABCDE1234F1Z5, Tamil Nadu) sells Office Chairs to M/s Priya Traders (GSTIN: 33XYZAB9876G1Z3, Tamil Nadu). Date: 15-Jun-2024. Bill No: SB-2024-0001. Both parties are in Tamil Nadu — this is an INTRA-STATE sale.',
      task: 'Open the Sales Voucher below. Enter voucher number, date, both GSTINs, and item details. Apply CGST + SGST (NOT IGST — same state). Verify grand total matches the data given.',
      data: 'Item: Office Chair × 2 Nos\nHSN Code: 9401\nRate per unit: ₹3,500\nTaxable Amount: ₹7,000\nGST Rate: 18% (CGST 9% + SGST 9%)\nCGST: ₹630 | SGST: ₹630\nGrand Total: ₹8,260',
      answer: 'Voucher Type: Sales\nDebit: M/s Priya Traders A/c → ₹8,260\nCredit: Sales A/c → ₹7,000\nCredit: CGST Output A/c → ₹630\nCredit: SGST Output A/c → ₹630\n\nIntra-state = CGST + SGST in equal halves.\nGenerate IRN after saving (mandatory if turnover > ₹5 Cr).',
      vtype: 'S'
    },
    {
      title: 'Inter-state Sales — Laptop (18% IGST)',
      preview: 'Demo Traders (TN) sells Laptops to Tech World (Maharashtra). Inter-state — IGST applies.',
      scenario: 'Demo Traders (Tamil Nadu, GSTIN: 33ABCDE1234F1Z5) sells Laptops to M/s Tech World (Maharashtra, GSTIN: 27PQRST5678H1Z2). Date: 20-Jun-2024. Bill No: SB-2024-0002. Supply crosses state boundary — INTER-STATE sale.',
      task: 'Open Sales Voucher. Set Place of Supply as Maharashtra. Apply IGST 18% (do NOT split into CGST+SGST). Enter party GSTIN for Maharashtra (starts with 27).',
      data: 'Item: Laptop × 1\nHSN Code: 8471\nRate: ₹45,000\nTaxable Amount: ₹45,000\nGST Rate: 18% → IGST only (inter-state)\nIGST: ₹8,100\nGrand Total: ₹53,100',
      answer: 'Voucher Type: Sales\nDebit: M/s Tech World A/c → ₹53,100\nCredit: Sales A/c → ₹45,000\nCredit: IGST Output A/c → ₹8,100\n\nIMPORTANT: Inter-state → only IGST applies. Never mix IGST with CGST/SGST in the same bill.\nIn TallyPrime: Set Place of Supply = Maharashtra in Statutory Details.',
      vtype: 'S'
    },
    {
      title: 'NIL Rated Sale — Rice (0% GST)',
      preview: 'Ram Stores sells Rice (essential food) in Tamil Nadu. NIL rated — 0% GST, no tax entries.',
      scenario: 'Ram Stores sells Rice (essential food) to a local grocery store within Tamil Nadu. Date: 25-Jun-2024. Bill No: SB-2024-0003. Unbranded rice is a NIL rated item — 0% GST.',
      task: 'Open Sales Voucher. Enter the item with 0% GST rate. Verify that CGST and SGST both show ₹0. Grand total = taxable amount only (no tax added).',
      data: 'Item: Rice 10kg × 50 Bags\nHSN Code: 1006\nRate per bag: ₹650\nTaxable Amount: ₹32,500\nGST Rate: 0% (NIL Rated)\nCGST: ₹0 | SGST: ₹0\nGrand Total: ₹32,500',
      answer: 'Voucher Type: Sales\nDebit: Customer A/c → ₹32,500\nCredit: Sales A/c (NIL Rated) → ₹32,500\n\nNo GST ledger entries — NIL rated = zero tax.\nIn TallyPrime: Select 0% GST rate OR set item as NIL in stock master under HSN details.',
      vtype: 'S'
    },
    {
      title: '28% GST Sale — Cement (Intra-state)',
      preview: 'Construction supplier sells Cement Bags within Tamil Nadu. 28% slab — CGST 14% + SGST 14%.',
      scenario: 'A construction supplier sells Cement Bags to a local firm within Tamil Nadu. Date: 01-Jul-2024. Bill No: SB-2024-0004. Cement falls in the highest 28% GST slab.',
      task: 'Open Sales Voucher. Apply 28% GST split as CGST 14% + SGST 14% (intra-state). Note the high tax amount — verify your calculation matches the data box.',
      data: 'Item: Cement Bag 50kg × 100 Bags\nHSN Code: 2523\nRate per bag: ₹380\nTaxable Amount: ₹38,000\nGST 28%: CGST 14% + SGST 14%\nCGST: ₹5,320 | SGST: ₹5,320\nGrand Total: ₹48,640',
      answer: 'Voucher Type: Sales\nDebit: Customer A/c → ₹48,640\nCredit: Sales A/c → ₹38,000\nCredit: CGST Output A/c → ₹5,320\nCredit: SGST Output A/c → ₹5,320\n\nCement HSN 2523 = 28% slab (highest). Always map HSN correctly in TallyPrime stock item master.',
      vtype: 'S'
    },
    {
      title: 'Credit Note — Sales Return (Office Chair)',
      preview: 'Priya Traders returns 1 Office Chair. A Credit Note reverses the earlier GST entries.',
      scenario: 'M/s Priya Traders returns 1 Office Chair from Bill SB-2024-0001. Date: 30-Jun-2024. A Credit Note must be issued. The GST charged earlier must be reversed.',
      task: 'Use Credit Note voucher type (not Sales). Enter the returned item. Reverse CGST and SGST. Link to original bill SB-2024-0001. This reduces your output tax liability.',
      data: 'Item Returned: Office Chair × 1\nHSN Code: 9401\nOriginal Rate: ₹3,500\nTaxable Reversal: ₹3,500\nCGST 9% Reversed: ₹315\nSGST 9% Reversed: ₹315\nCredit Note Total: ₹4,130',
      answer: 'Voucher Type: Credit Note (Sales Return)\nDebit: Sales Return A/c → ₹3,500\nDebit: CGST Output A/c (reversal) → ₹315\nDebit: SGST Output A/c (reversal) → ₹315\nCredit: M/s Priya Traders A/c → ₹4,130\n\nIn TallyPrime: Ctrl+F8 or Credit Note voucher. Link to original bill SB-2024-0001.',
      vtype: 'S'
    }
  ],
  purchase: [
    {
      title: 'Intra-state Purchase — Office Chair (18% GST, ITC)',
      preview: 'Demo Traders (TN) buys Office Chairs from Furniture Hub (TN). CGST+SGST, ITC claimable.',
      scenario: 'M/s Demo Traders (TN) purchases Office Chairs from M/s Furniture Hub (TN, GSTIN: 33GHIJK5678L1Z7). Date: 05-Jun-2024. Bill No: PB-2024-0001. Both in Tamil Nadu — intra-state, CGST + SGST. ITC is claimable.',
      task: 'Open Purchase Voucher. Enter supplier GSTIN and item details. Apply CGST + SGST. Note that these go to Input Tax Credit (ITC) ledgers — not expense.',
      data: 'Item: Office Chair × 5 Nos\nHSN Code: 9401\nRate: ₹3,200 per unit\nTaxable Amount: ₹16,000\nGST 18%: CGST 9% + SGST 9%\nCGST Input (ITC): ₹1,440\nSGST Input (ITC): ₹1,440\nGrand Total: ₹18,880',
      answer: 'Voucher Type: Purchase\nDebit: Purchase A/c → ₹16,000\nDebit: CGST Input A/c (ITC) → ₹1,440\nDebit: SGST Input A/c (ITC) → ₹1,440\nCredit: M/s Furniture Hub A/c → ₹18,880\n\nITC claimable once supplier files GSTR-1 and it reflects in your GSTR-2B.',
      vtype: 'P'
    },
    {
      title: 'Inter-state Purchase — Laptop from Delhi (IGST ITC)',
      preview: 'Demo Traders buys Laptops from Delhi. Inter-state → IGST, fully claimable as ITC.',
      scenario: 'Demo Traders purchases Laptops from M/s IT Solutions, Delhi (GSTIN: 07LMNOP3456Q1Z8). Date: 10-Jun-2024. Bill No: PB-2024-0002. Inter-state purchase — IGST applies.',
      task: 'Open Purchase Voucher. Supplier is in Delhi (DL state, code 07). Apply IGST 18% (not CGST/SGST). Claim full IGST as Input Tax Credit.',
      data: 'Item: Laptop × 3 units\nHSN Code: 8471\nRate: ₹44,000 per unit\nTaxable Amount: ₹1,32,000\nIGST 18%: ₹23,760\nGrand Total: ₹1,55,760',
      answer: 'Voucher Type: Purchase\nDebit: Purchase A/c → ₹1,32,000\nDebit: IGST Input A/c (ITC) → ₹23,760\nCredit: M/s IT Solutions Delhi A/c → ₹1,55,760\n\nIGST ITC of ₹23,760 is fully claimable. Place of Supply = Tamil Nadu (destination).',
      vtype: 'P'
    },
    {
      title: '5% GST Purchase — Wheat Flour',
      preview: 'Demo Traders buys Wheat Flour locally. 5% GST slab — CGST 2.5% + SGST 2.5%.',
      scenario: 'Demo Traders purchases Wheat Flour from a local Tamil Nadu supplier. Date: 15-Jun-2024. Bill No: PB-2024-0003. Wheat flour falls under 5% GST slab.',
      task: 'Open Purchase Voucher. Apply 5% GST — that is CGST 2.5% + SGST 2.5%. Verify the small tax amounts. ITC is claimable only for business use.',
      data: 'Item: Wheat Flour 5kg × 200 Packs\nHSN Code: 1101\nRate: ₹200 per pack\nTaxable Amount: ₹40,000\nGST 5%: CGST 2.5% + SGST 2.5%\nCGST Input: ₹1,000 | SGST Input: ₹1,000\nGrand Total: ₹42,000',
      answer: 'Voucher Type: Purchase\nDebit: Purchase A/c → ₹40,000\nDebit: CGST Input A/c → ₹1,000\nDebit: SGST Input A/c → ₹1,000\nCredit: Supplier A/c → ₹42,000\n\nNote: ITC claimable only if used for taxable business. NOT claimable for personal or exempt use.',
      vtype: 'P'
    },
    {
      title: 'Debit Note — Purchase Return (Laptop to Delhi)',
      preview: 'Demo Traders returns 2 faulty Laptops to Delhi supplier. Debit Note reverses IGST ITC.',
      scenario: 'Demo Traders returns 2 faulty Laptops to M/s IT Solutions, Delhi (from PB-2024-0002). Date: 20-Jun-2024. A Debit Note must be raised. The IGST ITC claimed earlier must be reversed.',
      task: 'Create a Debit Note voucher (Purchase Return). Reverse the IGST ITC. Link to original bill PB-2024-0002. This reduces your ITC balance.',
      data: 'Item Returned: Laptop × 2\nHSN Code: 8471\nRate: ₹44,000 each\nTaxable Reversal: ₹88,000\nIGST 18% Reversed: ₹15,840\nDebit Note Total: ₹1,03,840',
      answer: 'Voucher Type: Debit Note (Purchase Return)\nDebit: M/s IT Solutions Delhi A/c → ₹1,03,840\nCredit: Purchase Return A/c → ₹88,000\nCredit: IGST Input A/c (ITC Reversal) → ₹15,840\n\nIn TallyPrime: Ctrl+F9 or Debit Note. Link to original bill PB-2024-0002 for proper ITC adjustment.',
      vtype: 'P'
    },
    {
      title: 'Capital Goods Purchase — Machinery from Karnataka',
      preview: 'Demo Traders buys a machine from Karnataka. Capital goods — IGST ITC fully claimable same year.',
      scenario: 'Demo Traders purchases a Cutting Machine from a Karnataka supplier (GSTIN: 29UVWXY1234Z1Z6) for business expansion. Date: 25-Jun-2024. Bill: PB-2024-0005. Capital goods — full ITC claimable in same financial year.',
      task: 'Open Purchase Voucher. This is a capital goods purchase — use a Fixed Asset ledger group, not regular purchase. Claim IGST ITC. Note: asset is debited, not purchases.',
      data: 'Item: Cutting Machine (Capital Good)\nHSN Code: 8457\nRate: ₹2,50,000\nTaxable Amount: ₹2,50,000\nIGST 18% (inter-state from Karnataka): ₹45,000\nGrand Total: ₹2,95,000',
      answer: 'Voucher Type: Purchase (Capital Goods)\nDebit: Machinery A/c (Fixed Assets) → ₹2,50,000\nDebit: IGST Input A/c (ITC) → ₹45,000\nCredit: Karnataka Supplier A/c → ₹2,95,000\n\nIn TallyPrime: Ledger group = Fixed Assets. Full ITC of ₹45,000 claimable in same financial year.',
      vtype: 'P'
    }
  ],
  gst: [
    {
      title: 'Construct GSTIN — Tamil Nadu Trader (Manual Decoding)',
      preview: 'Build a GSTIN from scratch for a new TN trader. Understand each part of the 15-char format.',
      scenario: 'A new trader in Tamil Nadu is applying for GST registration. Their PAN is ABCDE1234F. They are the first entity registering under this PAN. You must understand and construct their GSTIN step by step.',
      task: 'Use the GST Generator below to generate a Tamil Nadu GSTIN. Then manually decode each part: state code, PAN, entity number, Z, checksum. Enter it in TallyPrime under F11 > GST > Company GSTIN.',
      data: 'State: Tamil Nadu → Code: 33\nPAN: ABCDE1234F (10 characters)\nEntity Number: 1 (first registration)\nDefault Character: Z\nChecksum Digit: 5 (sample)\nFull GSTIN: 33ABCDE1234F1Z5\nTotal length: 15 characters',
      answer: 'GSTIN = [33] + [ABCDE1234F] + [1] + [Z] + [5]\n→ 2 state code + 10 PAN + 1 entity no + Z + 1 checksum = 15 chars\n\nIn TallyPrime: F11 (Features) > Statutory & Taxation > GST > Enter GSTIN in Company GST Details.\nVerify: First 2 digits must match state code. PAN must match PAN card.',
      vtype: 'GST'
    },
    {
      title: 'Intra-state vs Inter-state — Identify Tax Type',
      preview: 'Two sales on same day — one TN to TN, one TN to Kerala. Identify CGST+SGST vs IGST.',
      scenario: 'A business has two sales on the same day: (1) Sells goods from Tamil Nadu to a Tamil Nadu customer. (2) Sells goods from Tamil Nadu to a Kerala customer. They need to know which tax applies to each.',
      task: 'For each transaction, identify if it is intra-state or inter-state and which tax applies. Create two separate sales vouchers with the correct tax type for each.',
      data: 'Sale 1: TN Seller → TN Buyer\nType: INTRA-STATE\nTax: CGST 9% + SGST 9%\n---\nSale 2: TN Seller → Kerala Buyer\nType: INTER-STATE\nTax: IGST 18%\nKerala State Code: 32 (KL)',
      answer: 'Sale 1: Same state → CGST + SGST. Place of Supply = Tamil Nadu (auto-selected).\nSale 2: Different states → IGST only. Place of Supply = Kerala (KL, code 32).\n\nNEVER mix CGST+SGST with IGST in the same invoice.\nIn TallyPrime: Under Statutory Details of voucher, set Place of Supply correctly. Tally auto-applies the right tax.',
      vtype: 'GST'
    },
    {
      title: 'Decode GSTIN — Identify State and PAN from GSTIN',
      preview: 'Given GSTIN 27PQRST5678H1Z2 — decode state, PAN, entity. Verify before entering in Tally.',
      scenario: 'Your accounts team received a purchase invoice from a supplier with GSTIN: 27PQRST5678H1Z2. Before entering it in TallyPrime, you must verify which state this supplier is from and extract their PAN.',
      task: 'Decode the GSTIN manually. Identify the state name, PAN, and entity number. Then verify in TallyPrime by entering this GSTIN in the supplier ledger master.',
      data: 'GSTIN: 27PQRST5678H1Z2\nFirst 2 digits: 27 → Maharashtra\nNext 10 chars: PQRST5678H → PAN\nEntity No: 1 (first registration)\nDefault: Z\nChecksum: 2',
      answer: 'State Code 27 = Maharashtra\nPAN: PQRST5678H (verify against supplier PAN card)\nEntity: 1st registration under this PAN\n\nIn TallyPrime: Ledger Master > Party Ledger > GST Registration Details > Enter GSTIN.\nTally auto-validates format and fills state name.\nFor inter-state purchases from Maharashtra to TN → IGST applies.',
      vtype: 'GST'
    },
    {
      title: 'GST Rate Classification — Match Items to Slabs',
      preview: 'Classify Rice, Flour, Paper, Laptop, Chair, Cement under correct GST slabs (0/5/12/18/28%).',
      scenario: 'A business buys and sells multiple items and needs to classify them under correct GST slabs before entering in TallyPrime stock item master. Wrong GST rate = wrong tax = compliance penalty.',
      task: 'Match each item in the data box to the correct GST slab. Then open TallyPrime Stock Item Master (Alt+G > Create Stock Item) and set the correct GST rate and HSN for each.',
      data: 'Rice (unbranded) → 0% NIL\nWheat Flour (5kg pack) → 5%\nPrinter Paper A4 → 12%\nElectric Fan → 12%\nMobile Phone → 18%\nOffice Chair → 18%\nLaptop → 18%\nCement Bag → 28%',
      answer: 'In TallyPrime Stock Item Master:\nSet HSN code + GST rate for each item.\nTally auto-calculates CGST/SGST/IGST based on rate set in master.\n\nWrong rate in master → all bills carry wrong tax → must file revised returns.\nAlways cross-check HSN on gst.gov.in > Search HSN/SAC before creating stock items.',
      vtype: 'GST'
    },
    {
      title: 'ITC Eligibility — What Can You Claim as Input Tax Credit?',
      preview: 'Three purchases this month — office furniture, owner groceries, production machine. Which gets ITC?',
      scenario: 'Demo Traders made three purchases this month: (1) Office furniture for the office, (2) Groceries for the owner\'s personal home, (3) A machine used to produce taxable goods. ITC eligibility differs for each.',
      task: 'Determine ITC eligibility for each purchase. Enter eligible ones as Purchase Vouchers with ITC ledgers. Book non-eligible ones under expense (no ITC).',
      data: 'Purchase 1: Office Chair (for office/business use)\n→ ITC: ELIGIBLE ✓ — Claim CGST/SGST Input\n---\nPurchase 2: Groceries (owner personal use)\n→ ITC: NOT ELIGIBLE ✗ — Book as expense\n---\nPurchase 3: Production Machine (capital good)\n→ ITC: ELIGIBLE ✓ — Capital Goods ITC',
      answer: 'Purchase 1 — Business use: CGST Input + SGST Input ledgers, fully claimable.\nPurchase 2 — Personal use: NOT claimable. Debit Purchases/Expense, no input ledger. Tax is a cost.\nPurchase 3 — Capital goods: Debit Machinery A/c (Fixed Asset) + IGST Input. Full ITC in same year.\n\nIn TallyPrime: For non-ITC, set "ITC Not Applicable" in GST details of the purchase ledger.',
      vtype: 'P'
    }
  ],
  irn: [
    {
      title: 'IRN Mandatory Check — Which Business Needs E-Invoice?',
      preview: 'Three businesses with turnover ₹3Cr, ₹7Cr, ₹50L — who must generate IRN?',
      scenario: 'Three businesses ask whether they need IRN (e-invoice) for their sales: (A) Annual turnover ₹3 crore, (B) Annual turnover ₹7 crore, (C) Annual turnover ₹50 lakh.',
      task: 'Determine which business must generate IRN. For the mandatory case, describe the TallyPrime process. Use the IRN Generator below to create a practice IRN for that business.',
      data: 'IRN Mandatory Threshold: ₹5 Crore/year (Aug 2023 onwards)\nBusiness A: ₹3 Cr → NOT mandatory\nBusiness B: ₹7 Cr → MANDATORY\nBusiness C: ₹50 Lakh → NOT mandatory\nIRP Portal: einvoice1.gst.gov.in',
      answer: 'Only Business B (₹7 Cr turnover) must generate IRN.\n\nProcess in TallyPrime:\n1. Create Sales Voucher → Accept (Ctrl+A)\n2. Press Ctrl+I → e-Invoice option appears\n3. Upload to IRP portal → system returns 64-char IRN + QR code\n4. Print invoice — IRN and QR auto-embeds\n\nPractice: Generate a fake IRN using the IRN Generator below.',
      vtype: 'IRN'
    },
    {
      title: 'Analyse an IRN — Real vs Fake / Practice',
      preview: 'Two IRNs given: one 19-char fake, one 64-char real SHA-256 hash. Identify which is valid.',
      scenario: 'An auditor shows two IRNs from company records:\nIRN 1: 454646554ab3x9kz12m (19 characters)\nIRN 2: a5d84f2e1c09b37a8e0d6f2c4a1b9e3d7f5c8a2b4d6e0f1a3c5b7d9e1f2a4c6 (64 characters)\nThe auditor asks which is valid and why.',
      task: 'Examine both IRNs. Identify which is real/valid. Explain the structure differences. Generate a practice IRN below and compare its length with a real IRN format.',
      data: 'IRN 1: 454646554ab3x9kz12m\nLength: 19 chars → FAKE (practice/learning format)\nPrefix: 454646554 (9 fixed digits)\nSuffix: 10 random alphanumeric\n---\nIRN 2: a5d84f2e1c09b37a8e0d6f2c4a1b9e3d...\nLength: 64 chars → REAL\nFormat: SHA-256 hash (hexadecimal)\nGenerated by: IRP Portal (signed)',
      answer: 'IRN 1 is FAKE (practice only) — 19 chars, used in TallyLearn for learning.\nIRN 2 is REAL — 64-char SHA-256 hash, digitally signed by IRP.\n\nIn TallyPrime: Real IRN is never typed manually. It is fetched automatically from the IRP portal after uploading invoice JSON via Ctrl+I.\nFake IRN is only for practice/training environments like this one.',
      vtype: 'IRN'
    },
    {
      title: 'IRN Cancellation — Wrong GSTIN Entered After IRN Generated',
      preview: 'Wrong buyer GSTIN on a bill that already has an IRN. Can it be corrected? What is the process?',
      scenario: 'An accountant generated IRN for Sales Bill SB-2024-0010 but entered the wrong buyer GSTIN. The IRN is already generated. The accountant wants to correct the invoice without creating a new bill number.',
      task: 'Determine: Can IRN be amended? What is the correct procedure? What is the cancellation time window? Practice the correct steps using the entry form below.',
      data: 'Original IRN: 454646554xxxxxxxx01 (fake)\nError: Wrong Buyer GSTIN entered\nIRN Amendment: NOT ALLOWED (IRN is final once generated)\nCancellation Window: Within 24 hours of IRN generation\nCorrect Steps:\n1. Cancel IRN via IRP within 24 hrs\n2. Cancel voucher in Tally\n3. Create new bill + new IRN',
      answer: 'IRN CANNOT be edited or amended — it is a cryptographic hash of invoice data.\n\nStep 1: Login to IRP portal → Cancel the IRN within 24 hours.\nStep 2: In TallyPrime, open original voucher → Alt+X to cancel.\nStep 3: Create new Sales Voucher with correct buyer GSTIN.\nStep 4: Generate fresh IRN for the corrected invoice.\n\nAlways verify party GSTIN before generating IRN. Use F5 Generate in TallyLearn to practice.',
      vtype: 'S'
    },
    {
      title: 'QR Code on E-Invoice — What Data is Encoded?',
      preview: 'Tax officer scans QR code on e-invoice during audit. List all 9 fields encoded in the QR.',
      scenario: 'A tax officer scans the QR code on an e-invoice during a business audit. They want to know what information is inside the QR code and whether it matches the printed invoice values.',
      task: 'List all fields that appear in the QR code of a valid e-invoice. After generating an IRN below, describe where the QR code would appear on the printed invoice in TallyPrime.',
      data: 'QR Code Contains (9 fields):\n1. Supplier GSTIN\n2. Buyer GSTIN\n3. Invoice Number\n4. Invoice Date\n5. Invoice Value (Grand Total)\n6. HSN Code (main item)\n7. IRN (64-char hash)\n8. IRN Generation Date and Time\n9. Digital Signature of IRP',
      answer: 'The QR code is a digitally signed JSON with 9 key fields above.\nIt allows tax officials to verify invoice authenticity OFFLINE — scan and compare with printed values.\n\nIn TallyPrime: After IRN generation → Print Preview → QR code auto-embeds at top-right of invoice.\nIf QR code is missing: IRN was not properly generated. Regenerate via Ctrl+I.',
      vtype: 'IRN'
    },
    {
      title: 'Bulk IRN — Day-End E-Invoice Process for Multiple Bills',
      preview: 'A business issues 15 invoices in one day. How to generate bulk IRN in TallyPrime? Practice 10.',
      scenario: 'A business with ₹8 Cr turnover issues 15 invoices in a single day. The accountant needs to generate IRN for all 15 at end of day. Some invoices are intra-state, some inter-state.',
      task: 'Describe the bulk IRN generation process in TallyPrime. Use the IRN Generator below to create 10 practice IRNs. Understand which types of invoices need IRN.',
      data: 'All 15 invoices need IRN (turnover > ₹5 Cr)\nIntra-state invoices: CGST+SGST → IRN required\nInter-state invoices: IGST → IRN required\nB2C small invoices (<₹250): IRN optional\nBulk method: JSON export from Tally → IRP portal',
      answer: 'Bulk IRN process in TallyPrime:\n1. Gateway → E-Invoice → Generate in Bulk\n2. Select all pending vouchers (unprocessed)\n3. Export as JSON file\n4. Upload JSON to IRP portal (einvoice1.gst.gov.in)\n5. Portal returns IRN + QR for each invoice\n6. Tally auto-updates vouchers with received IRNs\n\nPractice: Click "Generate 10 IRNs" in the IRN Generator to see bulk fake IRNs.',
      vtype: 'IRN'
    }
  ]
};

/* ─────────────────────────────────────────
   PRACTICE QUESTIONS — RENDER
───────────────────────────────────────── */
let activePQCat = 'sales';

function renderPractice() {
  document.getElementById('content-area').innerHTML = `
    <div class="pq-wrap">
      <div class="pq-main-head">
        PRACTICE QUESTIONS — Click a question to expand. Entry form opens below the question.
      </div>
      <div class="pq-cat-bar">
        <button class="pcat-btn active" onclick="switchPQCat('sales', this)">Sales (5)</button>
        <button class="pcat-btn" onclick="switchPQCat('purchase', this)">Purchase (5)</button>
        <button class="pcat-btn" onclick="switchPQCat('gst', this)">GST (5)</button>
        <button class="pcat-btn" onclick="switchPQCat('irn', this)">IRN (5)</button>
      </div>
      <div id="pq-list"></div>
    </div>
  `;
  activePQCat = 'sales';
  renderPQList();
}

function switchPQCat(cat, btn) {
  activePQCat = cat;
  document.querySelectorAll('.pcat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPQList();
}

function renderPQList() {
  const questions = PRACTICE_QUESTIONS[activePQCat] || [];
  document.getElementById('pq-list').innerHTML = questions.map((q, i) => `
    <div class="pq-card" id="pqcard-${i}">

      <!-- Clickable header -->
      <div class="pq-header" id="pqhdr-${i}" onclick="togglePQ(${i})">
        <div class="pq-num-badge">Q${i + 1}</div>
        <div class="pq-preview-text">
          <b>${q.title}</b>
          <div class="pq-preview-sub">${q.preview}</div>
        </div>
        <div class="pq-arrow" id="pqarrow-${i}">▶</div>
      </div>

      <!-- Expandable body -->
      <div class="pq-body" id="pqbody-${i}">
        <div class="pq-scenario-full">${q.scenario}</div>
        <div class="pq-task-box"><b>Your Task:</b> ${q.task}</div>
        <div class="pq-data-box">${q.data.split('\n').join('<br />')}</div>

        <div class="pq-action-bar">
          <button class="pq-action-btn" onclick="openInlineEntry(${i})">
            ▶ Open ${q.vtype === 'P' ? 'Purchase' : q.vtype === 'GST' ? 'GST Generator' : q.vtype === 'IRN' ? 'IRN Generator' : 'Sales'} Entry Form
          </button>
          <button class="pq-action-btn show-ans" id="ansbtn-${i}" onclick="toggleAnswer(${i})">
            Show Answer / Journal Entry
          </button>
        </div>

        <div class="pq-answer-box" id="pqans-${i}">
          <div class="ans-hdr">JOURNAL ENTRY &amp; TALLY STEPS</div>
          ${q.answer.split('\n').join('<br />')}
        </div>

        <!-- Inline entry form renders here -->
        <div id="pqentry-${i}"></div>
      </div>

    </div>
  `).join('');
}

function togglePQ(i) {
  const body   = document.getElementById(`pqbody-${i}`);
  const header = document.getElementById(`pqhdr-${i}`);
  const arrow  = document.getElementById(`pqarrow-${i}`);
  const isOpen = body.classList.contains('show');

  // Close all
  document.querySelectorAll('.pq-body').forEach(b => b.classList.remove('show'));
  document.querySelectorAll('.pq-header').forEach(h => h.classList.remove('open'));
  document.querySelectorAll('.pq-arrow').forEach(a => { a.classList.remove('open'); a.textContent = '▶'; });

  if (!isOpen) {
    body.classList.add('show');
    header.classList.add('open');
    arrow.classList.add('open');
    arrow.textContent = '▼';
    document.getElementById(`pqcard-${i}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function toggleAnswer(i) {
  const box = document.getElementById(`pqans-${i}`);
  const btn = document.getElementById(`ansbtn-${i}`);
  const showing = box.classList.contains('show');
  box.classList.toggle('show', !showing);
  btn.textContent = showing ? 'Show Answer / Journal Entry' : 'Hide Answer';
}

/* ─────────────────────────────────────────
   INLINE ENTRY FORM (inside practice question)
───────────────────────────────────────── */

// Each question gets its own items array
const inlineItems = {};

function openInlineEntry(qi) {
  const q = PRACTICE_QUESTIONS[activePQCat][qi];
  const container = document.getElementById(`pqentry-${qi}`);

  // Toggle: if already open, close it
  if (container.innerHTML.trim() !== '') {
    container.innerHTML = '';
    return;
  }

  if (q.vtype === 'GST') {
    container.innerHTML = gstInlineHTML(qi);
    return;
  }
  if (q.vtype === 'IRN') {
    container.innerHTML = irnInlineHTML(qi);
    return;
  }

  // Sales or Purchase voucher
  inlineItems[qi] = [{ name: '', hsn: '', qty: 1, price: 0, gst: 18, tax: 0, cgst: 0, sgst: 0, tot: 0 }];
  const bno    = nextBillNo(q.vtype);
  const pLabel = q.vtype === 'S' ? 'Customer' : 'Supplier';

  container.innerHTML = `
    <div class="pq-entry-wrap">
      <div class="pq-entry-head">
        ${q.vtype === 'S' ? 'SALES' : 'PURCHASE'} VOUCHER — Practice Entry for Q${qi + 1}
        <span class="close-entry-btn" onclick="document.getElementById('pqentry-${qi}').innerHTML=''">✕ Close Form</span>
      </div>

      <div class="tfield section-row">
        <div class="tf-label">Voucher Type</div>
        <div class="tf-value" style="padding:4px 8px; font-weight:700; color:#1c3a5e;">
          ${q.vtype === 'S' ? 'Sales' : 'Purchase'}
        </div>
      </div>
      <div class="tfield">
        <div class="tf-label">Voucher No.</div>
        <div class="tf-colon">:</div>
        <div class="tf-value"><input id="ie-vno-${qi}" value="${bno}" style="font-weight:700;" /></div>
      </div>
      <div class="tfield">
        <div class="tf-label">Date</div>
        <div class="tf-colon">:</div>
        <div class="tf-value"><input id="ie-date-${qi}" type="date" value="${todayISO()}" /></div>
      </div>

      <div class="tfield section-row">
        <div class="tf-label">Our Company</div>
      </div>
      <div class="tfield">
        <div class="tf-label">Company Name</div>
        <div class="tf-colon">:</div>
        <div class="tf-value"><input id="ie-co-${qi}" value="Demo Traders Pvt Ltd" /></div>
      </div>
      <div class="tfield">
        <div class="tf-label">Our GSTIN</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="ie-ogst-${qi}" placeholder="Enter or press Generate" />
          <button class="gen-btn" onclick="document.getElementById('ie-ogst-${qi}').value = genGSTIN('TN')">F5 Gen</button>
        </div>
      </div>

      <div class="tfield section-row">
        <div class="tf-label">${pLabel} Details</div>
      </div>
      <div class="tfield">
        <div class="tf-label">${pLabel} Name</div>
        <div class="tf-colon">:</div>
        <div class="tf-value"><input id="ie-party-${qi}" placeholder="Enter ${pLabel.toLowerCase()} name..." /></div>
      </div>
      <div class="tfield">
        <div class="tf-label">Party GSTIN</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="ie-pgst-${qi}" placeholder="Enter or generate" />
          <button class="gen-btn" onclick="document.getElementById('ie-pgst-${qi}').value = genGSTIN(document.getElementById('ie-pst-${qi}').value || 'TN')">F5 Gen</button>
        </div>
      </div>
      <div class="tfield">
        <div class="tf-label">Party State</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <select id="ie-pst-${qi}" style="font-size:11px; color:#00008b;">${stateOptions('TN')}</select>
        </div>
      </div>

      <div class="tfield section-row">
        <div class="tf-label">Stock Items</div>
        <div class="tf-note">ENTER ITEM · HSN · QTY · RATE · GST%</div>
      </div>

      <div class="itbl-wrap">
        <table class="itbl">
          <thead>
            <tr>
              <th style="width:24px">#</th>
              <th style="width:155px">Item</th>
              <th style="width:58px">HSN</th>
              <th style="width:38px">Qty</th>
              <th style="width:76px" class="num">Rate</th>
              <th style="width:82px" class="num">Taxable</th>
              <th style="width:42px" class="num">GST%</th>
              <th style="width:78px" class="num">CGST</th>
              <th style="width:78px" class="num">SGST</th>
              <th style="width:82px" class="num">Total</th>
              <th style="width:18px"></th>
            </tr>
          </thead>
          <tbody id="ie-tbody-${qi}"></tbody>
        </table>
      </div>
      <button class="add-row-btn" onclick="ieAddRow(${qi})">+ Add Item Row</button>

      <div class="totals-bar">
        <div class="tot-cell"><div class="tot-label">TAXABLE</div><div class="tot-val" id="ie-tt-${qi}">₹0.00</div></div>
        <div class="tot-cell"><div class="tot-label">CGST</div><div class="tot-val" id="ie-tc-${qi}">₹0.00</div></div>
        <div class="tot-cell"><div class="tot-label">SGST</div><div class="tot-val" id="ie-ts-${qi}">₹0.00</div></div>
        <div class="tot-cell"><div class="tot-label">GRAND TOTAL</div><div class="tot-val grand" id="ie-tg-${qi}">₹0.00</div></div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" onclick="ieSave(${qi}, '${q.vtype}')">Ctrl+A &nbsp; Save &amp; Generate IRN</button>
        <button class="btn btn-secondary" onclick="ieAddRow(${qi})">F6 &nbsp; Add Row</button>
        <button class="btn btn-danger" onclick="document.getElementById('pqentry-${qi}').innerHTML=''">✕ Close</button>
      </div>
      <div id="ie-sout-${qi}"></div>
    </div>
  `;

  setupFieldFocus(`pqentry-${qi}`);
  ieRenderRows(qi);
}

function gstInlineHTML(qi) {
  return `
    <div class="pq-entry-wrap">
      <div class="pq-entry-head">
        GST GENERATOR — Practice for Q${qi + 1}
        <span class="close-entry-btn" onclick="document.getElementById('pqentry-${qi}').innerHTML=''">✕ Close</span>
      </div>
      <div class="tfield">
        <div class="tf-label">Select State</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <select id="ig-st-${qi}" onchange="document.getElementById('ig-out-${qi}').value = genGSTIN(this.value)"
            style="font-size:11px; color:#00008b;">
            ${stateOptions('TN')}
          </select>
        </div>
      </div>
      <div class="tfield">
        <div class="tf-label">Generated GSTIN</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="ig-out-${qi}" readonly value="${genGSTIN('TN')}"
            style="font-weight:700; font-size:12px; letter-spacing:2px; color:#00008b;" />
          <button class="gen-btn" onclick="document.getElementById('ig-out-${qi}').value = genGSTIN(document.getElementById('ig-st-${qi}').value)">
            F5 Generate
          </button>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" onclick="document.getElementById('ig-out-${qi}').value = genGSTIN(document.getElementById('ig-st-${qi}').value)">Generate</button>
        <button class="btn btn-danger" onclick="document.getElementById('pqentry-${qi}').innerHTML=''">✕ Close</button>
      </div>
    </div>
  `;
}

function irnInlineHTML(qi) {
  return `
    <div class="pq-entry-wrap">
      <div class="pq-entry-head">
        IRN GENERATOR — Practice for Q${qi + 1}
        <span class="close-entry-btn" onclick="document.getElementById('pqentry-${qi}').innerHTML=''">✕ Close</span>
      </div>
      <div class="tfield">
        <div class="tf-label">Bill Reference</div>
        <div class="tf-colon">:</div>
        <div class="tf-value"><input id="ii-ref-${qi}" placeholder="e.g. SB-2024-0001" style="font-size:11px; color:#00008b;" /></div>
      </div>
      <div class="tfield">
        <div class="tf-label">Generated IRN</div>
        <div class="tf-colon">:</div>
        <div class="tf-value">
          <input id="ii-out-${qi}" readonly value="${genIRN()}"
            style="font-weight:700; font-size:12px; letter-spacing:2px; color:#553300; font-family:'Courier New';" />
          <button class="gen-btn" onclick="document.getElementById('ii-out-${qi}').value = genIRN()">F5 Regen</button>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" onclick="document.getElementById('ii-out-${qi}').value = genIRN()">Regenerate IRN</button>
        <button class="btn btn-secondary" onclick="irnInlineBulk(${qi})">Generate 10</button>
        <button class="btn btn-danger" onclick="document.getElementById('pqentry-${qi}').innerHTML=''">✕ Close</button>
      </div>
      <div id="ii-bulk-${qi}"></div>
    </div>
  `;
}

function irnInlineBulk(qi) {
  const rows = Array.from({ length: 10 }, (_, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="text-amber font-mono" style="letter-spacing:1px; font-size:11px;">${genIRN()}</td>
      <td style="color:#888; font-size:10px;">${new Date().toLocaleTimeString()}</td>
    </tr>
  `).join('');
  document.getElementById(`ii-bulk-${qi}`).innerHTML = `
    <table class="state-ref-tbl" style="margin:0;">
      <thead><tr><th>#</th><th>IRN (Fake)</th><th>Time</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/* ─── Inline Items Table Logic ─── */
function ieCalcItem(it) {
  it.tax  = it.qty * it.price;
  it.cgst = it.tax * it.gst / 200;
  it.sgst = it.tax * it.gst / 200;
  it.tot  = it.tax + it.cgst + it.sgst;
}

function ieGrandTotals(qi) {
  const its = inlineItems[qi] || [];
  return {
    tax:  its.reduce((s, x) => s + x.tax,  0),
    cgst: its.reduce((s, x) => s + x.cgst, 0),
    sgst: its.reduce((s, x) => s + x.sgst, 0),
    tot:  its.reduce((s, x) => s + x.tot,  0)
  };
}

function ieRenderRows(qi) {
  const tbody = document.getElementById(`ie-tbody-${qi}`);
  if (!tbody) return;
  const its = inlineItems[qi] || [];

  tbody.innerHTML = its.map((it, j) => `
    <tr>
      <td class="num">${j + 1}</td>
      <td>
        <input list="ie-pdl-${qi}" value="${it.name}" placeholder="Item..."
          onchange="ieSetProduct(${qi}, ${j}, this.value)"
          style="width:150px;" />
        <datalist id="ie-pdl-${qi}">
          ${PRODUCTS.map(p => `<option value="${p.n}">`).join('')}
        </datalist>
      </td>
      <td><input value="${it.hsn}" onchange="inlineItems[${qi}][${j}].hsn = this.value" style="width:52px;" placeholder="HSN" /></td>
      <td><input type="number" value="${it.qty}" min="0" onchange="inlineItems[${qi}][${j}].qty = +this.value; ieRecalc(${qi}, ${j})" style="width:34px;" /></td>
      <td class="num"><input type="number" value="${it.price || ''}" placeholder="0" onchange="inlineItems[${qi}][${j}].price = +this.value; ieRecalc(${qi}, ${j})" style="width:70px; text-align:right;" /></td>
      <td class="num" style="color:#333;">${it.tax ? fmt(it.tax) : '—'}</td>
      <td class="num">
        <select onchange="inlineItems[${qi}][${j}].gst = +this.value; ieRecalc(${qi}, ${j})"
          style="border:none; background:transparent; font-size:11px; color:#00008b; width:40px;">
          ${[0, 5, 12, 18, 28].map(r => `<option value="${r}"${it.gst === r ? ' selected' : ''}>${r}%</option>`).join('')}
        </select>
      </td>
      <td class="num" style="color:#1c3a5e;">${it.cgst ? fmt(it.cgst) : '—'}</td>
      <td class="num" style="color:#1c3a5e;">${it.sgst ? fmt(it.sgst) : '—'}</td>
      <td class="num text-green fw-bold">${it.tot ? fmt(it.tot) : '—'}</td>
      <td style="text-align:center;">
        <span onclick="ieDeleteRow(${qi}, ${j})" style="cursor:pointer; color:#880000; font-size:14px;">×</span>
      </td>
    </tr>
  `).join('');

  const g = ieGrandTotals(qi);
  [['ie-tt', g.tax], ['ie-tc', g.cgst], ['ie-ts', g.sgst], ['ie-tg', g.tot]].forEach(([id, val]) => {
    const el = document.getElementById(`${id}-${qi}`);
    if (el) el.textContent = fmt(val);
  });
}

function ieSetProduct(qi, j, val) {
  inlineItems[qi][j].name = val;
  const p = PRODUCTS.find(x => x.n === val);
  if (p) { inlineItems[qi][j].hsn = p.h; inlineItems[qi][j].gst = p.g; inlineItems[qi][j].price = p.p; }
  ieRecalc(qi, j);
}

function ieRecalc(qi, j) {
  ieCalcItem(inlineItems[qi][j]);
  ieRenderRows(qi);
}

function ieAddRow(qi) {
  if (!inlineItems[qi]) inlineItems[qi] = [];
  inlineItems[qi].push({ name: '', hsn: '', qty: 1, price: 0, gst: 18, tax: 0, cgst: 0, sgst: 0, tot: 0 });
  ieRenderRows(qi);
  setTimeout(() => {
    const rows = document.querySelectorAll(`#ie-tbody-${qi} tr`);
    rows[rows.length - 1]?.querySelector('input')?.focus();
  }, 30);
}

function ieDeleteRow(qi, j) {
  if (inlineItems[qi].length > 1) {
    inlineItems[qi].splice(j, 1);
    ieRenderRows(qi);
  }
}

function ieSave(qi, type) {
  const party = document.getElementById(`ie-party-${qi}`)?.value || 'Unknown Party';
  const bno   = document.getElementById(`ie-vno-${qi}`)?.value;
  const date  = document.getElementById(`ie-date-${qi}`)?.value || todayISO();
  const g     = ieGrandTotals(qi);
  const irn   = genIRN();

  bills.push({ t: type, no: bno, party, date, taxable: g.tax, gst: g.cgst + g.sgst, total: g.tot, irn });

  const sout = document.getElementById(`ie-sout-${qi}`);
  sout.innerHTML = `
    <div class="saved-grid">
      <div class="saved-box">
        <div class="saved-lbl">✓ VOUCHER SAVED</div>
        <div style="font-size:11px; color:#004400; line-height:1.9;">
          No: <b>${bno}</b> &nbsp;|&nbsp; ${party}<br>
          Taxable: <b>${fmt(g.tax)}</b> &nbsp; GST: <b>${fmt(g.cgst + g.sgst)}</b><br>
          Grand Total: <b>${fmt(g.tot)}</b>
        </div>
      </div>
      <div class="irn-box">
        <div class="irn-lbl">IRN GENERATED (FAKE)</div>
        <div class="irn-val">${irn}</div>
        <div style="font-size:9px; color:#885500;">${new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────
   KEYBOARD — Tab / F5 / F6 handlers
───────────────────────────────────────── */
function tabNext(event, nextId) {
  if (event.key === 'Tab' || event.key === 'Enter') {
    event.preventDefault();
    const el = document.getElementById(nextId);
    if (el) { el.focus(); if (el.select) el.select(); }
  }
  if (event.key === 'F6') {
    event.preventDefault();
    addBillRow();
  }
}

function gstKeyHandler(event, fieldId, stateFieldId, nextId) {
  if (event.key === 'F5') {
    event.preventDefault();
    const stEl = document.getElementById(stateFieldId);
    document.getElementById(fieldId).value = genGSTIN(stEl ? stEl.value : 'TN');
  }
  if (nextId) tabNext(event, nextId);
}

/* ─────────────────────────────────────────
   FOCUS HIGHLIGHT — Tally style blue row
───────────────────────────────────────── */
function setupFieldFocus(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.tfield input, .tfield select').forEach(el => {
    el.addEventListener('focus', function () {
      container.querySelectorAll('.tfield').forEach(r => r.classList.remove('focused'));
      this.closest('.tfield')?.classList.add('focused');
    });
    el.addEventListener('blur', function () {
      this.closest('.tfield')?.classList.remove('focused');
    });
  });
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  // Set today's date in menu bar
  document.getElementById('mb-date').textContent = todayDisplay();

  // Sidebar navigation clicks
  document.querySelectorAll('.sb-item').forEach(el => {
    el.addEventListener('click', function () {
      navigate(this.dataset.page);
    });
  });

  // Keyboard shortcut: Ctrl+A to save bill if on bill page
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'a') {
      const saveBtn = document.querySelector('#bill-save-out')
        ? document.querySelector('.btn-primary')
        : null;
      if (saveBtn) { e.preventDefault(); saveBtn.click(); }
    }
  });

  // Load dashboard
  navigate('dashboard');
});

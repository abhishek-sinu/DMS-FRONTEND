// Receipt template + helper for ISKCON Donation Management
// Generates a printable receipt (Donor copy + Office copy) matching the
// official ISKCON Hyderabad format. Opens a print window so the user can
// save it as a PDF or print it directly — no extra dependencies required.

// --- Default temple / trust details ---
// These are used as a fallback when saved Temple Settings are not available.
// The values can be edited from the Temple Settings screen and are passed in
// to downloadDonationReceipt() so the receipt always reflects saved settings.
const DEFAULT_TEMPLE = {
  name: 'INTERNATIONAL SOCIETY FOR KRISHNA CONSCIOUSNESS (ISKCON)',
  founder: 'Founder Acharya: His Divine Grace A.C. Bhaktivedanta Swami Prabhupada',
  headOffice: '(Head Office: Hare Krishna Land, Juhu, Mumbai - 400 049)',
  address:
    'Temple : Hare Krishna Land, 5-4-743-745, Nampally Station Road, Opp. G Pulla Reddy Sweets Shop, Abids, Hyderabad, Telangana, India 500001',
  phones: 'Phone Nos: 9182822719 / 9849104991',
  email: 'Email id : iskconhyddonations@gmail.com',
  registration:
    '(Registered under Bombay Public Trusts Act Vide Registration No. F2179(Bom), PAN-AAATI0017P)',
  logoUrl: '/logo.png',
  bank: 'RAZORPAY',
  branch: '',
};

// Normalise saved settings (snake_case from the API) into the shape the
// template uses, falling back to the defaults for any missing field.
function resolveTemple(settings) {
  if (!settings) return { ...DEFAULT_TEMPLE };
  const pick = (camel, snake) =>
    settings[camel] ?? settings[snake] ?? DEFAULT_TEMPLE[camel];
  return {
    name: pick('name', 'name'),
    founder: pick('founder', 'founder'),
    headOffice: pick('headOffice', 'head_office'),
    address: pick('address', 'address'),
    phones: pick('phones', 'phones'),
    email: pick('email', 'email'),
    registration: pick('registration', 'registration'),
    logoUrl: pick('logoUrl', 'logo_url') || '/logo.png',
    bank: pick('bank', 'bank'),
    branch: pick('branch', 'branch'),
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Indian-system number to words (rupees + paise) ---
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitsToWords(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? ' ' + ONES[o] : '');
}

function threeDigitsToWords(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let str = '';
  if (h) str += ONES[h] + ' Hundred';
  if (rest) str += (str ? ' ' : '') + twoDigitsToWords(rest);
  return str;
}

function integerToWords(num) {
  if (num === 0) return 'Zero';
  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  if (crore) words += integerToWords(crore) + ' Crore ';
  if (lakh) words += twoDigitsToWords(lakh) + ' Lakh ';
  if (thousand) words += twoDigitsToWords(thousand) + ' Thousand ';
  if (hundred) words += threeDigitsToWords(hundred);
  return words.trim();
}

export function amountInWords(amount) {
  const num = Number(amount) || 0;
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  const rupeeWords = integerToWords(rupees) || 'Zero';
  const paiseWords = paise === 0 ? 'Zero' : twoDigitsToWords(paise);
  return `${rupeeWords} And ${paiseWords} Paise Only`;
}

// Build a single donor address line from donor record (falls back gracefully)
function buildAddress(donor) {
  if (!donor) return '';
  const parts = [
    donor.address_house,
    donor.address_city,
    donor.address_state,
    donor.address_house || donor.address_city ? 'India' : '',
    donor.address_pin,
  ].filter(Boolean);
  if (parts.length) return parts.join(' , ');
  return donor.address || '';
}

function copyHtml(title, donation, donor, TEMPLE) {
  const date = formatDate(donation.transaction_date);
  const amount = Number(donation.amount) || 0;
  const address = escapeHtml(buildAddress(donor));
  const pan = escapeHtml(donor && donor.pan_card ? donor.pan_card : '');
  const words = escapeHtml(amountInWords(amount));

  return `
  <div class="receipt">
    <div class="header">
      <img src="${TEMPLE.logoUrl}" class="logo" alt="ISKCON" onerror="this.style.display='none'"/>
      <div class="head-text">
        <div class="temple-name">${TEMPLE.name}</div>
        <div class="founder">${TEMPLE.founder}</div>
        <div class="line">${TEMPLE.headOffice}</div>
      </div>
    </div>
    <div class="sub">${TEMPLE.address} ${TEMPLE.phones} ${TEMPLE.email}</div>
    <div class="sub">${TEMPLE.registration}</div>

    <div class="title-row">
      <span class="rtitle">${title}</span>
      <span class="rdate">Date: <b>${date}</b></span>
    </div>

    <div class="row"><span>Receipt No: <b>${escapeHtml(donation.receipt_number)}</b></span></div>
    <div class="row"><span>Received with thanks from: <b>${escapeHtml(donation.donor_name)}</b></span></div>
    <div class="row"><span>Address: <b>${address}</b></span></div>
    <div class="row"><span>Amount: <b>&#8377;${amount.toFixed(2)}/- Rs. ${words}</b></span></div>
    <div class="row"><span>Donor PAN No: <b>${pan}</b> &nbsp; Phone No: <b>${escapeHtml(donation.phone_number)}</b></span></div>
    <div class="row"><span>Mode Of Payment: <b>${escapeHtml(donation.mode_of_payment)}</b> No : <b>${escapeHtml(donation.instrument_number)}</b> &nbsp; Dated: <b>${date}</b> &nbsp; Bank: <b>${escapeHtml(TEMPLE.bank)}</b> Branch: <b>${escapeHtml(TEMPLE.branch)}</b></span></div>
    <div class="row"><span>On Account of: <b>DONATION ${escapeHtml(donation.scheme_name)}</b></span></div>

    <div class="footer-row">
      <div class="created">
        <div><b>Created On: ${date}</b></div>
        <div class="small">(Draft/Cheque subject to realization)</div>
        <div class="note"><b>Note:</b> This is a computer generated receipt. No signature is required</div>
      </div>
      <div class="service">Yours in the service of Lord Krishna</div>
    </div>

    <div class="mantra">Hare Krishna Hare Krishna Krishna Krishna Hare Hare Hare Rama Hare Rama Rama Rama Hare Hare</div>
  </div>`;
}

export function downloadDonationReceipt(donation, donor, templeSettings) {
  const TEMPLE = resolveTemple(templeSettings);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(donation.receipt_number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; color: #1a1a1a; margin: 0; padding: 24px; font-size: 13px; }
    .receipt { padding: 16px 8px 24px; border-bottom: 1px solid #ccc; margin-bottom: 24px; }
    .header { display: flex; align-items: center; gap: 16px; }
    .logo { width: 64px; height: 64px; object-fit: contain; }
    .head-text { text-align: center; flex: 1; }
    .temple-name { color: #8b1a1a; font-weight: bold; font-size: 17px; }
    .founder { font-weight: bold; font-size: 12px; margin-top: 2px; }
    .line { font-size: 12px; margin-top: 2px; }
    .sub { text-align: center; font-size: 11px; margin-top: 4px; }
    .title-row { display: flex; align-items: center; justify-content: center; gap: 24px; margin: 14px 0 10px; }
    .rtitle { text-decoration: underline; font-size: 14px; }
    .rdate { font-size: 13px; }
    .row { margin: 5px 0; }
    .footer-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px; }
    .small { font-size: 11px; }
    .note { margin-top: 6px; }
    .service { font-style: italic; white-space: nowrap; padding-left: 16px; }
    .mantra { text-align: center; color: #8b1a1a; font-size: 11px; margin-top: 22px; }
    @media print {
      body { padding: 0; }
      .receipt { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  ${copyHtml('Receipt', donation, donor, TEMPLE)}
  ${copyHtml('Receipt - Office Copy', donation, donor, TEMPLE)}
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow pop-ups to download the receipt.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

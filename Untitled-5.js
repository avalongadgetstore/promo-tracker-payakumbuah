/* google-sheets.js */

/*
  This file calls the Netlify serverless function /export_to_sheets
  which will:
   - read selected promos/date range from client request
   - query Supabase transactions
   - create/update Google Sheet in Captain account using stored tokens
*/

async function exportSelectedPromos() {
  const checkboxes = document.querySelectorAll('#promoCheckboxList input[type=checkbox]:checked');
  if (checkboxes.length === 0) {
    alert('Pilih minimal 1 promo untuk diekspor.');
    return;
  }
  const promoIds = Array.from(checkboxes).map(cb => cb.value);
  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo = document.getElementById('dateTo').value;

  // show status
  document.getElementById('exportStatus').innerText = 'Menyiapkan laporan...';

  // call serverless function
  const res = await fetch('/.netlify/functions/export_to_sheets', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ promoIds, dateFrom, dateTo })
  });

  const data = await res.json();
  if (!res.ok) {
    document.getElementById('exportStatus').innerText = `Gagal: ${data.message || JSON.stringify(data)}`;
    alert('Export gagal: ' + (data.message || 'unknown'));
    return;
  }

  document.getElementById('exportStatus').innerHTML = `Berhasil! Laporan dibuat: <a href="${data.sheetUrl}" target="_blank">Buka Google Sheet</a>`;
  alert('Laporan berhasil diekspor ke Google Sheets!');
}

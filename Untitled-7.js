/* app.js */

let currentUser = null; // { id, email, role, name }

async function initApp() {
  // load promos into select & checkbox list
  await loadPromos();
  attachUI();
  // attempt to auto-login via supabase session
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    // get user
    const user = session.user;
    currentUser = { id: user.id, email: user.email, name: user.user_metadata?.full_name || user.email, role: user.user_metadata?.role || 'server' };
    onLogin();
  }
}

function attachUI() {
  // default page
  showPage('homePage');
  // set date defaults
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('dateFrom').value = today;
  document.getElementById('dateTo').value = today;
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById(name);
  if (pg) pg.classList.add('active');
}

/* login selection (for demo only - use proper auth flows) */
function selectCaptain() {
  // show login modal or call Supabase auth UI (not implemented here)
  // for demo we set role to captain
  currentUser = { id:'demo-captain', email:'captain@example.com', name:'Cusmii', role:'captain' };
  onLogin();
}
function selectServer() {
  currentUser = { id:'demo-server', email:'server@example.com', name:'Server Demo', role:'server' };
  onLogin();
}

function onLogin() {
  document.getElementById('userRole').innerText = currentUser.role.toUpperCase();
  document.getElementById('usernameDisplay').innerText = currentUser.name;
  // show dashboard
  showPage('transactionPage');
}

/* load promos from Supabase */
async function loadPromos() {
  const promos = await getPromos();
  const promoSelect = document.getElementById('promoSelect');
  const promoCheckboxList = document.getElementById('promoCheckboxList');
  const promoListDiv = document.getElementById('promoList');
  promoSelect.innerHTML = '<option value="">-- pilih promo --</option>';
  promoCheckboxList.innerHTML = '';
  promoListDiv.innerHTML = '';

  promos.forEach(p => {
    // select
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.start_date} - ${p.end_date})`;
    promoSelect.appendChild(opt);
    // checkbox
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${p.id}" /> ${p.name} (${p.start_date})`;
    promoCheckboxList.appendChild(label);
    // card promo
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<h3>${p.name}</h3><p class="muted">${p.description || ''}</p><small>Kuota: ${p.quota || '-'}</small>`;
    promoListDiv.appendChild(card);
  });
}

/* submit promo: validate, upload photo to Supabase, save transaction, backup to Drive */
async function submitPromo() {
  const serverName = document.getElementById('serverName').value;
  if (!serverName) { alert('Pilih nama server dulu.'); return; }
  const promoId = document.getElementById('promoSelect').value;
  if (!promoId) { alert('Pilih jenis promo.'); return; }
  const customerName = document.getElementById('customerName').value.trim();
  const customerPhone = document.getElementById('customerPhone').value.trim();
  if (!customerName || !customerPhone) { alert('Isi nama dan no HP customer.'); return; }

  const photoInput = document.getElementById('promoPhoto');
  const file = photoInput.files[0];
  try {
    let photoPath = null, photoUrl = null, driveBackup = null;
    if (file) {
      // upload to supabase storage
      const upload = await uploadPhotoToSupabase(file);
      photoPath = upload.path || upload;
      photoUrl = upload.url || null;
      // ask server to copy to drive (backup)
      const backupRes = await backupFileToDrive(photoPath, file.name);
      driveBackup = backupRes;
    }

    const tx = {
      promo_id: promoId,
      server_name: serverName,
      customer_name: customerName,
      customer_phone: customerPhone,
      photo_url: photoUrl || null,
      date: new Date().toISOString()
    };

    await addTransaction(tx);
    alert('Transaksi tersimpan!');
    // clear form
    document.getElementById('customerName').value='';
    document.getElementById('customerPhone').value='';
    document.getElementById('promoPhoto').value='';
    // update UI maybe
    loadPromos();
  } catch (err) {
    console.error(err);
    alert('Gagal submit: '+ err.message);
  }
}

/* logout placeholder */
function logout() {
  currentUser = null;
  document.getElementById('userRole').innerText = '';
  document.getElementById('usernameDisplay').innerText = '';
  showPage('homePage');
}

/* init */
initApp();

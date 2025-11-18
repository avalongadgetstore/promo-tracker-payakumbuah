// supabase.js
// REPLACE these placeholders with your actual Supabase values
const SUPABASE_URL = "https://jcfdscmpaawcjisopwkk.supabase.co"; /* REPLACE IF DIFFERENT */
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZmRzY21wYWF3Y2ppc29wd2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDc4NDYsImV4cCI6MjA3NTk4Mzg0Nn0.yUbbMv2CrKJ9UkIKhRifQRSMIbJ-_hZzLcgrzf8AvPk";

/* initialize Supabase (global) */
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* export helper functions (example) */
async function getPromos() {
  const { data, error } = await supabase.from('promos').select('*').order('start_date', { ascending: true });
  if (error) { console.error('getPromos error', error); return []; }
  return data || [];
}

async function addTransaction(tx) {
  const { data, error } = await supabase.from('transactions').insert([tx]);
  if (error) throw error;
  return data;
}

async function uploadPhotoToSupabase(file) {
  const filename = `promo_photos/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('promo_photos').upload(filename, file);
  if (error) {
    console.error('Supabase storage upload error', error);
    throw error;
  }
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${data.Key || data.path || data}`;
  // better to use supabase.storage.from(...).getPublicUrl(...) but depends on bucket policy
  return { path: data.path || filename, url: publicUrl };
}

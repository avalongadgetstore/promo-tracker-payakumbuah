/* google-drive.js */

/*
  This client will call a serverless endpoint to perform Drive backup.
  We'll send file path (from Supabase storage) or blob.
*/

async function backupFileToDrive(supabasePath, originalFilename) {
  // call serverless to copy file from Supabase -> Drive (server handles it)
  const res = await fetch('/.netlify/functions/backup_to_drive', {
    method:'POST', headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ path: supabasePath, filename: originalFilename })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Drive backup failed', data);
    return null;
  }
  return data; // { fileId, webViewLink }
}

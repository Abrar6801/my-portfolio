'use strict';

/* ============================================================
   Supabase configuration (PUBLIC values only)

   Leave both fields empty and the site renders from the committed
   content.json snapshot. Fill them in and the site loads live
   content from Supabase, falling back to the snapshot if the
   database is slow, paused, or unreachable.

   The anon key is public by design — Row Level Security on the
   database is what prevents writes (see supabase/schema.sql).
   NEVER put the service_role key here or anywhere client-side.

   After filling these in, also add the Supabase origin to the
   Content-Security-Policy in index.html:
     connect-src 'self' https://YOUR-PROJECT-REF.supabase.co;
   ============================================================ */
window.SUPABASE_CONFIG = {
  url: '',      /* e.g. 'https://abcdefghijklm.supabase.co' */
  anonKey: ''   /* the "anon / public" API key from Project Settings → API */
};

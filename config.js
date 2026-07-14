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
  url: 'https://wnqeuhuskbyzqxgkfmbm.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWV1aHVza2J5enF4Z2tmbWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5ODczMTMsImV4cCI6MjA5OTU2MzMxM30.aAZTXW4mOSGCTryEZKlIOjpaxR5q3jMvLemH8S5OHvc'
};

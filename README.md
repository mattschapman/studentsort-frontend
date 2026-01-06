# StudentSort

## Setup

1. Create a new Next.js app using `npx create-next-app@latest`
2. Create a new supabase project at https://supabase.co
3. To link the supabase project with the Next.js app, create the following files:
    * `/lib/supabase/client.ts`
    * `/lib/supabase/server.ts`
    * `/lib/supabase/middleware.ts`
    * `.env.local` - Add the env vars from the supabase project
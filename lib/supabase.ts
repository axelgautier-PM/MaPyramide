import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient stocke la session dans les cookies (pas localStorage)
// pour que le middleware @supabase/ssr puisse la lire côté serveur
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

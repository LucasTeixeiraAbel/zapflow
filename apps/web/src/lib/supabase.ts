import { createClient } from '@supabase/supabase-js';

// No ambiente real, essas variáveis devem estar no .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sua-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sua-chave-anon';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

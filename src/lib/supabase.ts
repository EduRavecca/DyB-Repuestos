import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log de diagnóstico profesional para ERSoft (Aparecerá en la consola del navegador)
console.log("--- Diagnóstico ERSoft ---");
console.log("URL de Supabase detectada:", supabaseUrl ? "OK (Comienza con " + supabaseUrl.slice(0, 10) + "...)" : "ERROR: No detectada");
console.log("Anon Key detectada:", supabaseAnonKey ? "OK (Longitud: " + supabaseAnonKey.length + " caracteres)" : "ERROR: No detectada");
console.log("--------------------------");

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan las variables de entorno de Supabase. Asegúrate de configurar .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

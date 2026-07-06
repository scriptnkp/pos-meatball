// ============================================
// ตั้งค่าการเชื่อมต่อ Supabase
// หาค่าได้จาก Supabase Dashboard > Project Settings > API
// ============================================
const SUPABASE_URL = 'https://meifexajekudpgwygrxu.supabase.co'; // เช่น https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1laWZleGFqZWt1ZHBnd3lncnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjQzNzYsImV4cCI6MjA5ODkwMDM3Nn0.hRNziMPpCHWJ9XjewHBH8XMMPd2IRWJrOpEDgbRpwGs';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

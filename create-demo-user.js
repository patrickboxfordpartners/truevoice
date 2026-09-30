// Quick script to create demo user for hackathon judges
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createDemoUser() {
  const email = 'demo@truevoice.com';
  const password = 'demo2024!';

  console.log('Creating demo user...');
  console.log('Email:', email);
  console.log('Password:', password);

  // Create user with admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Demo User'
    }
  });

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Demo user created!');
  console.log('\nLogin credentials for judges:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nLogin URL: https://fleet-spider-112.convex.site/login');
}

createDemoUser();

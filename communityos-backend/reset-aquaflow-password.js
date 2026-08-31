import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const email = 'aquaflow@provider.com';
const newPassword = 'AquaFlow@12345';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

try {
  console.log('Finding AquaFlow account...');

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    throw new Error(`Supabase user ${email} not found`);
  }

  console.log(`Supabase user found: ${user.id}`);

  const { error: updateError } =
    await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
        email_confirm: true,
      }
    );

  if (updateError) {
    throw updateError;
  }

  console.log('');
  console.log('=================================');
  console.log('AQUAFLOW PASSWORD RESET SUCCESS');
  console.log('=================================');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${newPassword}`);
  console.log('=================================');

} catch (error) {
  console.error('');
  console.error('PASSWORD RESET FAILED');
  console.error(error.message);
} finally {
  process.exit(0);
}
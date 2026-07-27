import { requireSupabaseClient } from '../../lib/supabase';

type AuthInput = {
  email: string;
  password: string;
};

type SignUpInput = AuthInput & {
  displayName: string;
};

export async function signInWithEmail({ email, password }: AuthInput) {
  const client = requireSupabaseClient();
  const { error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signUpWithProfile({ displayName, email, password }: SignUpInput) {
  const client = requireSupabaseClient();
  const { error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        display_name: displayName.trim(),
      },
    },
  });

  if (error) {
    throw error;
  }

}

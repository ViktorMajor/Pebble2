declare namespace NodeJS {
  type ProcessEnv = {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_EAS_PROJECT_ID?: string;
  };
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

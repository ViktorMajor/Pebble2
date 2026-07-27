export const en = {
  app: { name: 'Pebble', loading: 'Loading Pebble', retry: 'Try again', settings: 'Settings', notConfigured: 'Pebble is not configured on this device.', continue: 'Continue', skip: 'Skip' },
  onboarding: { first: 'Send a pebble when someone crosses your mind.', second: 'Touching a received pebble simply means it reached you.', third: 'A pebble does not require a reply. Silence is allowed.' },
  auth: {
    signIn: 'Sign in', createProfile: 'Create profile', access: 'Sign in to your private shore.',
    displayName: 'Display name', email: 'Email', password: 'Password', createAccount: 'Create profile',
    existingAccount: 'I already have access', createError: 'Could not create profile.', signInError: 'Could not sign in.', emailHint: 'Use a valid email address.', passwordHint: 'Use at least 6 characters.',
  },
  pairing: {
    begin: 'Begin with one private shore.', create: 'Create a shore', join: 'Join a shore', invitation: 'Invitation',
    shareOnce: 'This invitation is single-use. Share it only with the person you choose.', copy: 'Copy invitation', share: 'Share invitation',
    copied: 'Invitation copied.', createError: 'Could not create shore.', joinError: 'Could not join shore.',
    activeShore: 'You already have an active shore.', invalid: 'This invitation is not available.', expired: 'This invitation has expired.',
    used: 'This invitation has already been used.', full: 'This shore already has two people.', network: 'Could not connect. Try again.',
  },
  shore: { quiet: 'A quiet shore.', empty: 'This shore is ready for a pebble.', shared: 'Shared shore', incoming: 'Incoming pebble', sent: 'Sent pebble', send: 'Send a pebble', loading: 'Loading shore', closed: 'This shore is closed.', sendError: 'Could not send pebble.', touchError: 'Could not touch pebble.', loadError: 'Could not load shore.' },
  settings: {
    title: 'Settings', profile: 'Profile', language: 'Language', connection: 'Connection', notifications: 'Notifications', account: 'Account',
    displayName: 'Display name', accountEmail: 'Account email', currentLanguage: 'Current language', systemDefault: 'System default',
    activeShore: 'Active shore', closedShores: 'Closed shores', permission: 'Notification permission', enabled: 'Allowed', disabled: 'Not allowed', unavailable: 'Unavailable',
    signOut: 'Sign out', deleteAccount: 'Delete account', closeShore: 'Close shore', beginNew: 'Begin a new shore', noClosed: 'No closed shores yet.',
    statusActive: 'Active', statusWaiting: 'Waiting for your person', statusClosed: 'Closed', partner: 'Partner', waiting: 'Waiting for someone you choose.',
    save: 'Save', saved: 'Saved.', profileError: 'Could not save your profile.', loadError: 'Could not load your account.',
    closeTitle: 'Close this shore?', closeMessage: 'Pebbles will remain here, but no new pebbles or touches can be added.', cancel: 'Cancel',
    deleteTitle: 'Delete account?', deleteMessage: 'Your profile, memberships, sent pebbles, invitations, and device tokens will be removed. The other person\'s profile and pebbles remain.', deleteError: 'Could not delete account.',
  },
  language: { title: 'Language', system: 'System default', english: 'English', hungarian: 'Magyar' },
} as const;

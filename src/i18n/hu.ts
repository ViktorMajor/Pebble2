export const hu = {
  app: { name: 'Pebble', loading: 'A Pebble betöltése', retry: 'Próbáld újra', shoreError: 'A part betöltése nem sikerült.', settings: 'Beállítások', notConfigured: 'A Pebble nincs beállítva ezen az eszközön.', continue: 'Tovább', skip: 'Kihagyás' },
  onboarding: { first: 'Küldj egy kavicsot, amikor eszedbe jut valaki.', second: 'Egy érkező kavics megérintése csak azt jelenti, hogy megérkezett.', third: 'Egy kavics nem igényel választ. A csendnek is van helye.' },
  auth: {
    signIn: 'Belépés', createProfile: 'Profil létrehozása', access: 'Lépj be a privát partodhoz.',
    displayName: 'Megjelenő név', email: 'E-mail', password: 'Jelszó', createAccount: 'Profil létrehozása',
    existingAccount: 'Már van hozzáférésem', createError: 'A profil létrehozása nem sikerült.', signInError: 'A belépés nem sikerült.', emailHint: 'Adj meg érvényes e-mail-címet.', passwordHint: 'Legalább 6 karaktert használj.',
  },
  pairing: {
    begin: 'Kezdj egy privát parttal.', create: 'Part létrehozása', join: 'Csatlakozás egy parthoz', invitation: 'Meghívó',
    shareOnce: 'Ez a meghívó egyszer használható. Csak annak küldd el, akit választottál.', copy: 'Meghívó másolása', share: 'Meghívó megosztása',
    copied: 'A meghívó a vágólapra került.', createError: 'A part létrehozása nem sikerült.', joinError: 'A csatlakozás nem sikerült.',
    activeShore: 'Már van aktív partod.', invalid: 'Ez a meghívó nem elérhető.', expired: 'Ez a meghívó lejárt.',
    used: 'Ezt a meghívót már felhasználták.', full: 'Ezen a parton már ketten vannak.', network: 'Nem sikerült kapcsolódni. Próbáld újra.',
  },
  shore: { quiet: 'Csendes part.', empty: 'Ez a part készen áll egy kavicsra.', shared: 'Közös part', incoming: 'Érkező kavics', sent: 'Elküldött kavics', send: 'Kavics küldése', loading: 'A part betöltése', closed: 'Ez a part lezárult.', sendError: 'A kavics elküldése nem sikerült.', touchError: 'A kavics érintése nem sikerült.', loadError: 'A part betöltése nem sikerült.' },
  settings: {
    title: 'Beállítások', profile: 'Profil', language: 'Nyelv', connection: 'Kapcsolódás', notifications: 'Értesítések', account: 'Fiók',
    displayName: 'Megjelenő név', accountEmail: 'Fiók e-mail-címe', currentLanguage: 'Jelenlegi nyelv', systemDefault: 'Rendszer alapértelmezése',
    activeShore: 'Aktív part', closedShores: 'Lezárt partok', permission: 'Értesítési engedély', enabled: 'Engedélyezve', disabled: 'Nincs engedélyezve', unavailable: 'Nem érhető el',
    signOut: 'Kijelentkezés', deleteAccount: 'Fiók törlése', closeShore: 'Part lezárása', beginNew: 'Új part indítása', noClosed: 'Még nincs lezárt part.',
    statusActive: 'Aktív', statusWaiting: 'Arra vár, akit választottál', statusClosed: 'Lezárt', partner: 'Társ', waiting: 'Arra vár, akit választottál.',
    save: 'Mentés', saved: 'Elmentve.', profileError: 'A profil mentése nem sikerült.', loadError: 'A fiók betöltése nem sikerült.',
    closeTitle: 'Lezárod ezt a partot?', closeMessage: 'A kavicsok itt maradnak, de új kavicsot vagy érintést már nem lehet hozzáadni.', cancel: 'Mégse',
    deleteTitle: 'Törlöd a fiókot?', deleteMessage: 'A profilod, tagságaid, elküldött kavicsaid, meghívóid és eszközértesítési tokenjeid törlődnek. A másik személy profilja és kavicsai megmaradnak.', deleteError: 'A fiók törlése nem sikerült.',
  },
  language: { title: 'Nyelv', system: 'Rendszer alapértelmezése', english: 'English', hungarian: 'Magyar' },
} as const;

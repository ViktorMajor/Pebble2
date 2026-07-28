import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { BowlScreen } from '../../../src/features/bowl/BowlScreen';
import { AppLoadingScreen, AppRetryScreen } from '../../../src/features/app/AppStateScreen';
import { useAppSession } from '../../../src/features/app/AppSessionProvider';
import { getConnectionStatus } from '../../../src/features/pairing/connectionService';
import { useI18n } from '../../../src/i18n';
export default function PastConnectionRoute(){const{id}=useLocalSearchParams<{id:string}>();const{session}=useAppSession();const{t}=useI18n();const[status,setStatus]=useState<'active'|'closed'|null>(null);const[failed,setFailed]=useState(false);useEffect(()=>{if(id)void getConnectionStatus(id).then((value)=>{setStatus(value);setFailed(!value);}).catch(()=>setFailed(true));},[id]);if(!session)return<Redirect href="/(auth)"/>;if(failed)return<AppRetryScreen message={t('app.connectionError')} onRetry={()=>{setFailed(false);setStatus(null);if(id)void getConnectionStatus(id).then(setStatus).catch(()=>setFailed(true));}}/>;if(!id||!status)return<AppLoadingScreen/>;return<BowlScreen pairId={id} connectionStatus={status}/>;}

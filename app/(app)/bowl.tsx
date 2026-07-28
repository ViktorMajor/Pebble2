import { Redirect } from 'expo-router';
import { BowlScreen } from '../../src/features/bowl/BowlScreen';
import { useAppSession } from '../../src/features/app/AppSessionProvider';
import { AppLoadingScreen, AppRetryScreen } from '../../src/features/app/AppStateScreen';
import { useI18n } from '../../src/i18n';
export default function BowlRoute(){const state=useAppSession();const{t}=useI18n();if(state.isLoading)return<AppLoadingScreen/>;if(state.connectionErrorText)return<AppRetryScreen message={t('app.connectionError')} onRetry={()=>void state.connectionRefresh()}/>;if(!state.session)return<Redirect href="/(auth)"/>;if(!state.connectionId||!state.connectionComplete)return<Redirect href="/(app)/pairing"/>;return<BowlScreen pairId={state.connectionId} connectionStatus="active"/>;}

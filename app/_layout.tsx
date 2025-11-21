import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { store, persistor } from '../src/store';
import { useAppSelector } from '../src/hook';
import { setAuthToken } from '../src/api/setAuthToken';
import type { RootState } from '../src/store';

function AuthBootstrapper() {
  const token = useAppSelector((s: RootState) => s.auth.token);

  useEffect(() => {
    setAuthToken(token ?? null);
  }, [token]);

  return null;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate 
          loading={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" />
            </View>
          } 
          persistor={persistor}
        >
          <AuthBootstrapper />
          <Slot />
          <Toast />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

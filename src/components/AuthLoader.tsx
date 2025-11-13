import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../hook';
import { meThunk } from '../store/slices/authSlice';

export default function AuthLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { token, user, loading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(meThunk());
    }
  }, [token, user, dispatch]);

  if (token && !user && loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0F0E17',
        }}
      >
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return <>{children}</>;
}

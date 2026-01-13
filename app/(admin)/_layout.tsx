import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Button, Text, View } from 'react-native';

import { useAppSelector } from '../../src/hook';

export default function AdminLayout() {
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();

  // Helper to extract role safely (handles string or object from population)
  const getRoleName = (u: typeof user) => {
    if (!u || !u.role) return 'guest';
    if (typeof u.role === 'string') return u.role;
    // @ts-ignore - Handle populated role object
    return u.role.type || u.role.name || 'guest';
  };

  const userRole = getRoleName(user);
  const isStaff = userRole === 'admin' || userRole === 'employee';

  useEffect(() => {
    console.log('[AdminLayout] User:', user?.email, 'Role:', userRole, 'IsStaff:', isStaff);
    if (user && !isStaff) {
      console.log('[AdminLayout] Redirecting non-staff user to home');
      router.replace('/');
    }
  }, [user, isStaff, router, userRole]);

  if (!user || !isStaff) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#fff', marginBottom: 16 }}>Acceso denegado</Text>
        <Button title="Volver" onPress={() => router.replace('/')} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

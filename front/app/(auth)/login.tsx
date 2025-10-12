import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { loginThunk } from '../../src/store/slices/authSlice';

export default function Login() {
  const [email, setEmail] = useState('admin@joypark.io');
  const [password, setPassword] = useState('admin123');
  const dispatch = useAppDispatch();
  const nav = useRouter();
  const { loading } = useAppSelector((s) => s.auth);

  const onLogin = async () => {
    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      nav.replace('/');
    } catch {
      Alert.alert('Error', 'Login inválido');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Login</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
      />
      <Button title={loading ? 'Ingresando…' : 'Entrar'} onPress={onLogin} />
    </View>
  );
}

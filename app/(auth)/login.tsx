import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { loginThunk } from '../../src/store/slices/authSlice';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading } = useAppSelector((s) => s.auth);

  const onLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Campos requeridos', text2: 'Completá tu email y contraseña' });
      return;
    }

    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      Toast.show({ type: 'success', text1: '¡Bienvenido!', text2: 'Sesión iniciada correctamente' });
      router.replace('/');
    } catch (error) {
      setAttempts(attempts + 1);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Credenciales inválidas' });
    }
  };

  return (
    <LinearGradient colors={['#0F0E17', '#1A0B2E', '#2A0B3A']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} centerContent>
        <View style={styles.glassCard}>
          <Ionicons name="wine" size={60} color="#FAD02C" style={styles.icon} />
          <Text style={styles.title}>Joy Wine</Text>
          <Text style={styles.subtitle}>Ingresa tus credenciales</Text>

          <View style={styles.inputGroup}>
            <Ionicons name="mail-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor="#666"
              secureTextEntry
              style={styles.input}
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={onLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.replace('/')}>
            <Text style={styles.cancelText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  glassCard: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 30,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: { marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#A7A9BE', marginBottom: 32 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 56, color: '#fff', fontSize: 16 },
  primaryBtn: {
    backgroundColor: '#8B5CF6',
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  linkBtn: { marginTop: 24 },
  linkText: { color: '#A7A9BE', fontSize: 15 },
  linkTextBold: { color: '#FAD02C', fontWeight: '800' },
  cancelBtn: { marginTop: 16 },
  cancelText: { color: '#666', fontSize: 14, fontWeight: '600' },
});

import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';

WebBrowser.maybeCompleteAuthSession();
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { loginWithGoogleThunk, registerThunk } from '../../src/store/slices/authSlice';

export default function Register() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading } = useAppSelector((s) => s.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cel, setCel] = useState('');
  const [role, setRole] = useState<'user' | 'employee' | 'admin'>('user');

  // Google OAuth
  const [_request, _response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'dummy-web-id',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'dummy-ios-id',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'dummy-android-id',
  });

  const onGoogleRegister = async () => {
    try {
      const result = await promptAsync();
      if (result.type === 'success' && result.params.id_token) {
        await dispatch(loginWithGoogleThunk(result.params.id_token)).unwrap();
        Alert.alert('Bienvenido', 'Cuenta creada con Google');
        router.replace('/');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo registrar con Google');
    }
  };

  const onRegister = async () => {
    if (!name || !email || !password || !cel) {
      return Alert.alert('Campos requeridos', 'Completá nombre, email, contraseña y WhatsApp');
    }

    try {
      await dispatch(registerThunk({ name, email, password, cel, role })).unwrap();
      Alert.alert('Bienvenido', 'Cuenta creada correctamente');
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error al registrarse', e?.message || 'Revisá los datos e intentá nuevamente');
    }
  };

  const RoleOption = ({ value, label }: { value: typeof role; label: string }) => (
    <TouchableOpacity
      style={[styles.roleOption, role === value && styles.roleOptionSelected]}
      onPress={() => setRole(value)}
    >
      <Text style={[styles.roleText, role === value && styles.roleTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Registrate con tu correo y número de WhatsApp</Text>

        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>Selecciona tu rol (Demo):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolesScroll}>
            <RoleOption value="user" label="Usuario" />
            <RoleOption value="employee" label="Empleado" />
            <RoleOption value="admin" label="Admin" />
          </ScrollView>
        </View>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nombre completo"
          placeholderTextColor="#6B7280"
          style={styles.input}
        />

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña (mínimo 6 caracteres)"
          placeholderTextColor="#6B7280"
          secureTextEntry
          style={styles.input}
        />

        <TextInput
          value={cel}
          onChangeText={setCel}
          placeholder="WhatsApp (solo números, con código de país)"
          placeholderTextColor="#6B7280"
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={onRegister} disabled={loading}>
          <Text style={styles.primaryBtnText}>{loading ? 'Creando cuenta...' : 'Registrarse'}</Text>
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o registrate con</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Botón Google */}
        <TouchableOpacity style={styles.googleBtn} onPress={onGoogleRegister} disabled={loading}>
          <Ionicons name="logo-google" size={20} color="#fff" />
          <Text style={styles.googleBtnText}>Continuar con Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/')}>
          <Text style={styles.secondaryBtnText}>Ya tengo cuenta, iniciar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0E17',
  },
  scroll: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FAD02C',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#A7A9BE',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1A1A2E',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryBtnText: { color: '#9CA3AF', fontWeight: '600', fontSize: 14 },

  // Separador
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#6B7280',
    paddingHorizontal: 12,
    fontSize: 13,
  },

  // Botón Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DB4437',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    marginBottom: 8,
  },
  googleBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  roleContainer: { marginBottom: 20 },
  roleLabel: { color: '#ccc', marginBottom: 10, marginLeft: 4 },
  rolesScroll: { flexDirection: 'row', gap: 10 },
  roleOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 10,
  },
  roleOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  roleText: { color: '#888', fontWeight: '600' },
  roleTextSelected: { color: '#fff' },
});

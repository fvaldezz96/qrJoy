import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { useAppDispatch, useAppSelector } from '../hook';
import { loginThunk, loginWithGoogleThunk } from '../store/slices/authSlice';
import logo from '../../assets/IMG_1459.png';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LoginModal({ visible, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const { loading: authLoading } = useAppSelector((s) => s.auth);

  // Animation Values
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Google Auth
  const [_request, _response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'dummy',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'dummy',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'dummy',
  });

  const handleLogin = async () => {
    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      handleClose();
      Toast.show({ type: 'success', text1: 'Acceso concedido' });
    } catch {
      Toast.show({ type: 'error', text1: 'Acceso denegado', text2: 'Credenciales inválidas' });
    }
  };

  const handleGoogleLogin = async () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      Toast.show({ type: 'info', text1: 'Google', text2: 'No disponible en este entorno' });
      return;
    }
    try {
      const result = await promptAsync();
      if (result.type === 'success' && result.params.id_token) {
        await dispatch(loginWithGoogleThunk(result.params.id_token)).unwrap();
        handleClose();
        Toast.show({ type: 'success', text1: 'Login con Google', text2: 'Sesión iniciada' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo iniciar con Google' });
    }
  };

  const animationStyle = {
    opacity: opacityAnim,
    transform: [{ scale: scaleAnim }],
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, animationStyle]}>
          <View style={styles.logoCircle}>
            <Image source={logo} style={styles.logoImage} />
          </View>
          <Text style={styles.modalSubtitle}>Acceso Exclusivo</Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholderTextColor="#aaa"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#aaa"
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={authLoading}>
            {authLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>INGRESAR</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.googleText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.registerText}>¿Primera vez? Solicitar acceso VIP</Text>
            </TouchableOpacity>
          </Link>
        </Animated.View>
      </View>
      <Toast />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    backgroundColor: '#150030',
    padding: 30,
    borderRadius: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#aa00ff',
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: 'rgba(170,0,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#ff00aa',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
  },
  logoImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  modalSubtitle: { fontSize: 16, color: '#e0aaff', marginBottom: 20 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#aa00ff44',
  },
  primaryBtn: {
    backgroundColor: '#aa00ff',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#ffffff20' },
  dividerText: { color: '#888', paddingHorizontal: 10 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285f4',
    width: '100%',
    padding: 14,
    borderRadius: 16,
    justifyContent: 'center',
    gap: 10,
  },
  googleText: { color: '#fff', fontWeight: '700' },
  cancelText: { color: '#888', marginTop: 20 },
  registerText: { color: '#ff00aa', marginTop: 20, fontWeight: '700' },
});

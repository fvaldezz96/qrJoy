import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppDispatch, useAppSelector } from '../hook';
import { loginThunk } from '../store/slices/authSlice'; // 🔄 CAMBIADO A LOGIN DIRECTO
import { showAlert } from '../utils/showAlert';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LoginModal({ visible, onClose }: Props) {
  const [email, setEmail] = useState('user@joypark.io'); // 🔄 CAMBIADO A USER DEFAULT
  const [password, setPassword] = useState('user123'); // 🔄 CAMBIADO A USER DEFAULT
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);

  const onLogin = async () => {
    try {
      await dispatch(
        loginThunk({ email, password }), // 🔄 CAMBIADO A LOGIN DIRECTO
      ).unwrap();
      onClose();
    } catch {
      showAlert('Error', 'Credenciales inválidas');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Joy Wine</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: { backgroundColor: '#1A1A2E', padding: 24, borderRadius: 20, width: '85%', gap: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center' },
  input: { backgroundColor: '#333', color: '#fff', padding: 14, borderRadius: 12 },
  button: { backgroundColor: '#8B5CF6', padding: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  cancel: { color: '#8B5CF6', textAlign: 'center', marginTop: 8 },
});

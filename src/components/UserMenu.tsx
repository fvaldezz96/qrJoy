import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../hook';
import { logout } from '../store/slices/authSlice';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function UserMenu({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  if (!visible) return null;

  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true,
  }).start();

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  return (
    <Animated.View style={[styles.menu, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.email[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>{user?.role}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.item} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        <Text style={styles.itemText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = {
  menu: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    width: 220,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  email: { color: '#fff', fontWeight: '600' },
  role: { color: '#8B5CF6', fontSize: 12, textTransform: 'capitalize' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  itemText: { color: '#FF3B30', fontWeight: '600' },
};

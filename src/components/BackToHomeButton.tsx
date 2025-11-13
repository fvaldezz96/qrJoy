// components/BackToHomeButton.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Text, TouchableOpacity } from 'react-native';

const EXCLUDED_ROUTES = [
  '/',
  '/(user)/products',
  '/(user)/cart',
  '/(user)/my-qr',
  '/(user)/my-tickets',
  '/(admin)/dashboard',
  '/(admin)/orders-screen',
  '/(admin)/qr-scanner',
];

export default function BackToHomeButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (EXCLUDED_ROUTES.includes(pathname)) return null;

  const bounceAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(bounceAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.spring(bounceAnim, { toValue: 0.95, useNativeDriver: true }).start(() => {
      router.replace('/');
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        Platform.OS === 'web' ? styles.web : styles.mobile,
        {
          transform: [{ scale: bounceAnim }, { translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={['#FAD02C', '#FF6B9D']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={Platform.OS === 'web' ? 'arrow-back' : 'home'} size={22} color="#000" />
          <Text style={styles.text}>{Platform.OS === 'web' ? 'Volver' : 'Inicio'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = {
  container: {
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  web: {
    position: 'fixed' as const,
    top: 20,
    left: 20,
  },
  mobile: {
    position: 'absolute' as const,
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    minWidth: 140,
  },
  text: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#000',
    letterSpacing: 0.5,
  },
} as const;

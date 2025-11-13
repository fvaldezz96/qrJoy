import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Image, Text, View } from 'react-native';

import { useAppSelector } from '../../src/hook';

export default function QRScreen() {
  const nav = useRouter();
  const params = useLocalSearchParams<{ png?: string; code?: string; signature?: string }>();
  const { qr } = useAppSelector((s) => s.orders);

  const png = (params.png as string) || qr?.pngDataUrl;
  const code = (params.code as string) || qr?.code;
  const signature = (params.signature as string) || qr?.signature;

  if (!png) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}
      >
        <Text>No hay un QR disponible aún.</Text>
        <Button title="Volver" onPress={() => nav.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Mostrá este QR en la barra</Text>
      <Image source={{ uri: png }} style={{ width: 280, height: 280 }} />
      <Text style={{ fontSize: 12, opacity: 0.7 }}>code: {code}</Text>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>sig: {signature?.slice(0, 12)}…</Text>
      <Button title="Listo" onPress={() => nav.replace('/')} />
    </View>
  );
}

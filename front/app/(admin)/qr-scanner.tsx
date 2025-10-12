// app/(admin)/qr-scanner.tsx
import { useEffect, useState } from 'react';
import { View, Text, Alert, Button } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { redeemQr } from '../../src/store/slices/adminSlice';
import { useAppDispatch } from '../../src/hook';

export default function QrScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission]);

  if (!permission) {
    return <Text>Solicitando permisos…</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Text>Se necesita permiso de cámara</Text>
        <Button title="Permitir cámara" onPress={requestPermission} />
      </View>
    );
  }

  const onScan = async ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    try {
      const payload = JSON.parse(data) as { c: string; s: string };
      await dispatch(redeemQr({ code: payload.c, signature: payload.s })).unwrap();
      Alert.alert('OK', 'QR validado y consumido');
    } catch (e: any) {
      Alert.alert('Error', 'QR inválido o ya usado');
    } finally {
      setTimeout(() => setScanned(false), 1200);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScan}
      />
    </View>
  );
}

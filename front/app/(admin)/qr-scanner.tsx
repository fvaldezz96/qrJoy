// const onBarCodeScanned = async ({ data }: { data: string }) => {
// try {
// const payload = JSON.parse(data) as { c: string; s: string };
// const res = await api.post('/qr/redeem', { code: payload.c, signature: payload.s, station: 'bar' });
// Alert.alert('OK', 'QR validado y consumido');
// } catch (e: any) {
// Alert.alert('Error', e?.response?.data?.message ?? 'QR inválido o ya usado');
// }
// };
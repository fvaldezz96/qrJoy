import { Link } from 'expo-router';
import { Text,View } from 'react-native';


export default function Home(){
return (
  <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap:12 }}>
    <Text style={{ fontSize:20, fontWeight:'600' }}>JoyPark</Text>
    <Link href="/(user)/products">Ir a Productos</Link>
    <Link href="/(admin)/qr-scanner">Scanner Admin</Link>
    <Link href="/(admin)/orders-screen">Pedidos (Admin)</Link>
    <Link href="/(user)/qr">Ver mi QR</Link>
    <Link href="/(user)/my-tickets">Mis tickets</Link>
  </View>
);
}
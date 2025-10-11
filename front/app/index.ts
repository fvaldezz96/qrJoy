import { View, Text, Button } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function Home() {
  return (
    <View style={{ flex: 1, alignItems:'center', justifyContent:'center' }}>
      <Text>JoyPark está vivo 🚀</Text>
      <StatusBar style="auto" />
    </View>
  );
}

import { Slot, Stack } from 'expo-router';
import { Provider, useSelector } from 'react-redux';

import { RootState,store } from '../src/store';


function RoleGate(){
const role = useSelector((s:RootState)=> s.auth.role);
return (
<Stack>
{/* Stack auto; usaremos grupos (user/admin) en las rutas */}
<Stack.Screen name="index" options={{ headerTitle: 'JoyPark' }} />
</Stack>
);
}


export default function Layout(){
return (
<Provider store={store}>
<Slot />
</Provider>
);
}
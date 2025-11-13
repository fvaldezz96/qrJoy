import { Slot } from 'expo-router';
import { Provider } from 'react-redux';

import { store } from '../src/store';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Slot />
    </Provider>
  );
}

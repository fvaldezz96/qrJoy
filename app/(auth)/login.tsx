import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Pressable, Switch, Text, TextInput, View, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import {
  loginThunk,
  loginWithKeycloakCredentialsThunk,
  loginWithKeycloakTokenThunk,
} from '../../src/store/slices/authSlice';
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_ISSUER } from '../../src/config';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [adminMode, setAdminMode] = useState(true);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading } = useAppSelector((s) => s.auth);

  const useProxy = Constants.appOwnership === 'expo' && Platform.OS !== 'web';

  const discovery = AuthSession.useAutoDiscovery(KEYCLOAK_ISSUER);

  const redirectUri = AuthSession.makeRedirectUri({
    // En Expo Go / web suele funcionar mejor con proxy.
    // En builds standalone se recomienda configurar un scheme.
  });

  const [request, _response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: KEYCLOAK_CLIENT_ID,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      scopes: ['openid', 'profile', 'email'],
    },
    discovery,
  );

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Completá tu email y contraseña');
      return;
    }

    // if (!/\S+@\S+\.\S+/.test(email)) {
    //   Alert.alert('Email inválido', 'Revisá el formato del correo');
    //   return;
    // }

    if (attempts >= 3) {
      Alert.alert('Demasiados intentos', 'Esperá unos minutos antes de volver a intentar');
      return;
    }

    try {
      if (adminMode) {
        await dispatch(
          loginWithKeycloakCredentialsThunk({ username: email, password }),
        ).unwrap();
      } else {
        await dispatch(loginThunk({ email, password })).unwrap();
      }
      router.replace('/');
    } catch (error) {
      setAttempts(attempts + 1);
      Alert.alert('Error de autenticación', 'Credenciales inválidas o sesión bloqueada');
    }
  };

  const onGoogleLogin = async () => {
    if (!KEYCLOAK_ISSUER) {
      Alert.alert('Config faltante', 'EXPO_PUBLIC_KEYCLOAK_ISSUER no está configurado');
      return;
    }
    if (!discovery?.authorizationEndpoint || !discovery?.tokenEndpoint) {
      Alert.alert('Keycloak', 'Discovery OIDC no disponible (revisá issuer)');
      return;
    }
    if (!request) {
      Alert.alert('Keycloak', 'Auth request no está listo');
      return;
    }

    try {
      const result = await promptAsync({ useProxy });
      if (result.type !== 'success') {
        return;
      }
      const code = result.params.code;
      if (!code) {
        Alert.alert('Keycloak', 'No se recibió code');
        return;
      }

      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: KEYCLOAK_CLIENT_ID,
          code,
          redirectUri,
          extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : {},
        },
        discovery,
      );

      const accessToken = tokenResponse.accessToken;
      if (!accessToken) {
        Alert.alert('Keycloak', 'No se recibió access_token');
        return;
      }

      await dispatch(loginWithKeycloakTokenThunk(accessToken)).unwrap();
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo iniciar sesión con Google');
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: '#0F0E17',
        gap: 16,
      }}
    >
      <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
        JoyPark
      </Text>

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1A1A2E',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
      }}>
        <View style={{ gap: 2 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>
            {adminMode ? 'Modo Admin/Empleado (Keycloak)' : 'Modo Cliente (Local/Google)'}
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
            Cambiá el modo según el tipo de usuario
          </Text>
        </View>
        <Switch value={adminMode} onValueChange={setAdminMode} />
      </View>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#666"
        autoCapitalize="none"
        keyboardType="email-address"
        style={inputStyle}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        placeholderTextColor="#666"
        secureTextEntry
        style={inputStyle}
      />

      <Button
        title={loading ? 'Ingresando...' : 'Iniciar Sesión'}
        onPress={onLogin}
        disabled={loading}
        color="#8B5CF6"
      />

      {!adminMode && (
        <Pressable
          onPress={() => router.push('/(auth)/register')}
          disabled={loading}
          style={{
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#374151',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Crear cuenta</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
            Registro normal con email y contraseña
          </Text>
        </Pressable>
      )}

      {!adminMode && (
        <Pressable
          onPress={onGoogleLogin}
          disabled={loading}
          style={{
            backgroundColor: '#111827',
            borderWidth: 1,
            borderColor: '#374151',
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>
            Continuar con Google
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
            Se abre Keycloak (SSO) y vuelve a la app
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const inputStyle = {
  backgroundColor: '#1A1A2E',
  color: '#fff',
  padding: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#333',
};

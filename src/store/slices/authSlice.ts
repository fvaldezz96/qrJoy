import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import api from '../../api/client';
import { setAuthToken } from '../../api/setAuthToken';
import { readToken, removeToken, saveToken } from '../../utils/tokenStorage';
// 🚫 KEYCLOAK ELIMINADO - Solo autenticación directa
// import { KEYCLOAK_CLIENT_ID, KEYCLOAK_TOKEN_URL } from '../../config';

type Role = 'user' | 'admin' | 'employee';

export interface User {
  _id: string;
  email: string;
  name?: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error?: string;
}

const initialState: AuthState = {
  token: null,
  user: null,
  loading: false,
};

// ✅ Limpieza del input
function sanitize(input: string) {
  return input.replace(/[<>{}]/g, '').trim();
}

// ✅ Login seguro con persistencia cifrada
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (body: { email: string; password: string }) => {
    const cleanEmail = sanitize(body.email);
    const cleanPass = sanitize(body.password);

    // IMPORTANTE: Intentar login directo primero, si falla usar fallback
    try {
      const { data } = await api.post('/auth/login', { email: cleanEmail, password: cleanPass });
      const payload = data.data as { token: string; user: User };

      // Guardar token de forma segura (nativo/web)
      await saveToken(payload.token);
      setAuthToken(payload.token);
      return payload;
    } catch (directError) {
      console.warn('[Auth] Login directo falló, intentando con Sistema A:', directError);
      
      // Fallback: delegar login a Sistema A
      try {
        const delegatedResponse = await api.loginToSystemA(cleanEmail, cleanPass);
        
        if (delegatedResponse.success) {
          const payload = {
            token: delegatedResponse.token,
            user: delegatedResponse.user,
          };

          await saveToken(payload.token);
          setAuthToken(payload.token);
          return payload;
        } else {
          throw new Error(delegatedResponse.message || 'Login delegado falló');
        }
      } catch (fallbackError) {
        console.error('[Auth] Error en fallback a Sistema A:', fallbackError);
        throw fallbackError;
      }
    }
  },
);

// ✅ Login usando un access_token emitido por Keycloak / IdP compartido
// Este thunk asume que ya obtuviste un token válido del IdP (por ejemplo vía redirección OAuth)
// y simplemente lo guarda y llama a /auth/me-idp para sincronizar el usuario y sus roles.
export const loginWithKeycloakTokenThunk = createAsyncThunk(
  'auth/loginWithKeycloakToken',
  async (token: string) => {
    const cleanToken = sanitize(token);
    if (!cleanToken) throw new Error('Token vacío');

    await saveToken(cleanToken);
    setAuthToken(cleanToken);

    const { data } = await api.get('/auth/me-idp');
    const user = data.data as User;

    return { token: cleanToken, user };
  },
);

// 🚫 KEYCLOAK ELIMINADO - Login directo con JWT
// export const loginWithKeycloakCredentialsThunk = createAsyncThunk(
//   'auth/loginWithKeycloakCredentials',
//   async (
//     body: { username: string; password: string },
//     { dispatch },
//   ): Promise<{ token: string; user: User }> => {
//     // ... código Keycloak eliminado
//   },
// );

// ✅ Login con Google (envía idToken al backend)
export const loginWithGoogleThunk = createAsyncThunk(
  'auth/loginWithGoogle',
  async (idToken: string) => {
    const { data } = await api.post('/auth/google', { idToken });
    const payload = data.data as { token: string; user: User };

    await saveToken(payload.token);
    setAuthToken(payload.token);
    return payload;
  },
);

// ✅ Registro de usuario (rol user por defecto en el backend)
export const registerThunk = createAsyncThunk(
  'auth/register',
  async (body: { name: string; email: string; password: string; cel: string }) => {
    const cleanEmail = sanitize(body.email);
    const cleanPass = sanitize(body.password);
    const cleanName = sanitize(body.name);
    const celNumber = Number(String(body.cel).replace(/\D/g, ''));

    const { data } = await api.post('/auth/register', {
      email: cleanEmail,
      password: cleanPass,
      name: cleanName,
      cel: celNumber,
    });

    const payload = data.data as { token: string; user: User };

    await saveToken(payload.token);
    setAuthToken(payload.token);
    return payload;
  },
);

// ✅ Revalidar usuario usando el token almacenado
export const meThunk = createAsyncThunk('auth/me', async () => {
  const storedToken = await readToken();
  if (!storedToken) throw new Error('No token found');

  setAuthToken(storedToken);
  const { data } = await api.get('/auth/me');
  return data.data as User;
});

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      setAuthToken(null);
      removeToken();
    },
  },
  extraReducers: (b) => {
    b.addCase(loginThunk.pending, (s) => {
      s.loading = true;
      s.error = undefined;
    })
      .addCase(loginThunk.fulfilled, (s, a: PayloadAction<{ token: string; user: User }>) => {
        s.loading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })
      // 🚫 KEYCLOAK ELIMINADO - Removidos reducers de Keycloak
      // .addCase(loginWithKeycloakCredentialsThunk.pending, (s) => {
      //   s.loading = true;
      //   s.error = undefined;
      // })
      // ... más código Keycloak eliminado
      .addCase(registerThunk.pending, (s) => {
        s.loading = true;
        s.error = undefined;
      })
      .addCase(registerThunk.fulfilled, (s, a: PayloadAction<{ token: string; user: User }>) => {
        s.loading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
      })
      .addCase(registerThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })
      .addCase(loginWithGoogleThunk.pending, (s) => {
        s.loading = true;
        s.error = undefined;
      })
      .addCase(loginWithGoogleThunk.fulfilled, (s, a: PayloadAction<{ token: string; user: User }>) => {
        s.loading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
      })
      .addCase(loginWithGoogleThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })
      .addCase(meThunk.fulfilled, (s, a) => {
        s.user = a.payload;
      })
      .addCase(meThunk.rejected, (s) => {
        s.user = null;
        s.token = null;
        removeToken();
      });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;

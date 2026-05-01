import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

// 1. Interface Auth State
interface AuthState {
  isAuthenticated: boolean;
  role: string | null;
  userId: string | null; // string UUID
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  role: null,
  userId: null,
  status: 'idle',
  error: null
};

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/auth/status');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Session expired');
    }
  }
);

// 2. Redux Thunk Object email, password, remember
interface LoginParams {
  email?: string;
  password?: string;
  remember?: boolean;
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, remember }: LoginParams, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/auth/login', { email, password, remember });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/api/auth/logout');
      return {};
    } catch (err: any) {
      return rejectWithValue('Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // user_id (string) fallback
        const { authenticated, role, id, user_id } = action.payload || {};
        state.isAuthenticated = !!authenticated;
        state.role = authenticated ? role : null;
        state.userId = authenticated ? (user_id || id) : null;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.status = 'failed';
        state.isAuthenticated = false;
        state.role = null;
        state.userId = null;
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        if (action.payload.ok && action.payload.owner) {
          state.status = 'succeeded';
          state.isAuthenticated = true;
          state.role = action.payload.owner.role;
          
          // user_id State Database
          state.userId = action.payload.owner.user_id || action.payload.owner.id;

          if (action.payload.token) {
            localStorage.setItem('token', action.payload.token);
          }
          if (action.payload.owner.role) {
            localStorage.setItem('role', action.payload.owner.role);
          }
          localStorage.setItem('user', JSON.stringify(action.payload.owner));
          
          window.dispatchEvent(new Event('storage'));
        }
      })
      .addCase(login.rejected, (state, action: PayloadAction<any>) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.role = null;
        state.userId = null;
        
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
      });
  }
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
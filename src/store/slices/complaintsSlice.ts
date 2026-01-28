import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/client';

export interface Complaint {
    _id: string;
    userId?: { _id: string; name: string; email: string; phone?: string } | string;
    message: string;
    contactInfo?: string;
    status: 'pending' | 'read' | 'resolved';
    createdAt: string;
    updatedAt: string;
}

interface ComplaintsState {
    complaints: Complaint[];
    loading: boolean;
    error?: string;
    successMessage?: string;
}

export const createComplaint = createAsyncThunk(
    'complaints/create',
    async (payload: { message: string; contactInfo?: string }) => {
        const { data } = await api.post('/complaints', payload);
        return data.data;
    }
);

export const fetchComplaints = createAsyncThunk('complaints/fetchAll', async (status?: string) => {
    const params = status ? { status } : {};
    const { data } = await api.get('/complaints', { params });
    return data.data.complaints;
});

export const updateComplaintStatus = createAsyncThunk(
    'complaints/updateStatus',
    async ({ id, status }: { id: string; status: string }) => {
        const { data } = await api.patch(`/complaints/${id}/status`, { status });
        return data.data;
    }
);

const initialState: ComplaintsState = {
    complaints: [],
    loading: false,
};

const complaintsSlice = createSlice({
    name: 'complaints',
    initialState,
    reducers: {
        clearMessages(state) {
            state.error = undefined;
            state.successMessage = undefined;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create
            .addCase(createComplaint.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(createComplaint.fulfilled, (state) => {
                state.loading = false;
                state.successMessage = 'Queja enviada correctamente. Gracias por tu feedback.';
            })
            .addCase(createComplaint.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Error al enviar queja';
            })
            // Fetch
            .addCase(fetchComplaints.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchComplaints.fulfilled, (state, action) => {
                state.loading = false;
                state.complaints = action.payload;
            })
            .addCase(fetchComplaints.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Update
            .addCase(updateComplaintStatus.fulfilled, (state, action) => {
                const index = state.complaints.findIndex((c) => c._id === action.payload._id);
                if (index !== -1) {
                    state.complaints[index] = action.payload;
                }
            });
    },
});

export const { clearMessages } = complaintsSlice.actions;
export default complaintsSlice.reducer;

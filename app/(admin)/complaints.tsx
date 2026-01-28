import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';


import { useAppDispatch, useAppSelector } from '../../src/hook';
import { fetchComplaints, updateComplaintStatus, Complaint } from '../../src/store/slices/complaintsSlice';

export default function AdminComplaintsScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { complaints, loading } = useAppSelector((state) => state.complaints || { complaints: [], loading: false });

    const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

    useEffect(() => {
        dispatch(fetchComplaints());
    }, [dispatch]);

    const handleStatusUpdate = (id: string, newStatus: string) => {
        dispatch(updateComplaintStatus({ id, status: newStatus }));
    };

    const filtered = complaints.filter(c => filter === 'all' || c.status === filter);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#F59E0B';
            case 'read': return '#3B82F6';
            case 'resolved': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'read': return 'Leído';
            case 'resolved': return 'Resuelto';
            default: return status;
        }
    };

    const renderItem = ({ item }: { item: Complaint }) => {
        const user = typeof item.userId === 'object' ? item.userId : null;
        const userName = user?.name || 'Anónimo';
        const userEmail = user?.email || item.contactInfo || 'Sin contacto';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.userName}>{userName}</Text>
                        <Text style={styles.userEmail}>{userEmail}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {getStatusLabel(item.status)}
                        </Text>
                    </View>
                </View>

                <Text style={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>

                <Text style={styles.message}>{item.message}</Text>

                <View style={styles.actions}>
                    {item.status !== 'read' && item.status !== 'resolved' && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: '#3B82F6' }]}
                            onPress={() => handleStatusUpdate(item._id, 'read')}
                        >
                            <Text style={{ color: '#3B82F6', fontSize: 12 }}>Marcar Leído</Text>
                        </TouchableOpacity>
                    )}
                    {item.status !== 'resolved' && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: '#10B981', backgroundColor: '#10B98110' }]}
                            onPress={() => handleStatusUpdate(item._id, 'resolved')}
                        >
                            <Text style={{ color: '#10B981', fontSize: 12 }}>Resolver</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#1e1b4b', '#0f172a']} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quejas y Sugerencias</Text>
            </LinearGradient>

            {/* Filters */}
            <View style={styles.filters}>
                <TouchableOpacity onPress={() => setFilter('all')} style={[styles.filterChip, filter === 'all' && styles.filterActive]}>
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Todas</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilter('pending')} style={[styles.filterChip, filter === 'pending' && styles.filterActive]}>
                    <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>Pendientes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilter('resolved')} style={[styles.filterChip, filter === 'resolved' && styles.filterActive]}>
                    <Text style={[styles.filterText, filter === 'resolved' && styles.filterTextActive]}>Resueltas</Text>
                </TouchableOpacity>
            </View>

            {loading && complaints.length === 0 ? (
                <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchComplaints())} tintColor="#fff" />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="chatbubbles-outline" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>No hay registros</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    header: { padding: 20, paddingTop: 50, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    filters: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    filterActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    filterText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    filterTextActive: { color: '#fff' },
    list: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    userName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    userEmail: { fontSize: 12, color: '#64748b' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700' },
    date: { fontSize: 11, color: '#94a3b8', marginBottom: 8 },
    message: { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 12 },
    actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
    actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 12, color: '#94a3b8' },
});

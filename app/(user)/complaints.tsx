import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

import { useAppDispatch, useAppSelector } from '../../src/hook';
import { createComplaint } from '../../src/store/slices/complaintsSlice';

export default function ComplaintsScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { loading } = useAppSelector((state) => state.complaints || { loading: false }); // Fallback if slice undefined yet

    const [message, setMessage] = useState('');
    const [contactInfo, setContactInfo] = useState(user?.email || '');

    const handleSubmit = async () => {
        if (!message.trim()) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Por favor escribe tu mensaje.' });
            return;
        }

        try {
            await dispatch(createComplaint({ message, contactInfo })).unwrap();
            Toast.show({ type: 'success', text1: 'Enviado', text2: 'Gracias por tu comentario.' });
            router.back();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Error al enviar.' });
        }
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Buzón de Sugerencias</Text>
                    <Text style={styles.subtitle}>
                        Tu opinión nos ayuda a mejorar. Cuéntanos tu experiencia, reporta un problema o déjanos una sugerencia.
                    </Text>

                    <View style={styles.card}>
                        <Text style={styles.label}>Mensaje</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Escribe aquí..."
                            placeholderTextColor="#64748b"
                            multiline
                            numberOfLines={6}
                            value={message}
                            onChangeText={setMessage}
                            textAlignVertical="top"
                        />

                        <Text style={styles.label}>Contacto (Opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email o teléfono"
                            placeholderTextColor="#64748b"
                            value={contactInfo}
                            onChangeText={setContactInfo}
                        />

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#8b5cf6', '#6d28d9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.buttonText}>Enviar</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    backButton: { marginBottom: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#334155' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 30, lineHeight: 20 },
    card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, elevation: 4 },
    label: { color: '#cbd5e1', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 10 },
    input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 12, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#334155' },
    textArea: { minHeight: 120 },
    button: { marginTop: 30, borderRadius: 12, overflow: 'hidden', elevation: 4 },
    buttonDisabled: { opacity: 0.7 },
    gradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

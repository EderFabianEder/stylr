import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar,
    TextInput, ScrollView, Modal, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react-native';
import { reportService } from '../services/api';

export default function ReportScreen({ targetUser, contentType, contentId, onClose }) {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { loadCategories(); }, []);

    const loadCategories = async () => {
        try {
            setIsLoading(true);
            const response = await reportService.getCategories();
            const cats = response.data || [];
            setCategories(cats);
        } catch (err) {
            console.log('Failed to load report categories:', err);
            setError('Kategorien konnten nicht geladen werden');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedCategory || !targetUser?.id) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await reportService.report(
                targetUser.id,
                selectedCategory,
                contentType || 'profile',
                contentId || targetUser.id,
                additionalInfo.trim() || null
            );
            setShowSuccessModal(true);
        } catch (err) {
            console.log('Report failed:', err);
            setError(err.message || 'Meldung konnte nicht gesendet werden');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        setTimeout(() => { onClose(); }, 100);
    };

    const SuccessModal = () => (
        <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={handleSuccessClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.successIconContainer}>
                        <Check size={40} color="#4CAF50" strokeWidth={3} />
                    </View>
                    <Text style={styles.modalTitle}>Meldung gesendet</Text>
                    <Text style={styles.modalMessage}>
                        Danke für deine Meldung. Wir werden den Inhalt prüfen und entsprechend handeln.
                    </Text>
                    <TouchableOpacity activeOpacity={0.8} onPress={handleSuccessClose}>
                        <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.modalButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={styles.modalButtonText}>Fertig</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SuccessModal />

            <LinearGradient colors={['#FF5A5F', '#CE494D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerGradient}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Inhalt melden</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.warningBanner}>
                    <AlertTriangle size={24} color="#FF5A5F" strokeWidth={2} />
                    <Text style={styles.warningText}>
                        Bitte wähle den Grund aus, der am besten beschreibt, warum du diesen Inhalt meldest.
                    </Text>
                </View>

                {targetUser && (
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemInfoLabel}>Meldung für:</Text>
                        <Text style={styles.itemInfoText}>
                            {contentType === 'post' ? 'Post' : contentType === 'comment' ? 'Kommentar' : 'Profil'} von {targetUser.name}
                        </Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.reasonsContainer}>
                    <Text style={styles.sectionTitle}>Grund auswählen</Text>

                    {isLoading ? (
                        <ActivityIndicator size="large" color="#FF5A5F" style={{ paddingVertical: 30 }} />
                    ) : categories.length === 0 ? (
                        <Text style={styles.emptyText}>Keine Kategorien verfügbar</Text>
                    ) : (
                        categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.slug}
                                style={[styles.reasonItem, selectedCategory === cat.slug && styles.reasonItemSelected]}
                                onPress={() => setSelectedCategory(cat.slug)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.reasonContent}>
                                    <View style={[styles.radioButton, selectedCategory === cat.slug && styles.radioButtonSelected]}>
                                        {selectedCategory === cat.slug && <View style={styles.radioButtonInner} />}
                                    </View>
                                    <View style={styles.reasonTextContainer}>
                                        <Text style={[styles.reasonLabel, selectedCategory === cat.slug && styles.reasonLabelSelected]}>
                                            {cat.name}
                                        </Text>
                                        {cat.description && (
                                            <Text style={styles.reasonDescription}>{cat.description}</Text>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={styles.additionalSection}>
                    <Text style={styles.sectionTitle}>Zusätzliche Informationen (optional)</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Beschreibe genauer, was das Problem ist..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            value={additionalInfo}
                            onChangeText={setAdditionalInfo}
                            textAlignVertical="top"
                        />
                    </View>
                    <Text style={styles.characterCount}>{additionalInfo.length}/500</Text>
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                    disabled={!selectedCategory || isSubmitting}
                >
                    <LinearGradient
                        colors={selectedCategory && !isSubmitting ? ['#FF5A5F', '#CE494D'] : ['#CCC', '#BBB']}
                        style={styles.submitButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Meldung absenden</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Falsche Meldungen können Konsequenzen für deinen Account haben. Melde nur Inhalte, die tatsächlich gegen unsere Richtlinien verstoßen.
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    headerGradient: { paddingTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    scrollView: { flex: 1 },
    warningBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', margin: 15, padding: 15, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF5A5F' },
    warningText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#666', lineHeight: 20 },
    itemInfo: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 15, padding: 15, borderRadius: 12 },
    itemInfoLabel: { fontSize: 12, color: '#999', marginBottom: 5 },
    itemInfoText: { fontSize: 15, color: '#333', fontWeight: '500' },
    errorBanner: { backgroundColor: '#FFF0F0', marginHorizontal: 15, marginBottom: 15, padding: 15, borderRadius: 12 },
    errorText: { color: '#FF5A5F', fontSize: 14, textAlign: 'center' },
    emptyText: { color: '#999', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
    reasonsContainer: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 15, padding: 15, borderRadius: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    reasonItem: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, marginBottom: 8, backgroundColor: '#f8f9fa' },
    reasonItemSelected: { backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FF5A5F' },
    reasonContent: { flexDirection: 'row', alignItems: 'flex-start' },
    radioButton: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
    radioButtonSelected: { borderColor: '#FF5A5F' },
    radioButtonInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF5A5F' },
    reasonTextContainer: { flex: 1 },
    reasonLabel: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 3 },
    reasonLabelSelected: { color: '#FF5A5F' },
    reasonDescription: { fontSize: 13, color: '#888', lineHeight: 18 },
    additionalSection: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 15, padding: 15, borderRadius: 12 },
    textInputContainer: { backgroundColor: '#f8f9fa', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0' },
    textInput: { padding: 12, fontSize: 14, color: '#333', minHeight: 100, lineHeight: 20 },
    characterCount: { textAlign: 'right', marginTop: 8, fontSize: 12, color: '#999' },
    submitButton: { marginHorizontal: 15, paddingVertical: 16, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFF', letterSpacing: 0.5 },
    disclaimer: { marginHorizontal: 15, marginTop: 15, fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '100%', maxWidth: 340, alignItems: 'center' },
    successIconContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    modalMessage: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
    modalButton: { paddingVertical: 12, paddingHorizontal: 50, borderRadius: 25 },
    modalButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
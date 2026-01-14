import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    TextInput,
    Platform,
    ScrollView,
    Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react-native';

const reportReasons = [
    { id: 1, label: 'Inappropriate content', description: 'Nudity, sexual content, or offensive material' },
    { id: 2, label: 'Spam', description: 'Misleading or repetitive content' },
    { id: 3, label: 'Harassment or bullying', description: 'Targeting or attacking individuals' },
    { id: 4, label: 'Hate speech', description: 'Discrimination or hateful content' },
    { id: 5, label: 'Violence or dangerous content', description: 'Threats, self-harm, or dangerous activities' },
    { id: 6, label: 'Intellectual property violation', description: 'Copyright or trademark infringement' },
    { id: 7, label: 'Scam or fraud', description: 'Deceptive practices or fake products' },
    { id: 8, label: 'Other', description: 'Something else not listed above' },
];

export default function ReportScreen({ item, onClose, onSubmit }) {
    const [selectedReason, setSelectedReason] = useState(null);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleSubmit = () => {
        if (!selectedReason) return;

        const reportData = {
            itemId: item?.id,
            reason: reportReasons.find(r => r.id === selectedReason),
            additionalInfo: additionalInfo.trim(),
            timestamp: new Date().toISOString(),
        };

        console.log('Report submitted:', reportData);

        if (onSubmit) {
            onSubmit(reportData);
        }

        setShowSuccessModal(true);
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        // Small delay to ensure modal closes first
        setTimeout(() => {
            onClose();
        }, 100);
    };

    // Success Modal
    const SuccessModal = () => (
        <Modal
            visible={showSuccessModal}
            transparent={true}
            animationType="fade"
            onRequestClose={handleSuccessClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.successIconContainer}>
                        <Check size={40} color="#4CAF50" strokeWidth={3} />
                    </View>
                    <Text style={styles.modalTitle}>Report Submitted</Text>
                    <Text style={styles.modalMessage}>
                        Thank you for helping keep our community safe. We'll review this report and take appropriate action.
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleSuccessClose}
                    >
                        <LinearGradient
                            colors={['#FF5A5F', '#CE494D']}
                            style={styles.modalButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.modalButtonText}>Done</Text>
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

            {/* Header */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Report Content</Text>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Warning Banner */}
                <View style={styles.warningBanner}>
                    <AlertTriangle size={24} color="#FF5A5F" strokeWidth={2} />
                    <Text style={styles.warningText}>
                        Please select the reason that best describes why you're reporting this content.
                    </Text>
                </View>

                {/* Item Info */}
                {item && (
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemInfoLabel}>Reporting:</Text>
                        <Text style={styles.itemInfoText}>
                            "{item.description}" by @{item.username}
                        </Text>
                    </View>
                )}

                {/* Report Reasons */}
                <View style={styles.reasonsContainer}>
                    <Text style={styles.sectionTitle}>Select a reason</Text>

                    {reportReasons.map((reason) => (
                        <TouchableOpacity
                            key={reason.id}
                            style={[
                                styles.reasonItem,
                                selectedReason === reason.id && styles.reasonItemSelected
                            ]}
                            onPress={() => setSelectedReason(reason.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.reasonContent}>
                                <View style={[
                                    styles.radioButton,
                                    selectedReason === reason.id && styles.radioButtonSelected
                                ]}>
                                    {selectedReason === reason.id && (
                                        <View style={styles.radioButtonInner} />
                                    )}
                                </View>
                                <View style={styles.reasonTextContainer}>
                                    <Text style={[
                                        styles.reasonLabel,
                                        selectedReason === reason.id && styles.reasonLabelSelected
                                    ]}>
                                        {reason.label}
                                    </Text>
                                    <Text style={styles.reasonDescription}>
                                        {reason.description}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Additional Information */}
                <View style={styles.additionalSection}>
                    <Text style={styles.sectionTitle}>Additional information (optional)</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Provide any additional details that might help us understand the issue..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            value={additionalInfo}
                            onChangeText={setAdditionalInfo}
                            textAlignVertical="top"
                        />
                    </View>
                    <Text style={styles.characterCount}>
                        {additionalInfo.length}/500
                    </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                    disabled={!selectedReason}
                >
                    <LinearGradient
                        colors={selectedReason ? ['#FF5A5F', '#CE494D'] : ['#CCC', '#BBB']}
                        style={styles.submitButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.submitButtonText}>Submit Report</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Disclaimer */}
                <Text style={styles.disclaimer}>
                    False reports may result in action against your account. Only submit a report if you genuinely believe this content violates our community guidelines.
                </Text>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerGradient: {
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0F0',
        margin: 15,
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FF5A5F',
    },
    warningText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    itemInfo: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        borderRadius: 12,
    },
    itemInfoLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 5,
    },
    itemInfoText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    reasonsContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    reasonItem: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 8,
        backgroundColor: '#f8f9fa',
    },
    reasonItemSelected: {
        backgroundColor: '#FFF0F0',
        borderWidth: 1,
        borderColor: '#FF5A5F',
    },
    reasonContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    radioButton: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    radioButtonSelected: {
        borderColor: '#FF5A5F',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF5A5F',
    },
    reasonTextContainer: {
        flex: 1,
    },
    reasonLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 3,
    },
    reasonLabelSelected: {
        color: '#FF5A5F',
    },
    reasonDescription: {
        fontSize: 13,
        color: '#888',
        lineHeight: 18,
    },
    additionalSection: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        borderRadius: 12,
    },
    textInputContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textInput: {
        padding: 12,
        fontSize: 14,
        color: '#333',
        minHeight: 100,
        lineHeight: 20,
    },
    characterCount: {
        textAlign: 'right',
        marginTop: 8,
        fontSize: 12,
        color: '#999',
    },
    submitButton: {
        marginHorizontal: 15,
        paddingVertical: 16,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    disclaimer: {
        marginHorizontal: 15,
        marginTop: 15,
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        lineHeight: 18,
    },
    bottomPadding: {
        height: 40,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    successIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 25,
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 50,
        borderRadius: 25,
    },
    modalButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});
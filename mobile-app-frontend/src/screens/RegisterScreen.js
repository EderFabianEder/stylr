import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert
} from 'react-native';

export default function RegisterScreen({ onRegister, onNavigateToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Fehler', 'Passwörter stimmen nicht überein');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Fehler', 'Passwort muss mindestens 6 Zeichen lang sein');
            return;
        }

        setIsLoading(true);

        // TODO: Hier später API-Call zu deinem Laravel Backend
        setTimeout(() => {
            setIsLoading(false);
            Alert.alert('Erfolg', 'Account erstellt!', [
                { text: 'OK', onPress: () => onRegister({ name, email }) }
            ]);
        }, 1000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.registerHeader}>
                        <TouchableOpacity onPress={onNavigateToLogin} style={styles.backButton}>
                            <Text style={styles.backButtonText}>← Zurück</Text>
                        </TouchableOpacity>
                        <Text style={styles.registerTitle}>Konto erstellen</Text>
                        <Text style={styles.registerSubtitle}>Werde Teil der stylr Community</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Dein Name"
                                placeholderTextColor="#95a5a6"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>E-Mail</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="deine@email.com"
                                placeholderTextColor="#95a5a6"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Passwort</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Mindestens 6 Zeichen"
                                placeholderTextColor="#95a5a6"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="password"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Passwort bestätigen</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Passwort wiederholen"
                                placeholderTextColor="#95a5a6"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, styles.loginButton, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Lädt...' : 'Registrieren'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                Mit der Registrierung stimmst du unseren{' '}
                                <Text style={styles.termsLink}>AGB</Text> und{' '}
                                <Text style={styles.termsLink}>Datenschutzrichtlinien</Text> zu
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    registerHeader: {
        marginBottom: 40,
    },
    backButton: {
        marginBottom: 20,
    },
    backButtonText: {
        color: '#3498db',
        fontSize: 16,
        fontWeight: '600',
    },
    registerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    registerSubtitle: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#2c3e50',
    },
    button: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    loginButton: {
        backgroundColor: '#2c3e50',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    termsContainer: {
        marginTop: 20,
        paddingHorizontal: 10,
    },
    termsText: {
        fontSize: 12,
        color: '#95a5a6',
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#3498db',
        fontWeight: '600',
    },
});
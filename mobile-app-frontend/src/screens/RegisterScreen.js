import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/api';

export default function RegisterScreen({ onRegister, onNavigateToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleRegister = async () => {
        setErrors({});

        // Client-side validation
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
            return;
        }

        if (password !== confirmPassword) {
            setErrors({ password_confirmation: ['Passwörter stimmen nicht überein'] });
            return;
        }

        if (password.length < 8) {
            setErrors({ password: ['Passwort muss mindestens 8 Zeichen haben'] });
            return;
        }

        setIsLoading(true);
        try {
            const accountType = isPrivate ? 'private' : 'public';
            const response = await authService.register(name, email, password, confirmPassword, accountType);

            // Registrierung erfolgreich
            Alert.alert(
                'Willkommen bei STYLR! 🎉',
                'Dein Account wurde erstellt. Bitte verifiziere deine E-Mail-Adresse.',
                [{
                    text: 'OK',
                    onPress: () => {
                        const userData = response.data?.user || response.data;
                        onRegister(userData);
                    }
                }]
            );

        } catch (error) {
            // Validation errors vom Server
            if (error.errors) {
                setErrors(error.errors);
            }

            Alert.alert('Registrierung fehlgeschlagen', error.message || 'Bitte versuche es erneut');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.topCircle} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        <View style={styles.registerHeader}>
                            <TouchableOpacity onPress={onNavigateToLogin}>
                                <Text style={styles.backButtonText}>← Zurück</Text>
                            </TouchableOpacity>
                            <Text style={styles.registerTitle}>Registrieren</Text>
                        </View>

                        <View style={styles.loginPrompt}>
                            <Text style={styles.loginText}>Bereits registriert? </Text>
                            <TouchableOpacity onPress={onNavigateToLogin}>
                                <Text style={styles.loginLink}>Login</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formContainer}>
                            <TextInput
                                style={[styles.input, errors.name && styles.inputError]}
                                placeholder="Name"
                                placeholderTextColor="#999"
                                value={name}
                                onChangeText={setName}
                                editable={!isLoading}
                            />
                            {errors.name && <Text style={styles.errorText}>{errors.name[0]}</Text>}

                            <TextInput
                                style={[styles.input, errors.email && styles.inputError]}
                                placeholder="E-Mail"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!isLoading}
                            />
                            {errors.email && <Text style={styles.errorText}>{errors.email[0]}</Text>}

                            <TextInput
                                style={[styles.input, errors.password && styles.inputError]}
                                placeholder="Passwort (min. 8 Zeichen)"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!isLoading}
                            />
                            {errors.password && <Text style={styles.errorText}>{errors.password[0]}</Text>}

                            <TextInput
                                style={[styles.input, errors.password_confirmation && styles.inputError]}
                                placeholder="Passwort bestätigen"
                                placeholderTextColor="#999"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                editable={!isLoading}
                            />
                            {errors.password_confirmation && <Text style={styles.errorText}>{errors.password_confirmation[0]}</Text>}

                            <View style={styles.privacyContainer}>
                                <View style={styles.privacyTextContainer}>
                                    <Text style={styles.privacyTitle}>Privates Profil</Text>
                                    <Text style={styles.privacyDescription}>
                                        {isPrivate
                                            ? 'Nur bestätigte Follower können deine Posts sehen'
                                            : 'Jeder kann dein Profil und Posts sehen'}
                                    </Text>
                                </View>
                                <Switch
                                    value={isPrivate}
                                    onValueChange={setIsPrivate}
                                    trackColor={{ false: '#e0e0e0', true: '#ffcccb' }}
                                    thumbColor={isPrivate ? '#FF5A5F' : '#f4f3f4'}
                                    disabled={isLoading}
                                />
                            </View>

                            <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
                                <LinearGradient colors={['#FF5A5F', '#CE494D']} style={[styles.registerButton, isLoading && styles.buttonDisabled]}>
                                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Account erstellen</Text>}
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.termsText}>
                                Mit der Registrierung akzeptierst du unsere Nutzungsbedingungen und Datenschutzrichtlinien.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.bottomCircle} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, paddingHorizontal: 30, paddingTop: 60, paddingBottom: 40 },
    topCircle: { position: 'absolute', top: -100, left: -50, width: 200, height: 200, borderRadius: 100, opacity: 0.6, zIndex: -1 },
    bottomCircle: { position: 'absolute', bottom: -80, left: -60, width: 180, height: 180, borderRadius: 90, opacity: 0.5, zIndex: -1 },
    registerHeader: { marginBottom: 20, marginTop: 50 },
    backButtonText: { color: '#FF5A5F', fontSize: 16, fontWeight: '600', marginBottom: 20 },
    registerTitle: { fontSize: 36, fontWeight: '300', color: '#000' },
    loginPrompt: { flexDirection: 'row', marginBottom: 30 },
    loginText: { fontSize: 14, color: '#666' },
    loginLink: { fontSize: 14, color: '#FF5A5F', fontWeight: '500' },
    formContainer: { width: '100%' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#333', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 15, fontSize: 14, color: '#000', marginBottom: 20 },
    inputError: { borderColor: '#FF5A5F', marginBottom: 5 },
    errorText: { color: '#FF5A5F', fontSize: 12, marginLeft: 20, marginBottom: 15 },
    privacyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8f8f8', borderRadius: 15, padding: 15, marginBottom: 25 },
    privacyTextContainer: { flex: 1, marginRight: 15 },
    privacyTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
    privacyDescription: { fontSize: 12, color: '#666' },
    registerButton: { borderRadius: 25, paddingVertical: 15, paddingHorizontal: 40, alignItems: 'center', marginTop: 10 },
    buttonDisabled: { opacity: 0.6 },
    registerButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    termsText: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 20, lineHeight: 18 },
});
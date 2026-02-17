import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/api';

export default function LoginScreen({ onLogin, onNavigateToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [needs2FA, setNeeds2FA] = useState(false);

    const handleLogin = async () => {
        setErrors({});

        if (!email || !password) {
            Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
            return;
        }

        if (needs2FA && !twoFactorCode) {
            Alert.alert('Fehler', 'Bitte gib deinen 2FA-Code ein');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authService.login(email, password, needs2FA ? twoFactorCode : null);

            // Login erfolgreich - merge user data with abilities
            const userData = {
                ...(response.data?.user || response.data),
                abilities: response.data?.abilities || [],
            };
            console.log('Login userData:', JSON.stringify(userData));
            onLogin(userData);

        } catch (error) {
            // 2FA erforderlich
            if (error.status === 403 && error.data?.two_factor_required) {
                setNeeds2FA(true);
                Alert.alert('2FA erforderlich', 'Bitte gib deinen 2FA-Code ein');
                return;
            }

            // Account gesperrt
            if (error.status === 423) {
                const lockedUntil = error.data?.locked_until;
                Alert.alert('Account gesperrt', `Bitte versuche es später erneut.${lockedUntil ? `\nGesperrt bis: ${lockedUntil}` : ''}`);
                return;
            }

            // Validation errors
            if (error.errors) {
                setErrors(error.errors);
            }

            // Remaining attempts
            if (error.data?.remaining_attempts !== undefined) {
                Alert.alert('Login fehlgeschlagen', `${error.message}\nVerbleibende Versuche: ${error.data.remaining_attempts}`);
            } else {
                Alert.alert('Login fehlgeschlagen', error.message || 'Bitte überprüfe deine Anmeldedaten');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert(
            'Passwort vergessen?',
            'Gib deine E-Mail-Adresse ein um einen Reset-Link zu erhalten.',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Reset-Link senden',
                    onPress: async () => {
                        if (!email) {
                            Alert.alert('Fehler', 'Bitte gib zuerst deine E-Mail-Adresse ein');
                            return;
                        }
                        try {
                            await authService.forgotPassword(email);
                            Alert.alert('Erfolg', 'Falls ein Account existiert, wurde ein Reset-Link gesendet.');
                        } catch (error) {
                            Alert.alert('Fehler', error.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.topCircle} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <View style={styles.content}>
                    <Text style={styles.title}>Login</Text>
                    <View style={styles.signupPrompt}>
                        <Text style={styles.signupText}>Noch kein Account? </Text>
                        <TouchableOpacity onPress={onNavigateToRegister}>
                            <Text style={styles.signupLink}>Registrieren</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formContainer}>
                        <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="E-Mail"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!isLoading && !needs2FA}
                        />
                        {errors.email && <Text style={styles.errorText}>{errors.email[0]}</Text>}

                        <TextInput
                            style={[styles.input, errors.password && styles.inputError]}
                            placeholder="Passwort"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!isLoading && !needs2FA}
                        />
                        {errors.password && <Text style={styles.errorText}>{errors.password[0]}</Text>}

                        {needs2FA && (
                            <>
                                <Text style={styles.twoFALabel}>2FA-Code eingeben:</Text>
                                <TextInput
                                    style={[styles.input, styles.twoFAInput]}
                                    placeholder="000000"
                                    placeholderTextColor="#999"
                                    value={twoFactorCode}
                                    onChangeText={setTwoFactorCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!isLoading}
                                />
                            </>
                        )}

                        <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
                            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={[styles.loginButton, isLoading && styles.buttonDisabled]}>
                                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Login</Text>}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
                            <Text style={styles.forgotButtonText}>Passwort vergessen?</Text>
                        </TouchableOpacity>

                        {needs2FA && (
                            <TouchableOpacity onPress={() => { setNeeds2FA(false); setTwoFactorCode(''); }} style={styles.backButton}>
                                <Text style={styles.backButtonText}>← Zurück</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
            <LinearGradient colors={['#FF5A5F', '#CE494D']} style={styles.bottomCircle} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    keyboardView: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 30, paddingTop: 60 },
    topCircle: { position: 'absolute', top: -100, left: -50, width: 200, height: 200, borderRadius: 100, opacity: 0.6, zIndex: -1 },
    bottomCircle: { position: 'absolute', bottom: -80, left: -60, width: 180, height: 180, borderRadius: 90, opacity: 0.5, zIndex: -1 },
    title: { fontSize: 36, fontWeight: '300', color: '#000', marginBottom: 15, marginTop: 120 },
    signupPrompt: { flexDirection: 'row', marginBottom: 40 },
    signupText: { fontSize: 14, color: '#666' },
    signupLink: { fontSize: 14, color: '#FF5A5F', fontWeight: '500' },
    formContainer: { width: '100%' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#333', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 15, fontSize: 14, color: '#000', marginBottom: 20 },
    inputError: { borderColor: '#FF5A5F', marginBottom: 5 },
    errorText: { color: '#FF5A5F', fontSize: 12, marginLeft: 20, marginBottom: 15 },
    twoFALabel: { fontSize: 14, color: '#666', marginBottom: 10, marginLeft: 5 },
    twoFAInput: { textAlign: 'center', fontSize: 24, letterSpacing: 10 },
    loginButton: { borderRadius: 25, paddingVertical: 15, paddingHorizontal: 40, alignSelf: 'flex-start', marginTop: 10, minWidth: 120, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    forgotButton: { marginTop: 20 },
    forgotButtonText: { color: '#666', fontSize: 14 },
    backButton: { marginTop: 15 },
    backButtonText: { color: '#FF5A5F', fontSize: 14, fontWeight: '500' },
});
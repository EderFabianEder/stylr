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

export default function LoginScreen({ onLogin, onNavigateToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
            return;
        }

        setIsLoading(true);

        // TODO: Hier später API-Call zu deinem Laravel Backend
        setTimeout(() => {
            setIsLoading(false);
            onLogin({ email });
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
                    {/* Top Circle Decoration */}
                    <View style={styles.topCircle} />

                    {/* Login Title */}
                    <Text style={styles.title}>Login</Text>

                    {/* Don't have an account */}
                    <View style={styles.signupPrompt}>
                        <Text style={styles.signupText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={onNavigateToRegister}>
                            <Text style={styles.signupLink}>sign up</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password"
                        />

                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={styles.loginButtonText}>
                                {isLoading ? 'Loading...' : 'Login'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Circle Decoration */}
                    <View style={styles.bottomCircle} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 60,
    },
    topCircle: {
        position: 'absolute',
        top: -100,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#ff7b9d',
        opacity: 0.6,
    },
    bottomCircle: {
        position: 'absolute',
        bottom: -80,
        left: -60,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#ff7b9d',
        opacity: 0.5,
    },
    title: {
        fontSize: 36,
        fontWeight: '300',
        color: '#000',
        marginBottom: 15,
        marginTop: 120,
    },
    signupPrompt: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    signupText: {
        fontSize: 14,
        color: '#666',
    },
    signupLink: {
        fontSize: 14,
        color: '#ff7b9d',
        fontWeight: '500',
    },
    formContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 15,
        fontSize: 14,
        color: '#000',
        marginBottom: 20,
    },
    loginButton: {
        backgroundColor: '#ff6b8a',
        borderRadius: 25,
        paddingVertical: 15,
        paddingHorizontal: 40,
        alignSelf: 'flex-start',
        marginTop: 10,
        shadowColor: '#ff6b8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
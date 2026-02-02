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
    Alert,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from './api';

export default function LoginScreen({ onLogin, onNavigateToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleLogin = async () => {
        // Clear previous errors
        setErrors({});

        // Basic validation
        if (!email || !password) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.login(email, password);

            // Get user data after successful login
            const userData = await authService.getUser();

            onLogin(userData.data || userData);
        } catch (error) {
            console.log('Login error:', error);

            if (error.errors) {
                setErrors(error.errors);
            }

            if (Platform.OS === 'web') {
                window.alert(error.message || 'Login failed. Please check your credentials.');
            } else {
                Alert.alert('Login Failed', error.message || 'Please check your credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Circle mit Gradient */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.topCircle}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <Text style={styles.title}>Login</Text>

                    <View style={styles.signupPrompt}>
                        <Text style={styles.signupText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={onNavigateToRegister}>
                            <Text style={styles.signupLink}>sign up</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formContainer}>
                        <View>
                            <TextInput
                                style={[styles.input, errors.email && styles.inputError]}
                                placeholder="Email"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    setErrors({ ...errors, email: null });
                                }}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                                editable={!isLoading}
                            />
                            {errors.email && (
                                <Text style={styles.errorText}>{errors.email[0]}</Text>
                            )}
                        </View>

                        <View>
                            <TextInput
                                style={[styles.input, errors.password && styles.inputError]}
                                placeholder="Password"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setErrors({ ...errors, password: null });
                                }}
                                secureTextEntry
                                autoComplete="password"
                                editable={!isLoading}
                            />
                            {errors.password && (
                                <Text style={styles.errorText}>{errors.password[0]}</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#FF5A5F', '#CE494D']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Login</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Bottom Circle mit Gradient */}
            <LinearGradient
                colors={['#FF5A5F', '#CE494D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomCircle}
            />
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
    content: {
        flex: 1,
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
        opacity: 0.6,
        zIndex: -1,
    },
    bottomCircle: {
        position: 'absolute',
        bottom: -80,
        left: -60,
        width: 180,
        height: 180,
        borderRadius: 90,
        opacity: 0.5,
        zIndex: -1,
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
        color: '#FF5A5F',
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
    inputError: {
        borderColor: '#FF5A5F',
        marginBottom: 5,
    },
    errorText: {
        color: '#FF5A5F',
        fontSize: 12,
        marginLeft: 20,
        marginBottom: 15,
    },
    loginButton: {
        borderRadius: 25,
        paddingVertical: 15,
        paddingHorizontal: 40,
        alignSelf: 'flex-start',
        marginTop: 10,
        shadowColor: '#FF5A5F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        minWidth: 120,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    forgotPassword: {
        marginTop: 20,
    },
    forgotPasswordText: {
        color: '#FF5A5F',
        fontSize: 14,
    },
});
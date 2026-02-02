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
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from './api';

export default function RegisterScreen({ onRegister, onNavigateToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleRegister = async () => {
        // Clear previous errors
        setErrors({});

        // Basic validation
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (password !== confirmPassword) {
            setErrors({ password_confirmation: ['Passwords do not match'] });
            return;
        }

        if (password.length < 8) {
            setErrors({ password: ['Password must be at least 8 characters'] });
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.register(
                name,
                email,
                password,
                confirmPassword
            );

            // Get user data after successful registration
            const userData = await authService.getUser();

            if (Platform.OS === 'web') {
                window.alert('Account created successfully!');
            } else {
                Alert.alert('Success', 'Account created successfully!', [
                    { text: 'OK', onPress: () => onRegister(userData.data || userData) }
                ]);
                return;
            }

            onRegister(userData.data || userData);
        } catch (error) {
            console.log('Registration error:', error);

            if (error.errors) {
                setErrors(error.errors);
            }

            if (Platform.OS === 'web') {
                window.alert(error.message || 'Registration failed. Please try again.');
            } else {
                Alert.alert('Registration Failed', error.message || 'Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
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
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        <View style={styles.registerHeader}>
                            <TouchableOpacity onPress={onNavigateToLogin}>
                                <Text style={styles.backButtonText}>← Back</Text>
                            </TouchableOpacity>
                            <Text style={styles.registerTitle}>Register</Text>
                        </View>

                        <View style={styles.loginPrompt}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={onNavigateToLogin}>
                                <Text style={styles.loginLink}>login</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formContainer}>
                            <View>
                                <TextInput
                                    style={[styles.input, errors.name && styles.inputError]}
                                    placeholder="Name"
                                    placeholderTextColor="#999"
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        setErrors({ ...errors, name: null });
                                    }}
                                    autoCapitalize="words"
                                    editable={!isLoading}
                                />
                                {errors.name && (
                                    <Text style={styles.errorText}>{errors.name[0]}</Text>
                                )}
                            </View>

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
                                    autoComplete="password-new"
                                    editable={!isLoading}
                                />
                                {errors.password && (
                                    <Text style={styles.errorText}>{errors.password[0]}</Text>
                                )}
                            </View>

                            <View>
                                <TextInput
                                    style={[styles.input, errors.password_confirmation && styles.inputError]}
                                    placeholder="Confirm Password"
                                    placeholderTextColor="#999"
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        setErrors({ ...errors, password_confirmation: null });
                                    }}
                                    secureTextEntry
                                    editable={!isLoading}
                                />
                                {errors.password_confirmation && (
                                    <Text style={styles.errorText}>{errors.password_confirmation[0]}</Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={handleRegister}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#FF5A5F', '#CE494D']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.registerButtonText}>Register</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

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
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 60,
        paddingBottom: 40,
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
    registerHeader: {
        marginBottom: 20,
        marginTop: 50,
    },
    backButtonText: {
        color: '#FF5A5F',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 20,
    },
    registerTitle: {
        fontSize: 36,
        fontWeight: '300',
        color: '#000',
    },
    loginPrompt: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    loginText: {
        fontSize: 14,
        color: '#666',
    },
    loginLink: {
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
    registerButton: {
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
        minWidth: 140,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
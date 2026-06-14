import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, Alert, BackHandler, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { API_URL } from '../config';

interface LoginScreenProps {
  onNavigateToWelcome: () => void;
  onNavigateToSignup: () => void;
  onLoginSuccess: () => void;
  onLoginAsAdmin: () => void;
}

const KeyboardWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

export default function LoginScreen({ onNavigateToWelcome, onNavigateToSignup, onLoginSuccess, onLoginAsAdmin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: boolean; password?: boolean }>({});

  useEffect(() => {
    const backAction = () => {
      onNavigateToWelcome();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onNavigateToWelcome]);

  const handleLogin = async () => {
    let newErrors = {};
    if (!email.trim()) newErrors = { ...newErrors, email: true };
    if (!password.trim()) newErrors = { ...newErrors, password: true };

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, passwordHash: password })
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userEmail', cleanEmail);
        setIsSubmitting(false);
        onLoginSuccess();
      } else {
        setIsSubmitting(false);
        Alert.alert("Authentication Denied", "Invalid email/password combinations or account verification is pending.");
      }
    } catch (networkError) {
      setIsSubmitting(false);
      Alert.alert("Network Timeout", "Could not verify context against backend infrastructure.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />

      <KeyboardWrapper behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Top Dark Hero Section */}
        <View style={styles.topHeroSection}>
          <TouchableOpacity style={styles.backIconButton} onPress={onNavigateToWelcome} activeOpacity={0.8}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Sign In</Text>
          <Text style={styles.heroSubtitle}>Welcome back to the campus network.</Text>
        </View>

        {/* Bottom Sheet Form Section */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.bottomSheet}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Small drag pill for visual aesthetics */}
          <View style={styles.dragPill} />

          <Text style={styles.inputLabel}>Campus Email</Text>
          <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputWrapperFocused, errors.email && styles.inputWrapperError]}>
            <Mail size={20} color={focusedInput === 'email' ? '#2D4196' : '#9CA3AF'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="student@buitems.edu.pk"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => { setEmail(text); setErrors({ ...errors, email: false }); }}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>Please enter your campus email</Text>}

          <Text style={[styles.inputLabel, { marginTop: 24 }]}>Password</Text>
          <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputWrapperFocused, errors.password && styles.inputWrapperError]}>
            <Lock size={20} color={focusedInput === 'password' ? '#2D4196' : '#9CA3AF'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={(text) => { setPassword(text); setErrors({ ...errors, password: false }); }}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {errors.password && <Text style={styles.errorText}>Password is required</Text>}

          <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
            activeOpacity={0.9}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Sign In</Text>
                <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignup} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />

          <TouchableOpacity onPress={onLoginAsAdmin} style={styles.adminPortal} activeOpacity={0.7}>
            <ShieldCheck size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
            <Text style={styles.adminPortalText}>Access Admin Panel</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D4196' // Base color is now Deep Blue
  },
  topHeroSection: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    paddingBottom: 40,
    backgroundColor: '#2D4196',
  },
  backIconButton: {
    alignSelf: 'flex-start',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glassmorphism touch
    borderRadius: 12,
    marginBottom: 32,
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 40,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 16,
    color: '#E0E7FF', // Soft light blue
  },
  bottomSheet: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 40,
  },
  dragPill: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 32,
  },
  inputLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Minimalist borderless gray background
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'transparent', // Transparent by default for modern look
  },
  inputWrapperFocused: {
    borderColor: '#2D4196',
    backgroundColor: '#FFFFFF',
    // YAHAN SE BHI SHADOW AUR ELEVATION REMOVE KIYA HAI
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    paddingVertical: 18,
    fontSize: 16,
    color: '#111827'
  },
  errorText: {
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#EF4444',
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 16,
    marginBottom: 32
  },
  forgotText: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#2D4196',
    fontSize: 14
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#2D4196',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D4196',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0
  },
  submitButtonText: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: 0.5
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#6B7280',
    fontSize: 15
  },
  footerLink: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#F17022',
    fontSize: 15
  },
  bottomSpacer: {
    flex: 1, // Pushes admin portal to the absolute bottom if screen is tall
    minHeight: 40,
  },
  adminPortal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  adminPortalText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#9CA3AF',
    fontSize: 14
  }
});
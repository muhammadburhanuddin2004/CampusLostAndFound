import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, Alert, ScrollView, BackHandler
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { API_URL } from '../config';

interface SignupScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToDashboard: () => void;
}

const KeyboardWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

export default function SignupScreen({ onNavigateToLogin, onNavigateToDashboard }: SignupScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    const backAction = () => {
      onNavigateToLogin();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onNavigateToLogin]);

  const handleSignup = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const newErrors: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanName) newErrors.fullName = "Full name is required";
    if (!cleanEmail) newErrors.email = "Email address is required";
    else if (!emailRegex.test(cleanEmail)) newErrors.email = "Please enter a valid email address";
    if (!password) newErrors.password = "Password field cannot be empty";
    else if (password.length < 6) newErrors.password = "Must be at least 6 characters";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/test-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: password, passwordHash: password, username: cleanName, role: "Student" })
      });

      if (response.ok) {
        await AsyncStorage.setItem('userEmail', cleanEmail);
        await AsyncStorage.setItem('userName', cleanName);

        // CRASH FIX APPLIED HERE
        Alert.alert("Registration Success", `Welcome aboard, ${cleanName}!`, [
          {
            text: "Go to Dashboard",
            onPress: () => {
              if (onNavigateToDashboard) {
                onNavigateToDashboard();
              }
            }
          }
        ]);
      } else {
        const errorText = await response.text();
        Alert.alert("Registration Failed", errorText || "The server rejected the registration parameters.");
      }
    } catch (networkError) {
      Alert.alert("Network Timeout", "Could not establish a connection to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />

      <KeyboardWrapper behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Top Dark Hero Section */}
        <View style={styles.topHeroSection}>
          <TouchableOpacity style={styles.backIconButton} onPress={onNavigateToLogin} activeOpacity={0.8}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Create Account</Text>
          <Text style={styles.heroSubtitle}>Deploy your profile to join the network.</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.bottomSheet}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.dragPill} />

          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={[styles.inputWrapper, focusedInput === 'fullName' && styles.inputWrapperFocused, errors.fullName ? styles.inputWrapperError : null]}>
            <User size={20} color={focusedInput === 'fullName' ? '#2D4196' : '#9CA3AF'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={(text) => { setFullName(text); setErrors(prev => ({ ...prev, fullName: undefined })); }}
              onFocus={() => setFocusedInput('fullName')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>Email Address</Text>
          <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputWrapperFocused, errors.email ? styles.inputWrapperError : null]}>
            <Mail size={20} color={focusedInput === 'email' ? '#2D4196' : '#9CA3AF'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="student@buitems.edu.pk"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => { setEmail(text); setErrors(prev => ({ ...prev, email: undefined })); }}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>Password</Text>
          <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputWrapperFocused, errors.password ? styles.inputWrapperError : null]}>
            <Lock size={20} color={focusedInput === 'password' ? '#2D4196' : '#9CA3AF'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Create a secure password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={(text) => { setPassword(text); setErrors(prev => ({ ...prev, password: undefined })); }}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>Confirm Password</Text>
          <View style={[styles.inputWrapper, focusedInput === 'confirm' && styles.inputWrapperFocused, errors.confirmPassword ? styles.inputWrapperError : null]}>
            <ShieldCheck size={20} color={focusedInput === 'confirm' ? '#2D4196' : '#9CA3AF'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Verify your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
              onFocus={() => setFocusedInput('confirm')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled, { marginTop: 40 }]}
            onPress={handleSignup}
            disabled={isSubmitting}
            activeOpacity={0.9}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Sign Up & Verify</Text>
                <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have a profile? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2D4196' },
  topHeroSection: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60, paddingBottom: 40, backgroundColor: '#2D4196' },
  backIconButton: { alignSelf: 'flex-start', padding: 8, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12, marginBottom: 32 },
  heroTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 38, color: '#FFFFFF', letterSpacing: -1, marginBottom: 8 },
  heroSubtitle: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 16, color: '#E0E7FF' },
  bottomSheet: { flexGrow: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 40 },
  dragPill: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 10, alignSelf: 'center', marginBottom: 32 },
  inputLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: '#111827', marginBottom: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: 'transparent' },
  inputWrapperFocused: {
    borderColor: '#2D4196',
    backgroundColor: '#FFFFFF'
  },
  inputWrapperError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontFamily: 'PlusJakartaSans-Medium', paddingVertical: 18, fontSize: 16, color: '#111827' },
  errorText: { fontFamily: 'PlusJakartaSans-Medium', color: '#EF4444', fontSize: 13, marginTop: 8, marginLeft: 4 },
  submitButton: { flexDirection: 'row', backgroundColor: '#2D4196', borderRadius: 18, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#2D4196', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  submitButtonDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0, elevation: 0 },
  submitButtonText: { fontFamily: 'PlusJakartaSans-Bold', color: '#FFFFFF', fontSize: 17, letterSpacing: 0.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 20 },
  footerText: { fontFamily: 'PlusJakartaSans-Medium', color: '#6B7280', fontSize: 15 },
  footerLink: { fontFamily: 'PlusJakartaSans-Bold', color: '#F17022', fontSize: 15 }
});
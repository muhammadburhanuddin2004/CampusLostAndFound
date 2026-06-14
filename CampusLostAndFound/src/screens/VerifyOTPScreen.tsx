import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, Alert, BackHandler
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { API_URL } from '../config';

interface VerifyOTPScreenProps {
  route: any;
  navigation: any;
}

export default function VerifyOTPScreen({ route, navigation }: VerifyOTPScreenProps) {
  const { emailToVerify } = route.params || { emailToVerify: '' };
  const [otp, setOtp] = useState('');
  const [focusedInput, setFocusedInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);

  // === HARDWARE BACK BUTTON FIX ===
  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Login');
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  const handleVerify = async () => {
    if (!otp.trim() || otp.length < 6) {
      setError(true);
      Alert.alert("Invalid Input", "Please enter the complete 6-digit verification code.");
      return;
    }
    setError(false);
    setIsSubmitting(true);

    const VERIFY_URL = `${API_URL}/api/auth/verify?email=${encodeURIComponent(emailToVerify)}&otp=${encodeURIComponent(otp.trim())}`;

    try {
      const response = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        Alert.alert("Account Verified!", "Your student identity is officially validated.", [{ text: "Proceed to Sign In", onPress: () => navigation.navigate('Login') }]);
      } else {
        const errorText = await response.text();
        Alert.alert("Verification Failed", errorText.replace(/['"]+/g, '') || "The token entered does not match our records.");
      }
    } catch (networkError) {
      Alert.alert("Network Disruption", "Could not establish an identity validation check with the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Edge-to-Edge Status Bar */}
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent={true} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.innerContainer}>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
             <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
              We sent a security passcode to your official address:{"\n"}
              <Text style={styles.emailHighlight}>{emailToVerify || "your student email"}</Text>
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>One-Time Password (OTP)</Text>
            <TextInput
              style={error ? [styles.input, styles.inputError] : focusedInput ? [styles.input, styles.inputFocused] : styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              maxLength={6}
              value={otp}
              onChangeText={(text) => { setOtp(text); setError(false); }}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
            />
            {error && <Text style={styles.errorText}>Please enter a complete 6-digit verification security token</Text>}

            <TouchableOpacity
              style={isSubmitting ? [styles.submitButton, styles.submitButtonDisabled, { marginTop: 32 }] : [styles.submitButton, { marginTop: 32 }]}
              onPress={handleVerify}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Verify & Activate</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F9' },
  // Status bar overlap fix for inner container
  innerContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 },
  // Status bar overlap fix for absolute back button
  backButton: { position: 'absolute', top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 20, left: 24, zIndex: 10, padding: 8, backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  headerContainer: { marginBottom: 40, marginTop: 40 },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 32, color: '#111827', marginBottom: 12 },
  subtitle: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 16, color: '#6B7280', lineHeight: 26 },
  emailHighlight: { fontFamily: 'PlusJakartaSans-Bold', color: '#2D4196' },
  formContainer: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, elevation: 4, shadowColor: '#2D4196', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, marginBottom: 24 },
  inputLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: '#374151', marginBottom: 12 },
  input: { fontFamily: 'PlusJakartaSans-Bold', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#D0D5DD', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 18, fontSize: 24, color: '#111827', textAlign: 'center', letterSpacing: 8 },
  inputFocused: { borderColor: '#2D4196', backgroundColor: '#FFFFFF', elevation: 2 },
  inputError: { borderColor: '#F17022', backgroundColor: '#FFF5F0' },
  errorText: { fontFamily: 'PlusJakartaSans-Medium', color: '#F17022', fontSize: 12, marginTop: 8, marginLeft: 4, textAlign: 'center' },
  submitButton: { backgroundColor: '#2D4196', borderRadius: 16, paddingVertical: 16, alignItems: 'center', elevation: 6, shadowColor: '#2D4196', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  submitButtonDisabled: { backgroundColor: '#D0D5DD', shadowOpacity: 0, elevation: 0 },
  submitButtonText: { fontFamily: 'PlusJakartaSans-Bold', color: '#FFFFFF', fontSize: 16, letterSpacing: 0.5 }
});
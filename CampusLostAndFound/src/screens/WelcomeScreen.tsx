import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, SafeAreaView, Animated, Image, BackHandler, Platform } from 'react-native';
import { ArrowRight, UserPlus } from 'lucide-react-native';

interface WelcomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
}

export default function WelcomeScreen({ onNavigateToLogin, onNavigateToSignup }: WelcomeScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // === HARDWARE BACK BUTTON FIX ===
  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Edge-to-Edge Status Bar */}
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true}/>

      <Animated.View style={[styles.mainContentWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Top Section: Deep Blue Hero with Logo */}
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
             <Image
                source={require('../../assets/font/logo.png')}
                style={styles.logoImage}
             />
          </View>
          <Text style={styles.mainTitle}>BUITEMS</Text>
          <Text style={styles.subTitle}>Campus Lost & Found</Text>
        </View>

        {/* Middle Section: Modern Punchy Copywriting */}
        <View style={styles.infoSection}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Exclusive for BUITEMS</Text>
          </View>

          <Text style={styles.heroHeading}>Lost something?</Text>
          <Text style={styles.heroHeadingHighlight}>Let's find it.</Text>

          <Text style={styles.tagline}>
            Join the campus community network to quickly report lost items or seamlessly return found belongings to their owners.
          </Text>
        </View>

        {/* Bottom Section: Modern Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.loginButton} activeOpacity={0.9} onPress={onNavigateToLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
            <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupButton} activeOpacity={0.8} onPress={onNavigateToSignup}>
            <UserPlus size={20} color="#2D4196" style={{ marginRight: 10 }} />
            <Text style={styles.signupButtonText}>Create New Account</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA' // Slightly lighter background for a cleaner modern look
  },
  mainContentWrapper: {
    flex: 1
  },
  headerSection: {
    flex: 0.8, // Reduced height to give more breathing room to the modern bottom section
    backgroundColor: '#2D4196',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
    elevation: 8,
    shadowColor: '#2D4196',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  logoCircle: {
    width: 90, // Slightly refined size
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    padding: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  mainTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 1
  },
  subTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    color: '#F17022',
    marginTop: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  infoSection: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  badgeContainer: {
    backgroundColor: '#EEF2FF', // Soft modern blue
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF'
  },
  badgeText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    color: '#2D4196',
  },
  heroHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 32,
    color: '#111827',
    textAlign: 'center',
    lineHeight: 40,
  },
  heroHeadingHighlight: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 32,
    color: '#F17022', // BUITEMS Orange pop for modern highlight
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  tagline: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 10,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#2D4196',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#2D4196',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12
  },
  loginButtonText: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.5
  },
  signupButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF', // Clean white
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  signupButtonText: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#2D4196',
    fontSize: 16,
    letterSpacing: 0.5
  },
});
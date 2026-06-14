import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, StatusBar, SafeAreaView, Image, BackHandler } from 'react-native';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export default function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // === HARDWARE BACK BUTTON FIX ===
  useEffect(() => {
    const backAction = () => {
      return true; // Splash screen par back block hona chahiye
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        onAnimationComplete();
      }, 1000);
    });
  }, [fadeAnim, onAnimationComplete]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Edge-to-Edge Status Bar */}
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />

      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <View style={styles.logoCircle}>
          <Image
             source={require('../../assets/font/logo.png')}
             style={styles.logoImage}
          />
        </View>
        <Text style={styles.mainTitle}>BUITEMS</Text>
        <Text style={styles.subTitle}>CAMPUS LOST & FOUND</Text>
      </Animated.View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Loading Student Portal...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D4196',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    padding: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  mainTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    color: '#F17022',
    letterSpacing: 3,
    marginTop: 8,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#E0E7FF',
    opacity: 0.8,
    fontSize: 14,
    letterSpacing: 1,
  },
});
import React, { useState, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddPostScreen from './src/screens/AddPostScreen';
import MyPostsScreen from './src/screens/MyPostsScreen';
import AdminPanelScreen from './src/screens/AdminPanelScreen';
import { PostProvider } from './src/context/PostContext';

// PASTE IT EXACTLY HERE: Right beneath the imports, outside of any functions.
const API_URL = "http://borhan2004-001-site1.site4future.com/api/items";

type ScreenType = 'Splash' | 'Welcome' | 'Login' | 'Signup' | 'Dashboard' | 'AddPost' | 'MyPosts' | 'AdminPanel';

function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('Splash');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transitionToScreen = (nextScreen: ScreenType) => {
    // Let the WelcomeScreen handle its own custom bottom slide-in animation cleanly
    if (currentScreen === 'Splash' && nextScreen === 'Welcome') {
      setCurrentScreen(nextScreen);
      return;
    }

    // Smooth crossfade animation for everything else
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setCurrentScreen(nextScreen);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  const renderScreenContent = () => {
    switch (currentScreen) {
      case 'Splash':
        return <SplashScreen onAnimationComplete={() => transitionToScreen('Welcome')} />;
      case 'Welcome':
        return (
          <WelcomeScreen
            onNavigateToLogin={() => transitionToScreen('Login')}
            onNavigateToSignup={() => transitionToScreen('Signup')}
          />
        );
      case 'Login':
        return (
          <LoginScreen
            onNavigateToWelcome={() => transitionToScreen('Welcome')}
            onNavigateToSignup={() => transitionToScreen('Signup')}
            onLoginSuccess={() => transitionToScreen('Dashboard')}
            onLoginAsAdmin={() => transitionToScreen('AdminPanel')}
          />
        );
      case 'AdminPanel':
        return <AdminPanelScreen onNavigateBack={() => transitionToScreen('Login')} />;
      case 'Signup':
        return (
          <SignupScreen
            onNavigateToLogin={() => transitionToScreen('Login')}
            // FIX: Changed from onSignupSuccess to onNavigateToDashboard
            onNavigateToDashboard={() => transitionToScreen('Dashboard')}
          />
        );
      case 'Dashboard':
        return (
          <DashboardScreen
            onNavigateToAddPost={() => transitionToScreen('AddPost')}
            onNavigateToMyPosts={() => transitionToScreen('MyPosts')}
            onLogout={() => transitionToScreen('Login')}
          />
        );
      case 'AddPost':
        return <AddPostScreen onNavigateBack={() => transitionToScreen('Dashboard')} />;
      case 'MyPosts':
        return <MyPostsScreen onNavigateBack={() => transitionToScreen('Dashboard')} />;
      default:
        return <WelcomeScreen onNavigateToLogin={() => transitionToScreen('Login')} onNavigateToSignup={() => transitionToScreen('Signup')} />;
    }
  };

  return (
    <PostProvider>
      <View style={styles.rootContainer}>
        <Animated.View style={[styles.animatedWrapper, { opacity: fadeAnim }]}>
          {renderScreenContent()}
        </Animated.View>
      </View>
    </PostProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#003366',
  },
  animatedWrapper: {
    flex: 1,
  },
});

export default App;
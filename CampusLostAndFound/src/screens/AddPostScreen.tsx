import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, Image, ActivityIndicator, Alert, PermissionsAndroid,
  BackHandler // <-- BackHandler import kiya gaya hai
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Camera, ArrowLeft, ImagePlus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const ITEM_CATEGORIES = [
  'ID Card', 'Wallet', 'Keys', 'Books and Notes',
  'Electronics', 'Calculator', 'USB Drive', 'Bag',
  'Stationery', 'Clothing', 'Other'
];

interface AddPostScreenProps {
  onNavigateBack: () => void;
}

export default function AddPostScreen({ onNavigateBack }: AddPostScreenProps) {
  const [itemType, setItemType] = useState<'Lost' | 'Found'>('Lost');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Electronics');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: boolean; location?: boolean; contact?: boolean }>({});

  // === HARDWARE BACK BUTTON FIX ===
  useEffect(() => {
    const backAction = () => {
      onNavigateBack(); // App band karne ke bajaye pichli screen par le jao
      return true; // Default behavior (app exit) ko block karne ke liye true return karein
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [onNavigateBack]);
  // ================================

  const handleImageUpload = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Campus App Camera Permission",
          message: "We need access to your camera to take item photos.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert("Permission Denied", "Camera access is required to use this feature.");
        return;
      }
    }

    Alert.alert(
      "Upload Item Photo",
      "Choose a source:",
      [
        {
          text: "Take Photo",
          onPress: () => {
            launchCamera({ mediaType: 'photo', quality: 0.8 }, (result) => {
              if (!result.didCancel && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri || null);
              }
            });
          }
        },
        {
          text: "Choose from Gallery",
          onPress: () => {
            launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (result) => {
              if (!result.didCancel && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri || null);
              }
            });
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleSubmit = async () => {
    let newErrors = {};

    if (!title.trim()) newErrors = { ...newErrors, title: true };
    if (!location.trim()) newErrors = { ...newErrors, location: true };
    if (!contact.trim()) newErrors = { ...newErrors, contact: true };

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const activeUserEmail = await AsyncStorage.getItem('userEmail') || 'unknown@buitems.edu.pk';

      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', itemType);
      formData.append('category', selectedCategory);
      formData.append('location', location);
      formData.append('description', description);
      formData.append('contact', contact);
      formData.append('ownerEmail', activeUserEmail);

      if (imageUri) {
        const fileUri = Platform.OS === 'android' ? imageUri : imageUri.replace('file://', '');
        const filename = imageUri.split('/').pop() || 'upload.jpg';

        formData.append('imageFile', {
          uri: fileUri,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      const response = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

      setIsSubmitting(false);
      onNavigateBack();
    } catch (error) {
      console.error("Error posting to cloud:", error);
      setIsSubmitting(false);
      Alert.alert("Connection Error", "Could not reach the server. Please check your internet and try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Bar ko transparent kar diya taake premium immersive look aaye */}
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />

      {/* Header Container */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.iconButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Item</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

          <View style={styles.card}>

            {/* Toggle Switch */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, itemType === 'Lost' && styles.toggleLostActive]}
                onPress={() => setItemType('Lost')}
              >
                <Text style={[styles.toggleText, itemType === 'Lost' && styles.toggleTextActive]}>Lost</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, itemType === 'Found' && styles.toggleFoundActive]}
                onPress={() => setItemType('Found')}
              >
                <Text style={[styles.toggleText, itemType === 'Found' && styles.toggleTextActive]}>Found</Text>
              </TouchableOpacity>
            </View>

            {/* Image Uploader */}
            <Text style={styles.label}>Item Photo</Text>
            <TouchableOpacity style={styles.imageUploadBox} onPress={handleImageUpload} activeOpacity={0.8}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <ImagePlus size={32} color="#9CA3AF" />
                  <Text style={styles.uploadText}>Tap to Upload Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Title Input */}
            <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, focusedInput === 'title' && styles.inputFocused, errors.title && styles.inputError]}
              placeholder="e.g., Black Leather Wallet"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={(text) => { setTitle(text); setErrors({ ...errors, title: false }); }}
              onFocus={() => setFocusedInput('title')}
              onBlur={() => setFocusedInput(null)}
            />
            {errors.title && <Text style={styles.errorText}>Title is required</Text>}

            {/* Category Chips */}
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
              {ITEM_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Location Input */}
            <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, focusedInput === 'location' && styles.inputFocused, errors.location && styles.inputError]}
              placeholder="e.g., Library 2nd Floor"
              placeholderTextColor="#9CA3AF"
              value={location}
              onChangeText={(text) => { setLocation(text); setErrors({ ...errors, location: false }); }}
              onFocus={() => setFocusedInput('location')}
              onBlur={() => setFocusedInput(null)}
            />
            {errors.location && <Text style={styles.errorText}>Location is required</Text>}

            {/* Contact Input */}
            <Text style={styles.label}>Contact Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, focusedInput === 'contact' && styles.inputFocused, errors.contact && styles.inputError]}
              placeholder="e.g., 0300 1234567"
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
              value={contact}
              onChangeText={(text) => { setContact(text); setErrors({ ...errors, contact: false }); }}
              onFocus={() => setFocusedInput('contact')}
              onBlur={() => setFocusedInput(null)}
            />
            {errors.contact && <Text style={styles.errorText}>Contact is required</Text>}

            {/* Description Input */}
            <Text style={styles.label}>Additional Details</Text>
            <TextInput
              style={[styles.input, styles.textArea, focusedInput === 'desc' && styles.inputFocused]}
              placeholder="Any distinct markings or colors?"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              onFocus={() => setFocusedInput('desc')}
              onBlur={() => setFocusedInput(null)}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Publish Report</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F9',
  },
  scrollContainer: {
    paddingHorizontal: 12,
    paddingBottom: 40,
    paddingTop: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 18,
    // Android Status Bar FIX: Ye line header ko screen ke upper edge tak le jayegi
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    backgroundColor: '#2D4196',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#2D4196',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#2D4196',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F5',
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleLostActive: {
    backgroundColor: '#F17022',
    shadowColor: '#F17022',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleFoundActive: {
    backgroundColor: '#2D4196',
    shadowColor: '#2D4196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  label: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    color: '#2D4196',
    marginBottom: 8,
    marginTop: 16,
  },
  required: {
    color: '#F17022',
  },
  imageUploadBox: {
    height: 150,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  input: {
    fontFamily: 'PlusJakartaSans-Regular',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  inputFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2D4196',
    shadowColor: '#2D4196',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: {
    borderColor: '#F17022',
    backgroundColor: '#FFF5F0',
  },
  errorText: {
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#F17022',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F1F3F5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#E6E9F4',
    borderColor: '#2D4196',
  },
  chipText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#2D4196',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  textArea: {
    height: 100,
  },
  submitBtn: {
    backgroundColor: '#2D4196',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#2D4196',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#D0D5DD',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
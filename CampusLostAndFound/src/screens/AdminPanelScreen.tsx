import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, Modal, Platform, ActivityIndicator,
  BackHandler
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { API_URL } from '../config';

const STATUS_OPTIONS = ['Active', 'Claimed', 'Returned', 'Closed'];

interface AdminPanelScreenProps {
  onNavigateBack: () => void;
}

interface Item {
  id: number;
  title: string;
  type: string;
  category: string;
  location: string;
  description: string;
  contact: string;
  status: string;
  ownerEmail: string;
  createdAt: string;
}

export default function AdminPanelScreen({ onNavigateBack }: AdminPanelScreenProps) {
  const [livePosts, setLivePosts] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  // === HARDWARE BACK BUTTON FIX ===
  useEffect(() => {
    const backAction = () => {
      onNavigateBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onNavigateBack]);

  const fetchAllPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/items`, {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setLivePosts(data);
      } else {
        Alert.alert("Sync Error", "Could not load campus bulletin data.");
      }
    } catch (error) {
      console.error("Admin fetch error:", error);
      Alert.alert("Network Disconnected", "Cannot reach the BUITEMS cloud server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const handleDelete = (id: number) => {
    Alert.alert("Admin Override", "Permanently delete this post from the campus database?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/api/items/${id}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              setLivePosts(prevPosts => prevPosts.filter(post => post.id !== id));
              Alert.alert("Purged", "The item has been deleted from the system.");
            } else {
              Alert.alert("Action Denied", "Server rejected the deletion command.");
            }
          } catch (error) {
            Alert.alert("Network Error", "Could not reach the server to execute delete.");
          }
        }
      }
    ]);
  };

  const handleMarkDuplicate = (id: number) => {
    Alert.alert("Admin Action", "Mark this post as a duplicate?", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => {
          setLivePosts(prev => prev.map(p => p.id === id ? { ...p, status: 'Closed (Duplicate)' } : p));
        }
      }
    ]);
  };

  const openStatusPicker = (id: number) => {
    setSelectedPostId(id);
    setStatusModalVisible(true);
  };

  const handleSelectStatus = (newStatus: string) => {
    if (selectedPostId !== null) {
      setLivePosts(prev => prev.map(p => p.id === selectedPostId ? { ...p, status: newStatus } : p));
    }
    setStatusModalVisible(false);
    setSelectedPostId(null);
  };

  const renderAdminPost = ({ item }: { item: Item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.badge, { backgroundColor: item.type === 'Lost' ? '#FFF5F0' : '#E6E9F4' }]}>
          <Text style={[styles.badgeText, { color: item.type === 'Lost' ? '#F17022' : '#2D4196' }]}>
            {item.type}
          </Text>
        </View>
      </View>

      <Text style={styles.reporterText}>Owner: {item.ownerEmail || 'Legacy System User'}</Text>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status: </Text>
        <Text style={styles.statusValue}>{item.status}</Text>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionBtnUpdate} onPress={() => openStatusPicker(item.id)}>
          <Text style={styles.actionBtnTextUpdate}>Update</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtnDuplicate} onPress={() => handleMarkDuplicate(item.id)}>
          <Text style={styles.actionBtnTextDuplicate}>Duplicate</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDelete(item.id)}>
          <Text style={styles.actionBtnTextDelete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Edge-to-Edge Status Bar */}
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />

      {/* Modern Floating Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.iconButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Admin</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D4196" />
          <Text style={styles.loadingText}>Fetching database records...</Text>
        </View>
      ) : (
        <FlatList
          data={livePosts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderAdminPost}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No posts in the system yet.</Text>
          }
        />
      )}

      {/* Modern Status Picker Modal */}
      <Modal animationType="fade" transparent={true} visible={statusModalVisible} onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Override Post Status</Text>
            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity key={status} style={styles.statusOptionBtn} onPress={() => handleSelectStatus(status)}>
                <Text style={styles.statusOptionText}>{status}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setStatusModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F9', // Premium light background
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    backgroundColor: '#2D4196', // BUITEMS Blue
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
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 40,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 12,
    color: '#6B7280',
    fontSize: 15,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
    marginTop: 40,
    color: '#9CA3AF',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#2D4196',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, // Soft premium shadow
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  reporterText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  statusLabel: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    color: '#374151',
  },
  statusValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#2D4196',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
    paddingTop: 16,
  },
  actionBtnUpdate: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#EEF2FF', // Soft Blue background
  },
  actionBtnTextUpdate: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#2D4196',
    fontSize: 13,
  },
  actionBtnDuplicate: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#F3F4F6', // Soft Gray
  },
  actionBtnTextDuplicate: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#4B5563',
    fontSize: 13,
  },
  actionBtnDelete: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FEF2F2', // Soft Red
  },
  actionBtnTextDelete: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#EF4444',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)', // Modern dark overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '85%',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusOptionBtn: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  statusOptionText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    color: '#2D4196',
  },
  cancelBtn: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  cancelBtnText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: '#EF4444',
  },
});
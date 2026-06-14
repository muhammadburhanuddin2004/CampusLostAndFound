import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity,
    SafeAreaView, StatusBar, Alert, Platform, Modal, Image, ActivityIndicator, BackHandler
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { API_URL } from '../config';

const STATUS_OPTIONS = ['Active', 'Claimed', 'Returned', 'Closed'];

interface Item {
    id: number; title: string; type: string; category: string; location: string;
    description: string; contact: string; status: string; imageUri?: string; createdAt: string;
}
interface MyPostsScreenProps { onNavigateBack: () => void; }

export default function MyPostsScreen({ onNavigateBack }: MyPostsScreenProps) {
    const [myLivePosts, setMyLivePosts] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

    useEffect(() => {
        const backAction = () => { onNavigateBack(); return true; };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [onNavigateBack]);

    const fetchMyPosts = async () => {
        setIsLoading(true);
        try {
            const activeEmail = await AsyncStorage.getItem('userEmail');
            if (!activeEmail) {
                Alert.alert("Authentication Error", "Could not locate active session data.");
                setIsLoading(false); return;
            }
            const response = await fetch(`${API_URL}/api/items/my-posts?email=${encodeURIComponent(activeEmail)}`);
            if (response.ok) {
                const data = await response.json();
                setMyLivePosts(data);
            } else {
                Alert.alert("Sync Error", "Could not load your personal bulletin data.");
            }
        } catch (error) {
            Alert.alert("Network Disconnected", "Cannot reach the BUITEMS cloud server.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchMyPosts(); }, []);

    const handleDelete = (id: number) => {
        Alert.alert("Delete Post", "Are you sure you want to permanently delete this report?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                    try {
                        const response = await fetch(`${API_URL}/api/items/${id}`, { method: 'DELETE' });
                        if (response.ok) setMyLivePosts(prev => prev.filter(p => p.id !== id));
                        else Alert.alert("Action Denied", "Server rejected the deletion command.");
                    } catch (error) {
                        Alert.alert("Network Error", "Could not reach the server to execute delete.");
                    }
                }
            }
        ]);
    };

    const openStatusPicker = (id: number) => {
        setSelectedPostId(id);
        setStatusModalVisible(true);
    };

    const handleSelectStatus = async (newStatus: string) => {
        if (selectedPostId === null) return;
        const postToUpdate = myLivePosts.find(p => p.id === selectedPostId);
        if (!postToUpdate) return;
        setStatusModalVisible(false);

        try {
            const updatedEntity = { ...postToUpdate, status: newStatus };
            const response = await fetch(`${API_URL}/api/items/${selectedPostId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(updatedEntity)
            });
            if (response.ok) {
                setMyLivePosts(prev => prev.map(p => p.id === selectedPostId ? { ...p, status: newStatus } : p));
            } else {
                Alert.alert("Update Denied", "The server rejected the status alteration request.");
            }
        } catch (error) {
            Alert.alert("Network Error", "Could not reach the database node to save status alterations.");
        } finally {
            setSelectedPostId(null);
        }
    };

    const renderMyPost = ({ item }: { item: Item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            {item.imageUri && (
                <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
            )}

            <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Current Status: </Text>
                <Text style={[styles.statusValue, { color: item.status === 'Active' ? '#10B981' : '#F17022' }]}>
                    {item.status || 'Active'}
                </Text>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openStatusPicker(item.id)}>
                    <Text style={styles.actionBtnText}>Update Status</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />

            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={onNavigateBack} style={styles.iconButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Posts</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2D4196" />
                    <Text style={styles.loadingText}>Fetching your records...</Text>
                </View>
            ) : (
                <FlatList
                    data={myLivePosts}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderMyPost}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={styles.emptyText}>You haven't posted any items yet.</Text>}
                />
            )}

            <Modal animationType="fade" transparent={true} visible={statusModalVisible} onRequestClose={() => setStatusModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select New Status</Text>
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
    container: { flex: 1, backgroundColor: '#F3F5F9' },
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 18, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16, backgroundColor: '#2D4196', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#2D4196', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8, zIndex: 10 },
    iconButton: { padding: 8 },
    headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: '#FFFFFF', letterSpacing: 0.5 },
    listContainer: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 40 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontFamily: 'PlusJakartaSans-Medium', marginTop: 12, color: '#6B7280', fontSize: 15 },
    emptyText: { fontFamily: 'PlusJakartaSans-Medium', textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#2D4196', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 17, color: '#111827', flex: 1 },
    dateText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: '#9CA3AF' },
    cardImage: { width: '100%', height: 160, borderRadius: 12, marginBottom: 14, resizeMode: 'cover' },
    statusRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
    statusLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, color: '#374151' },
    statusValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 16 },
    actionBtn: { flex: 1, backgroundColor: '#EEF2FF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginRight: 8 },
    actionBtnText: { fontFamily: 'PlusJakartaSans-Bold', color: '#2D4196', fontSize: 13 },
    deleteBtn: { flex: 1, backgroundColor: '#FEF2F2', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginLeft: 8 },
    deleteBtnText: { fontFamily: 'PlusJakartaSans-Bold', color: '#EF4444', fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#FFFFFF', width: '85%', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    modalTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, color: '#111827', marginBottom: 20, textAlign: 'center' },
    statusOptionBtn: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
    statusOptionText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: '#2D4196' },
    cancelBtn: { marginTop: 20, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 12 },
    cancelBtnText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, color: '#EF4444' }
});
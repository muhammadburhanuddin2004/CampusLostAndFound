import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, ScrollView, TextInput, Image, Linking, ActivityIndicator, Platform, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, MapPin, MessageCircle, Plus, X, User, LogOut, FileText, Home, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { API_URL } from '../config';

const { width, height } = Dimensions.get('window');

interface CloudPost {
  id: number;
  title: string;
  category?: string;
  type: 'Lost' | 'Found';
  location: string;
  description: string;
  contact: string;
  createdAt?: string;
  status?: string;
  imageUri?: string;
  reportedBy?: string;
}

interface DashboardScreenProps {
  onNavigateToAddPost: () => void;
  onNavigateToMyPosts: () => void;
  onLogout: () => void;
}

export default function DashboardScreen({ onNavigateToAddPost, onNavigateToMyPosts, onLogout }: DashboardScreenProps) {
  const [livePosts, setLivePosts] = useState<CloudPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [studentName, setStudentName] = useState<string>('Student');
  const [studentEmail, setStudentEmail] = useState<string>('');

  const [activeFilter, setActiveFilter] = useState<'All' | 'Lost' | 'Found'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<CloudPost | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [profileCardVisible, setProfileCardVisible] = useState(false);

  // Full Screen Image Viewer States
  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(null);

  useEffect(() => {
    const initializeDashboardData = async () => {
      try {
        const cachedName = await AsyncStorage.getItem('userName');
        const cachedEmail = await AsyncStorage.getItem('userEmail');

        if (cachedName) setStudentName(cachedName);
        if (cachedEmail) setStudentEmail(cachedEmail);

        const response = await fetch(`${API_URL}/api/items`);
        if (!response.ok) throw new Error(`Server status error: ${response.status}`);
        const data = await response.json();
        setLivePosts(data);
      } catch (error) {
        console.error("Error running dashboard baseline sync:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    initializeDashboardData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/items`);
      if (response.ok) {
        const data = await response.json();
        setLivePosts(data);
      }
    } catch (err) {
      console.error("Refresh syncing tracking exception:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const openWhatsApp = (phone: string) => {
    let formattedNumber = phone.replace(/[^0-9]/g, '');
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '92' + formattedNumber.substring(1);
    }
    Linking.openURL(`whatsapp://send?phone=${formattedNumber}`);
  };

  const filteredItems = livePosts.filter(item => {
    const matchesFilter = activeFilter === 'All' || item.type === activeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenDetails = (item: CloudPost) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItemCard = ({ item }: { item: CloudPost }) => (
    <TouchableOpacity style={styles.opCard} activeOpacity={0.95} onPress={() => handleOpenDetails(item)}>
      <View style={styles.cardImageContainer}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.cardCoverImage} />
        ) : (
          <View style={[styles.cardCoverImage, styles.placeholderCover]} />
        )}
        <View style={[styles.opBadge, { backgroundColor: item.type === 'Lost' ? '#F17022' : '#10B981' }]}>
          <Text style={styles.opBadgeText}>{item.type.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeaderArea}>
          <Text style={styles.opCardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{item.status || 'Active'}</Text>
          </View>
        </View>

        <View style={styles.opLocationRow}>
          <MapPin size={16} color="#64748B" />
          <Text style={styles.opLocationText} numberOfLines={1}>{item.location}</Text>
        </View>

        <Text style={styles.opDescriptionText} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardFooterDivider} />

        <View style={styles.cardActionRow}>
          <Text style={styles.cardTimeText}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
          </Text>
          <View style={styles.viewMoreBtn}>
            <Text style={styles.viewMoreText}>View Details</Text>
            <ArrowRight size={16} color="#2B3990" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />

      {/* BUITEMS Themed Header matching MyPostsScreen layout */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>Hello, {studentName}</Text>
          </View>
          <TouchableOpacity style={styles.profileAvatar} onPress={() => setProfileCardVisible(true)}>
            <Text style={styles.profileInitials}>{studentName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Box integrated cleanly in the blue header */}
        <View style={styles.searchBoxWrapper}>
          <Search size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search lost or found items..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {((['All', 'Lost', 'Found'] as const)).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.modernFilterChip, activeFilter === filter && styles.modernFilterChipActive]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modernFilterChipText, activeFilter === filter && styles.modernFilterChipTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Feed */}
      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#2B3990" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItemCard}
          contentContainerStyle={styles.feedList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={<Text style={styles.emptyStateText}>No items found matching criteria.</Text>}
        />
      )}

      {/* Modern Attached Bottom Navigation with BUITEMS Colors */}
      <View style={styles.floatingBottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Home size={24} color="#2B3990" />
          <Text style={[styles.navText, { color: '#2B3990' }]}>Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateToMyPosts} activeOpacity={0.7}>
          <FileText size={24} color="#94A3B8" />
          <Text style={styles.navText}>My Posts</Text>
        </TouchableOpacity>

        {/* BUITEMS Orange FAB */}
        <TouchableOpacity style={styles.centerFabBtn} onPress={onNavigateToAddPost} activeOpacity={0.9}>
          <View style={styles.fabInnerRing}>
            <Plus size={32} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setProfileCardVisible(true)} activeOpacity={0.7}>
          <User size={24} color="#94A3B8" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onLogout} activeOpacity={0.7}>
          <LogOut size={24} color="#EF4444" />
          <Text style={[styles.navText, { color: '#EF4444' }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Premium Bottom Sheet Modal for Post Details */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity style={styles.overlayCloseTrigger} activeOpacity={1} onPress={() => setModalVisible(false)} />

          <View style={styles.opBottomSheetContent}>
            <View style={styles.dragPill} />

            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Image Section with Full-Screen Trigger */}
                {selectedItem.imageUri ? (
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={() => {
                      setCurrentImageUri(selectedItem.imageUri!);
                      setFullImageVisible(true);
                    }}
                  >
                    <Image source={{ uri: selectedItem.imageUri }} style={styles.sheetImageOP} />
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.sheetImageOP, styles.placeholderCover]} />
                )}

                <View style={styles.sheetHeaderGroup}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitleOP}>{selectedItem.title}</Text>
                    <View style={styles.sheetTagsRow}>
                      <View style={[styles.sheetBadge, { backgroundColor: selectedItem.type === 'Lost' ? '#FFF0E6' : '#ECFDF5', borderColor: selectedItem.type === 'Lost' ? '#F17022' : '#A7F3D0' }]}>
                        <Text style={[styles.sheetBadgeText, { color: selectedItem.type === 'Lost' ? '#F17022' : '#10B981' }]}>
                          {selectedItem.type.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.sheetStatusText}>• {selectedItem.status || 'Active'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.circularCloseBtn}>
                    <X size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.opSheetLocationRow}>
                  <View style={styles.iconCircleBlue}>
                    <MapPin size={22} color="#2B3990" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationLabelMini}>LOCATION</Text>
                    <Text style={styles.sheetLocationTextOP}>{selectedItem.location}</Text>
                  </View>
                </View>

                <View style={styles.sheetContentDivider} />

                <Text style={styles.sheetSectionTitle}>Description</Text>
                <Text style={styles.sheetDescriptionOP}>{selectedItem.description}</Text>

                <View style={styles.sheetContentDivider} />

                <Text style={styles.sheetSectionTitle}>Reported By</Text>
                <View style={styles.authorCardOP}>
                  <View style={styles.authorAvatarOP}>
                    <User size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>{selectedItem.reportedBy || 'Campus Student'}</Text>
                    <Text style={styles.authorSub}>BUITEMS Verified</Text>
                  </View>
                </View>

                {selectedItem.contact ? (
                  <TouchableOpacity style={styles.opWhatsappBtn} onPress={() => openWhatsApp(selectedItem.contact)} activeOpacity={0.9}>
                    <Text style={styles.opWhatsappBtnText}>Connect on WhatsApp</Text>
                    <View style={styles.whatsappIconCircle}>
                      <MessageCircle size={20} color="#25D366" />
                    </View>
                  </TouchableOpacity>
                ) : null}

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal animationType="fade" transparent={true} visible={fullImageVisible} onRequestClose={() => setFullImageVisible(false)}>
        <View style={styles.fullScreenOverlay}>
          <TouchableOpacity style={styles.fullScreenCloseBtn} onPress={() => setFullImageVisible(false)} activeOpacity={0.8}>
            <X size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {currentImageUri && (
            <Image
              source={{ uri: currentImageUri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Profile Modal (BUITEMS Themed) */}
      <Modal animationType="fade" transparent={true} visible={profileCardVisible} onRequestClose={() => setProfileCardVisible(false)}>
        <View style={styles.profileModalOverlay}>
          <View style={styles.opProfileCard}>
            <View style={styles.profileCardHeaderDark} />

            <View style={styles.hugeAvatar}>
              <Text style={styles.hugeAvatarText}>{studentName.charAt(0).toUpperCase()}</Text>
            </View>

            <Text style={styles.profileModalName}>{studentName}</Text>
            <View style={styles.verifiedTag}>
              <ShieldCheck size={14} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.verifiedTagText}>Campus Verified</Text>
            </View>

            <View style={styles.profileDetailsWrapper}>
              <View style={styles.profileDataBox}>
                <Text style={styles.profileDataLabel}>Registered Email</Text>
                <Text style={styles.profileDataValue}>{studentEmail || 'N/A'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeProfileBtn} onPress={() => setProfileCardVisible(false)}>
              <Text style={styles.closeProfileBtnText}>Dismiss</Text>
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
    backgroundColor: '#F8FAFC' // Clean modern background
  },
  // BUITEMS Header - exactly mimicking your original MyPostsScreen header shape
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 50,
    backgroundColor: '#2B3990', // BUITEMS Royal Blue
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#2B3990',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    flex: 1,
    paddingRight: 10,
  },
  headerSubtitle: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInitials: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  searchBoxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    color: '#111827',
  },
  // Filters
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  filterScroll: {
    paddingBottom: 10,
  },
  modernFilterChip: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modernFilterChipActive: {
    backgroundColor: '#2B3990',
    borderColor: '#2B3990',
  },
  modernFilterChipText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    color: '#64748B',
  },
  modernFilterChipTextActive: {
    color: '#FFFFFF',
  },
  // Main Feed & OP Cards
  feedList: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 10,
  },
  opCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  cardImageContainer: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  cardCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderCover: {
    backgroundColor: '#E2E8F0',
  },
  opBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  opBadgeText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cardBody: {
    padding: 20,
  },
  cardHeaderArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  opCardTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 19,
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
    color: '#475569',
    textTransform: 'uppercase',
  },
  opLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  opLocationText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  opDescriptionText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  cardFooterDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTimeText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    color: '#94A3B8',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  viewMoreText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    color: '#2B3990',
    marginRight: 6,
  },
  // Attached OP Bottom Navigation
  floatingBottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 76,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'ios' ? 14 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minWidth: 50,
  },
  navText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
  },
  centerFabBtn: {
    width: 68,
    height: 68,
    backgroundColor: '#F17022', // BUITEMS Orange
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
    shadowColor: '#F17022',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  fabInnerRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // OP Premium Bottom Sheet Modal
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  overlayCloseTrigger: {
    flex: 1,
  },
  opBottomSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 16,
    maxHeight: height * 0.92,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 40,
  },
  dragPill: {
    width: 48,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetImageOP: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    marginBottom: 24,
  },
  sheetHeaderGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  sheetTitleOP: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 26,
    color: '#111827',
    lineHeight: 34,
    marginBottom: 12,
  },
  sheetTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  sheetBadgeText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  sheetStatusText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    color: '#64748B',
    marginLeft: 10,
  },
  circularCloseBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  opSheetLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconCircleBlue: {
    width: 44,
    height: 44,
    backgroundColor: '#EEF2FF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationLabelMini: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  sheetLocationTextOP: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: '#111827',
  },
  sheetContentDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  sheetSectionTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    color: '#111827',
    marginBottom: 12,
  },
  sheetDescriptionOP: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  authorCardOP: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F8FAFC',
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 32,
  },
  authorAvatarOP: {
    width: 48,
    height: 48,
    backgroundColor: '#2B3990',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: '#111827',
  },
  authorSub: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    color: '#10B981',
    marginTop: 2,
  },
  opWhatsappBtn: {
    flexDirection: 'row',
    backgroundColor: '#25D366',
    borderRadius: 20,
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  opWhatsappBtnText: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  whatsappIconCircle: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Full Screen Image Modal Styles
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },

  // Profile Modal
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  opProfileCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 32,
  },
  profileCardHeaderDark: {
    width: '100%',
    height: 120,
    backgroundColor: '#2B3990',
  },
  hugeAvatar: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  hugeAvatarText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 38,
    color: '#2B3990',
  },
  profileModalName: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    color: '#111827',
    marginTop: 16,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  verifiedTagText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    color: '#10B981',
    textTransform: 'uppercase',
  },
  profileDetailsWrapper: {
    width: '100%',
    paddingHorizontal: 28,
    marginTop: 28,
  },
  profileDataBox: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  profileDataLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileDataValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: '#111827',
    marginTop: 6,
  },
  closeProfileBtn: {
    marginTop: 24,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  closeProfileBtnText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: '#475569',
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 40,
  }
});
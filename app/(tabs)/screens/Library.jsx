import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const BASE_WIDTH = 360;
const scale = (size) => (width / BASE_WIDTH) * size;

const Library = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const LibraryCard = ({
    icon,
    iconType = 'material',
    title,
    description,
    colors,
    iconColor,
    onPress,
    large = false,
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={styles.cardWrapper}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={large ? styles.largeCard : styles.card}>

          <View style={styles.cardGlow} pointerEvents="none" />

          <View style={large ? styles.largeIconBox : styles.iconBox}>
            {iconType === 'ionicons' ? (
              <Ionicons name={icon} size={large ? 30 : 25} color={iconColor} />
            ) : (
              <MaterialCommunityIcons name={icon} size={large ? 30 : 25} color={iconColor} />
            )}
          </View>

          <View style={styles.cardContent}>
            <Text style={large ? styles.largeCardTitle : styles.cardTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={large ? styles.largeCardDescription : styles.cardDescription} numberOfLines={2}>
              {description}
            </Text>
          </View>

          <View style={styles.arrowButton}>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#050507', '#0C0C11', '#15151C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}>

      <SafeAreaView style={styles.safeArea}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={scale(22)} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Library
          </Text>

          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            // Ensures content clears any bottom tab bar / mini-player / home
            // indicator on small screens, instead of a fixed 30px that's not
            // enough once a bottom nav is present.
            { paddingBottom: Math.max(insets.bottom, 16) + 110 },
          ]}
          style={styles.scrollView}
          bounces={true}
          nestedScrollEnabled={true}>

          {/* HERO */}
          <View style={styles.hero}>
            <View style={styles.heroGlowOne} pointerEvents="none" />
            <View style={styles.heroGlowTwo} pointerEvents="none" />

            <LinearGradient
              colors={['#FF6A00', '#EE0979']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroIcon}>
              <Ionicons name="library" size={34} color="#fff" />
            </LinearGradient>

            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle} numberOfLines={1}>
                Your Library
              </Text>
              <Text style={styles.heroSubtitle} numberOfLines={2}>
                Everything you love, all in one place.
              </Text>
            </View>
          </View>

          {/* ONLINE MUSIC */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Your Music
              </Text>
              <Text style={styles.sectionSubtitle} numberOfLines={1}>
                Keep listening to your favorites
              </Text>
            </View>

            <View style={styles.musicIcon}>
              <Ionicons name="musical-notes" size={18} color="#FF6A00" />
            </View>
          </View>

          {/* CARD GROUP */}
          <View style={styles.cardGroup}>
            <LibraryCard
              icon="heart"
              iconType="ionicons"
              title="Liked Songs"
              description="All the songs you've saved and loved."
              colors={['#351B29', '#21131C']}
              iconColor="#FF5C8A"
              onPress={() => navigation.navigate('Likedsong')}
            />

            <LibraryCard
              icon="playlist-music"
              title="Playlists"
              description="Create and manage your playlists."
              colors={['#172A3D', '#111C29']}
              iconColor="#49A7FF"
              onPress={() => navigation.navigate('AddPlaylist')}
            />

            <LibraryCard
              icon="cloud-download-outline"
              title="Downloads"
              description="Listen to music without internet."
              colors={['#18332C', '#101F1B']}
              iconColor="#4DDBA4"
              onPress={() => navigation.navigate('Download')}
            />
          </View>

          {/* OFFLINE MESSAGE */}
          <LinearGradient
            colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.025)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoCard}>

            <View style={styles.infoIcon}>
              <Ionicons name="cloud-offline-outline" size={22} color="#B8B8C5" />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle} numberOfLines={1}>
                No internet? No problem.
              </Text>
              <Text style={styles.infoText} numberOfLines={2}>
                Your downloaded songs are always available when you're offline.
              </Text>
            </View>
          </LinearGradient>

          {/* Explicit bottom spacer so the last card/info block is never
              flush against the scroll boundary, and is always fully
              scrollable clear of any overlapping bottom UI. */}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Library;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },

  /* ---------------- HEADER ---------------- */

  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  backBtn: {
    width: scale(35),
    height: scale(35),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  headerTitle: {
    flex: 1, // re-added: without this, space-between won't center the title
    textAlign: 'center',
    color: '#fff',
    fontSize: scale(20),
    fontFamily: 'Poppins-Bold',
  },

  headerPlaceholder: {
    width: scale(35), // matched to backBtn width so title stays truly centered
  },

  /* ---------------- SCROLL ---------------- */

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    // paddingBottom is applied dynamically above via insets
  },

  /* ---------------- HERO ---------------- */

  hero: {
    height: 145,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: '#17171E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: 'rgba(255,106,0,0.12)',
    top: -100,
    right: -30,
  },

  heroGlowTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: 'rgba(238,9,121,0.10)',
    bottom: -90,
    left: 40,
  },

  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6A00',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  heroTextContainer: {
    flex: 1,
    marginLeft: 18,
    justifyContent: 'center',
  },

  heroTitle: {
    color: '#fff',
    fontSize: scale(24),
    fontFamily: 'Poppins-Bold',
  },

  heroSubtitle: {
    color: '#9999A5',
    fontSize: scale(13),
    marginTop: 5,
    lineHeight: 19,
    fontFamily: 'Poppins-Medium',
  },

  /* ---------------- SECTION ---------------- */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 14,
  },

  sectionHeaderText: {
    flex: 1,
    marginRight: 12,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: scale(19),
    fontFamily: 'Poppins-Bold',
  },

  sectionSubtitle: {
    color: '#777783',
    fontSize: scale(12),
    marginTop: 2,
    fontFamily: 'Poppins-Medium',
  },

  musicIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,106,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.15)',
  },

  /* ---------------- CARD GROUP ---------------- */

  cardGroup: {
    gap: 12,
  },

  cardWrapper: {
    width: '100%',
  },

  card: {
    minHeight: 100,
    borderRadius: 22,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  largeCard: {
    minHeight: 125,
    borderRadius: 25,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  cardGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.025)',
    right: -40,
    top: -40,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  largeIconBox: {
    width: 65,
    height: 65,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  cardContent: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 8,
    justifyContent: 'center',
  },

  cardTitle: {
    color: '#fff',
    fontSize: scale(15),
    fontFamily: 'Poppins-Bold',
  },

  largeCardTitle: {
    color: '#fff',
    fontSize: scale(18),
    fontFamily: 'Poppins-Bold',
  },

  cardDescription: {
    color: '#898995',
    fontSize: scale(11),
    marginTop: 4,
    lineHeight: 16,
    fontFamily: 'Poppins-Medium',
  },

  largeCardDescription: {
    color: '#9999A5',
    fontSize: scale(12),
    marginTop: 5,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
  },

  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginLeft: 8,
  },

  /* ---------------- INFO ---------------- */

  infoCard: {
    marginTop: 20,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  infoIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  infoContent: {
    flex: 1,
    marginLeft: 13,
    justifyContent: 'center',
  },

  infoTitle: {
    color: '#E7E7ED',
    fontSize: scale(13),
    fontFamily: 'Poppins-Bold',
  },

  infoText: {
    color: '#777783',
    fontSize: scale(11),
    lineHeight: 16,
    marginTop: 3,
    fontFamily: 'Poppins-Medium',
  },

  bottomSpace: {
    height: 25,
  },
});
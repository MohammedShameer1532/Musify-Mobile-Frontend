// ShareScreenModern.js

import { useNavigation } from '@react-navigation/native';
import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Image,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';




const { width } = Dimensions.get('window'); // ✅ screen width
const SONG_IMAGE_SIZE = Math.min(
  width * 0.62,
  320
);

const BASE_WIDTH = 360;

const scale = (size) => (width / BASE_WIDTH) * size;

const ShareScreenMod = () => {
  const navigation = useNavigation();

  const onShare = async () => {
    try {
      await Share.share({
        title: 'Music App',
        message:
          '🎵 I am using this amazing Music App for streaming songs, playlists and vibes. Try it now 🚀\n\nhttps://example.com/app-link',
        url: 'https://example.com/app-link',
      });
    } catch (error) {
      console.error('Share error', error);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      <LinearGradient
        colors={['#050505', '#0f0f0f', '#151515']}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={scale(22)} color="white" />
            </TouchableOpacity>

            <Text style={styles.title}>Share App</Text>

            <View style={{ width: 42 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 40,
            }}
          >
            {/* HERO SECTION */}

            <View style={styles.heroContainer}>
              {/* Glow */}

              <View style={styles.glow1} />
              <View style={styles.glow2} />

              {/* LOGO */}



              <LinearGradient
                colors={['#ff6a00', '#ee0979']}
                style={styles.logoWrap}
              >
                <Image
                  source={require('../assets/LysernFy.png')}
                  style={styles.logo}
                />
              </LinearGradient>

              <Text style={styles.heroTitle}>
                Share The Music Experience
              </Text>

              <Text style={styles.heroSubtitle}>
                Invite your friends and enjoy unlimited
                music, playlists and premium vibes together.
              </Text>
            </View>

            {/* FEATURE CARDS */}

            <View style={styles.cardsWrap}>
              <View style={styles.card}>
                <View style={styles.cardIcon}>
                  <Ionicons
                    name="headset"
                    size={24}
                    color="#ff6a00"
                  />
                </View>

                <Text style={styles.cardTitle}>
                  Premium Audio
                </Text>

                <Text style={styles.cardDesc}>
                  Crystal clear sound quality with
                  immersive listening experience.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardIcon}>
                  <Ionicons
                    name="flash"
                    size={24}
                    color="#00d4ff"
                  />
                </View>

                <Text style={styles.cardTitle}>
                  Fast Streaming
                </Text>

                <Text style={styles.cardDesc}>
                  Stream songs instantly without
                  buffering or interruptions.
                </Text>
              </View>
            </View>

            {/* SHARE CARD */}

            <LinearGradient
              colors={[
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.03)',
              ]}
              style={styles.shareCard}
            >
              <LinearGradient
                colors={['#ff6a00', '#ee0979']}
                style={styles.logoWrap}
              >

                <Ionicons
                  name="musical-notes"
                  size={48}
                  color="#fff"
                />
              </LinearGradient>

              <Text style={styles.shareTitle}>
                Invite Your Friends
              </Text>

              <Text style={styles.shareText}>
                Share the app with friends and let them
                discover trending music and playlists.
              </Text>

              {/* SHARE BUTTON */}

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onShare}
                style={{ width: '100%' }}
              >
                <LinearGradient
                  colors={['#ff6a00', '#ee0979']}
                  style={styles.shareBtn}
                >
                  <Ionicons
                    name="share-social"
                    size={22}
                    color="#fff"
                    style={{ marginRight: 10 }}
                  />

                  <Text style={styles.shareBtnText}>
                    Share Now
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}


export default ShareScreenMod;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 18,
    paddingTop: 10,
  },

  backBtn: {
    width: scale(35),
    height: scale(35),
    borderRadius: scale(20),

    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  title: {
    color: '#fff',
    fontSize: scale(20),
    fontFamily: 'Poppins-Bold',
  },

  /* HERO */

  heroContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 25,
  },

  glow1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,

    backgroundColor: 'rgba(255,106,0,0.20)',
    top: -20,
    left: 40,
  },

  glow2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 100,

    backgroundColor: 'rgba(238,9,121,0.20)',
    top: 50,
    right: 40,
  },

  logoWrap: {
    width: 115,
    height: 115,
    borderRadius: 60,

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#ee0979',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  logo: {
    width: 75,
    height: 75,
    resizeMode: 'contain',
    borderRadius: 20,
  },
  heroTitle: {
    color: '#fff',
    fontSize: scale(24),
    marginTop: 28,
    textAlign: 'center',

    fontFamily: 'Poppins-Bold',
  },

  heroSubtitle: {
    color: '#b8b8b8',
    textAlign: 'center',

    marginTop: 14,
    lineHeight: 24,
    fontSize: scale(15),

    paddingHorizontal: 10,

    fontFamily: 'Poppins-Medium',
  },

  /* CARDS */

  cardsWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    marginTop: 34,
    paddingHorizontal: 18,
  },

  card: {
    width: '48%',

    backgroundColor: 'rgba(255,255,255,0.06)',

    borderRadius: 24,
    padding: 18,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,

    backgroundColor: 'rgba(255,255,255,0.08)',

    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTitle: {
    color: '#fff',
    fontSize: scale(16),
    marginTop: 16,

    fontFamily: 'Poppins-Bold',
  },

  cardDesc: {
    color: '#999',
    fontSize: scale(13),

    marginTop: 8,
    lineHeight: 21,

    fontFamily: 'Poppins-Medium',
  },

  /* SHARE CARD */

  shareCard: {
    marginHorizontal: 18,
    marginTop: 30,

    borderRadius: 30,
    padding: 20,

    alignItems: 'center',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  banner: {
    width: '100%',
    height: 180,
    borderRadius: 22,
  },

  shareTitle: {
    color: '#fff',
    fontSize: scale(21),

    marginTop: 24,

    fontFamily: 'Poppins-Bold',
  },

  shareText: {
    color: '#aaa',
    textAlign: 'center',

    lineHeight: 24,
    marginTop: 10,
    marginBottom: 26,

    fontSize: scale(14),

    fontFamily: 'Poppins-Medium',
  },

  /* BUTTON */

  shareBtn: {
    height: 60,
    borderRadius: 30,

    justifyContent: 'center',
    alignItems: 'center',

    flexDirection: 'row',

    shadowColor: '#ff6a00',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },

  shareBtnText: {
    color: '#fff',
    fontSize: scale(17),

    fontFamily: 'Poppins-Bold',
  },
});
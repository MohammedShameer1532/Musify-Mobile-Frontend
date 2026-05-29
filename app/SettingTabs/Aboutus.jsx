import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const AboutUs = () => {
  const navigation = useNavigation();

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#050505"
      />

      <LinearGradient
        colors={['#050505', '#0b0b0b', '#101010']}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }}>

          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              About App
            </Text>

            <View style={{ width: 40 }} />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* HERO SECTION */}

            <View style={styles.heroContainer}>
              {/* Glow Effects */}

              <View style={styles.glow1} />
              <View style={styles.glow2} />

              {/* Logo */}

              <LinearGradient
                colors={['#ff6a00', '#ee0979']}
                style={styles.logoWrap}
              >
                <Image
                  source={require('../assets/LysernFy.png')}
                  style={styles.logo}
                />
              </LinearGradient>

              {/* App Name */}

              <Text style={styles.appName}>
                LysernFy
              </Text>

              <View style={styles.taglineWrap}>
                <Ionicons
                  name="musical-notes"
                  size={16}
                  color="#fff"
                />

                <Text style={styles.tagline}>
                  Feel the music. Live the vibe.
                </Text>
              </View>

              {/* Stats */}

              <View style={styles.statsRow}>
                <View style={styles.statsCard}>
                  <Text style={styles.statsNumber}>
                    24/7
                  </Text>

                  <Text style={styles.statsLabel}>
                    Streaming
                  </Text>
                </View>

                <View style={styles.statsCard}>
                  <Text style={styles.statsNumber}>
                    HD
                  </Text>

                  <Text style={styles.statsLabel}>
                    Audio
                  </Text>
                </View>

                <View style={styles.statsCard}>
                  <Text style={styles.statsNumber}>
                    ∞
                  </Text>

                  <Text style={styles.statsLabel}>
                    Vibes
                  </Text>
                </View>
              </View>
            </View>

            {/* ABOUT CARD */}

            <LinearGradient
              colors={[
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.04)',
              ]}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <Ionicons
                    name="sparkles"
                    size={22}
                    color="#ff6a00"
                  />
                </View>

                <Text style={styles.cardTitle}>
                  Our Story
                </Text>
              </View>

              <Text style={styles.cardText}>
                LysernFy is built for people who
                truly love music. We created a
                premium streaming experience with
                modern design, immersive audio and
                lightning-fast performance.
              </Text>

              <Text style={styles.cardText}>
                From discovering tracks to enjoying
                smooth playback, every detail is
                designed to keep you connected to
                your music without distractions.
              </Text>
            </LinearGradient>

            {/* FEATURES */}

            <LinearGradient
              colors={[
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.04)',
              ]}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <Ionicons
                    name="flash"
                    size={22}
                    color="#00d4ff"
                  />
                </View>

                <Text style={styles.cardTitle}>
                  Why Users Love LysernFy
                </Text>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons
                    name="headset"
                    size={20}
                    color="#fff"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>
                    Premium Audio
                  </Text>

                  <Text style={styles.featureDesc}>
                    Crystal-clear sound quality for
                    immersive listening.
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons
                    name="flash"
                    size={20}
                    color="#fff"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>
                    Super Fast UI
                  </Text>

                  <Text style={styles.featureDesc}>
                    Smooth and responsive experience
                    with modern animations.
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons
                    name="cloud-download"
                    size={20}
                    color="#fff"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>
                    Offline Support
                  </Text>

                  <Text style={styles.featureDesc}>
                    Download and enjoy music
                    anywhere anytime.
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons
                    name="shield-checkmark"
                    size={20}
                    color="#fff"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>
                    Secure & Private
                  </Text>

                  <Text style={styles.featureDesc}>
                    Your data and account stay safe
                    and protected.
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* FOOTER */}

            <View style={styles.footerWrap}>
              <Text style={styles.footerText}>
                Made with ❤️ for music lovers
              </Text>

              <Text style={styles.copyText}>
                © {new Date().getFullYear()} LysernFy
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default AboutUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
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
    width: 35,
    height: 35,
    borderRadius: 20,

    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
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

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },

  /* HERO */

  heroContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },

  glow1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 120,

    backgroundColor: 'rgba(255,106,0,0.14)',

    top: -40,
    left: 20,
  },

  glow2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,

    backgroundColor: 'rgba(238,9,121,0.14)',

    top: 40,
    right: 20,
  },

  logoGradient: {
    width: 130,
    height: 130,
    borderRadius: 65,

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#ee0979',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },

  logo: {
    width: 75,
    height: 75,
    resizeMode: 'contain',
    borderRadius: 20,
  },

  appName: {
    color: '#fff',
    fontSize: 34,
    marginTop: 24,

    letterSpacing: 1,

    fontFamily: 'Poppins-ExtraBold',
  },

  taglineWrap: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.10)',

    paddingHorizontal: 16,
    paddingVertical: 10,

    borderRadius: 30,

    marginTop: 18,
  },

  tagline: {
    color: '#fff',
    marginLeft: 8,

    fontSize: 14,

    fontFamily: 'Poppins-Medium',
  },

  /* STATS */

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    width: '100%',
    marginTop: 32,
  },

  statsCard: {
    width: '31%',

    backgroundColor: 'rgba(255,255,255,0.07)',

    borderRadius: 24,
    paddingVertical: 20,

    alignItems: 'center',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  statsNumber: {
    color: '#fff',
    fontSize: 24,

    fontFamily: 'Poppins-Bold',
  },

  statsLabel: {
    color: '#aaa',
    marginTop: 6,

    fontSize: 13,

    fontFamily: 'Poppins-Medium',
  },

  /* CARDS */

  card: {
    marginHorizontal: 18,
    marginTop: 28,

    borderRadius: 30,
    padding: 22,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 20,
  },

  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,

    backgroundColor: 'rgba(255,255,255,0.08)',

    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTitle: {
    color: '#fff',
    fontSize: 20,

    marginLeft: 14,

    fontFamily: 'Poppins-Bold',
  },

  cardText: {
    color: '#cfcfcf',

    lineHeight: 26,
    fontSize: 15,

    marginBottom: 14,

    fontFamily: 'Poppins-Medium',
  },

  /* FEATURES */

  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.05)',

    borderRadius: 22,
    padding: 16,

    marginBottom: 14,
  },

  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,

    backgroundColor: '#ff6a00',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 14,
  },

  featureTitle: {
    color: '#fff',
    fontSize: 15,

    fontFamily: 'Poppins-Bold',
  },

  featureDesc: {
    color: '#aaa',

    marginTop: 4,
    lineHeight: 22,

    fontSize: 13,

    fontFamily: 'Poppins-Medium',
  },

  /* FOOTER */

  footerWrap: {
    alignItems: 'center',
    marginTop: 34,
  },

  footerText: {
    color: '#fff',
    fontSize: 15,

    fontFamily: 'Poppins-Medium',
  },

  copyText: {
    color: '#777',

    marginTop: 10,
    fontSize: 12,

    fontFamily: 'Poppins-Regular',
  },
});
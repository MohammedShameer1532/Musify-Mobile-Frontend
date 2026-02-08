import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const AboutUs = () => {
  const navigation = useNavigation();

  return (
    <LinearGradient colors={['#050505', '#0b0b0b']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Image source={require('../assets/LysernFy.png')} style={styles.logo} />
            <Text style={styles.appName}>LysernFy</Text>

            {/* use View for row layout */}
            <View style={styles.taglineRow}>
              <Ionicons name="musical-notes-outline" size={20} color="#1db954" />
              <Text style={styles.taglineText}>Feel the music. Live the moment.</Text>
            </View>
          </View>
          {/* About card */}
          <View style={styles.card}>
            <Text style={styles.title}>About Us</Text>

            <Text style={styles.text}>
              LysernFy is a modern music streaming experience built for listeners
              who value simplicity, speed, and sound.
            </Text>

            <Text style={styles.text}>
              Designed with a clean interface and powerful playback features,
              LysernFy lets you discover, play, and enjoy music without
              distractions.
            </Text>

            <Text style={styles.text}>
              Whether you're relaxing, focusing, or vibing on the go, LysernFy
              adapts to your mood and keeps the music flowing.
            </Text>
          </View>

          {/* Features card */}
          <View style={styles.card}>
            <Text style={styles.title}>Why LysernFy</Text>

            <View style={styles.feature}>
              <Ionicons name="headset-outline" size={20} color="#1db954" />
              <Text style={styles.featureText}>High-quality music playback</Text>
            </View>

            <View style={styles.feature}>
              <Ionicons name="flash-outline" size={20} color="#1db954" />
              <Text style={styles.featureText}>Fast, smooth, and responsive UI</Text>
            </View>

            <View style={styles.feature}>
              <Ionicons name="cloud-download-outline" size={20} color="#1db954" />
              <Text style={styles.featureText}>Smart streaming and offline support</Text>
            </View>

            <View style={styles.feature}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#1db954" />
              <Text style={styles.featureText}>Secure authentication and privacy-first design</Text>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>© {new Date().getFullYear()} LysernFy. All rights reserved.</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AboutUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  taglineText: {
    color: '#aeb0b5',
    fontSize: 13,
    marginLeft: 4, // ✅ works here
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginLeft: 4,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 28,
  },
  logo: {
    width: Math.min(120, width * 0.28),
    height: Math.min(120, width * 0.28),
    resizeMode: 'contain',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  appName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.6,
  },
  tagline: {
    color: '#aeb0b5',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: '85%',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  text: {
    color: '#cfcfcf',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  featureText: {
    color: '#e6e6e6',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    color: '#8a8a8a',
    fontSize: 12,
    textAlign: 'center',
    marginTop: -5,
  },
});

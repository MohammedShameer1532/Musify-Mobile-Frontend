import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef } from 'react';
import ViewShot from 'react-native-view-shot';
import RNBlobUtil from 'react-native-blob-util';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

const Donateus = () => {
  const navigation = useNavigation();
  const qrRef = useRef();

  const donateNow = () => {
    const upiUrl =
      'upi://pay?pa=mshameer260-2@okicici&pn=LysernFy&am=50&cu=INR';

    Linking.openURL(upiUrl);
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android' && Platform.Version < 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  };
  const downloadQR = async () => {
    try {
      const uri = await qrRef.current.capture();

      const fileName = `LysernFy_QR_${Date.now()}.png`;

      await RNBlobUtil.MediaCollection.copyToMediaStore(
        {
          name: fileName,
          parentFolder: 'LysernFy',
          mimeType: 'image/png',
        },
        'Download',
        uri
      );

      Alert.alert(
        'Downloaded 🎉',
        'QR Code saved to Downloads/LysernFy'
      );
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to download QR');
    }
  };

  return (
    <>
      <StatusBar
        backgroundColor="#050505"
        barStyle="light-content"
      />

      <LinearGradient
        colors={['#050505', '#0b0b0b', '#121212']}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }}>

          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            <Text style={styles.title}>
              Support Us
            </Text>

            <View style={{ width: 42 }} />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 50,
            }}
          >
            {/* HERO */}

            <View style={styles.heroSection}>
              <View style={styles.glow1} />
              <View style={styles.glow2} />

              <LinearGradient
                colors={['#ff416c', '#ff4b2b']}
                style={styles.logoWrap}
              >
                <Ionicons
                  name="heart"
                  size={48}
                  color="#fff"
                />
              </LinearGradient>

              <Text style={styles.heroTitle}>
                Keep The Music Alive ❤️
              </Text>

              <Text style={styles.heroSubtitle}>
                Your support helps us improve LysernFy,
                launch exciting features, and deliver a
                better music experience for everyone.
              </Text>
            </View>

            {/* STATS CARD */}

            <LinearGradient
              colors={[
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.03)',
              ]}
              style={styles.statsCard}
            >
              <View style={styles.statsRow}>
                <View style={styles.statsItem}>
                  <Ionicons
                    name="musical-notes"
                    size={24}
                    color="#ff6a00"
                  />

                  <Text style={styles.statsNumber}>
                    24/7
                  </Text>

                  <Text style={styles.statsLabel}>
                    Music Streaming
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.statsItem}>
                  <Ionicons
                    name="rocket"
                    size={24}
                    color="#00d4ff"
                  />

                  <Text style={styles.statsNumber}>
                    Fast
                  </Text>

                  <Text style={styles.statsLabel}>
                    New Features
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* WHY SUPPORT */}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Why Support Us?
              </Text>

              <Text style={styles.sectionSub}>
                Every contribution matters
              </Text>
            </View>

            <View style={styles.cardsWrap}>
              <View style={styles.card}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor:
                        'rgba(255,106,0,0.18)',
                    },
                  ]}
                >
                  <Ionicons
                    name="flash"
                    size={22}
                    color="#ff6a00"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    Faster Updates
                  </Text>

                  <Text style={styles.cardDesc}>
                    Help us deliver smoother updates and
                    exciting new features faster.
                  </Text>
                </View>
              </View>

              <View style={styles.card}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor:
                        'rgba(0,212,255,0.18)',
                    },
                  ]}
                >
                  <Ionicons
                    name="headset"
                    size={22}
                    color="#00d4ff"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    Better Experience
                  </Text>

                  <Text style={styles.cardDesc}>
                    Your donations help improve audio,
                    performance, and overall experience.
                  </Text>
                </View>
              </View>
            </View>

            {/* DONATE BUTTON */}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={donateNow}
              style={styles.btnWrap}
            >
              <LinearGradient
                colors={['#ff416c', '#ff4b2b']}
                style={styles.donateBtn}
              >
                <Ionicons
                  name="heart"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 10 }}
                />

                <Text style={styles.donateText}>
                  Donate via UPI
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* QR CARD */}

            <LinearGradient
              colors={[
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.03)',
              ]}
              style={styles.qrCard}
            >
              <View style={styles.qrTop}>
                <LinearGradient
                  colors={['#7d5fff', '#5f27cd']}
                  style={styles.qrIcon}
                >
                  <Ionicons
                    name="qr-code"
                    size={24}
                    color="#fff"
                  />
                </LinearGradient>

                <Text style={styles.qrHeading}>
                  Scan QR To Donate
                </Text>
              </View>

              <ViewShot
                ref={qrRef}
                options={{
                  format: 'png',
                  quality: 1,
                }}
              >
                <Image
                  source={require('../assets/qr.jpeg')}
                  style={styles.qr}
                />
              </ViewShot>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={downloadQR}
                style={styles.downloadWrap}
              >
                <LinearGradient
                  colors={['#7d5fff', '#5f27cd']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.downloadBtn}
                >
                  <View style={styles.downloadIcon}>
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color="#fff"
                    />
                  </View>

                  <View>
                    <Text style={styles.downloadText}>
                      Download QR
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.qrText}>
                Scan using Google Pay, PhonePe, Paytm,
                Amazon Pay, or any UPI app.
              </Text>
            </LinearGradient>

            {/* THANK YOU */}

            <LinearGradient
              colors={[
                'rgba(255,106,0,0.18)',
                'rgba(238,9,121,0.12)',
              ]}
              style={styles.noteBox}
            >
              <Ionicons
                name="sparkles-outline"
                size={22}
                color="#fff"
              />

              <Text style={styles.noteText}>
                Thank you for supporting LysernFy and
                helping us grow ❤️
              </Text>
            </LinearGradient>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default Donateus;

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
    width: 35,
    height: 35,
    borderRadius: 20,

    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  title: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },

  /* HERO */

  heroSection: {
    alignItems: 'center',
    marginTop: 35,
    paddingHorizontal: 24,
  },

  glow1: {
    position: 'absolute',

    width: 180,
    height: 180,
    borderRadius: 100,

    backgroundColor: 'rgba(255,65,108,0.16)',

    top: -20,
    left: 20,
  },

  glow2: {
    position: 'absolute',

    width: 160,
    height: 160,
    borderRadius: 100,

    backgroundColor: 'rgba(255,75,43,0.16)',

    top: 40,
    right: 20,
  },

  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#ff416c',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },

  heroTitle: {
    color: '#fff',
    fontSize: 30,

    marginTop: 26,
    textAlign: 'center',

    fontFamily: 'Poppins-Bold',
  },

  heroSubtitle: {
    color: '#b8b8b8',
    textAlign: 'center',

    marginTop: 14,
    lineHeight: 24,
    fontSize: 15,

    fontFamily: 'Poppins-Medium',
  },

  /* STATS */

  statsCard: {
    marginHorizontal: 18,
    marginTop: 30,

    borderRadius: 30,
    paddingVertical: 24,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statsItem: {
    flex: 1,
    alignItems: 'center',
  },

  divider: {
    width: 1,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  statsNumber: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,

    fontFamily: 'Poppins-Bold',
  },

  statsLabel: {
    color: '#999',
    marginTop: 4,

    fontSize: 13,

    fontFamily: 'Poppins-Medium',
  },

  /* SECTION */

  sectionHeader: {
    marginTop: 35,
    marginBottom: 16,
    paddingHorizontal: 18,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 22,

    fontFamily: 'Poppins-Bold',
  },

  sectionSub: {
    color: '#888',
    marginTop: 4,

    fontSize: 13,

    fontFamily: 'Poppins-Medium',
  },

  /* CARDS */

  cardsWrap: {
    paddingHorizontal: 18,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.06)',

    borderRadius: 24,
    padding: 18,

    marginBottom: 14,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 16,
  },

  cardTitle: {
    color: '#fff',
    fontSize: 15,

    fontFamily: 'Poppins-Bold',
  },

  cardDesc: {
    color: '#9a9a9a',
    fontSize: 13,

    marginTop: 6,
    lineHeight: 20,

    fontFamily: 'Poppins-Medium',
  },

  /* BUTTON */

  btnWrap: {
    marginHorizontal: 18,
    marginTop: 30,
  },

  donateBtn: {
    height: 62,
    borderRadius: 32,

    justifyContent: 'center',
    alignItems: 'center',

    flexDirection: 'row',

    shadowColor: '#ff416c',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },

  donateText: {
    color: '#fff',
    fontSize: 17,

    fontFamily: 'Poppins-Bold',
  },

  /* QR */

  qrCard: {
    marginHorizontal: 18,
    marginTop: 28,

    borderRadius: 30,
    padding: 22,

    alignItems: 'center',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  qrTop: {
    alignItems: 'center',
  },

  qrIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',
  },

  qrHeading: {
    color: '#fff',
    fontSize: 22,

    marginTop: 16,

    fontFamily: 'Poppins-Bold',
  },

  qr: {
    width: 230,
    height: 290,

    borderRadius: 24,

    marginTop: 24,
    marginBottom: 18,

    backgroundColor: '#fff',
  },

  qrText: {
    color: '#aaa',
    textAlign: 'center',

    lineHeight: 22,
    fontSize: 13,

    fontFamily: 'Poppins-Medium',
    marginTop:10
  },

  /* NOTE */

  noteBox: {
    marginHorizontal: 18,
    marginTop: 24,

    borderRadius: 24,
    padding: 18,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  noteText: {
    color: '#fff',
    marginLeft: 12,

    flex: 1,
    lineHeight: 22,

    fontSize: 13,

    fontFamily: 'Poppins-Medium',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 12,

    backgroundColor: 'rgba(255,255,255,0.08)',

    paddingVertical: 14,
    paddingHorizontal: 22,

    borderRadius: 18,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  downloadText: {
    color: '#fff',
    fontSize: 15,
    marginLeft: 8,
    marginTop: 5,
    fontFamily: 'Poppins-Bold',
  },
  downloadIcon: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold', 
  }
});
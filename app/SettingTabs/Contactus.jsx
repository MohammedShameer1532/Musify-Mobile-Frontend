import React from 'react';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const Contactus = () => {
  const navigation = useNavigation();

  const emailUs = () => {
    Linking.openURL('mailto:mshameer1227@gmail.com');
  };

  const callUs = () => {
    Linking.openURL('tel:+916374089031');
  };

  return (
    <>
      <StatusBar
        backgroundColor="#050505"
        barStyle="light-content"
      />

      <LinearGradient
        colors={['#050505', '#0d0d0d', '#141414']}
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
              Contact Us
            </Text>

            <View style={{ width: 42 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 40,
            }}
          >
            {/* HERO SECTION */}

            <View style={styles.heroSection}>
              {/* Glow Effects */}

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
                We’re Here To Help 💬
              </Text>

              <Text style={styles.heroSubtitle}>
                Have questions, feedback, or suggestions?
                Reach out anytime and we’ll get back to
                you as soon as possible.
              </Text>
            </View>

            {/* CONTACT CARDS */}

            <View style={styles.cardsContainer}>
              {/* EMAIL */}

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.touchCard}
                onPress={emailUs}
              >
                <LinearGradient
                  colors={[
                    'rgba(255,255,255,0.08)',
                    'rgba(255,255,255,0.03)',
                  ]}
                  style={styles.card}
                >
                  <View style={styles.leftSection}>
                    <LinearGradient
                      colors={['#ff6a00', '#ff9248']}
                      style={styles.iconWrap}
                    >
                      <Ionicons
                        name="mail"
                        size={24}
                        color="#fff"
                      />
                    </LinearGradient>

                    <View style={{ marginLeft: 16 }}>
                      <Text style={styles.cardTitle}>
                        Email Support
                      </Text>

                      <Text style={styles.cardDesc}>
                        mshameer1227@gmail.com
                      </Text>
                    </View>
                  </View>

                  <View style={styles.arrowWrap}>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#fff"
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* PHONE */}

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.touchCard}
                onPress={callUs}
              >
                <LinearGradient
                  colors={[
                    'rgba(255,255,255,0.08)',
                    'rgba(255,255,255,0.03)',
                  ]}
                  style={styles.card}
                >
                  <View style={styles.leftSection}>
                    <LinearGradient
                      colors={['#00c6ff', '#0072ff']}
                      style={styles.iconWrap}
                    >
                      <Ionicons
                        name="call"
                        size={24}
                        color="#fff"
                      />
                    </LinearGradient>

                    <View style={{ marginLeft: 16 }}>
                      <Text style={styles.cardTitle}>
                        Call Us
                      </Text>

                      <Text style={styles.cardDesc}>
                        +91 63740 89031
                      </Text>
                    </View>
                  </View>

                  <View style={styles.arrowWrap}>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#fff"
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* SUPPORT INFO */}

            <LinearGradient
              colors={[
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.03)',
              ]}
              style={styles.noteCard}
            >
              <View style={styles.noteIcon}>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color="#fff"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.noteTitle}>
                  Fast Response
                </Text>

                <Text style={styles.noteText}>
                  Our support team usually responds
                  within 24 hours for all queries and
                  feedback.
                </Text>
              </View>
            </LinearGradient>

            {/* FOOTER */}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Made with ❤️ by Mohammed Shameer
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default Contactus;

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
    marginTop: 40,
    paddingHorizontal: 25,
  },

  glow1: {
    position: 'absolute',

    width: 180,
    height: 180,
    borderRadius: 100,

    backgroundColor: 'rgba(255,106,0,0.18)',

    top: -20,
    left: 20,
  },

  glow2: {
    position: 'absolute',

    width: 160,
    height: 160,
    borderRadius: 100,

    backgroundColor: 'rgba(238,9,121,0.18)',

    top: 50,
    right: 20,
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
    fontSize: 30,

    marginTop: 28,
    textAlign: 'center',

    fontFamily: 'Poppins-Bold',
  },

  heroSubtitle: {
    color: '#b8b8b8',
    textAlign: 'center',

    marginTop: 14,
    lineHeight: 24,
    fontSize: 15,

    paddingHorizontal: 10,

    fontFamily: 'Poppins-Medium',
  },

  /* CARDS */

  cardsContainer: {
    marginTop: 36,
    paddingHorizontal: 18,
  },

  touchCard: {
    marginBottom: 18,
  },

  card: {
    borderRadius: 28,

    paddingVertical: 18,
    paddingHorizontal: 18,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,

    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTitle: {
    color: '#fff',
    fontSize: 17,

    fontFamily: 'Poppins-Bold',
  },

  cardDesc: {
    color: '#999',
    fontSize: 13,

    marginTop: 4,

    fontFamily: 'Poppins-Medium',
  },

  arrowWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,

    backgroundColor: 'rgba(255,255,255,0.08)',

    justifyContent: 'center',
    alignItems: 'center',
  },

  /* NOTE CARD */

  noteCard: {
    marginHorizontal: 18,
    marginTop: 10,

    borderRadius: 28,
    padding: 18,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  noteIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,

    backgroundColor: 'rgba(255,255,255,0.08)',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 16,
  },

  noteTitle: {
    color: '#fff',
    fontSize: 16,

    marginBottom: 4,

    fontFamily: 'Poppins-Bold',
  },

  noteText: {
    color: '#999',
    fontSize: 13,
    lineHeight: 22,

    fontFamily: 'Poppins-Medium',
  },

  /* FOOTER */

  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingBottom: 20,
  },

  footerText: {
    color: '#777',
    fontSize: 13,

    fontFamily: 'Poppins-Medium',
  },
});
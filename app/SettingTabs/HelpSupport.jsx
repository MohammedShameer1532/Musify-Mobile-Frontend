import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'react-native';

const HelpSupport = () => {
  const navigation = useNavigation();

  const emailSupport = () => {
    Linking.openURL('mailto:mshameer1227@gmail.com');
  };

  const callSupport = () => {
    Linking.openURL('tel:+916374089031');
  };

  const faqData = [
    {
      icon: 'trash-outline',
      title: 'Delete my account',
      desc: 'Go to Settings → Account Details → Delete Account.',
      color: '#ff4d6d',
    },
    {
      icon: 'create-outline',
      title: 'Change username',
      desc: 'Open Profile Edit and update your username easily.',
      color: '#00d4ff',
    },
    {
      icon: 'person-circle-outline',
      title: 'Check account details',
      desc: 'Visit Account Details to view your information.',
      color: '#7d5fff',
    },
    {
      icon: 'headset-outline',
      title: 'Contact support',
      desc: 'Reach out anytime from the support section.',
      color: '#00c896',
    },
    {
      icon: 'wifi-outline',
      title: 'App not loading?',
      desc: 'Check internet connection or restart the app.',
      color: '#ff9f43',
    },
  ];

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
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            <Text style={styles.title}>
              Help & Support
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
                colors={['#ff6a00', '#ee0979']}
                style={styles.logoWrap}
              >
                <Image
                  source={require('../assets/LysernFy.png')}
                  style={styles.logo}
                />
              </LinearGradient>

              <Text style={styles.heroTitle}>
                We’re Here To Help
              </Text>

              <Text style={styles.heroSubtitle}>
                Find quick answers, troubleshoot issues,
                and connect with support anytime.
              </Text>
            </View>

            {/* QUICK HELP */}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Quick Help
              </Text>

              <Text style={styles.sectionSub}>
                Frequently asked questions
              </Text>
            </View>

            <View style={styles.cardsWrap}>
              {faqData.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  style={styles.card}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: `${item.color}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={item.color}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.cardDesc}>
                      {item.desc}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* CONTACT SUPPORT */}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Contact Support
              </Text>

              <Text style={styles.sectionSub}>
                Reach us directly anytime
              </Text>
            </View>

            {/* EMAIL */}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={emailSupport}
            >
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.10)',
                  'rgba(255,255,255,0.04)',
                ]}
                style={styles.contactCard}
              >
                <View style={styles.contactLeft}>
                  <LinearGradient
                    colors={['#00d4ff', '#007cf0']}
                    style={styles.contactIcon}
                  >
                    <Ionicons
                      name="mail"
                      size={22}
                      color="#fff"
                    />
                  </LinearGradient>

                  <View>
                    <Text style={styles.contactTitle}>
                      Email Support
                    </Text>

                    <Text style={styles.contactDesc}>
                      mshameer1227@gmail.com
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="open-outline"
                  size={20}
                  color="#aaa"
                />
              </LinearGradient>
            </TouchableOpacity>

            {/* CALL */}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={callSupport}
            >
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.10)',
                  'rgba(255,255,255,0.04)',
                ]}
                style={styles.contactCard}
              >
                <View style={styles.contactLeft}>
                  <LinearGradient
                    colors={['#00c896', '#00a86b']}
                    style={styles.contactIcon}
                  >
                    <Ionicons
                      name="call"
                      size={22}
                      color="#fff"
                    />
                  </LinearGradient>

                  <View>
                    <Text style={styles.contactTitle}>
                      Call Support
                    </Text>

                    <Text style={styles.contactDesc}>
                      +91 63740 89031
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="open-outline"
                  size={20}
                  color="#aaa"
                />
              </LinearGradient>
            </TouchableOpacity>

            {/* SUPPORT NOTE */}

            <LinearGradient
              colors={[
                'rgba(255,106,0,0.18)',
                'rgba(238,9,121,0.12)',
              ]}
              style={styles.noteBox}
            >
              <Ionicons
                name="time-outline"
                size={22}
                color="#fff"
              />

              <Text style={styles.noteText}>
                Our support team usually responds within
                24 hours.
              </Text>
            </LinearGradient>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default HelpSupport;

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
  /* HERO */

  heroSection: {
    alignItems: 'center',
    marginTop: 35,
    paddingHorizontal: 25,
  },

  glow1: {
    position: 'absolute',

    width: 180,
    height: 180,
    borderRadius: 100,

    backgroundColor: 'rgba(255,106,0,0.18)',

    top: -30,
    left: 20,
  },

  glow2: {
    position: 'absolute',

    width: 160,
    height: 160,
    borderRadius: 100,

    backgroundColor: 'rgba(238,9,121,0.18)',

    top: 20,
    right: 10,
  },

  heroIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#ee0979',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },

  heroTitle: {
    color: '#fff',
    fontSize: 28,
    marginTop: 24,

    fontFamily: 'Poppins-Bold',
  },

  heroSubtitle: {
    color: '#b8b8b8',
    textAlign: 'center',

    marginTop: 12,
    lineHeight: 24,
    fontSize: 15,

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
    fontSize: 21,

    fontFamily: 'Poppins-Bold',
  },

  sectionSub: {
    color: '#888',
    marginTop: 4,

    fontSize: 13,

    fontFamily: 'Poppins-Medium',
  },

  /* FAQ CARD */

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

  /* CONTACT */

  contactCard: {
    marginHorizontal: 18,
    marginBottom: 16,

    borderRadius: 28,
    padding: 18,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 16,
  },

  contactTitle: {
    color: '#fff',
    fontSize: 16,

    fontFamily: 'Poppins-Bold',
  },

  contactDesc: {
    color: '#a1a1a1',
    marginTop: 4,

    fontSize: 13,

    fontFamily: 'Poppins-Medium',
  },

  /* NOTE */

  noteBox: {
    marginHorizontal: 18,
    marginTop: 12,

    borderRadius: 22,
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
});
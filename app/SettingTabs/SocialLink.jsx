import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const SocialLink = ({ navigation }) => {
  const links = [
    {
      title: 'Twitter / X',
      username: '@mshameer260',
      icon: 'logo-twitter',
      url: 'https://x.com/mshameer260',
      colors: ['#1DA1F2', '#0d8bff'],
    },

    {
      title: 'Instagram',
      username: '@mshameer260',
      icon: 'logo-instagram',
      url: 'https://www.instagram.com/mshameer260/',
      colors: ['#833ab4', '#fd1d1d', '#fcb045'],
    },

    {
      title: 'LinkedIn',
      username: 'Mohammed Shameer',
      icon: 'logo-linkedin',
      url: 'https://www.linkedin.com/in/mohammed-shameer-a-60454623b/',
      colors: ['#0077B5', '#00a0dc'],
    },

    {
      title: 'GitHub',
      username: 'MohammedShameer1532',
      icon: 'logo-github',
      url: 'https://github.com/MohammedShameer1532',
      colors: ['#2d2d2d', '#000'],
    },

    {
      title: 'Facebook',
      username: 'Mohammed Shameer',
      icon: 'logo-facebook',
      url: 'https://www.facebook.com/a.mdshameer.a.mdshameer',
      colors: ['#1877F2', '#0d5fff'],
    },

    {
      title: 'YouTube',
      username: '@MohammedShameer1527',
      icon: 'logo-youtube',
      url: 'https://www.youtube.com/@MohammedShameer1527',
      colors: ['#ff0000', '#ff4d4d'],
    },
  ];

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
              Social Links
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

            <View style={styles.heroContainer}>
              {/* Glow Effects */}

              <View style={styles.glow1} />
              <View style={styles.glow2} />

              {/* APP LOGO */}

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
                Let’s Connect 🚀
              </Text>

              <Text style={styles.heroSubtitle}>
                Follow us on social platforms for updates,
                music vibes, projects, and more creative
                content.
              </Text>
            </View>

            {/* SOCIAL CARDS */}

            <View style={styles.cardsContainer}>
              {links.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() =>
                    Linking.openURL(link.url)
                  }
                  style={styles.touchCard}
                >
                  <LinearGradient
                    colors={[
                      'rgba(255,255,255,0.09)',
                      'rgba(255,255,255,0.03)',
                    ]}
                    style={styles.card}
                  >
                    {/* Left */}

                    <View style={styles.leftContent}>
                      <LinearGradient
                        colors={link.colors}
                        style={styles.iconWrap}
                      >
                        <Ionicons
                          name={link.icon}
                          size={24}
                          color="#fff"
                        />
                      </LinearGradient>

                      <View style={{ marginLeft: 16 }}>
                        <Text style={styles.cardTitle}>
                          {link.title}
                        </Text>

                        <Text style={styles.cardUsername}>
                          {link.username}
                        </Text>
                      </View>
                    </View>

                    {/* Right */}

                    <View style={styles.arrowWrap}>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#fff"
                      />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* FOOTER */}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Built with ❤️ by Mohammed Shameer
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default SocialLink;

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

  headerTitle: {
    color: '#fff',
    fontSize: 20,
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

    backgroundColor: 'rgba(255,106,0,0.18)',

    top: -20,
    left: 10,
  },

  glow2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 100,

    backgroundColor: 'rgba(238,9,121,0.18)',

    top: 40,
    right: 10,
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

    marginTop: 12,
    lineHeight: 24,
    fontSize: 15,

    paddingHorizontal: 10,

    fontFamily: 'Poppins-Medium',
  },

  /* CARDS */

  cardsContainer: {
    marginTop: 34,
    paddingHorizontal: 18,
  },

  touchCard: {
    marginBottom: 16,
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

  leftContent: {
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

  cardUsername: {
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

  /* FOOTER */

  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },

  footerText: {
    color: '#777',
    fontSize: 13,

    fontFamily: 'Poppins-Medium',
  },
});
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React, { useContext, useEffect, useRef } from 'react'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';

const Musiclang = () => {
  const navigation = useNavigation();
  const { selectedLanguage, setSelectedLanguage } = useContext(SearchContext);

  const LANGUAGES = [
    { name: 'Tamil', code: 'tamil', image: 'https://c.saavncdn.com/artists/Anirudh_Ravichander_003_20260121134149_500x500.jpg' },
    { name: 'Hindi', code: 'hindi', image: 'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg' },
    { name: 'Telugu', code: 'telugu', image: 'https://c.saavncdn.com/artists/Devi_Sri_Prasad_008_20250619062824_500x500.jpg' },
    { name: 'English', code: 'english', image: 'https://c.saavncdn.com/artists/Ed_Sheeran_002_20250625073038_500x500.jpg' },
    { name: 'Punjabi', code: 'punjabi', image: 'https://c.saavncdn.com/artists/Guru_Randhawa_004_20250701125845_500x500.jpg' },
    { name: 'Marathi', code: 'marathi', image: 'https://c.saavncdn.com/artists/Ajay_Atul_003_20230228105414_500x500.jpg' },
    { name: 'Gujarati', code: 'gujarati', image: 'https://c.saavncdn.com/artists/Kinjal_Dave_003_20241217095517_500x500.jpg' },
    { name: 'Bengali', code: 'bengali', image: 'https://c.saavncdn.com/artists/Anupam_Roy_007_20250623084828_500x500.jpg' },
    { name: 'Kannada', code: 'kannada', image: 'https://c.saavncdn.com/artists/Arjun_Janya_004_20230327131756_500x500.jpg' },
    { name: 'Bhojpuri', code: 'bhojpuri', image: 'https://c.saavncdn.com/artists/Manoj_Tiwari_500x500.jpg' },
    { name: 'Malayalam', code: 'malayalam', image: 'https://c.saavncdn.com/artists/Bijibal_500x500.jpg' },
    { name: 'Sanskrit', code: 'sanskrit', image: 'https://c.saavncdn.com/artists/M_S_Subbulakshmi_500x500.jpg' },
    { name: 'Haryanvi', code: 'haryanvi', image: 'https://c.saavncdn.com/artists/Sapna_Choudhary_000_20220916102820_500x500.jpg' },
    { name: 'Rajasthani', code: 'rajasthani', image: 'https://c.saavncdn.com/artists/Seema_Mishra_500x500.jpg' },
    { name: 'Odia', code: 'odia', image: 'https://c.saavncdn.com/artists/Akshaya_Mohanty_500x500.jpg' },
    { name: 'Assamese', code: 'assamese', image: 'https://c.saavncdn.com/artists/Zubeen_Garg_003_20201020081952_500x500.jpg' },
  ];

  function AnimatedIcon({ children, focused }) {
    const scale = useRef(new Animated.Value(focused ? 1.15 : 1)).current;
    const opacity = useRef(new Animated.Value(focused ? 1 : 0.7)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: focused ? 1.15 : 1,
          useNativeDriver: true,
          friction: 5,
        }),
        Animated.timing(opacity, {
          toValue: focused ? 1 : 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, [focused]);

    return (
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        {children}
      </Animated.View>
    );
  }

  return (
    <LinearGradient colors={['#050505', '#0b0b0b']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <AnimatedIcon focused={true}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
          </AnimatedIcon>
          <Text style={styles.title}>Select Languages</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}>
          <View style={styles.grid}>
            {LANGUAGES.map(item => (
              <TouchableOpacity
                key={item.code}
                onPress={() => setSelectedLanguage(item.code)}
                style={[
                  styles.languageCard,
                  selectedLanguage === item.code && styles.selectedCard,
                ]}
              >
                <Image source={{ uri: item.image }} style={styles.languageImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.overlay}
                >
                  <Text style={styles.languageText}>{item.name}</Text>
                  {selectedLanguage === item.code && (
                    <Ionicons name="checkmark-circle" size={22} color="#10b981" style={styles.checkIcon} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

export default Musiclang

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop:15,
  },
  languageCard: {
    width: '48%',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1c1c1c',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#10b981',
    transform: [{ scale: 1.02 }],
  },
  languageImage: {
    width: '100%',
    height: 140,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  languageText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  checkIcon: {
    marginTop: 6,
    backgroundColor: '#000',
    borderRadius: 12,
  },
});

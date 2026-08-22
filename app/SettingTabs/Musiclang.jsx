import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

import { useNavigation } from '@react-navigation/native';

import { SearchContext } from '../contextProvider/searchContext';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';

import { API_URL } from '@env';


const { width } = Dimensions.get('window');

const BASE_WIDTH = 360;

const scale = size => (width / BASE_WIDTH) * size;


// =====================================================
// LANGUAGES
// =====================================================

const LANGUAGES = [
  {
    name: 'Tamil',
    code: 'tamil',
    image:
      'https://c.saavncdn.com/artists/Anirudh_Ravichander_003_20260121134149_500x500.jpg',
  },

  {
    name: 'Hindi',
    code: 'hindi',
    image:
      'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg',
  },

  {
    name: 'Telugu',
    code: 'telugu',
    image:
      'https://c.saavncdn.com/artists/Devi_Sri_Prasad_008_20250619062824_500x500.jpg',
  },

  {
    name: 'English',
    code: 'english',
    image:
      'https://c.saavncdn.com/artists/Ed_Sheeran_002_20250625073038_500x500.jpg',
  },

  {
    name: 'Punjabi',
    code: 'punjabi',
    image:
      'https://c.saavncdn.com/artists/Guru_Randhawa_004_20250701125845_500x500.jpg',
  },

  {
    name: 'Marathi',
    code: 'marathi',
    image:
      'https://c.saavncdn.com/artists/Ajay_Atul_003_20230228105414_500x500.jpg',
  },

  {
    name: 'Gujarati',
    code: 'gujarati',
    image:
      'https://c.saavncdn.com/artists/Kinjal_Dave_003_20241217095517_500x500.jpg',
  },

  {
    name: 'Bengali',
    code: 'bengali',
    image:
      'https://c.saavncdn.com/artists/Anupam_Roy_007_20250623084828_500x500.jpg',
  },

  {
    name: 'Kannada',
    code: 'kannada',
    image:
      'https://c.saavncdn.com/artists/Arjun_Janya_004_20230327131756_500x500.jpg',
  },

  {
    name: 'Bhojpuri',
    code: 'bhojpuri',
    image:
      'https://c.saavncdn.com/artists/Manoj_Tiwari_500x500.jpg',
  },

  {
    name: 'Malayalam',
    code: 'malayalam',
    image:
      'https://c.saavncdn.com/artists/Bijibal_500x500.jpg',
  },

  {
    name: 'Sanskrit',
    code: 'sanskrit',
    image:
      'https://c.saavncdn.com/artists/M_S_Subbulakshmi_500x500.jpg',
  },

  {
    name: 'Haryanvi',
    code: 'haryanvi',
    image:
      'https://c.saavncdn.com/artists/Sapna_Choudhary_000_20220916102820_500x500.jpg',
  },

  {
    name: 'Rajasthani',
    code: 'rajasthani',
    image:
      'https://c.saavncdn.com/artists/Seema_Mishra_500x500.jpg',
  },

  {
    name: 'Odia',
    code: 'odia',
    image:
      'https://c.saavncdn.com/artists/Akshaya_Mohanty_500x500.jpg',
  },

  {
    name: 'Assamese',
    code: 'assamese',
    image:
      'https://c.saavncdn.com/artists/Zubeen_Garg_003_20201020081952_500x500.jpg',
  },
];


const Musiclang = () => {

  const navigation = useNavigation();

  const {
    selectedLanguage,
    setSelectedLanguage,
  } = useContext(SearchContext);

  const [saving, setSaving] = useState(false);



  // =====================================================
  // SAVE LANGUAGE
  // =====================================================

  const handleContinue = async () => {

    if (!selectedLanguage) {

      Alert.alert(
        'Select a language',
        'Please select your preferred music language.',
      );

      return;
    }

    try {

      setSaving(true);

      const user = getAuth().currentUser;

      const response = await axios.post(
        `${API_URL}/api/preferences/language`,
        {
          userId: user.uid,
          language: selectedLanguage,
        },
      );

      if (response?.data?.success) {

        // Continue to app
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'TabsLayout',
            },
          ],
        });

      } else {

        Alert.alert(
          'Error',
          'Unable to save your language.',
        );
      }

    } catch (error) {

      console.error(
        'Save music language error:',
        error?.response?.data || error,
      );

      Alert.alert(
        'Error',
        'Unable to save language. Please try again.',
      );

    } finally {

      setSaving(false);

    }
  };

  const getlanguage = async () => {
    try {
      const user = getAuth().currentUser;

      if (!user) {
        console.log('No logged-in user');
        setSelectedLanguage(null);
        return;
      }

      const res = await axios.get(
        `${API_URL}/api/preferences/${encodeURIComponent(
          user.uid,
        )}`,
      );

      console.log('Language response:', res.data);

      // Backend has saved language
      if (res.data?.success && res.data?.language) {
        setSelectedLanguage(res.data.language);
      } else {
        // No saved language
        setSelectedLanguage(null);
      }

    } catch (error) {
      console.error(
        'Get language error:',
        error?.response?.data || error?.message || error,
      );

      // If API fails, don't select anything
      setSelectedLanguage(null);
    }
  };

  useEffect(() => {
    getlanguage();
  }, []);

  return (

    <LinearGradient
      colors={[
        '#050505',
        '#0b0b0b',
        '#050505',
      ]}
      style={styles.container}>

      <SafeAreaView style={{ flex: 1 }}>

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              navigation.goBack()
            }
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={scale(22)}
              color="#fff"
            />
          </TouchableOpacity>


          <View style={styles.headerCenter}>

            <Text style={styles.title}>
              Choose Your Music
            </Text>
          </View>


          <View style={styles.headerSide} />

        </View>


        {/* ================================================= */}
        {/* DESCRIPTION */}
        {/* ================================================= */}

        <View style={styles.descriptionContainer}>

          <Text style={styles.description}>
            We'll use this to personalize your music
            recommendations.
          </Text>

        </View>


        {/* ================================================= */}
        {/* LANGUAGE GRID */}
        {/* ================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 120,
          }}>

          <View style={styles.grid}>

            {LANGUAGES.map(item => {

              const selected =
                selectedLanguage === item.code;

              return (

                <TouchableOpacity
                  key={item.code}
                  activeOpacity={0.85}
                  onPress={() =>
                    setSelectedLanguage(item.code)
                  }
                  style={[
                    styles.languageCard,
                    selected && styles.selectedCard,
                  ]}>

                  <Image
                    source={{
                      uri: item.image,
                    }}
                    style={styles.languageImage}
                  />


                  {/* Gradient */}

                  <LinearGradient
                    colors={[
                      'transparent',
                      'rgba(0,0,0,0.85)',
                    ]}
                    style={styles.overlay}>

                    <Text style={styles.languageText}>
                      {item.name}
                    </Text>

                  </LinearGradient>


                  {/* Selected */}

                  {selected && (

                    <View style={styles.checkContainer}>

                      <Ionicons
                        name="checkmark"
                        size={15}
                        color="#000"
                      />

                    </View>

                  )}

                </TouchableOpacity>

              );

            })}

          </View>

        </ScrollView>


        {/* ================================================= */}
        {/* CONTINUE BUTTON */}
        {/* ================================================= */}

        <View style={styles.bottomContainer}>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={saving}
            onPress={handleContinue}
            style={[
              styles.continueButton,
              saving && {
                opacity: 0.7,
              },
            ]}>

            {saving ? (

              <ActivityIndicator
                size="small"
                color="#000"
              />

            ) : (

              <>

                <Text style={styles.continueText}>
                  Continue
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#000"
                />

              </>

            )}

          </TouchableOpacity>

        </View>

      </SafeAreaView>

    </LinearGradient>

  );
};


export default Musiclang;


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: scale(35),
    height: scale(35),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSide: {
    width: 42,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(29,185,84,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.25)',
  },

  title: {
    color: '#fff',
    fontSize: scale(19),
    fontFamily: 'Poppins-Bold',
  },

  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: scale(10),
    fontFamily: 'Poppins-Regular',
    marginTop: 1,
  },

  descriptionContainer: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    alignItems: 'center',
  },

  description: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: scale(11),
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 17,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  languageCard: {
    width: '48%',
    height: 145,
    borderRadius: 18,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: '#1DB954',
  },

  languageImage: {
    width: '100%',
    height: '100%',
  },

  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 75,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },

  languageText: {
    color: '#fff',
    fontSize: scale(15),
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.3,
  },

  checkContainer: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: 'rgba(5,5,5,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },

  continueButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1DB954',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  continueText: {
    color: '#000',
    fontSize: scale(15),
    fontFamily: 'Poppins-Bold',
  },

});
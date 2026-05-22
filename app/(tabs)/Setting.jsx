import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth, signOut } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { getFirestore, collection, doc, onSnapshot } from '@react-native-firebase/firestore';
import axios from 'axios';
import DeviceInfo from 'react-native-device-info';
import { GOOGLE_CLIENT_ID, API_URL } from '@env';
import { Animated } from 'react-native';



const Setting = () => {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [deviceName, setDeviceName] = useState(null);



  useEffect(() => {
    DeviceInfo.getUniqueId().then(setDeviceId);
    setDeviceName(DeviceInfo.getModel());
  }, []);


  useEffect(() => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }

    console.log('✅ Firebase UID:', user.uid);

    const db = getFirestore();
    const userRef = doc(collection(db, 'users'), user.uid);

    const unsubscribe = onSnapshot(userRef, snapshot => {
      if (snapshot.exists) {
        const data = snapshot.data();
        console.log('🔥 Firestore user data (realtime):', data);
        setUserInfo(data);
      } else {
        console.log('⚠️ User document does not exist');
      }
    }, error => {
      console.log('❌ Firestore listener error:', error);
    });

    return unsubscribe;
  }, []);




  const handleLogedout = async (uid) => {
    try {
      const res = await axios.post(`${API_URL}/api/session/logout`, {
        userId: uid,
        deviceId: deviceId
      });

      console.log("SERVER RESPONSE 👉", res.data);

      if (!res.data.success) {
        throw new Error("Session creation failed");
      }

      console.log("Active devices:", res.data);
    } catch (err) {
      console.log("Session API error 👉", err.response?.data || err.message);
      throw err;
    }
  };


  const handleSignOut = async () => {
    try {
      const authInstance = getAuth();
      const user = authInstance.currentUser;
      if (user) {
        await AsyncStorage.removeItem(`welcome_shown_${user.uid}`);
      }
      await signOut(authInstance);
      await GoogleSignin.signOut();
      await handleLogedout(user.uid);
      console.log('User signed out successfully ✅');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.log('Sign out error 👉', error);
    }
  };


  function AnimatedIcon({ children, focused }) {
    const scale = new Animated.Value(focused ? 1.15 : 1);
    const opacity = new Animated.Value(focused ? 1 : 0.7);

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
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingVertical: 12 }} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <Image
              source={
                userInfo?.photo
                  ? { uri: userInfo.photo }
                  : require('../assets/avatar.png')
              }
              style={styles.avatar}
            />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.name}>{userInfo?.name || 'Guest User'}</Text>
              {/* <Text style={styles.email}>{userInfo?.email || 'Not signed in'}</Text> */}
              <Text style={styles.email}>
                {userInfo?.email && userInfo.email.trim() !== ''
                  ? userInfo.email
                  : userInfo?.name
                    ? 'Signed in via Facebook'
                    : 'Not signed in'}
              </Text>

            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('ProfileEdit')}>
              <Ionicons name="pencil-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>

            <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('Account')}>
              <Ionicons name="person-circle-outline" size={24} color="#fff" style={styles.optionIcon} />
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Account Details</Text>
                <Text style={styles.optionSubtitle}>Manage your account</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('Share')}>
              <Ionicons name="share-social-outline" size={24} color="#fff" style={styles.optionIcon} />
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Share</Text>
                <Text style={styles.optionSubtitle}>Tell friends about the app</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('Aboutus')}>
              <Ionicons name="information-circle-outline" size={24} color="#fff" style={styles.optionIcon} />
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>About Us</Text>
                <Text style={styles.optionSubtitle}>App & company info</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => navigation.navigate('SocialLink')} // or open a URL with Linking
            >
              <Ionicons name="people-outline" size={24} color="#fff" style={styles.optionIcon} />
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Connect With Us</Text>
                <Text style={styles.optionSubtitle}>Follow, join our community, or collaborate</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('HelpSupport')}>
              <Ionicons name="help-circle-outline" size={24} color="#fff" style={styles.optionIcon} />
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Help & Support</Text>
                <Text style={styles.optionSubtitle}>Help Centre</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </TouchableOpacity>


            <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('Contactus')}>
              <Ionicons name="call-outline" size={24} color="#fff" style={styles.optionIcon} />
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Contact Us</Text>
                <Text style={styles.optionSubtitle}>Get help or feedback</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('Contactus')}>
              <Ionicons name="star-outline" size={24} color="#fff" style={styles.optionIcon} />
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Rate on Google Play</Text>
                <Text style={styles.optionSubtitle}>Leave a review</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </TouchableOpacity>


            <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('Donateus')}>
              <Ionicons name="heart-outline" size={24} color="#fff" style={styles.optionIcon} />
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Donate Us</Text>
                <Text style={styles.optionSubtitle}>Support development</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>

            <View style={styles.optionCard}>
              <Ionicons name="apps-outline" size={24} color="#fff" style={styles.optionIcon} />
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Version</Text>
                <Text style={styles.optionSubtitle}>1.0.0</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={{ marginTop: 18, marginBottom: 100 }}>
            <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={handleSignOut}>
              <LinearGradient colors={['#2196f3', '#3f51b5']} style={styles.signOutBtn}>
                <Ionicons name="log-out-outline" size={23} color="#fff" style={{ marginRight: 5, }} />
                <Text style={styles.btnText}>Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient >
  );
};

export default Setting;

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

  profileCard: {
    marginHorizontal: 18,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#222',
  },
  name: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  email: {
    color: '#bdbdbd',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins-Medium',
  },
  editBtn: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    borderRadius: 10,
  },

  section: {
    marginTop: 18,
    paddingHorizontal: 18,
  },
  sectionTitle: {
    color: '#bdbdbd',
    fontSize: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    fontFamily: 'Poppins-Bold',
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionIcon: {
    marginRight: 12,
    width: 36,
    textAlign: 'center',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  optionSubtitle: {
    color: '#9e9e9e',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Poppins-Medium',
  },

  btn: {
    marginHorizontal: 18,
  },
  dangerBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff1744',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#2196f3',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: 320,
    padding: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});

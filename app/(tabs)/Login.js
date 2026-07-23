import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { FacebookAuthProvider } from '@react-native-firebase/auth';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DeviceInfo from 'react-native-device-info';
import { useNavigation } from '@react-navigation/native';
import { GOOGLE_CLIENT_ID, API_URL } from '@env';
import axios from 'axios';
import { Platform } from "react-native";
import { MenuProvider } from 'react-native-popup-menu';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';

const Login = () => {
  const [fbloading, setFbloading] = useState(false);
  const [gloading, setGloading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [deviceName, setDeviceName] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const navigation = useNavigation();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["100%"]);


  useEffect(() => {
    DeviceInfo.getUniqueId().then(setDeviceId);
    setDeviceName(DeviceInfo.getModel());

    GoogleSignin.configure({
      webClientId: GOOGLE_CLIENT_ID,
      offlineAccess: false,
    });
  }, []);


  const handleLoginSuccess = async (uid) => {
    if (!deviceId) return;

    try {
      const res = await axios.post(`${API_URL}/api/session/create`, {
        userId: uid,
        deviceId,
        deviceName,
        platform: Platform.OS,
      });


      if (res.data.showModal) {
        setSessions(res.data.sessions);

        setTimeout(() => {
          bottomSheetRef.current?.snapToIndex(0);  // 👈 open sheet
        }, 300);
      } else {
        // No modal needed → go to app
        navigation.replace("TabsLayout");
      }

    } catch (err) {
      console.error(err);
    }
  };


  const logoutOtherDevice = async (deviceId) => {
    try {
      const user = getAuth().currentUser;

      await axios.post(`${API_URL}/api/session/logout-device`, {
        userId: user.uid,
        deviceId: deviceId,
      })
      setShowDeviceModal(true);
      // refresh session list
    } catch (e) {
      console.error(e);
    }
  };



  const signInWithGoogle = async () => {
    if (gloading) return;
    try {
      setGloading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const userInfo = await GoogleSignin.signIn();

      const { idToken } = userInfo.data;
      if (!idToken) throw new Error('No idToken returned from Google');

      // ✅ Modular Auth API
      const authInstance = getAuth();
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(authInstance, googleCredential);

      const { user } = result;
      await handleLoginSuccess(result.user.uid, true);

      // ✅ Modular Firestore API
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);

      await setDoc(
        userRef,
        {
          name: user.displayName || 'Guest User',
          email: user.email || '',
          photo: user.photoURL || '',
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

    } catch (e) {
      console.error('Google Sign-In error 👉', e);
    } finally {
      setGloading(false);
    }
  };



  // ---------- Facebook Login ----------
  // const signInWithFacebook = async () => {
  //   if (fbloading) return;
  //   try {
  //     setFbloading(true);
  //     // Ask for permissions
  //     const result = await LoginManager.logInWithPermissions(['public_profile']);
  //     if (result.isCancelled) throw 'User cancelled Facebook login';

  //     // Get access token
  //     const data = await AccessToken.getCurrentAccessToken();
  //     if (!data) throw 'Failed to get Facebook access token';

  //     // Sign in with Firebase
  //     const credential = FacebookAuthProvider.credential(data.accessToken);
  //     const auth = getAuth();
  //     const resultAuth = await signInWithCredential(auth, credential);
  //     const { user } = resultAuth;
  //     await handleLoginSuccess(user.uid);



  //     // Get Facebook Graph ID
  //     const facebookId = user.providerData[0].uid;

  //     // Fetch profile picture (direct URL, no redirect)
  //     const response = await fetch(
  //       `https://graph.facebook.com/${facebookId}/picture?type=large&redirect=false&access_token=${data.accessToken}`
  //     );
  //     const json = await response.json();
  //     const photoUrl = json.data.url;

  //     // Save to Firestore
  //     const db = getFirestore();
  //     await setDoc(
  //       doc(db, 'users', user.uid),
  //       {
  //         name: user.displayName || 'Guest User',
  //         email: user.email || '',
  //         photo: photoUrl,
  //         createdAt: serverTimestamp(),
  //       },
  //       { merge: true }
  //     );

  //   } catch (e) {
  //     console.error('Facebook Sign-In error 👉', e);
  //   } finally {
  //     setFbloading(true);
  //   }
  // };



  return (
    <MenuProvider skipInstanceCheck>
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.root}>
          <View style={styles.card}>
            <Text style={styles.logo}>LysernFy</Text>
            <Text style={styles.subtitle}>
              Music that moves with you
            </Text>

            {/* Google */}
            <TouchableOpacity
              style={[
                styles.googleBtn,
                gloading && { opacity: 0.6 }
              ]}
              onPress={signInWithGoogle}
              disabled={gloading}
              activeOpacity={0.85}
            >
              <Image source={require('../assets/google_logo.png')} style={styles.googleLogo} />
              <Text style={styles.googleBtnText}>
                {gloading ? 'Please wait...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>


            {/* Facebook */}
            {/* <TouchableOpacity
              style={[
                styles.fbBtn,
                fbloading && { opacity: 0.6 }
              ]}
              onPress={signInWithFacebook}
              disabled={fbloading}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-facebook" size={25} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.fbBtnText}>
                {fbloading ? 'Please wait...' : 'Continue with Facebook'}
              </Text>
            </TouchableOpacity> */}


            <TouchableOpacity onPress={() => setShowTermsModal(true)} activeOpacity={0.8}>
              <Text style={styles.footerLink}>
                By continuing, you agree to our Terms & Privacy Policy
              </Text>
            </TouchableOpacity>

            <Modal visible={showTermsModal} transparent animationType="slide">
              <View style={styles.overlay}>
                <View style={styles.termsModalBox}>
                  <Text style={styles.termsTitle}>Your Data & Privacy</Text>

                  <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                    <Text style={styles.termsDescription}>
                      We use your information only to create and manage your profile inside
                      the app. This helps us personalize your experience and keep your account
                      secure.
                    </Text>

                    <Text style={styles.termsDescription}>
                      Your basic details such as name, email, and profile photo are used to
                      identify your account. We do not sell or share your personal data with
                      third parties.
                    </Text>

                    <Text style={styles.termsDescription}>
                      You are always in control — you can update your profile or delete your
                      account at any time.
                    </Text>

                    <TouchableOpacity style={styles.linkItem}>
                      <Text style={styles.linkText}>📄 Terms of Service</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkItem}>
                      <Text style={styles.linkText}>🔒 Privacy Policy</Text>
                    </TouchableOpacity>
                  </ScrollView>

                  <TouchableOpacity style={styles.closeBtn} onPress={() => setShowTermsModal(false)}>
                    <Text style={styles.closeText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <Modal visible={showDeviceModal} transparent animationType="fade">
              <View style={styles.overlay}>
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={48} color="#4CAF50" style={{ marginBottom: 12 }} />
                  <Text style={styles.successTitle}>Device Logged Out</Text>
                  <Text style={styles.successSubtitle}>Your Last session has been securely removed.</Text>
                  <TouchableOpacity
                    style={styles.okBtn}
                    onPress={() => {
                      bottomSheetRef.current?.close();
                      navigation.replace("TabsLayout");
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.okBtnText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </View>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          enableDynamicSizing={false}
          backgroundStyle={{ backgroundColor: '#121212', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
          handleIndicatorStyle={{ backgroundColor: '#666' }}
        >
          <View style={{ flex: 1, padding: 20 }}>
            <Text style={styles.sheetTitle}>Your Active Devices</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {sessions.map((item) => (
                <TouchableOpacity
                  key={item.device_id}
                  style={styles.deviceCard}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.deviceName}>
                      {item.device_name}
                      {item.device_id === deviceId && " (This Device)"}
                    </Text>
                    <Text style={styles.deviceTime}>
                      Last login: {new Date(item.last_login).toLocaleString()}
                    </Text>
                  </View>
                  {item.device_id !== deviceId && (
                    <TouchableOpacity
                      style={styles.logoutBtn}
                      onPress={() => logoutOtherDevice(item.device_id)}
                    >
                      <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </BottomSheet>

      </GestureHandlerRootView>
    </MenuProvider>
  );

};

export default Login;
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },

  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },

  logo: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
  },

  subtitle: {
    color: '#9e9e9e',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 28,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 40,   // add horizontal padding
    borderRadius: 30,
    justifyContent: 'flex-start', // align content to start
    marginBottom: 14,
  },

  googleLogo: {
    width: 22,
    height: 22,
    marginRight: 10,
  },

  googleBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },

  fbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1877F2',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 40,   // add horizontal padding
    borderRadius: 30,
    justifyContent: 'flex-start', // align content to start
  },

  fbBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  footerLink: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    color: '#1a73e8',            // Google-style blue
    fontWeight: '600',
    textDecorationLine: 'underline',
    letterSpacing: 0.3,
  },

  /* Modal styles */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerModalBox: {
    width: '86%',
    backgroundColor: '#1e1e1e',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBox: {
    width: '86%',
    backgroundColor: '#1e1e1e',
    padding: 18,
    borderRadius: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#bbb',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  providerBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  providerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 6,
  },
  modalInput: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#000',
    fontWeight: '700',
  },
  termsModalBox: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  termsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollArea: {
    marginBottom: 20,
  },
  termsDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  linkItem: {
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 15,
    color: '#3498db',
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  deviceName: { color: '#fff', fontWeight: '700' },
  deviceTime: { color: '#aaa', fontSize: 12 },
  logoutBtn: {
    backgroundColor: '#ff4444',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  deviceName: { color: '#fff', fontWeight: '600', fontSize: 16 },
  deviceTime: { color: '#aaa', fontSize: 12, marginTop: 4 },
  logoutBtn: {
    backgroundColor: '#ff4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  successBox: {
    width: '80%',
    backgroundColor: '#1e1e1e',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  successTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  successSubtitle: {
    color: '#bbb',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  okBtn: {
    backgroundColor: '#1a73e8',   // Hotstar-style primary blue
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,             // pill-shaped button
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 20,
  },

  okBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',   // modern CTA feel
  },


});


import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import {
  getAuth,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from '@react-native-firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';

import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
} from '@react-native-firebase/firestore';

const Account = () => {
  const navigation = useNavigation();

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  /* -------------------------------------------------------------------------- */
  /*                                FIRESTORE USER                              */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const authInstance = getAuth();
    const users = authInstance.currentUser;

    if (!users) return;

    const db = getFirestore();

    const userRef = doc(collection(db, 'users'), users.uid);

    const unsubscribe = onSnapshot(userRef, snapshot => {
      if (snapshot.exists) {
        setUserInfo(snapshot.data());
      }
    });

    return unsubscribe;
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                AUTH USER DATA                              */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const currentUser = auth().currentUser;

    if (currentUser?._user) {
      const provider = currentUser._user.providerData?.[0] || {};
      const metadata = currentUser._user.metadata || {};

      const created = metadata.creationTime
        ? new Date(Number(metadata.creationTime))
        : null;

      const lastLogin = metadata.lastSignInTime
        ? new Date(Number(metadata.lastSignInTime))
        : null;

      setUser({
        displayName: provider.displayName || 'Unknown',
        email: provider.email || 'Not available',
        uid: provider.uid || currentUser.uid,
        providerId: provider.providerId || 'unknown',
        createdAt: created
          ? created.toLocaleDateString()
          : 'N/A',
        lastLogin: lastLogin
          ? lastLogin.toLocaleDateString()
          : 'N/A',
      });
    }

    setFetching(false);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                              DELETE ACCOUNT                                */
  /* -------------------------------------------------------------------------- */

  const handleDeleteAccount = () => {
    setTitle('Delete Account');
    setMessage(
      'This will permanently delete your account. This action cannot be undone.'
    );
    setVisible(true);
  };

  const confirmDeleteAccount = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const authInstance = getAuth();
      const current = authInstance.currentUser;

      if (!current) {
        throw new Error('No authenticated user.');
      }

      await GoogleSignin.hasPlayServices();

      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error('No idToken received');
      }

      const credential =
        GoogleAuthProvider.credential(idToken);

      await reauthenticateWithCredential(
        current,
        credential
      );

      await deleteUser(current);

      await AsyncStorage.clear();

      await GoogleSignin.signOut();

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Delete account error 👉', error);

      Alert.alert(
        error.code === 'auth/requires-recent-login'
          ? 'Session expired'
          : 'Error',

        error.code === 'auth/requires-recent-login'
          ? 'Please sign in again to delete your account.'
          : error.message || 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <LinearGradient
      colors={['#050505', '#0b0b0b', '#111']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>

          <Text style={styles.title}>
            Account Details
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {fetching ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator
              size="large"
              color="#ff6a00"
            />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 50,
            }}
          >

            <LinearGradient
              colors={['#ff6a00', '#ee0979']}
              style={styles.heroCard}
            >
              <Image
                resizeMode="cover"
                source={
                  userInfo?.photo
                    ? {
                      uri: userInfo.photo.replace(
                        /s96-c|s100-c|s128-c/,
                        's400-c'
                      ),
                    }
                    : require('../assets/musicphoto.jpg')
                }
                style={styles.avatar}
              />

              <Text style={styles.heroName}>
                {userInfo?.name ||
                  user?.displayName}
              </Text>

              <Text style={styles.heroEmail}>
                {user?.email}
              </Text>

              <View style={styles.premiumBadge}>
                <Ionicons
                  name="diamond"
                  size={16}
                  color="#fff"
                />

                <Text style={styles.badgeText}>
                  Premium Member
                </Text>
              </View>
            </LinearGradient>

            {/* STATS */}

            <View style={styles.statsRow}>
              <View style={styles.statsCard}>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color="#fff"
                />

                <Text style={styles.statsTitle}>
                  Joined
                </Text>

                <Text style={styles.statsValue}>
                  {user?.createdAt}
                </Text>
              </View>

              <View style={styles.statsCard}>
                <Ionicons
                  name="time-outline"
                  size={24}
                  color="#fff"
                />

                <Text style={styles.statsTitle}>
                  Last Login
                </Text>

                <Text style={styles.statsValue}>
                  {user?.lastLogin}
                </Text>
              </View>
            </View>

            {/* ACCOUNT INFO */}

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>
                Account Information
              </Text>

              <View style={styles.infoRow}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#bbb"
                />

                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>
                    Email
                  </Text>

                  <Text style={styles.infoValue}>
                    {user?.email}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#bbb"
                />

                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>
                    Provider
                  </Text>

                  <Text style={styles.infoValue}>
                    Google Authentication
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color="#bbb"
                />

                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>
                    UID
                  </Text>

                  <Text
                    style={styles.infoValue}
                    numberOfLines={1}
                  >
                    {user?.uid}
                  </Text>
                </View>
              </View>
            </View>

            {/* DELETE BUTTON */}

            <TouchableOpacity
              style={styles.btn}
              activeOpacity={0.9}
              onPress={handleDeleteAccount}
            >
              <LinearGradient
                colors={['#ff416c', '#ff4b2b']}
                style={styles.gradientBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />

                <Text style={styles.btnText}>
                  {loading
                    ? 'Deleting...'
                    : 'Delete Account'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* MODAL */}

        <Modal
          transparent
          visible={visible}
          animationType="fade"
        >
          <View style={styles.overlay}>
            <View style={styles.alertBox}>
              <Text style={styles.modalTitle}>
                {title}
              </Text>

              <Text style={styles.modalMessage}>
                {message}
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor:
                        'rgba(255,255,255,0.08)',
                    },
                  ]}
                  onPress={() => setVisible(false)}
                >
                  <Text style={styles.modalBtnText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={loading}
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor:
                        '#ff3b30',
                    },
                  ]}
                  onPress={async () => {
                    setVisible(false);
                    await confirmDeleteAccount();
                  }}
                >
                  <Text style={styles.modalBtnText}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Account;

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

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

  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 18,
  },

  heroCard: {
    marginHorizontal: 18,
    borderRadius: 30,
    paddingVertical: 35,
    alignItems: 'center',

    shadowColor: '#ee0979',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    marginTop: 12,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: '#222',
  },

  heroName: {
    color: '#fff',
    fontSize: 24,
    marginTop: 14,
    fontFamily: 'Poppins-Bold',
  },

  heroEmail: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 5,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },

  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
  },

  badgeText: {
    color: '#fff',
    marginLeft: 8,
    fontFamily: 'Poppins-Bold',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginTop: 18,
  },

  statsCard: {
    width: '48%',
    padding: 18,
    borderRadius: 22,
    alignItems: 'center',

    // 🔥 Better visibility
    backgroundColor: 'rgba(255,255,255,0.06)',

    borderRadius: 28,
    padding: 20,

    // subtle border
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',

    // shadow
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,

  },

  statsTitle: {
    color: '#aaa',
    marginTop: 10,
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },

  statsValue: {
    color: '#fff',
    marginTop: 6,
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },


  infoCard: {
    marginHorizontal: 18,
    marginTop: 18,

    // 🔥 Better visibility
    backgroundColor: 'rgba(255,255,255,0.06)',

    borderRadius: 28,
    padding: 20,

    // subtle border
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',

    // shadow
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoTextWrap: {
    marginLeft: 14,
    flex: 1,
  },

  infoLabel: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },

  infoValue: {
    color: '#fff',
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },

  divider: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 18,
  },

  btn: {
    marginHorizontal: 18,
    marginTop: 30,
  },

  gradientBtn: {
    height: 58,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',

    shadowColor: '#ff416c',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },

  btnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  alertBox: {
    width: 320,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 22,
  },

  modalTitle: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },

  modalMessage: {
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
    fontFamily: 'Poppins-Medium',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },

  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },

  modalBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
});

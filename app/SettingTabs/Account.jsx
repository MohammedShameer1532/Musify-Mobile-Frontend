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
import { getFirestore, collection, doc, onSnapshot } from '@react-native-firebase/firestore';


const Account = () => {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [userInfo, setUserInfo] = useState(null);



  useEffect(() => {
    const authInstance = getAuth();
    const users = authInstance.currentUser;

    if (!users) {
      console.log('❌ No authenticated user');
      return;
    }

    console.log('✅ Firebase UID:', users?.uid);

    const db = getFirestore();
    const userRef = doc(collection(db, 'users'), users?.uid);

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



  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser?._user) {
      const provider = currentUser._user.providerData?.[0] || {};
      const metadata = currentUser._user.metadata || {};

      const created = metadata.creationTime ? new Date(Number(metadata.creationTime)) : null;
      const lastLogin = metadata.lastSignInTime ? new Date(Number(metadata.lastSignInTime)) : null;

      setUser({
        displayName: provider.displayName || 'Unknown',
        email: provider.email || 'Not available',
        // photoURL: provider.photoURL || null,
        uid: provider.uid || currentUser.uid,
        providerId: provider.providerId || 'unknown',
        createdAt: created ? created.toLocaleString() : 'N/A',
        lastLogin: lastLogin ? lastLogin.toLocaleString() : 'N/A',
      });
    }
    setFetching(false);
  }, []);



  const handleDeleteAccount = () => {
    setTitle('Delete Account');
    setMessage('This will permanently delete your account. This action cannot be undone.');
    setVisible(true);
  };



  const confirmDeleteAccount = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const authInstance = getAuth();
      const current = authInstance.currentUser;
      if (!current) throw new Error('No authenticated user.');

      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error('No idToken received');

      const credential = GoogleAuthProvider.credential(idToken);
      await reauthenticateWithCredential(current, credential);
      await deleteUser(current);

      await AsyncStorage.clear();
      await GoogleSignin.signOut();

      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      console.log('Delete account error 👉', error);
      Alert.alert(
        error.code === 'auth/requires-recent-login' ? 'Session expired' : 'Error',
        error.code === 'auth/requires-recent-login'
          ? 'Please sign in again to delete your account.'
          : error.message || 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <LinearGradient colors={['#000000', '#050505']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Account Details</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Loading */}
        {fetching ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1DB954" />
          </View>
        ) : (
          <>
            {/* Profile Card */}
            <View style={styles.card}>
              <View style={styles.planHeader}>
                <View style={styles.badge}>
                  <Ionicons name="person-circle-outline" size={30} color="#fff" />
                </View>
                <Text style={styles.sectionTitles} className='ml-2'>Profile</Text>
              </View>
              <View style={styles.profileRow}>
                <Image
                  source={
                   userInfo?.photo
                      ? { uri: userInfo.photo }
                      : require('../assets/musicphoto.jpg')
                  }
                  style={styles.avatar}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{userInfo?.name || user?.displayName}</Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color="#bbb" style={styles.infoIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Last Login</Text>
                  <Text style={styles.infoValue}>{user?.lastLogin}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color="#bbb" style={styles.infoIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Account Created</Text>
                  <Text style={styles.infoValue}>{user?.createdAt}</Text>
                </View>
              </View>
            </View>

            {/* Plan Card */}
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <Ionicons name="star" size={18} color="#FFD166" style={{ marginRight: 10 }} />
                <Text style={styles.sectionTitle}>Your Plan</Text>
              </View>
              <Text style={styles.planText}>Premium (Active)</Text>
              <Text style={styles.planNote}>Enjoy ad-free listening and offline downloads.</Text>
            </View>

            {/* Delete Account Button */}
            <TouchableOpacity style={styles.btn} onPress={handleDeleteAccount} activeOpacity={0.9}>
              <LinearGradient colors={['#ff5252', '#d32f2f']} style={styles.gradientBtn}>
                <Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.btnText}>{loading ? 'Deleting...' : 'Delete Account'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Confirmation Modal */}
        <Modal transparent visible={visible} animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.alertBox}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalMessage}>{message}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
                  onPress={() => setVisible(false)}
                >
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={loading}
                  style={[
                    styles.modalBtn,
                    { backgroundColor: loading ? '#888' : '#e53935' },
                  ]}
                  onPress={async () => {
                    setVisible(false);
                    await confirmDeleteAccount();
                  }}
                >
                  <Text style={styles.modalBtnText}>{loading ? 'Deleting...' : 'Delete'}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: '#000',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Loading */
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Cards */
  card: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    padding: 6,
    borderRadius: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitles: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  /* Profile */
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#222',
  },
  userName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  userEmail: {
    color: '#bdbdbd',
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
    borderRadius: 2,
  },

  /* Info rows */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    color: '#bbb',
    fontSize: 12,
  },
  infoValue: {
    color: '#ddd',
    fontSize: 14,
    marginTop: 2,
  },

  /* Plan card */
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planText: {
    color: '#FFD166',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  planNote: {
    color: '#bdbdbd',
    fontSize: 13,
    marginTop: 6,
  },

  /* Delete button */
  btn: {
    alignSelf: 'center',
    width: '86%',
    marginTop: 6,
    marginBottom: 30,
  },
  gradientBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#ff5252',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  /* Modal */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: 320,
    padding: 22,
    backgroundColor: 'rgba(30,30,30,0.98)',
    borderRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});

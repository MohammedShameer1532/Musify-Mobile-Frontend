import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navbar from '../common/Navbar';
import useNetwork from '../contextProvider/networkContext';
import Suggestion from '../resultComponent/Suggestion';
import Newrelease from '../resultComponent/Newrelease';
import Tplaylist from '../resultComponent/Tplaylist';
import Radio from '../resultComponent/Radio';
import Podcast from '../resultComponent/Podcast';
import Topartist from '../resultComponent/Topartist';
import { LegendList } from '@legendapp/list';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { doc, getDoc, setDoc } from '@react-native-firebase/firestore';
import Recommendation from '../resultComponent/Recommendation';
import { API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const IndexScreen = () => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const navigation = useNavigation();
  const sections = [
    { id: '1', component: <Recommendation /> },
    { id: '2', component: <Newrelease /> },
    { id: '3', component: <Tplaylist /> },
    { id: '4', component: <Radio /> },
    { id: '5', component: <Podcast /> },
    { id: '6', component: <Topartist /> },
  ];

  useEffect(() => {
    const checkWelcome = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const uid = user.uid;
      const name = user.displayName || 'there';

      const db = getFirestore();
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);

      // 🔥 FIRST TIME USER
      if (!docSnap.exists() || !docSnap.data().isOnboarded) {
        setTitle(`Hi ${name} 👋`);
        setMessage('You’re successfully onboarded!');
        setVisible(true);

        await setDoc(
          userRef,
          { isOnboarded: true },
          { merge: true }
        );

        return;
      }

      // 🔁 RETURNING USER (once per app launch)
      const flagKey = `welcome_shown_${uid}`;
      const alreadyShown = await AsyncStorage.getItem(flagKey);

      if (!alreadyShown) {
        setTitle(`Welcome back ${name} 🎉`);
        setMessage('Glad to see you again!');
        setVisible(true);
        await AsyncStorage.setItem(flagKey, 'true');
      }
    };

    checkWelcome();
  }, []);



  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#3a86ff', '#1a1a2e', '#0d0d0d']} // reversed order
        start={{ x: 0, y: 0 }}   // top
        end={{ x: 0, y: 1 }}     // bottom
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="flex-row items-center justify-between p-2 ml-4 mt-4 mr-4">

            {/* Left section */}
            <View className="flex-row items-center gap-3">
              <Image
                source={require('../assets/LysernFy.png')}
                style={styles.avatar}
                className="w-14 h-14 rounded-md"
              />
              <Text style={styles.header}>
                LysernFy
              </Text>
            </View>

            {/* Right section */}
            <TouchableOpacity onPress={() => navigation.navigate('Qrscanner')} className='mr-5'>
              <MaterialIcons name="qr-code-scanner" color="#fff" size={32} />
            </TouchableOpacity>
          </View>
          <Navbar />
          {/* Custom Modal */}
          <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.alertBox}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setVisible(false)}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Content */}
          <LegendList
            data={sections}
            estimatedItemSize={150}
            renderItem={({ item }) => item.component}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={{ paddingBottom: 90, marginTop: 0 }}
            ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  offlineContainer: {
    padding: 20
  },

  offlineCard: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 14,
    borderRadius: 24,

    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },

  offlineVideo: {
    width: 65,
    height: 65,
    marginRight: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },

  offlineTitle: {
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },

  offlineMessage: {
    fontFamily: 'Poppins-Medium',
    color: '#D8E6FF',
    fontSize: 13,
    marginTop: 3,
  },

  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },
  header: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: 'white',
    letterSpacing: 0.2
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  message: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  button: {
    backgroundColor: '#6200ee',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

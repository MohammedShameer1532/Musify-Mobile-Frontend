import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navbar from '../common/Navbar';
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
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Trending from '../resultComponent/Trending';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const BASE_WIDTH = 360;

const scale = (size) => (width / BASE_WIDTH) * size;

const IndexScreen = () => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const navigation = useNavigation();
  const sections = [
    { id: '1', component: <Recommendation /> },
    { id: '2', component: <Trending /> },
    { id: '3', component: <Newrelease /> },
    { id: '4', component: <Tplaylist /> },
    { id: '5', component: <Topartist /> },//
    { id: '7', component: <Podcast /> },//
    { id: '8', component: <Radio /> },
  ];



  useEffect(() => {
    const checkWelcome = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) return;

        const uid = user.uid;
        const name = user.displayName || 'there';

        const db = getFirestore();
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);

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

        const flagKey = `welcome_shown_${uid}`;
        const alreadyShown = await AsyncStorage.getItem(flagKey);

        if (!alreadyShown) {
          setTitle(`Welcome back ${name} 🎉`);
          setMessage('Glad to see you again!');
          setVisible(true);

          await AsyncStorage.setItem(flagKey, 'true');
        }

      } catch (error) {
        console.log('Welcome check error:', error);
      }
    };

    checkWelcome();
  }, []);


  return (
    <>
      <StatusBar
        backgroundColor="#000000"
        barStyle="light-content"
        translucent={false}
      />
      <LinearGradient
        colors={['#3a86ff', '#1a1a2e', '#0d0d0d']} // reversed order
        start={{ x: 0, y: 0 }}   // top
        end={{ x: 0, y: 1 }}     // bottom
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
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
                />
                <Text style={styles.header} className='font-extrabold'>
                  LysernFy
                </Text>
              </View>

              {/* Right section */}
              <TouchableOpacity onPress={() => navigation.navigate('Qrscanner')} className='mr-5'>
                <MaterialIcons name="qr-code-scanner" color="#fff" size={scale(30)} />
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
              showsVerticalScrollIndicator={false}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  offlineContainer: {
    padding: 20
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(6),
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
    fontSize: scale(26),
    color: 'white',
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

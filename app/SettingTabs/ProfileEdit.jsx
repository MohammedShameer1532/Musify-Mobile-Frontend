import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAuth, updateProfile } from '@react-native-firebase/auth';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';

const ProfileEdit = ({ navigation }) => {
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  const [username, setUsername] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Invalid name', 'Username cannot be empty');
      return;
    }

    try {
      setLoading(true);

      // 🔹 Update Firebase Auth
      await updateProfile(user, {
        displayName: username,
      });

      // 🔹 Update Firestore (realtime app profile)
      const db = getFirestore();
      const userRef = doc(collection(db, 'users'), user.uid);
      await setDoc(userRef,
        {
          name: username,
          updatedAt: serverTimestamp(),
        },
        { merge: true });

      Alert.alert('Success', 'Username updated successfully');
      navigation.goBack();
    } catch (error) {
      console.log('Update username error 👉', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Username</Text>
        <View style={{ width: 40 }} />
      </View>
      <View className='inpit'>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Enter new username"
          placeholderTextColor="#888"
          style={styles.input}
        />
      </View>
      <TouchableOpacity onPress={handleSave} disabled={loading}>
        <LinearGradient
          colors={['#ff6a00', '#ee0979']}
          style={styles.btn}
        >
          <Text style={styles.btnText}>
            {loading ? 'Saved' : 'Save'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ProfileEdit;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    justifyContent: 'space-between',
    marginTop: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    marginTop: 50,
    marginVertical: 20,      // top & bottom space
    marginHorizontal: 18,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',  // top & bottom space
    marginHorizontal: 18,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',     // top & bottom space
    marginHorizontal: 18,
  },
});

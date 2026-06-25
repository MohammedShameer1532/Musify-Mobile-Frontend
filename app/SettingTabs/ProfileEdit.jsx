import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { getAuth, updateProfile } from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';

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
      console.error('Update username error 👉', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getHighQualityGooglePhoto = (url) => {
    if (!url) return null;
    return url.replace(/s96-c|s100-c|s128-c/, 's400-c');
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Top Gradient */}
      <LinearGradient
        colors={['#ff6a00', '#ee0979']}
        style={styles.topSection}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image
              source={{ uri: getHighQualityGooglePhoto(user?.photoURL) }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.editIcon}>
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Edit Profile</Text>
        <Text style={styles.subHeading}>
          Update your username and personalize your profile
        </Text>
      </LinearGradient>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#999"
            style={{ marginRight: 10 }}
          />

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            placeholderTextColor="#777"
            style={styles.input}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ff6a00', '#ee0979']}
            style={styles.btn}
          >
            {loading ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.btnText}>Changes Saved</Text>
              </>
            ) : (
              <>
                <Text style={styles.btnText}>Save Changes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProfileEdit;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0b',
  },

  topSection: {
    height: 380,
    alignItems: 'center',
    paddingTop: 20,
  },

  backBtn: {
    position: 'absolute',
    top: 20,
    left: 18,
    width: 35,
    height: 35,
    borderRadius: 20,

    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  avatarContainer: {
    marginTop: 40,
    position: 'relative',
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#fff',
  },

  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#111',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  heading: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    marginTop: 18,
  },

  subHeading: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },

  card: {
    backgroundColor: '#151515',
    marginHorizontal: 18,
    marginTop: -80,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  label: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'Poppins-Medium',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2d2d2d',
    marginBottom: 28,
  },

  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: 55,
    fontFamily: 'Poppins-Medium',
  },

  btn: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  btnText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Poppins-Bold',
  },
});
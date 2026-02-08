// App.js
import React, {useEffect} from 'react';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {View, Text, Button, TouchableOpacity} from 'react-native';
import auth from '@react-native-firebase/auth';

export default function App() {
  useEffect(() => {
    // Configure Google Sign-In once on app start
    GoogleSignin.configure({
      webClientId:
        '816091965671-29t50qk9j4re96lf9eatibdj3ilj65nv.apps.googleusercontent.com', // replace with actual ID
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const {idToken} = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const user = await auth().signInWithCredential(googleCredential);
      console.log('Signed in user:', user.user);
    } catch (error) {
      console.log('Google sign-in error:', error);
    }
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Welcome to Musify</Text>
      <Button title="Sign in with Google" onPress={signInWithGoogle} />
      <TouchableOpacity
        onPress={signInWithGoogle}
        style={{padding: 12, backgroundColor: '#4285F4', borderRadius: 6}}>
        <Text style={{color: 'white', fontWeight: 'bold'}}>
          Sign in with Google
        </Text>
      </TouchableOpacity>
    </View>
  );
}

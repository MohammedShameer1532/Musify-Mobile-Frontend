import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId:
      '816091965671-29t50qk9j4re96lf9eatibdj3ilj65nv.apps.googleusercontent.com',
    offlineAccess: false,
  });
};

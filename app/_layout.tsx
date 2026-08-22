import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {NativeEventEmitter, NativeModules, StatusBar} from 'react-native';
import 'react-native-reanimated';
import {SearchContext, SearchProvider} from './contextProvider/searchContext';
import {useColorScheme} from 'react-native';
import '../global.css';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TabsLayout from './(tabs)/TabsLayout';
import Search from './common/Search';
import Song from './resultComponent/Song';
import Artist from './resultComponent/Artist';
import Album from './resultComponent/Album';
import Playlist from './resultComponent/Playlist';
import Tresult from './resultComponent/Tresult';
import Suggestion from './resultComponent/Suggestion';
import Tsongs from './resultComponent/Tsongs';
import Sresult from './resultComponent/Sresult';
import Rresult from './resultComponent/Rresult';
import Podresult from './resultComponent/Podresult';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from 'react-native-track-player';
import {useContext, useEffect, useState} from 'react';
import Tartist from './resultComponent/Tartist';
import Artistsongs from './resultComponent/Artistsongs';
import Outersong from './resultComponent/Outersong';
import {navigate, navigationRef} from './resultComponent/RootNavigation';
import {configureGoogleSignIn} from './firebase/googleAuth';
import {useAuth} from './firebase/useAuth';
import Login from './(tabs)/Login';
import Setting from './(tabs)/Setting';
import Account from './SettingTabs/Account';
import ProfileEdit from './SettingTabs/ProfileEdit';
import Share from './SettingTabs/Share';
import Aboutus from './SettingTabs/Aboutus';
import Donateus from './SettingTabs/Donateus';
import SocialLink from './SettingTabs/SocialLink';
import Contactus from './SettingTabs/Contactus';
import HelpSupport from './SettingTabs/HelpSupport';
import Recommendation from './resultComponent/Recommendation';
import {getAuth, signOut} from '@react-native-firebase/auth';
import DeviceInfo from 'react-native-device-info';
import axios from 'axios';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {API_URL} from '@env';
import Likedsong from './(tabs)/screens/Likedsong';
import Download from './(tabs)/screens/Download';
import AddPlaylist from './(tabs)/screens/AddPlaylist';
import {BottomSheetProvider} from './contextProvider/bottomSheetContext';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Viewplaylist from './(tabs)/screens/Viewplaylist';
import {MenuProvider} from 'react-native-popup-menu';
import Qrsheet from './common/Qrsheet';
import Scansheet from './common/Scansheet';
import Qrscanner from './common/Qrscanner';
import BootSplash from 'react-native-bootsplash';
import General from './SettingTabs/General';
import Musiclang from './SettingTabs/Musiclang';
import Equilizer from './SettingTabs/Equilizer';
import OfflineBanner from './common/OfflineBanner';
import {initDatabase} from './Database/downloadRepository';
import Trending from './resultComponent/Trending';
import {KeyboardProvider} from 'react-native-keyboard-controller';
const Stack = createNativeStackNavigator();

/* -------------------- App Navigator -------------------- */
function AppNavigator() {
  const {setOuterdata, setSelectedLanguage} = useContext(SearchContext);
  const {user, loading} = useAuth();
  const [checkingLanguage, setCheckingLanguage] = useState(true);
  const [hasLanguage, setHasLanguage] = useState(false);

  useEffect(() => {
    if (!loading && !checkingLanguage) {
      BootSplash.hide({fade: true});
    }
  }, [loading, checkingLanguage]);

  // TrackPlayer setup
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        await TrackPlayer.setupPlayer();

        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
            Capability.JumpForward,
            Capability.JumpBackward,
          ],

          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
          ],

          notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
            Capability.JumpForward,
            Capability.JumpBackward,
          ],

          android: {
            appKilledPlaybackBehavior:
              AppKilledPlaybackBehavior.ContinuePlayback,
          },

          forwardJumpInterval: 10,
          backwardJumpInterval: 10,
        });
      } catch (e) {
        console.error('TrackPlayer already initialized', e);
      }
    };

    if (isMounted) {
      setup();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Audio intent listener
  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(
      NativeModules.DeviceEventManagerModule,
    );

    const subscription = eventEmitter.addListener(
      'OpenAudioFile',
      async meta => {
        try {
          await TrackPlayer.reset();
          await TrackPlayer.add({
            url: meta.uri,
            title: meta.title || 'Unknown',
            artist: meta.artist || 'Unknown',
            album: meta.album || '',
            artwork: meta.artwork,
          });

          await TrackPlayer.play();
          setOuterdata(meta);
          if (navigationRef.isReady()) {
            navigationRef.navigate('Outersong', {metadata: meta});
          } else {
            console.error('Navigation not ready yet');
          }
        } catch (e) {
          console.error('Error playing file:', e);
        }
      },
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const users = getAuth().currentUser;
        if (!users) return;

        const deviceId = await DeviceInfo.getUniqueId();

        const res = await axios.post(`${API_URL}/api/session/validate`, {
          userId: users.uid,
          deviceId,
        });

        if (!res.data.valid) {
          await signOut(getAuth());
          navigationRef.reset({
            index: 0,
            routes: [{name: 'Login'}],
          });
        }
      } catch (err) {
        console.error('Session check error:', err);
      }
    };

    checkSession();

    const interval = setInterval(checkSession, 5000);

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // CHECK USER LANGUAGE
  // =====================================================

  useEffect(() => {
    const checkLanguagePreference = async () => {
      // Firebase auth is still loading
      if (loading) {
        return;
      }

      // No logged-in user
      if (!user) {
        setHasLanguage(false);
        setCheckingLanguage(false);
        return;
      }

      try {
        setCheckingLanguage(true);

        console.log('🌐 Checking language for:', user.uid);

        const response = await axios.get(
          `${API_URL}/api/preferences/${encodeURIComponent(user.uid)}`,
        );

        console.log('🌐 Language API response:', response?.data);

        const language =
          response?.data?.music_language ||
          response?.data?.language ||
          response?.data?.data?.music_language ||
          response?.data?.data?.language;

        if (language) {
          // =============================================
          // LANGUAGE EXISTS
          // =============================================

          console.log('✅ Language already selected:', language);

          setSelectedLanguage(language);
          setHasLanguage(true);
        } else {
          // =============================================
          // NO LANGUAGE
          // =============================================

          console.log('⚠️ No language found. Opening Musiclang.');

          setSelectedLanguage('');
          setHasLanguage(false);
        }
      } catch (error) {
        console.log(
          '❌ Language API error:',
          error?.response?.status,
          error?.response?.data,
        );

        // 404 means user has no preference
        if (error?.response?.status === 404) {
          setSelectedLanguage('');
          setHasLanguage(false);
        } else {
          /*
           * IMPORTANT:
           *
           * If the API/server is temporarily unavailable,
           * don't send an existing user to Musiclang.
           *
           * You can change this if you want.
           */
          setHasLanguage(true);
        }
      } finally {
        setCheckingLanguage(false);
      }
    };

    checkLanguagePreference();
  }, [loading, user, setSelectedLanguage]);

  // =====================================================
  // DON'T CREATE NAVIGATOR UNTIL EVERYTHING IS READY
  // =====================================================

  if (loading || (user && checkingLanguage)) {
    return null;
  }

  // =====================================================
  // SELECT INITIAL SCREEN
  // =====================================================

  const initialRoute = !user
    ? 'Login'
    : hasLanguage
    ? 'TabsLayout'
    : 'Musiclang';

  console.log('🚀 Initial route:', initialRoute);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="TabsLayout" component={TabsLayout} />
        <Stack.Screen name="Search" component={Search} />
        <Stack.Screen name="Song" component={Song} />
        <Stack.Screen name="Artist" component={Artist} />
        <Stack.Screen name="Album" component={Album} />
        <Stack.Screen name="Playlist" component={Playlist} />
        <Stack.Screen name="Tresult" component={Tresult} />
        <Stack.Screen name="Suggestion" component={Suggestion} />
        <Stack.Screen name="Tsongs" component={Tsongs} />
        <Stack.Screen name="Sresult" component={Sresult} />
        <Stack.Screen name="Rresult" component={Rresult} />
        <Stack.Screen name="Podresult" component={Podresult} />
        <Stack.Screen name="Tartist" component={Tartist} />
        <Stack.Screen name="Artistsongs" component={Artistsongs} />
        <Stack.Screen name="Outersong" component={Outersong} />
        <Stack.Screen name="Setting" component={Setting} />
        <Stack.Screen name="Account" component={Account} />
        <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
        <Stack.Screen name="Share" component={Share} />
        <Stack.Screen name="Aboutus" component={Aboutus} />
        <Stack.Screen name="Donateus" component={Donateus} />
        <Stack.Screen name="SocialLink" component={SocialLink} />
        <Stack.Screen name="Contactus" component={Contactus} />
        <Stack.Screen name="HelpSupport" component={HelpSupport} />
        <Stack.Screen name="Recommendation" component={Recommendation} />
        <Stack.Screen name="Likedsong" component={Likedsong} />
        <Stack.Screen name="AddPlaylist" component={AddPlaylist} />
        <Stack.Screen name="Viewplaylist" component={Viewplaylist} />
        <Stack.Screen name="Qrscanner" component={Qrscanner} />
        <Stack.Screen name="Scansheet" component={Scansheet} />
        <Stack.Screen name="General" component={General} />
        <Stack.Screen name="Musiclang" component={Musiclang} />
        <Stack.Screen name="Equilizer" component={Equilizer} />
        <Stack.Screen name="OfflineBanner" component={OfflineBanner} />
        <Stack.Screen name="Download" component={Download} />
        <Stack.Screen name="Trending" component={Trending} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

/* -------------------- Root Layout -------------------- */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        configureGoogleSignIn();
        await initDatabase();

        console.log('✅ App database initialized');
      } catch (error) {
        console.error('❌ App initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      {/* <KeyboardProvider> */}
      <SearchProvider>
        <GestureHandlerRootView style={{flex: 1}}>
          <BottomSheetModalProvider>
            <MenuProvider skipInstanceCheck>
              <ThemeProvider
                value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <BottomSheetProvider>
                  {/* <Testing /> */}
                  <Qrsheet />
                  <OfflineBanner />
                  <AppNavigator />
                </BottomSheetProvider>
              </ThemeProvider>
            </MenuProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </SearchProvider>
      {/* </KeyboardProvider> */}
    </SafeAreaProvider>
  );
}

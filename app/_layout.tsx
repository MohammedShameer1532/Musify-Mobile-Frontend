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
  RatingType,
} from 'react-native-track-player';
import {useContext, useEffect} from 'react';
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
import Testing from './common/Testing';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Viewplaylist from './(tabs)/screens/Viewplaylist';
import {MenuProvider} from 'react-native-popup-menu';
import Qrsheet from './common/Qrsheet';
import Scansheet from './common/Scansheet';
import Qrscanner from './common/Qrscanner';
const Stack = createNativeStackNavigator();

/* -------------------- App Navigator -------------------- */
function AppNavigator() {
  const {setOuterdata} = useContext(SearchContext);
  const {user, loading} = useAuth();
  console.log('api loggg', API_URL);

  // TrackPlayer setup
  useEffect(() => {
    TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
    }).then(() => {
      TrackPlayer.updateOptions({
        stopWithApp: false,

        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SetRating, // 👈 required
          Capability.SeekTo,
          Capability.JumpForward,
          Capability.JumpBackward,
        ],

        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SetRating, // 👈 required
          Capability.SeekTo,
          Capability.JumpForward,
          Capability.JumpBackward,
        ],
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
        },
        ratingType: RatingType.Heart,
        progressUpdateEventInterval: 2,
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        forwardJumpInterval: 10,
        backwardJumpInterval: 10,
      });
    });
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
            console.log('Navigation not ready yet');
          }
        } catch (e) {
          console.log('Error playing file:', e);
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
        console.log('Session check error:', err);
      }
    };

    checkSession();

    const interval = setInterval(checkSession, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName={user ? 'TabsLayout' : 'Login'}>
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
        <Stack.Screen name="Download" component={Download} />
        <Stack.Screen name="Viewplaylist" component={Viewplaylist} />
        <Stack.Screen name="Qrscanner" component={Qrscanner} />
        <Stack.Screen name="Scansheet" component={Scansheet} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

/* -------------------- Root Layout -------------------- */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  return (
    <SafeAreaProvider>
      <SearchProvider>
        <GestureHandlerRootView style={{flex: 1}}>
          <BottomSheetModalProvider>
            <MenuProvider skipInstanceCheck>
              <ThemeProvider
                value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <BottomSheetProvider>
                  {/* <Testing /> */}
                  <Qrsheet />
                  <AppNavigator />
                </BottomSheetProvider>
              </ThemeProvider>
            </MenuProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </SearchProvider>
    </SafeAreaProvider>
  );
}

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
import TrackPlayer, {Capability} from 'react-native-track-player';
import {useContext, useEffect} from 'react';
import Tartist from './resultComponent/Tartist';
import Artistsongs from './resultComponent/Artistsongs';
import Outersong from './resultComponent/Outersong';
import {navigate, navigationRef} from './resultComponent/RootNavigation';

const Stack = createNativeStackNavigator();

/* -------------------- App Navigator -------------------- */
function AppNavigator() {
  const {setOuterdata} = useContext(SearchContext);

  // TrackPlayer setup
  useEffect(() => {
    TrackPlayer.setupPlayer().then(() => {
      TrackPlayer.updateOptions({
        stopWithApp: true,
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.JumpForward,
          Capability.JumpBackward,
        ],
        jumpInterval: 10,
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
          navigate('Outersong', {metadata: meta});
        } catch (e) {
          console.log('Error playing file:', e);
        }
      },
    );

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
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
      </Stack.Navigator>

      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

/* -------------------- Root Layout -------------------- */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SearchProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppNavigator />
      </ThemeProvider>
    </SearchProvider>
  );
}

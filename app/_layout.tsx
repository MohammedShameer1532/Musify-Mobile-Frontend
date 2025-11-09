import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {StatusBar} from 'react-native';
import 'react-native-reanimated';
import {SearchProvider} from './contextProvider/searchContext';
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


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const Stack = createNativeStackNavigator();

  return (
    <SearchProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="TabsLayout"
              component={TabsLayout}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Search"
              component={Search}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Song"
              component={Song}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Artist"
              component={Artist}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Album"
              component={Album}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Playlist"
              component={Playlist}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Tresult"
              component={Tresult}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Suggestion"
              component={Suggestion}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Tsongs"
              component={Tsongs}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Sresult"
              component={Sresult}
              options={{headerShown: false}}
            />
             <Stack.Screen
              name="Rresult"
              component={Rresult}
              options={{headerShown: false}}
            />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </ThemeProvider>
    </SearchProvider>
  );
}

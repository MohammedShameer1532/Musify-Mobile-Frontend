/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import RootLayout from './app/_layout';
import {name as appName} from './app.json';
import TrackPlayer from 'react-native-track-player';
import {PlaybackService} from './PlaybackService';

AppRegistry.registerComponent(appName, () => RootLayout);
TrackPlayer.registerPlaybackService(() => PlaybackService);

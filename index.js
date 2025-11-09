/**
 * @format
 */

import {AppRegistry} from 'react-native';
import RootLayout from './app/_layout';
import {name as appName} from './app.json';
import 'react-native-gesture-handler';
import { PlaybackService } from './PlaybackService';
import TrackPlayer from 'react-native-track-player';


AppRegistry.registerComponent(appName, () => RootLayout);
TrackPlayer.registerPlaybackService(() => PlaybackService);

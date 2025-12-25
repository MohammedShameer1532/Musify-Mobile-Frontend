import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { NativeModules } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Music from '../common/Music';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TrackPlayer, { Capability, Event, useActiveTrack } from 'react-native-track-player';
import { MenuProvider } from 'react-native-popup-menu';
import Entypo from "react-native-vector-icons/Entypo";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { SearchContext } from '../contextProvider/searchContext';
import Localsearch from '../common/Localsearch';


const { LocalAudio } = NativeModules;


// ====================== Song Item Component ======================
const SongItem = React.memo(({ song, currentSong, handlePlay }) => {

  return (
    <View className="flex-row mt-5 ml-5 items-center justify-between pr-5 w-full">
      <TouchableOpacity onPress={() => handlePlay(song)}
        className="flex-1">
        <View className="flex-row items-center justify-between w-full">

          {/* Left Section: Image + Text */}
          <View className="flex-row items-center flex-1">
            {/* Song Image */}
            {song?.artist === "<unknown>" ? (
              <Image
                source={require("../assets/musicphoto.jpg")}
                className="rounded-xl w-14 h-14"
                resizeMode="cover"
              />
            ) : (
              <Image
                source={{ uri: song.artwork }}
                className="rounded-xl w-14 h-14"
                resizeMode="cover"
              />
            )}

            {/* Space between image and text */}
            <View className="ml-3 flex-1">
              {/* Title + Playing Animation in a Row */}
              <View className="flex-row items-center">
                {/* Playing Animation: only shows for current song */}
                {currentSong?.id === song?.id && (
                  <LottieView
                    source={require("../assets/playing.json")}
                    style={{ width: 20, height: 18, marginRight: 6 }}
                    autoPlay
                    loop
                  />
                )}

                {/* Song Title */}
                <Text
                  style={{
                    color: currentSong?.id === song.id ? "limegreen" : "white",
                  }}
                  className="text-base font-normal"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {song?.title ? song.title.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
                </Text>
              </View>

              {/* Artist stays below the title */}
              <Text
                className="text-gray-500 text-sm font-medium mt-1"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {song?.artist ? song.artist.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
              </Text>
            </View>
          </View>
          {/* Right Section: Lottie + Play Button */}
          <View className="flex-row items-center">
            <View className="pr-5">
              {currentSong?.id === song?.id && (
                <LottieView
                  source={require("../assets/music.json")}
                  style={{ width: 60, height: 60 }}
                  autoPlay
                  loop
                />
              )}
            </View>
            <View className="mr-3 w-12 h-12 bg-[#1DB954] rounded-full items-center justify-center shadow-lg">
              <FontAwesome
                name="play"
                size={20}
                color="black"
                style={{ marginLeft: 4 }}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});
const LocalMusic = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setSongsList } = useContext(SearchContext);
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["100%"]);
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const [showUp, setShowUp] = useState(false);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const currentSong = useActiveTrack();
  console.log('activetrack', currentSong);



  useEffect(() => {
    const fetchAudio = async () => {
      try {
        setLoading(true);
        const permission = Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(permission);

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          const files = await LocalAudio.getAudioFiles();
          setAudioFiles(files);
          setFilteredFiles(files);
          setSongsList(files);
          console.log('files', files);

        } else {
          setError('Permission denied');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false); // ✅ cleaner than setTimeout
      }
    };

    fetchAudio();
  }, []);


  useEffect(() => {
    async function setupPlayer() {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        stopWithApp: true,
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.JumpForward,
          Capability.JumpBackward,
        ],
        jumpInterval: 10,
      });
    }

    setupPlayer();
  }, []);



  const handlePlay = async (song) => {
    if (!song) return;
    // If same song, just open sheet
    if (currentSong?.id === song.id) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    try {
      const index = audioFiles.findIndex(s => s.id === song.id);
      if (index === -1) return;

      await TrackPlayer.reset();

      // Build queue in correct order
      const orderedQueue = [
        audioFiles[index],                       // clicked song first
        ...audioFiles.slice(index + 1),          // songs after clicked
        ...audioFiles.slice(0, index)            // songs before clicked
      ].map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        url: s.path,
        artwork: s.artwork,
        hasArtwork: true
      }));

      // Add queue
      await TrackPlayer.add(orderedQueue);

      // Play first (clicked song)
      await TrackPlayer.skip(0);
      sheetRef.current?.snapToIndex(0);
      await TrackPlayer.play();


    } catch (err) {
      console.log("Error:", err);
    }
  };




  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowUp(offsetY > 200); // show only after scrolling 200px
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <MenuProvider>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={['#1a1a1a', '#000']} style={styles.background}>
          <SafeAreaView style={styles.safeArea} className="flex-1 ">
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 35 }} className='w-10 mt-5'>
              <Ionicons name="arrow-back" size={30} color="white" style={styles.backIcon} className="ml-2" />
            </TouchableOpacity>
            <View className="px-5">
              <View className="flex-row items-center justify-start gap-3 px-4 py-4 bg-purple-900 rounded-md">
                <MaterialCommunityIcons name="music-box" size={40} color="white" />
                <Text className="text-[22px] font-semibold text-white flex-1">
                  On This Device Songs
                </Text>
              </View>
            </View>
            <View>
              <Localsearch audioFiles={audioFiles} setFilteredFiles={setFilteredFiles} />
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
            ) : (
              <View className='flex-1'>
                <FlatList
                  ref={flatListRef}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  data={filteredFiles}
                  keyExtractor={(item) => item.id}
                  initialNumToRender={10}     // render only a few rows first
                  maxToRenderPerBatch={10}
                  windowSize={7}
                  removeClippedSubviews
                  renderItem={({ item }) => (
                    <SongItem
                      song={item}
                      currentSong={currentSong}
                      handlePlay={handlePlay}
                    />
                  )}
                  contentContainerStyle={{ paddingBottom: 90 }}
                />
                {!isSheetOpen && showUp && (
                  <TouchableOpacity
                    style={styles.upIcon}
                    onPress={scrollToTop}
                    activeOpacity={0.7}
                  >
                    <AntDesign name="upcircle" size={45} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <BottomSheet
              ref={sheetRef}
              index={-1}
              snapPoints={snapPoints}
              enableDynamicSizing={false}
              enablePanDownToClose={true}
              handleIndicatorStyle={{
                backgroundColor: 'grey',
                width: 45,
                height: 5,
                borderRadius: 2,
              }}
              backgroundStyle={{
                backgroundColor: 'rgba(30, 30, 30, 0.95)',
              }}
              onChange={(index) => setIsSheetOpen(index >= 0)}
            >
              <TouchableOpacity onPress={() => sheetRef.current?.close()} style={{ width: 50 }} className='w-10 mt-0 ml-5'>
                <Entypo name="chevron-thin-down" size={30} color="white" style={styles.backIcon} className="ml-5" />
              </TouchableOpacity>
              {currentSong && (
                <View style={styles.songContainer}>
                  <Image
                    source={{ uri: currentSong?.artwork }}
                    style={styles.songImage}
                    className="rounded-xl"
                    resizeMode="cover"
                  />
                  <View style={styles.textContainer}>
                    <Text style={styles.songTitle}>
                      {currentSong?.title ? currentSong?.title?.replace(/\s*\(.*?\)\s*/g, '') : 'Unknown'}
                    </Text>
                    <Text style={styles.artist}>
                      {currentSong?.artist ? currentSong?.artist?.split(',')[0].trim().replace(/\s*\(.*?\)\s*/g, '') : 'Unknown Artist'}
                    </Text>
                  </View>
                  <Music />
                </View>
              )}
            </BottomSheet>
          </SafeAreaView>
        </LinearGradient>
      </GestureHandlerRootView >
    </MenuProvider >
  );
};

export default LocalMusic;

const styles = StyleSheet.create({
  upIcon: {
    position: "absolute",
    bottom: 100,
    right: 10,
    zIndex: 10,
  },
  lottie: {
    position: 'absolute',
    right: 50,
  },

  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backIcon: {
    marginLeft: 10,
    marginTop: 10,
  },
  songContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  textContainer: {
    alignSelf: 'flex-start',
    paddingLeft: 30,
    marginTop: 35,
  },
  songImage: {
    width: 290,
    height: 290,
  },
  songTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: 'white',
    marginTop: 10,
  },
  artist: {
    fontSize: 14,
    color: 'grey',
    marginTop: 5,
  },
  icons: {
    paddingTop: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    letterSpacing: 10,
    width: 100,
    position: 'absolute',
    marginLeft: 320,
  },
});

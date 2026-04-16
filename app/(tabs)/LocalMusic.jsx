import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated
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
import Entypo from "react-native-vector-icons/Entypo";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { SearchContext } from '../contextProvider/searchContext';
import Localsearch from '../common/Localsearch';
import { LegendList } from '@legendapp/list';
import Icon from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';

const { LocalAudio } = NativeModules;



// ====================== Modern Song Item ======================
const SongItem = React.memo(({ song, currentSong, handlePlay }) => {
  const isPlaying = currentSong?.id === song?.id;

  return (
    <TouchableOpacity onPress={() => handlePlay(song)} activeOpacity={0.8} style={styles.songCard}>
      <View style={styles.songLeft}>
        {song?.artist === "<unknown>" ? (
          <Image
            source={require("../assets/musicphoto.jpg")}
            className="rounded-xl w-14 h-14"
            resizeMode="cover"
            style={[styles.songImage, { borderColor: isPlaying ? "#1DB954" : "transparent" }]}
          />
        ) : (
          <Image
            source={{ uri: song.artwork }}
            className="rounded-xl w-14 h-14"
            resizeMode="cover"
            style={[styles.songImage, { borderColor: isPlaying ? "#1DB954" : "transparent" }]}
          />
        )}
        <View style={styles.songText} >
          <View className="flex-row items-center">
            {/* Playing Animation: only shows for current song */}
            {currentSong?.id === song?.id && (
              <LottieView
                source={require("../assets/playing.json")}
                style={{ width: 20, height: 20, marginRight: 5 }}
                autoPlay
                loop
              />
            )}

            {/* Song Title */}
            <Text
              style={[styles.songTitle, isPlaying && { color: "#1DB954" }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {song?.title ? song.title.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
            </Text>
          </View>
          <Text style={styles.artist} numberOfLines={1}>
            {song?.artist ? song.artist.replace(/\s*\(.*?\)\s*/g, "") : "Unknown Artist"}
          </Text>
        </View>
      </View>

      <View style={styles.songRight}>
        <View style={styles.playButton}>
          <FontAwesome
            name="play"
            size={20}
            color="black"
            style={{ marginLeft: 4 }}
          />
        </View>
        <View style={{ alignItems: 'flex-end', padding: 5, marginRight: -10 }}>
          <Menu>
            <MenuTrigger>
              <Icon name="dots-three-vertical" size={24} color="white" />
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: {
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: '#1f1f1f',
                },
              }}
            >
              <MenuOption >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                  <MaterialIcons name="lyrics" size={18} color="white" />
                  <Text style={{ color: 'white', fontSize: 14 }}>Lyrics</Text>
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
      </View>
    </TouchableOpacity>
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

  console.log(currentSong?.artwork?.slice(0, 30));




  function AnimatedIcon({ children, focused }) {
    const scale = new Animated.Value(focused ? 1.15 : 1);
    const opacity = new Animated.Value(focused ? 1 : 0.7);

    useEffect(() => {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: focused ? 1.15 : 1,
          useNativeDriver: true,
          friction: 5,
        }),
        Animated.timing(opacity, {
          toValue: focused ? 1 : 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, [focused]);

    return (
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        {children}
      </Animated.View>
    );
  }


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

  const handlePlay = useCallback(async (song) => {
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
        hasArtwork: true,
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
  }, [audioFiles, currentSong]);




  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowUp(offsetY > 200); // show only after scrolling 200px
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <MenuProvider skipInstanceCheck>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={['#050505', '#050505']} style={styles.background}>
          <SafeAreaView  className="flex-1">
            <View style={styles.header}>
              {/* Back Button on the left */}
              <AnimatedIcon focused={true}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={25} color="white"  />
                </TouchableOpacity>
              </AnimatedIcon>

              {/* Centered Logo + Title */}
              <View style={styles.centerContainer}>

                <Text style={styles.headerTitle}>Local Music</Text>
              </View>

              {/* Spacer on the right to balance layout */}
              <View style={{ width: 40 }} />
            </View>
            <Localsearch audioFiles={audioFiles} setFilteredFiles={setFilteredFiles} />
            {loading ? (
              <LottieView
                source={require("../assets/music.json")}
                style={{ width: 40, height: 40 }}
                autoPlay
                loop
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}
              />
            ) : (
              <View className='flex-1'>
                <LegendList
                  data={filteredFiles}
                  keyExtractor={(item) => item.id}

                  // ✅ Fixed height optimization (MOST IMPORTANT)
                  estimatedItemSize={96}

                  // ✅ Rendering window
                  windowSize={10}
                  drawDistance={1200}

                  // ✅ Initial render
                  initialNumToRender={8}
                  maxToRenderPerBatch={8}

                  // ✅ Memory optimization
                  recycleItems
                  removeClippedSubviews={true}

                  // ✅ Smooth scrolling
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator={false}

                  // ✅ Padding (important for bottom sheet overlap)
                  contentContainerStyle={{
                    padding: 15,
                    paddingBottom: 140,
                  }}

                  // ✅ Re-render ONLY when song changes
                  extraData={currentSong?.id}

                  ref={flatListRef}
                  onScroll={handleScroll}

                  renderItem={({ item }) => (
                    <SongItem
                      song={item}
                      currentSong={currentSong}
                      handlePlay={handlePlay}
                    />
                  )}
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
                  {currentSong?.artist !== "<unknown>" ? (
                    <Image
                      source={{ uri: currentSong?.artwork }}
                      style={styles.songImages}
                      className="rounded-xl"
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={require("../assets/musicphoto.jpg")}
                      className="rounded-xl"
                      style={styles.songImages}
                      resizeMode="cover"
                    />
                  )}
                  <View
                    style={{
                      marginTop: 15,
                      paddingVertical: 15,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 20,
                      marginHorizontal: 16,
                      alignSelf: 'stretch',
                    }}
                  >
                    <View style={styles.textContainer}>
                      <Text style={styles.songTitles}>
                        {currentSong?.title ? currentSong?.title?.replace(/\s*\(.*?\)\s*/g, '') : 'Unknown'}
                      </Text>
                      <Text style={styles.artist}>
                        {currentSong?.artist ? currentSong?.artist?.split(',')[0].trim().replace(/\s*\(.*?\)\s*/g, '') : 'Unknown Artist'}
                      </Text>
                    </View>
                    <Music />
                  </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 10,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 8,
  },

  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  // Song item
  songCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  songLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  songImage: { width: 60, height: 60, borderRadius: 10, marginRight: 12, borderWidth: 2 },
  songText: { flex: 1 },
  songTitle: { fontSize: 16, fontWeight: '600', color: 'white' },
  artist: { fontSize: 12, color: 'gray', marginTop: 4 },
  songRight: { flexDirection: 'row', alignItems: 'center' },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  upIcon: {
    position: "absolute",
    bottom: 100,
    zIndex: 10,
    alignSelf: "center",
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
    marginTop: 0,
  },
  songContainer: {
    alignItems: 'center',
    marginTop: 0,
  },
  songImages: {
    width: 290,
    height: 290,
  },
  songTitles: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 10,
    width: 300,
  },
  textContainer: {
    alignSelf: 'flex-start',
    paddingLeft: 30,
    marginTop: 10,
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

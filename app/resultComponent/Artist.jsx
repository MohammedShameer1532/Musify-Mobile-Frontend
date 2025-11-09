import { ActivityIndicator, Alert, Button, FlatList, Image, PermissionsAndroid, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from "react-native-linear-gradient";
import AverageColorExtractor from '../common/AverageColorExtractor';
import { SearchContext } from '../contextProvider/searchContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Music from '../common/Music';
import TrackPlayer, { Capability, Event, useTrackPlayerEvents } from 'react-native-track-player';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from "react-native-vector-icons/Entypo";
import LottieView from 'lottie-react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import RNBlobUtil from "react-native-blob-util";


const Artist = () => {
  const [artistData, setArtistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("rgb(30, 30, 30)");
  const [backgroundColors, setBackgroundColors] = useState("rgb(30, 30, 30)");
  const navigation = useNavigation();
  const { setCurrentSong, dataSearch, setCurrentIndex, setSongsList, currentSong } = useContext(SearchContext);
  const id = dataSearch;
  const sheetRef = useRef(null);
  const sheet = useRef(null);
  const snapPoints = useMemo(() => ["100%"]);
  const lyricsSnapPoints = useMemo(() => ["50%", "100%"], []);
  const songId = currentSong?.id;
  const [lyrics, setLyrics] = useState();
  const [copied, setCopied] = useState(false);
  const [showDownloadAnim, setShowDownloadAnim] = useState(false);
  const pendingTrackRef = useRef(null);


  console.log("songData", dataSearch);
  console.log("currentSong", currentSong);


  const matchIds = async (id) => {
    try {
      setLoading(true);
      let responseData;
      const apiUrl1 = await axios.get(`https://musify-api-inky.vercel.app/api/artists?id=${id}`);
      responseData = apiUrl1.data;
      const res = responseData.data;
      console.log('resss', res);
      setArtistData(res); // Wrap it in an array
      setTimeout(() => {
        setLoading(false);
      }, 400);
    } catch (error) {
      console.error('Error fetching:', error);
    }
  };
  console.log('artistdata', artistData);

  useEffect(() => {
    matchIds(id);
  }, [id]);

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


  const handlePlay = async (song, index) => {
    if (!song) return;

    if (currentSong?.id === song.id) {
      sheetRef.current?.snapToIndex(0);
      return;
    }
    pendingTrackRef.current = index;
    const queue = await TrackPlayer.getQueue();
    const isArtistMismatch = queue.length === 0 || queue[0].artist !== artistData?.topSongs[0]?.artists?.primary[0]?.name;

    if (isArtistMismatch) {
      await TrackPlayer.reset();

      const tracks = artistData.topSongs.map((s) => ({
        id: s.id,
        url: s.downloadUrl[4]?.url,
        title: s.name,
        artist: s.artists?.primary[0]?.name,
        artwork: s.image[2]?.url,
      }));

      await TrackPlayer.add(tracks);

      // 🔐 Wait for queue to stabilize before skipping
      await new Promise((resolve) => setTimeout(resolve, 100)); // tweak if needed
    }

    await TrackPlayer.skip(index);
    await TrackPlayer.play();

    // Wait for the player to actually switch tracks
    const activeIndex = await TrackPlayer.getActiveTrackIndex();
    const activeTrack = await TrackPlayer.getTrack(activeIndex);

    console.log('handlePlay finished:', activeIndex);

    setCurrentSong(activeTrack);
    setCurrentIndex(activeIndex);

    setTimeout(() =>
      sheetRef.current?.snapToIndex(0)
      , 50);
  };



  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged) {
      console.log('Event fired:', event.index);
      if (event.index != null) {
        // Only respond if event matches the intended track
        if (pendingTrackRef.current === null || pendingTrackRef.current === event.index) {
          const track = await TrackPlayer.getTrack(event.index);
          setCurrentSong(track);
          setCurrentIndex(event.index);
          pendingTrackRef.current = null; // clear after match
        }
      } else {
        setCurrentSong(null);
        setCurrentIndex(null);
        pendingTrackRef.current = null;
      }
    }
  });



  const GradientBackground = ({ style }: BottomSheetBackgroundProps) => (
    <LinearGradient
      colors={[backgroundColors, "#000"]}
      style={[style, { borderRadius: 0 }]} // keep BottomSheet’s rounded corners
    />
  );


  const handleDownload = async (url, fileName) => {
    try {
      if (!url) {
        Alert.alert("Error", "No download URL available");
        return;
      }

      // Request permission for Android < 13
      if (Platform.OS === 'android' && Platform.Version < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'Musify needs access to storage to save songs.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission denied', 'Cannot download without storage permission');
          return;
        }
      }

      const filePath = `/storage/emulated/0/Download/${fileName || 'Song.mp3'}`;

      RNBlobUtil.config({
        path: filePath,
        fileCache: true,
        addAndroidDownloads: {
          notification: true,
          title: fileName || "Song",
          description: "Downloading music file...",
          mime: "audio/mpeg",
          mediaScannable: true,
        },
      })
        .fetch("GET", url)
        .then((res) => {
          console.log("✅ Saved to:", res.path());
          setShowDownloadAnim(true); // show animation
          setTimeout(() => setShowDownloadAnim(false), 2000);
          RNBlobUtil.fs.scanFile([{ path: res.path(), mime: "audio/mpeg" }]);
        })
        .catch((err) => {
          console.error("Download error:", err);
          Alert.alert("Error", "Download failed.");
        });
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const fetchLyrics = async () => {
    try {
      const res = await axios.get(`https://jiosaavn-api.vercel.app/lyrics?id=${songId}`);
      const cleanLyrics = res?.data?.lyrics.replace(/<br\s*\/?>/gi, "\n"); // convert <br> to \n
      setLyrics(cleanLyrics);
      sheet.current?.snapToIndex(0);
      console.log("lyriii", cleanLyrics);

    } catch (error) {
      console.log(error);
      sheet.current?.snapToIndex(0);
      setLyrics("Failed to load lyrics");

    }
  };

  const handleCopy = () => {
    Clipboard.setString(lyrics || "");
    setCopied(true);

    // Reset back to copy icon after 2 sec
    setTimeout(() => setCopied(false), 1000);
  };



  
    // ====================== Song Item Component ======================
    const SongItem = React.memo(({ index, song, currentSong, handlePlay }) => {
  
      return (
        <View className="flex-row mt-5 ml-5 items-center justify-between pr-5 w-full">
          <TouchableOpacity onPress={() => handlePlay(song, index)}
            className="flex-1">
            <View className="flex-row items-center justify-between w-full">
  
              {/* Left Section: Image + Text */}
              <View className="flex-row items-center flex-1">
  
                {/* Space between image and text */}
                <View className="ml-1 flex-1">
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
                      {song?.name ? song?.name?.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
                    </Text>
                  </View>
  
                  {/* Artist stays below the title */}
                  <Text
                    className="text-gray-500 text-sm font-medium mt-1"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {song?.artists?.primary[0]?.name ? song?.artists?.primary[0]?.name.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
                  </Text>
                </View>
              </View>
              {/* Right Section: Lottie + Play Button */}
              <View className="flex-row items-center">
                <View className="pr-1">
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
                <View style={{ alignItems: 'flex-end', padding: 16 }}>
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
                      <MenuOption onSelect={fetchLyrics}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                          <MaterialIcons name="lyrics" size={18} color="white" />
                          <Text style={{ color: 'white', fontSize: 14 }}>Lyrics</Text>
                        </View>
                      </MenuOption>
                      <MenuOption onSelect={() => handleDownload(song.downloadUrl[4]?.url, `${song?.name}.mp3`)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                          <FontAwesome6 name="download" size={18} color="white" />
                          <Text style={{ color: 'white', fontSize: 14 }}>Download</Text>
                        </View>
                      </MenuOption>
                    </MenuOptions>
                  </Menu>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    });
  


  return (
    <MenuProvider>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={[backgroundColor, "#000"]} style={styles.background}>
          <SafeAreaView style={styles.safeArea} className="flex-1 ">
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 35 }} className='w-10 mt-5'>
              <Ionicons name="arrow-back" size={30} color="white" style={styles.backIcon} className="ml-2" />
            </TouchableOpacity>
            {artistData && (
              <AverageColorExtractor
                imageUrl={artistData?.image[2]?.url}
                onColorExtracted={(color) => {
                  if (color) {
                    setBackgroundColor(color);  // Only set if a valid color is received
                  }
                }}
              />
            )}
            {loading ? (
              <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
            ) : (
              <View className='flex-1'>
                <Image
                  source={{ uri: artistData?.image[2]?.url }}
                  style={styles.songImagee}
                  className="rounded-xl mt-0"
                />
                <View className='flex-row items-center mt-5 justify-between '>
                  <Text className="text-white font-bold text-3xl line-clamp-2 text-start ml-5 ">
                    {artistData?.name}
                  </Text>
                  <LottieView
                    source={require("../assets/Download.json")}
                    style={{ width: 100, height: 80 }}
                    autoPlay
                    loop
                  />
                </View>
                <FlatList
                  className='flex-1'
                  contentContainerStyle={{ paddingBottom: 20 }}
                  data={artistData?.topSongs}
                  keyExtractor={song => song.id}
                  renderItem={({ item: song, index }) => (
                    <SongItem
                      song={song}
                      index={index}
                      currentSong={currentSong}
                      handlePlay={handlePlay}
                    />
                  )}
                />
              </View>
            )}
            {showDownloadAnim && (
              <View style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.6)",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}>
                <LottieView
                  source={require("../assets/Download.json")}
                  style={{ width: 150, height: 150 }}
                  autoPlay
                  loop={false} // play once
                  onAnimationFinish={() => setShowDownloadAnim(false)}
                />
                <Text style={{ color: "white", marginTop: 10, fontSize: 16 }}>
                  Download Complete 🎵
                </Text>
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
              backgroundComponent={GradientBackground}
            >
              <TouchableOpacity onPress={() => sheetRef.current?.close()} style={{ width: 50 }} className='w-10 mt-0 ml-5'>
                <Entypo name="chevron-thin-down" size={30} color="white" style={styles.backIcon} className="ml-5" />
              </TouchableOpacity>
              {currentSong?.artwork && (
                <AverageColorExtractor
                  key={currentSong?.id}
                  imageUrl={currentSong.artwork}
                  onColorExtracted={(color) => {
                    if (color) setBackgroundColors(color);
                  }}
                />
              )}

              <FlatList
                data={currentSong ? [currentSong] : []}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => {
                  if (!item) return null; // prevent flicker
                  return (
                    <View style={styles.songContainer} key={index}>
                      {item?.artwork ? (
                        <Image
                          source={{ uri: item.artwork }}
                          style={styles.songImage}
                          className="rounded-xl"
                        />
                      ) : (
                        <View style={[styles.songImage, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={{ color: 'white' }}>No Image</Text>
                        </View>
                      )}
                      <View style={styles.textContainer}>
                        <Text style={styles.songTitle}>{item?.title?.replace(/\s*\(.*?\)\s*/g, '')}</Text>
                        <Text style={styles.artist}>{item?.artist?.replace(/\s*\(.*?\)\s*/g, '')}</Text>
                        <View style={styles.icons}>
                          <View style={{ alignItems: 'flex-end', padding: 16 }}>
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
                                <MenuOption onSelect={fetchLyrics}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                                    <MaterialIcons name="lyrics" size={18} color="white" />
                                    <Text style={{ color: 'white', fontSize: 14 }}>Lyrics</Text>
                                  </View>
                                </MenuOption>
                                <MenuOption onSelect={() => handleDownload(currentSong?.url, `${currentSong?.title}.mp3`)}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                                    <FontAwesome6 name="download" size={18} color="white" />
                                    <Text style={{ color: 'white', fontSize: 14 }}>Download</Text>
                                  </View>
                                </MenuOption>
                              </MenuOptions>
                            </Menu>
                          </View>
                        </View>
                      </View>
                      <Music />
                    </View>
                  )
                }}
              />
            </BottomSheet>
            <BottomSheet
              ref={sheet}
              index={-1}
              snapPoints={lyricsSnapPoints}
              enableDynamicSizing={false}
              enablePanDownToClose={true}
              handleIndicatorStyle={{
                backgroundColor: 'grey',
                width: 45,
                height: 5,
                borderRadius: 2,
              }}
              backgroundStyle={{ backgroundColor: '#000' }}
            >
              <Text
                style={{
                  fontSize: 18,
                  marginLeft: 10,
                  marginTop: 5.5,
                  marginBottom: 20,
                  fontWeight: "bold",
                  color: "grey",
                }}
              >
                Lyrics 🎶
              </Text>
              <TouchableOpacity style={styles.clearIcon} onPress={() => sheet.current?.close()}>
                <Ionicons name="close-circle" size={25} color="gray" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ position: "absolute", right: 50, top: "2%" }}
                onPress={handleCopy}
              >
                {copied ? (
                  <Ionicons name="checkbox-outline" size={25} color="grey" />
                ) : (
                  <MaterialDesignIcons name="clipboard-text-multiple" size={25} color="grey" />
                )}
              </TouchableOpacity>
              <BottomSheetScrollView
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 14,
                    textAlign: "center",   // centers text horizontally
                    lineHeight: 22,
                    marginBottom: 80,     // better readability
                  }}
                >
                  {lyrics}
                  -----
                </Text>
              </BottomSheetScrollView>
            </BottomSheet>
          </SafeAreaView>
        </LinearGradient>
      </GestureHandlerRootView>
    </MenuProvider>
  )
}

export default Artist

const styles = StyleSheet.create({
  songImagee: {
    width: 290,
    height: 290,
    display: 'flex',
    alignSelf: 'center',
  },
  songImages: {
    width: 60,
    height: 60,
    borderRadius: 15,
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
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginTop: 10,
  },
  album: {
    fontSize: 16,
    color: 'grey',
    marginTop: 5,
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
  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '2%',
  },
})
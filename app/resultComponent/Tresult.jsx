import { ActivityIndicator, Alert, FlatList, Image, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SearchContext } from '../contextProvider/searchContext';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AverageColorExtractor from '../common/AverageColorExtractor';
import LottieView from 'lottie-react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/Entypo';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Entypo from "react-native-vector-icons/Entypo";
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import TrackPlayer, { useActiveTrack } from 'react-native-track-player';
import Music from '../common/Music';
import RNBlobUtil from "react-native-blob-util";


const Tresult = () => {
  const { dataSearch } = useContext(SearchContext);
  const [loading, setLoading] = useState(true);
  const [tdata, setTdata] = useState();
  const [backgroundColor, setBackgroundColor] = useState("rgb(30, 30, 30)");
  const navigation = useNavigation();
  const id = dataSearch;
  const [showDownloadAnim, setShowDownloadAnim] = useState(false);
  const sheetRef = useRef(null);
  const sheet = useRef(null);
  const [lyrics, setLyrics] = useState();
  const [copied, setCopied] = useState(false);
  const [songData, setSongData] = useState([]);
  const snapPoints = useMemo(() => ["100%"]);
  const lyricsSnapPoints = useMemo(() => ["50%", "100%"], []);
  const pendingTrackRef = useRef(null);
  console.log('dataSearch in Tresult', dataSearch);
  const currentSong = useActiveTrack();

  const matchIds = async (id) => {
    try {
      setLoading(true);
      const apiUrl1 = await axios.get(`https://musify-api-inky.vercel.app/api/albums?id=${id}`);
      const res = apiUrl1.data.data;
      console.log('resss', res);
      setTdata(res); // Wrap it in an array
      setTimeout(() => {
        setLoading(false);
      }, 400);
    } catch (error) {
      console.error('Error fetching:', error);
    }
  };
  console.log('tdata', tdata);



  useEffect(() => {
    if (!id) return;
    matchIds(id);
  }, [id]);




  const handlePlay = async (song, index) => {
    if (!song) return;

    // If same song → just open player
    if (currentSong?.id === song.id) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    try {
      const songs = tdata?.songs || [];
      if (!songs.length) return;

      // Reset player
      await TrackPlayer.reset();
      // Reorder queue so clicked song plays first
      const orderedQueue = [
        songs[index],                 // clicked song
        ...songs.slice(index + 1),     // next songs
        ...songs.slice(0, index),      // previous songs
      ].map((s) => ({
        id: s.id,
        url: s.downloadUrl[4]?.url,
        title: s.name,
        artist: s.artists?.primary[0]?.name,
        artwork: s.image[2]?.url,
      }));

      // Add reordered queue
      await TrackPlayer.add(orderedQueue);

      // Play clicked song
      await TrackPlayer.skip(0);
      await TrackPlayer.play();
      setTimeout(() => {
        sheetRef.current?.snapToIndex(0);
      }, 10);


    } catch (error) {
      console.log('handlePlay error:', error);
    }
  };



  const GradientBackground = useCallback(
    ({ style }: BottomSheetBackgroundProps) => (
      <LinearGradient
        colors={[backgroundColor, "#000"]}
        style={[style, { borderRadius: 0 }]}
      />
    ),
    [backgroundColor]
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



  return (
    <MenuProvider>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={[backgroundColor, "#000"]} style={styles.background}>
          <SafeAreaView style={styles.safeArea} className="flex-1 ">
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 35 }} className='w-10 mt-5'>
              <Ionicons name="arrow-back" size={30} color="white" style={styles.backIcon} className="ml-2" />
            </TouchableOpacity>
            {tdata && tdata?.image?.[2]?.url && (
              <AverageColorExtractor
                imageUrl={tdata?.image[2]?.url}
                onColorExtracted={(color) => {
                  if (color) {
                    setBackgroundColor(color);  // Only set if a valid color is received
                  }
                }}
              />
            )}
            {currentSong?.artwork && (
              <AverageColorExtractor
                imageUrl={currentSong.artwork}
                onColorExtracted={(color) => {
                  if (color) setBackgroundColor(color);
                }}
              />
            )}
            {loading ? (
              <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
            ) : (
              <View className='flex-1'>
                <Image
                  source={{ uri: tdata?.image[2]?.url }}
                  style={styles.songImagee}
                  className="rounded-xl mt-0"
                />
                <View className='flex-row items-center mt-5 justify-between '>
                  <Text className="text-white font-bold text-2xl line-clamp-2 text-start ml-5 ">
                    {tdata?.name}
                  </Text>
                  <LottieView
                    source={require("../assets/Download.json")}
                    style={{ width: 100, height: 80 }}
                    autoPlay
                    loop
                  />
                </View>
                <FlatList
                  className='flex-1 '
                  contentContainerStyle={{ paddingBottom: 20 }}
                  data={tdata?.songs || tdata?.downloadUrl}
                  keyExtractor={song => song.id}
                  renderItem={({ item: song, index }) => (
                    <View className="flex-row mt-5 ml-5 items-center justify-between pr-5 w-full">
                      <TouchableOpacity onPress={() => handlePlay(song, index)}
                        className="flex-1">
                        <View className="flex-row items-center justify-between w-full">

                          {/* Left Section: Image + Text */}
                          <View className="flex-row items-center flex-1">
                            {/* Song Image */}
                            {tdata?.image?.[2]?.url ? (
                              <Image
                                source={{ uri: tdata.image[2].url }}
                                className="rounded-xl w-14 h-14"
                                resizeMode="cover"
                              />
                            ) : (
                              <Image
                                source={require("../assets/musicphoto.jpg")}
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
                                  {song?.name ? song?.name?.replace(/\s*\(.*?\)\s*/g, '') : 'Unknown'}
                                </Text>
                              </View>

                              {/* Artist stays below the title */}
                              <Text
                                className="text-gray-500 text-sm font-medium mt-1"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {song?.artists?.primary[0]?.name ? song?.artists?.primary[0]?.name?.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
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
                  style={{ width: 100, height: 100 }}
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
              <View style={styles.songContainer} >
                <Image
                  source={{ uri: currentSong?.artwork }}
                  style={styles.songImage}
                  className="rounded-xl"
                />
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.songTitle,
                      {
                        maxWidth:
                          currentSong?.id === currentSong?.id && currentSong?.title.length > 20 ? "80%" : "100%",
                      },
                    ]}
                    numberOfLines={currentSong?.title.length > 25 ? 1 : undefined}
                    ellipsizeMode={currentSong?.title.length > 25 ? "tail" : "clip"}
                  >
                    {currentSong?.title.replace(/\s*\(.*?\)\s*/g, '')}
                  </Text>
                  <Text style={styles.artist}>{currentSong?.artist?.replace(/\s*\(.*?\)\s*/g, '')}</Text>
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
            </BottomSheet>
            <BottomSheet
              ref={sheet}
              index={-1}
              snapPoints={lyricsSnapPoints}
              enableDynamicSizing={false}
              enablePanDownToClose={true} F
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

export default Tresult;

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
    fontSize: 25,
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
});

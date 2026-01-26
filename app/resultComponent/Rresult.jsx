import { ActivityIndicator, Alert, FlatList, Image, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import TrackPlayer, { Capability, Event, useActiveTrack } from 'react-native-track-player';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from "react-native-vector-icons/Entypo";
import LottieView from 'lottie-react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import RNBlobUtil from "react-native-blob-util";
import { useTrackPlayerEvents } from 'react-native-track-player';

const Rresult = () => {
  const { setCurrentSong, dataSearch, setCurrentIndex, currentIndex, setSongsList, setGlobalSearch } = useContext(SearchContext);
  const [stationid, setStationid] = useState([]);
  const [songid, setSongid] = useState('');
  const name = dataSearch.id;
  const lang = dataSearch.moreInfo.language;
  console.log('datasearch', dataSearch);
  const [rData, setRData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("rgb(30, 30, 30)");
  const [backgroundColors, setBackgroundColors] = useState("rgb(30, 30, 30)");
  const sheetRef = useRef(null);
  const sheet = useRef(null);
  const snapPoints = useMemo(() => ["100%"]);
  const lyricsSnapPoints = useMemo(() => ["50%", "100%"], []);
  const [lyrics, setLyrics] = useState();
  const [copied, setCopied] = useState(false);
  const [showDownloadAnim, setShowDownloadAnim] = useState(false);
  const currentSong = useActiveTrack();
  const songId = currentSong?.id;
  const navigation = useNavigation();
  const [songData, setSongData] = useState([]);

  const topColor = dataSearch?.moreInfo?.color || "#000";
  const gradientTop = topColor + "cc";  // adds 80% opacity
  console.log("songData", dataSearch);
  console.log("currentSong", currentSong);





  useEffect(() => {
    if (!name || name.trim() === '') {
      console.warn('Search name is empty. Skipping API call.');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://www.jiosaavn.com/api.php?language=${lang}&pid=&query=&name=${name}&mode=&artistid=&api_version=4&_format=json&_marker=0&ctx=wap6dot0&__call=webradio.createFeaturedStation`
        );

        const stationIdValue = response.data.stationid;
        if (!stationIdValue) {
          console.warn('No station ID returned.');
          setLoading(false);
          return;
        }

        setStationid(stationIdValue);

        const songResponse = await axios.get(
          `https://www.jiosaavn.com/api.php?__call=webradio.getSong&stationid=${stationIdValue}&k=20&next=1&api_version=4&_format=json&_marker=0&ctx=wap6dot0`
        );

        const stdata = songResponse.data;

        // ✅ Convert all numeric songs into an array
        const songArray = Object.keys(stdata)
          .filter(key => !isNaN(key))
          .map(key => stdata[key]);

        // ✅ Include top-level "song" if it exists
        if (stdata.song) {
          songArray.unshift({ song: stdata.song });
        }
        setRData(songArray);
        setLoading(false);

        console.log("Processed Songs:", songArray);
      } catch (error) {
        console.error("Error fetching radio data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [name]);

  console.log("dddd", rData);


  const preloadAllSongs = async () => {
    try {
      const ids = rData.map(item => item.song.id).join(",");

      const res = await axios.get(
        `https://musify-api-inky.vercel.app/api/songs?ids=${ids}`
      );

      const apiSongs = res.data.data;
      setSongData(apiSongs);

      console.log("🔥 All songs preloaded", apiSongs);
    } catch (e) {
      console.log("Preload error:", e);
    }
  };

  useEffect(() => {
    if (rData.length > 0) {
      preloadAllSongs();
    }
  }, [rData]);



  const handlePlay = async (song, index) => {
    if (!song?.song) return;

    if (currentSong?.id === song.song.id) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    try {
      const songs = songData;
      if (!songs.length) return;
      console.log('verifing', songs);


      await TrackPlayer.reset();

      const orderedQueue = [
        songs[index],
        ...songs.slice(index + 1),
        ...songs.slice(0, index),
      ].map(s => ({
        id: s?.id,
        title: s?.name,
        artist: s?.artists?.primary[0]?.name || 'Unknown',
        url: s?.downloadUrl[4]?.url || 'Unknown',
        artwork: s?.image[2]?.url,
      }));
      console.log('orderqueqe', orderedQueue);

      await TrackPlayer.add(orderedQueue);
      await TrackPlayer.skip(0);
      await TrackPlayer.play();


      sheetRef.current?.snapToIndex(0);


    } catch (error) {
      console.log('handlePlay error:', error);
    }
  };


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
            message: 'lysernfy needs access to storage to save songs.',
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
          Alert.alert("Download Complete", "Saved in Downloads folder.");
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


  const handleCopy = () => {
    Clipboard.setString(lyrics || "");
    setCopied(true);

    // Reset back to copy icon after 2 sec
    setTimeout(() => setCopied(false), 1000);
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



  const GradientBackground = useCallback(
    ({ style }: BottomSheetBackgroundProps) => (
      <LinearGradient
        colors={[backgroundColors, "#000"]}
        style={[style, { borderRadius: 0 }]}
      />
    ),
    [backgroundColors]
  );

  const songDataMap = useMemo(() => {
    const map = {};
    songData.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [songData]);

  const mergedSongs = useMemo(() => {
    return rData.map(item => {
      const fullSong = songDataMap[item?.song?.id];

      return {
        ...item,
        fullSong, // 👈 contains downloadUrl, image, artists, etc
      };
    });
  }, [rData, songDataMap]);



  return (
    <MenuProvider>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={[gradientTop, "#000"]} style={styles.background}>
          <SafeAreaView style={styles.safeArea} className="flex-1 ">
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 35 }} className='w-10 mt-5'>
              <Ionicons name="arrow-back" size={30} color="white" style={styles.backIcon} className="ml-2" />
            </TouchableOpacity>
            {currentSong?.artwork && (
              <AverageColorExtractor
                key={currentSong?.id}
                imageUrl={currentSong.artwork}
                onColorExtracted={(color) => {
                  if (color) setBackgroundColors(color);
                  console.log('backgroundcolor', backgroundColors);

                }}
              />
            )}
            {loading ? (
              <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
            ) : (
              <View className='flex-1'>
                <Image
                  source={{ uri: dataSearch?.imageUrl }}
                  style={styles.songImagee}
                  className="rounded-xl mt-0"
                />
                <View className='flex-row items-center mt-5 justify-between '>
                  <Text className="text-white font-bold text-2xl line-clamp-2 text-start ml-5 ">
                    {dataSearch?.id}
                  </Text>
                  <LottieView
                    source={require("../assets/Download.json")}
                    style={{ width: 100, height: 80 }}
                    autoPlay
                    loop
                  />
                </View>
                <FlatList
                  data={mergedSongs}
                  keyExtractor={(item) => item?.song?.id}
                  initialNumToRender={6}
                  maxToRenderPerBatch={6}
                  windowSize={10}
                  removeClippedSubviews={true}
                  contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                  getItemLayout={(data, index) => ({
                    length: 75,
                    offset: 75 * index,
                    index,
                  })}
                  renderItem={({ item, index }) => (
                    <SongItem
                      song={item}
                      index={index}
                      currentSong={currentSong}
                      handlePlay={handlePlay}
                      handleDownload={handleDownload}
                      fetchLyrics={fetchLyrics}
                      songData={songData}
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
              <TouchableOpacity
                onPress={() => sheetRef.current?.close()}
                style={{ width: 50 }}
                className='w-10 mt-0 ml-5'
              >
                <Entypo name="chevron-thin-down" size={30} color="white" />
              </TouchableOpacity>

              {/* 🔥 NO FlatList, NO heavy components */}
              {currentSong && (
                <View style={styles.songContainer}>

                  <Image
                    source={{ uri: currentSong.artwork }}
                    style={styles.songImages}
                    className="rounded-xl"
                  />
                  <View
                    style={{
                      marginTop: 35,
                      paddingVertical: 15,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 20,
                      marginHorizontal: 16,
                      alignSelf: 'stretch',
                    }}
                  >
                    <View style={styles.textContainer}>
                      <Text style={styles.songTitles}>
                        {currentSong?.title?.replace(/\s*\(.*?\)\s*/g, '')}
                      </Text>

                      <Text style={styles.artists}>
                        {currentSong?.artist?.replace(/\s*\(.*?\)\s*/g, '')}
                      </Text>

                      <View style={styles.icons}>
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
                    <Music />
                  </View>
                </View>
              )}
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

export default Rresult;




// ====================== Modern Song Item ======================
const SongItem = React.memo(({ index, song, currentSong, handlePlay, handleDownload, fetchLyrics, songData }) => {
  const isPlaying = currentSong?.id === song?.song?.id;

  return (
    <TouchableOpacity onPress={() => handlePlay(song, index)} activeOpacity={0.8} style={styles.songCard}>
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
            source={{ uri: song?.song?.image }}
            className="rounded-xl w-14 h-14"
            resizeMode="cover"
            style={[styles.songImage, { borderColor: isPlaying ? "#1DB954" : "transparent" }]}
          />
        )}
        <View style={styles.songText} >
          <View className="flex-row items-center">
            {/* Playing Animation: only shows for current song */}
            {currentSong?.id === song?.song?.id && (
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
              {song?.song?.title?.replace(/\s*\(.*?\)\s*/g, "")}
            </Text>
          </View>
          <Text style={styles.artist} numberOfLines={1}>
            {song?.song?.more_info?.music?.replace(/\s*\(.*?\)\s*/g, "")}
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
              <MenuOption onSelect={fetchLyrics}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                  <MaterialIcons name="lyrics" size={18} color="white" />
                  <Text style={{ color: 'white', fontSize: 14 }}>Lyrics</Text>
                </View>
              </MenuOption>
              <MenuOption onSelect={() => handleDownload(song?.fullSong?.downloadUrl?.[4]?.url, `${song?.song?.title}.mp3`)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                  <FontAwesome6 name="download" size={18} color="white" />
                  <Text style={{ color: 'white', fontSize: 14 }}>Download</Text>
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
  songImagee: {
    width: 290,
    height: 290,
    display: 'flex',
    alignSelf: 'center',
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
    marginTop: 10,
  },
  songImages: {
    width: 300,
    height: 300,
  },
  songTitles: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 10,
    width: 280,
  },
  album: {
    fontSize: 16,
    color: 'grey',
    marginTop: 5,
  },
  artists: {
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

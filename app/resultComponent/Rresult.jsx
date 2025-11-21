import { ActivityIndicator, Alert, FlatList, Image, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import TrackPlayer, { Capability, Event } from 'react-native-track-player';
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
  const { setCurrentSong, dataSearch, setCurrentIndex, currentIndex, setSongsList, currentSong, setGlobalSearch } = useContext(SearchContext);
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
  const songId = currentSong?.id;
  const navigation = useNavigation();
  const pendingTrackRef = useRef(null);
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


  const preloadAllSongs = async () => {
    try {
      const ids = rData.map(item => item.song.id).join(",");

      const res = await axios.get(
        `https://musify-api-inky.vercel.app/api/songs?ids=${ids}`
      );

      const apiSongs = res.data.data;

      // Convert to TrackPlayer format
      const tracks = apiSongs.map(track => ({
        id: track.id,
        url: track.downloadUrl[4].url,   // 320kbps
        title: track.name,
        artist: track.album.name,
        artwork: track.image[2].url
      }));

      // Save in global context (optional but useful)
      setSongsList(tracks);

      // Load into player
      await TrackPlayer.reset();
      await TrackPlayer.add(tracks);
      await TrackPlayer.play();
      setTimeout(() => {
        sheetRef.current?.snapToIndex(0);
      }, 100);


      console.log("🔥 All songs preloaded");
    } catch (e) {
      console.log("Preload error:", e);
    }
  };

  useEffect(() => {
    if (rData.length > 0) {
      preloadAllSongs();
    }
  }, [rData]);


  useEffect(() => {
    async function setupPlayer() {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        stopWithApp: true,
        waitForBuffer: false,
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
    try {
      // If user taps same track → open sheet
      if (currentSong?.id === song.song.id) {
        sheetRef.current?.snapToIndex(0);
        return;
      }

      await TrackPlayer.skip(index);
      await TrackPlayer.play();

      const track = await TrackPlayer.getTrack(index);
      setCurrentSong(track);
      setCurrentIndex(index);

      sheetRef.current?.snapToIndex(0);
    } catch (err) {
      console.log("Play error:", err);
    }
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

  const GradientBackground = ({ style }: BottomSheetBackgroundProps) => (
    <LinearGradient
      colors={[backgroundColors, "#000"]}
      style={[style, { borderRadius: 0 }]} // keep BottomSheet’s rounded corners
    />
  );





  const SongItem = React.memo(({ song, index, currentSong, navigation, setGlobalSearch, handlePlay }) => {

    const title = useMemo(() =>
      song?.song?.title?.replace(/\s*\(.*?\)\s*/g, "") ?? "Unknown",
      [song?.song?.title]
    );

    const artist = useMemo(() =>
      song?.song?.more_info?.music?.replace(/\s*\(.*?\)\s*/g, "") ?? "Unknown",
      [song?.song?.more_info?.music]
    );

    return (
      <TouchableOpacity
        onPress={() => handlePlay(song, index)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 10,
          marginTop: 5
        }}
      >
        {/* Song Image */}
        <Image
          source={{ uri: song?.song?.image }}
          style={{ width: 55, height: 55, borderRadius: 10 }}
        />

        {/* Text Section */}
        <View style={{ flex: 1, marginLeft: 10 }}>
          {/* Title + Playing Animation */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {currentSong?.id === song?.song?.id && (
              <LottieView
                source={require("../assets/playing.json")}
                style={{ width: 18, height: 18, marginRight: 6 }}
                autoPlay
                loop
              />
            )}

            <Text
              numberOfLines={1}
              style={{
                color: currentSong?.id === song?.song?.id ? "limegreen" : "white",
                fontSize: 15,
                fontWeight: "500"
              }}
            >
              {title}
            </Text>
          </View>

          <Text numberOfLines={1} style={{ color: "#aaa", marginTop: 2 }}>
            {artist}
          </Text>
        </View>
        <View className="pr-1">
          {currentSong?.id === song?.song?.id && (
            <LottieView
              source={require("../assets/music.json")}
              style={{ width: 60, height: 60 }}
              autoPlay
              loop
            />
          )}
        </View>
        {/* Play button */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#1DB954",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <FontAwesome
            name="play"
            size={18}
            color="black"
            style={{ marginLeft: 2 }}
          />
        </View>
      </TouchableOpacity>
    );
  });


  return (
    <MenuProvider>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={[gradientTop, "#000"]} style={styles.background}>
          <SafeAreaView style={styles.safeArea} className="flex-1 ">
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 35 }} className='w-10 mt-5'>
              <Ionicons name="arrow-back" size={30} color="white" style={styles.backIcon} className="ml-2" />
            </TouchableOpacity>
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
                  data={rData}
                  keyExtractor={(item) => item?.song?.id}
                  initialNumToRender={6}
                  maxToRenderPerBatch={6}
                  windowSize={10}
                  removeClippedSubviews={true}
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
                      navigation={navigation}
                      setGlobalSearch={setGlobalSearch}
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
              {/* 🔥 NO FlatList, NO heavy components */}
              {currentSong && (
                <View style={styles.songContainer}>

                  <Image
                    source={{ uri: currentSong.artwork }}
                    style={styles.songImage}
                    className="rounded-xl"
                  />

                  <View style={styles.textContainer}>
                    <Text style={styles.songTitle}>
                      {currentSong?.title?.replace(/\s*\(.*?\)\s*/g, '')}
                    </Text>

                    <Text style={styles.artist}>
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
                  {/* ⚡ Move Music Controls Outside BottomSheet */}
                </View>
              )}
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

export default Rresult;

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

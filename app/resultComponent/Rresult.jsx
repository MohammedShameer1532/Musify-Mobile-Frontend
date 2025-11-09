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
  const { setCurrentSong, dataSearch, setCurrentIndex, currentIndex, setSongsList, currentSong } = useContext(SearchContext);
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




  const matchIds = async (id) => {
    try {
      let responseData;
      setLoading(true);
      const apiUrl1 = await axios.get(`https://musify-api-inky.vercel.app/api/songs?ids=${id}`);
      responseData = apiUrl1.data;
      const res = responseData.data;
      console.log('resss', res);
      setSongData(res);
      setTimeout(() => {
        setLoading(false);
      }, 400);
    } catch (error) {
      console.error('Error fetching:', error);
      setLoading(false);
    }
  }

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

    if (currentSong?.id === song.song?.id) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    // ✅ Pass correct song id
    await matchIds(song?.song?.id);

    pendingTrackRef.current = index;
    const queue = await TrackPlayer.getQueue();

    const isArtistMismatch =
      queue.length === 0 ||
      queue[0].artist !== song?.song?.more_info?.music;

    if (isArtistMismatch) {
      await TrackPlayer.reset();

      const tracks = {
        id: songData[0]?.id,
        url: songData[0]?.downloadUrl[4]?.url,
        title: songData[0]?.album?.name,
        artist: songData[0]?.name,
        artwork: songData[0]?.image[2]?.url,
      }

      await TrackPlayer.add(tracks);

      // small delay for stability
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await TrackPlayer.skip(index);
    await TrackPlayer.play();

    const activeIndex = await TrackPlayer.getActiveTrackIndex();
    const activeTrack = await TrackPlayer.getTrack(activeIndex);

    console.log('handlePlay finished:', activeIndex);

    setCurrentSong(activeTrack);
    setCurrentIndex(activeIndex);

    setTimeout(() => sheetRef.current?.snapToIndex(0), 50);
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
      colors={[backgroundColor, "#000"]}
      style={[style, { borderRadius: 0 }]} // keep BottomSheet’s rounded corners
    />
  );




  const SongItem = React.memo(({ index, song, currentSong, handlePlay }) => {

    return (
      <View className="flex-row mt-5 ml-5 items-center justify-between pr-5 w-full">
        <TouchableOpacity onPress={() => handlePlay(song, index)}
          className="flex-1">
          <View className="flex-row items-center justify-between w-full">

            {/* Left Section: Image + Text */}
            <View className="flex-row items-center flex-1">
              <Image
                source={{ uri: song?.song?.image }}
                className="rounded-xl w-14 h-14"
              />
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
                    {song?.song?.title ? song?.song?.title?.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
                  </Text>
                </View>

                {/* Artist stays below the title */}
                <Text
                  className="text-gray-500 text-sm font-medium mt-1"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {song?.song?.more_info?.music ? song?.song?.more_info?.music?.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
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
            {/* {albumData.length > 0 && (
              <AverageColorExtractor
                imageUrl={albumData[0]?.image[2]?.url}
                onColorExtracted={(color) => {
                  if (color) {
                    setBackgroundColor(color);  // Only set if a valid color is received
                  }
                }}
              />
            )} */}
            {loading ? (
              <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
            ) : (
              <View className='flex-1'>
                {/* <Image
                  source={{ uri: albumData[0]?.image[2]?.url }}
                  style={styles.songImagee}
                  className="rounded-xl mt-0"
                /> */}
                <View className='flex-row items-center mt-5 justify-between '>
                  {/* <Text className="text-white font-bold text-2xl line-clamp-2 text-start ml-5 ">
                    {albumData[0]?.name}
                  </Text> */}
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
                  data={rData}
                  keyExtractor={(song, index) => song?.song?.id || index.toString()}
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
              {currentSong?.artwork && (
                <AverageColorExtractor
                  imageUrl={currentSong.artwork}
                  onColorExtracted={(color) => {
                    if (color) setBackgroundColor(color);
                  }}
                />
              )}

              <FlatList
                data={currentSong ? [currentSong] : []}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <View style={styles.songContainer} key={index}>
                    <Image
                      source={{ uri: item?.artwork }}
                      style={styles.songImage}
                      className="rounded-xl"
                    />
                    <View style={styles.textContainer}>
                      <Text
                      >
                        {item?.title?.replace(/\s*\(.*?\)\s*/g, '')}
                      </Text>
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
                )}
              />
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

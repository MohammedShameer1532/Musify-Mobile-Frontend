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
import { ScrollView } from 'react-native';


const Podresult = () => {
  const { setCurrentSong, dataSearch, setCurrentIndex, setSongsList, setPoddata } = useContext(SearchContext);
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
  const [visible, setVisible] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState();
  const [episodedata, setEpisodedata] = useState();
  const [songData, setSongData] = useState([]);
  console.log('dataSearch in Tresult', dataSearch);

  const url = dataSearch?.permurl;
  const id = url.split("/").pop();
  console.log('id', id);


  const poddata = async () => {
    try {
      const ress = await axios.get(
        `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${id}&type=show&season_number=1&sort_order=&includeMetaTags=0&ctx=wap6dot0&api_version=4&_format=json&_marker=0`
      );

      const podres = ress?.data;
      setEpisodedata(podres);

      console.log("podres", podres);
    } catch (err) {
      console.log("Error:", err);
    } finally {
      setLoading(false);   // ✅ VERY IMPORTANT
    }
  };



  const loadSeason = async (seasonNum) => {
    try {
      setSelectedEpisode(Number(seasonNum));
      console.log('selectedepisode', selectedEpisode);

      const res = await axios.get(
        `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${id}&type=show&season_number=${seasonNum}&ctx=wap6dot0&api_version=4&_format=json&_marker=0`
      );
      const dd = res?.data;
      setEpisodedata(res.data); // update list to show selected season episodes

      console.log("dd", dd);
    } catch (err) {
      console.log("Error:", err);
    } finally {
      setLoading(false);   // ✅ VERY IMPORTANT
    }
  };



  useEffect(() => {
    setSelectedEpisode(1);
    poddata();
    loadSeason(1);
  }, []);





  const preloadAllSongs = async () => {
    try {
      const ids = episodedata?.episodes.map(item => item?.id).join(",");
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
    if (episodedata?.episodes?.length > 0) {
      preloadAllSongs();
    }
    console.log('espisodedata', episodedata);

  }, [episodedata]);



  const handlePlay = async (song, index) => {
    if (!song?.id) return;

    if (currentSong?.id === song?.id) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    try {
      const songs = songData;
      if (!songs.length) return;


      await TrackPlayer.reset();

      const orderedQueue = [
        songs[index],
        ...songs.slice(index + 1),
        ...songs.slice(0, index),
      ].map(s => ({
        id: s?.id,
        title: s?.name,
        url: s?.downloadUrl[4]?.url || 'Unknown',
        artwork: s?.image[2]?.url,
        header: song.header_desc,
        Description: song?.more_info?.description,
        year: song?.more_info?.release_date,
        episode_number: song?.more_info?.episode_number,
      }));


      await TrackPlayer.add(orderedQueue);
      await TrackPlayer.skip(0);
      await TrackPlayer.play();

      setTimeout(() => {
        sheetRef.current?.snapToIndex(0);
      }, 10);

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


  const fetchLyrics = async () => {
    try {
      const res = await axios.get(`https://jiosaavn-api.vercel.app/lyrics?id=${songId}`);
      const cleanLyrics = res?.data?.lyrics.replace(/<br\s*\/?>/gi, "\n"); // convert <br> to \n
      setLyrics(cleanLyrics);
      console.log("lyriii", cleanLyrics);
      setVisible(true);
    } catch (error) {
      console.log(error);
      setLyrics("Failed to load lyrics");
      setVisible(true);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(lyrics || "");
    setCopied(true);

    // Reset back to copy icon after 2 sec
    setTimeout(() => setCopied(false), 1000);
  };




  const GradientBackground = ({ style }: BottomSheetBackgroundProps) => (
    <LinearGradient
      colors={[backgroundColors, "#000"]}
      style={[style, { borderRadius: 0 }]} // keep BottomSheet’s rounded corners
    />
  );



  const SongItem = React.memo(({ song, index, currentSong, handlePlay }) => {

    const title = useMemo(() =>
      song?.title?.replace(/\s*\(.*?\)\s*/g, "") ?? "Unknown",
      [song?.title]
    );



    const handlePress = (title, imageUrl, id, header, description, year, episode_number) => {
      setPoddata({
        title,
        imageUrl,
        id,
        header,
        description,
        year,
        episode_number
      });
      navigation.navigate('Podplay', { id: songId });
    };

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
          source={{ uri: song?.more_info?.square_image }}
          style={{ width: 55, height: 55, borderRadius: 10 }}
        />

        {/* Text Section */}
        <View style={{ flex: 1, marginLeft: 10 }}>
          {/* Title + Playing Animation */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {currentSong?.id === song?.id && (
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
                color: currentSong?.id === song?.id ? "limegreen" : "white",
                fontSize: 15,
                fontWeight: "500"
              }}
            >
              {title}
            </Text>
          </View>

          {/* <Text numberOfLines={1} style={{ color: "#aaa", marginTop: 2 }}>
            {artist}
          </Text> */}
        </View>
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
      </TouchableOpacity>
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
            {loading ? (
              <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
            ) : (
              <View className='flex-1 mt-[-10%]'>
                <Image
                  source={{ uri: dataSearch?.imageUrl }}
                  style={styles.songImagee}
                  className="rounded-xl mt-0"
                />
                <View className='flex-row items-center mt-0 justify-between '>
                  <Text style={styles.songTitles} className="text-white font-bold text-2xl line-clamp-2 text-start ml-5 ">
                    {dataSearch?.title?.replace(/\s*\(.*?\)\s*/g, '')}
                  </Text>
                  <LottieView
                    source={require("../assets/Download.json")}
                    style={{ width: 100, height: 80 }}
                    autoPlay
                    loop
                  />
                </View>
                <View style={{ flexDirection: "row", marginTop: -20, marginLeft: -10, marginBottom: 10 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      marginTop: 20
                    }}
                  >
                    {episodedata?.seasons?.map((s) => {
                      const seasonNum = Number(s.more_info?.season_number);

                      return (
                        <TouchableOpacity
                          key={s?.title}
                          onPress={() => loadSeason(seasonNum)}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            borderRadius: 20,
                            marginHorizontal: 6,
                            backgroundColor:
                              selectedEpisode === seasonNum ? "#10b981" : "#1f2937",
                          }}
                        >
                          <Text style={{ color: "white", fontSize: 14 }}>
                            {s.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                <FlatList
                  data={episodedata?.episodes || []}
                  keyExtractor={(item) => item?.id}
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
                      handlePlay={handlePlay}
                    />
                  )}
                  ListFooterComponent={() => (
                    <View style={{ paddingHorizontal: 14, paddingVertical: 20, marginBottom: 50 }}>
                      <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>About</Text>
                      <Text style={{ color: "#aaa", marginTop: 6 }}>
                        {episodedata?.show_details?.header_desc}
                      </Text>
                      <View style={{ marginTop: 10, alignItems: "center" }}>
                        <Text style={{ color: "white", fontSize: 16 }}>
                          Released Year - {episodedata?.show_details?.year}
                        </Text>
                      </View>
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
                <View style={{ marginTop: -15, flex: 1 }}>

                  {/* Image */}
                  <Image
                    source={{ uri: currentSong?.artwork }}
                    style={styles.songImagee}
                    className="rounded-xl"
                  />

                  {/* Header */}
                  <Text
                    style={{
                      color: "white",
                      fontSize: 15,
                      fontWeight: "700",
                      marginTop: 20,
                      paddingHorizontal: 20,
                      lineHeight: 28,
                    }}
                  >
                    {currentSong?.header}
                  </Text>

                  {/* Episode Number + Year */}
                  <Text
                    style={{
                      color: "#bbb",
                      fontSize: 14,
                      marginTop: 10,
                      paddingHorizontal: 20,
                    }}
                  >
                    Episode-{currentSong?.episode_number} / Year - {currentSong?.year}
                  </Text>
                  <View style={styles.textContainer}>
                    <Text style={styles.songTitle}>
                      {currentSong?.title?.replace(/\s*\(.*?\)\s*/g, '')}
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
                  <View className='mt-[-5%] flex-1'>
                    <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginLeft: 20 }}>Description</Text>
                    <BottomSheetScrollView
                      style={{ marginTop: 0, marginBottom: 22 }}
                      showsVerticalScrollIndicator={false}

                    >
                      <Text
                        style={{
                          color: "white",
                          opacity: 0.7,
                          marginTop: 15,
                          paddingHorizontal: 20,
                          fontSize: 15,
                          lineHeight: 22,
                        }}
                      >
                        {currentSong?.Description}
                      </Text>
                    </BottomSheetScrollView>
                  </View>
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

export default Podresult;


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
    paddingLeft: 20,
    marginTop: 5,
  },
  songImage: {
    width: 290,
    height: 290,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    marginTop: 10,
    width: 280,
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

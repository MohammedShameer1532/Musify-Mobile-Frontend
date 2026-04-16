import { ActivityIndicator, Alert, FlatList, Image, PermissionsAndroid, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import RNBlobUtil from "react-native-blob-util";
import { ScrollView } from 'react-native';
import { usePlaylistSheetStore } from '../store/playlistSheetStore';
import { decode } from 'html-entities';


const Podresult = () => {
  const { dataSearch, setQrdata } = useContext(SearchContext);
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
  const lyricsCache = useRef({});
  const openSheet = usePlaylistSheetStore((state) => state.openSheet);
  const songDetailsMap = useRef({});
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
      songs.forEach(s => { songDetailsMap.current[s.id] = s; });

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


  const fetchLyrics = async (songid) => {
    if (!songid) return;

    if (lyricsCache.current[songid]) {
      setLyrics(lyricsCache.current[songid]);
      sheet.current?.snapToIndex(0);
      return;
    }

    try {
      const res = await axios.get(
        `https://jiosaavn-api.vercel.app/lyrics?id=${songid}`
      );

      const cleanLyrics = res?.data?.lyrics?.replace(/<br\s*\/?>/gi, "\n");
      console.log("lyriii", cleanLyrics);
      lyricsCache.current[songid] = cleanLyrics;
      setLyrics(cleanLyrics);

      sheet.current?.snapToIndex(0);

    } catch (error) {
      setLyrics("Lyrics Not Found");
      sheet.current?.snapToIndex(0);
    }
  };



  const handleCopy = () => {
    Clipboard.setString(lyrics || "");
    setCopied(true);

    // Reset back to copy icon after 2 sec
    setTimeout(() => setCopied(false), 1000);
  };



  const formatSongTitle = (rawTitle) => {
    if (!rawTitle) return 'Unknown';

    const decoded = decode(rawTitle); // Converts &quot; to "
    const titleMatch = decoded.match(/^(.+?)\s*\(From\s+"([^"]+)"\)/i);

    if (titleMatch) {
      const mainTitle = titleMatch[1].trim();
      const source = titleMatch[2].trim();
      return `${mainTitle} from ${source}`;
    }

    return decoded.trim(); // fallback if pattern doesn't match
  };


  const GradientBackground = ({ style }: BottomSheetBackgroundProps) => (
    <LinearGradient
      colors={[backgroundColors, "#000"]}
      style={[style, { borderRadius: 0 }]} // keep BottomSheet’s rounded corners
    />
  );



  const accentColor = '#1DB954';


  const handleshowqr = (item) => {
    setQrdata(item);
    openSheet();
  }


  const ListHeader = () => (
    <View>
      <View style={styles.albumHeader}>
        <Image
          source={{ uri: dataSearch?.imageUrl }}
          style={styles.albumImage}
        />
      </View>
      <View style={styles.albumInfoCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
          style={styles.albumInfoGradient}
        >
          <Text style={styles.albumLabel}>Radio</Text>
          <Text style={styles.albumName} numberOfLines={2}>
            {dataSearch?.title?.replace(/\s*\(.*?\)\s*/g, '')}
          </Text>
        </LinearGradient>
      </View>
      <View style={{ flexDirection: "row", marginTop: -20, marginLeft: -25, marginBottom: 20 }}>
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
    </View>
  );


  const selectedSongDetails = songDetailsMap.current[currentSong?.id];



  return (
    <MenuProvider skipInstanceCheck >
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={[backgroundColor, 'rgba(0,0,0,0.98)', '#000']}
          locations={[0, 0.5, 1]}
          style={styles.background}>
          <SafeAreaView style={styles.safeArea} className="flex-1 ">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            {dataSearch?.imageUrl && (
              <AverageColorExtractor
                key={dataSearch.imageUrl}
                imageUrl={dataSearch.imageUrl}
                onColorExtracted={(color) => {
                  if (color) {
                    setBackgroundColor(color);
                  }
                }}
              />
            )}
            {loading ? (
              <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
            ) : (
              <View className='flex-1 '>
                <FlatList
                  data={episodedata?.episodes || []}
                  keyExtractor={(item) => item?.id}
                  initialNumToRender={6}
                  maxToRenderPerBatch={6}
                  windowSize={10}
                  contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                  removeClippedSubviews={true}
                  getItemLayout={(data, index) => ({
                    length: 75,
                    offset: 75 * index,
                    index,
                  })}
                  ListHeaderComponent={<ListHeader />}
                  renderItem={({ item: song, index }) => (
                    <SongItem
                      song={song}
                      index={index}
                      currentSong={currentSong}
                      handlePlay={handlePlay}
                      handleDownload={handleDownload}
                      fetchLyrics={fetchLyrics}
                      handleshowqr={handleshowqr}
                      formatSongTitle={formatSongTitle}
                    />
                  )}
                  ListFooterComponent={() => (
                    <View style={{ paddingVertical: 20, marginBottom: 40 }}>

                      {/* About Card */}
                      <LinearGradient
                        colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
                        style={{
                          borderRadius: 24,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.08)',
                        }}
                      >
                        {/* Header Row */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          paddingHorizontal: 20,
                          paddingTop: 20,
                          paddingBottom: 14,
                          borderBottomWidth: 1,
                          borderBottomColor: 'rgba(255,255,255,0.06)',
                        }}>
                          <View style={{
                            width: 32, height: 32, borderRadius: 10,
                            backgroundColor: 'rgba(29,185,84,0.15)',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Ionicons name="information-circle-outline" size={18} color="#1DB954" />
                          </View>
                          <Text style={{
                            color: '#1DB954', fontSize: 11,
                            fontFamily: 'Poppins-Bold', letterSpacing: 3,
                          }}>
                            ABOUT THIS SHOW
                          </Text>
                        </View>

                        {/* Description */}
                        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                          <Text style={{
                            color: 'rgba(255,255,255,0.75)',
                            fontSize: 14,
                            lineHeight: 22,
                            fontFamily: 'Poppins-Regular',
                          }}>
                            {episodedata?.show_details?.header_desc}
                          </Text>
                        </View>

                        {/* Divider */}
                        <View style={{
                          height: 1,
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          marginHorizontal: 20,
                        }} />

                        {/* Released Year Row */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingHorizontal: 20,
                          paddingVertical: 16,
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="calendar-outline" size={15} color="rgba(255,255,255,0.4)" />
                            <Text style={{
                              color: 'rgba(255,255,255,0.45)',
                              fontSize: 12,
                              fontFamily: 'Poppins-Regular',
                            }}>
                              Released Year
                            </Text>
                          </View>
                          <View style={{
                            backgroundColor: 'rgba(29,185,84,0.12)',
                            paddingHorizontal: 14,
                            paddingVertical: 5,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: 'rgba(29,185,84,0.25)',
                          }}>
                            <Text style={{
                              color: '#1DB954',
                              fontSize: 12,
                              fontFamily: 'Poppins-Bold',
                            }}>
                              {episodedata?.show_details?.year}
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
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
                  <BottomSheetScrollView>
                    {/* Image */}
                    <View style={{ alignItems: 'center', marginTop: 10 }}>
                      <Image
                        source={{ uri: currentSong?.artwork }}
                        style={{
                          width: 260,
                          height: 260,
                          borderRadius: 16,
                          shadowColor: '#000',
                          shadowOpacity: 0.5,
                          shadowRadius: 20,
                          elevation: 10,
                        }}
                      />
                    </View>
                    <View style={{
                      alignSelf: 'stretch',
                      marginHorizontal: 16,
                      marginTop: 16,
                      borderRadius: 18,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.08)',

                    }}>
                      <LinearGradient
                        colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
                        style={{
                          borderRadius: 24,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.08)',
                          borderRadius: 18,
                        }}
                      >

                        {/* Episode Info */}
                        <View style={{ marginTop: 0, marginBottom: 20 }}>

                          <View style={styles.episodeContainer}>
                            {/* TITLE */}
                            <Text style={styles.episodeTitle} numberOfLines={2}>
                              {currentSong?.title}
                            </Text>

                            {/* META CHIPS */}
                            <View style={styles.metaRow}>
                              <View style={styles.metaChip}>
                                <Text style={styles.metaText}>
                                  Ep {currentSong?.episode_number}
                                </Text>
                              </View>

                              <View style={styles.metaChip}>
                                <Text style={styles.metaText}>
                                  {currentSong?.year}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>

                      </LinearGradient>
                    </View>
                    <View
                      style={{
                        marginTop: 25,
                        paddingHorizontal: 20,
                        paddingVertical: 15,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 20,
                        marginHorizontal: 16,
                      }}
                    >
                      <View style={styles.textContainer}>
                        <Text style={styles.songTitled}>
                          {currentSong?.title?.replace(/\s*\(.*?\)\s*/g, '')}
                        </Text>
                        <View style={styles.icons}>
                          <Menu>
                            <MenuTrigger customStyles={{ optionWrapper: { activeOpacity: 0.6 } }}>
                              <MaterialCommunityIcons name="dots-vertical" color="#fff" size={28} />
                            </MenuTrigger>
                            <MenuOptions
                              customStyles={{
                                optionsContainer: {
                                  paddingVertical: 10,
                                  borderRadius: 12,
                                  backgroundColor: '#2a2a2a',   // sleek dark background
                                  marginTop: 5,
                                  width: 140,
                                  shadowColor: '#000',
                                  shadowOpacity: 0.2,
                                  shadowRadius: 6,
                                  elevation: 6,
                                  paddingHorizontal: 10,
                                },
                                optionWrapper: {
                                  paddingVertical: 12,
                                  paddingHorizontal: 14,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                },
                                optionText: {
                                  color: '#fff',
                                  fontSize: 15,
                                  fontWeight: '500',
                                  marginLeft: 12,


                                },
                              }}
                            >
                              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => fetchLyrics(currentSong?.id)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <MaterialIcons name="lyrics" size={20} color="#1DB954" />
                                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Lyrics</Text>
                                </View>
                              </MenuOption>
                              <View style={{
                                height: 1,
                                backgroundColor: '#444',  // softer, modern divider
                                marginVertical: 6,
                                marginHorizontal: 10,
                                width: 'auto'
                              }} />
                              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleDownload(currentSong?.url, `${currentSong?.title}.mp3`)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <FontAwesome6 name="download" size={20} color="#4da6ff" />
                                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Download</Text>
                                </View>
                              </MenuOption>
                              <View style={{
                                height: 1,
                                backgroundColor: '#444',  // softer, modern divider
                                marginVertical: 6,
                                marginHorizontal: 10,
                                width: 'auto'
                              }} />
                              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleshowqr(currentSong)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Ionicons name="qr-code-outline" color="#cccccc" size={24} />
                                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 10, fontFamily: 'Poppins-Bold', }}>QR Code</Text>
                                </View>
                              </MenuOption>
                            </MenuOptions>
                          </Menu>
                        </View>
                      </View>
                      <Music />
                    </View>
                    {selectedSongDetails && (
                      <View style={{
                        alignSelf: 'stretch',
                        marginHorizontal: 16,
                        marginTop: 16,
                        borderRadius: 18,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}>
                        <LinearGradient
                          colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
                          style={{ padding: 16 }}
                        >
                          {/* Section title */}
                          <Text style={{
                            color: '#1DB954', fontSize: 16, fontFamily: 'Poppins-Bold',
                            letterSpacing: 2, marginBottom: 12,
                          }}>
                            SONG INFO
                          </Text>

                          {[
                            { icon: 'calendar-outline', iconLib: 'Ionicons', label: 'Release Date', value: selectedSongDetails?.releaseDate },
                            { icon: 'time-outline', iconLib: 'Ionicons', label: 'Year', value: selectedSongDetails?.year },
                            { icon: 'pricetag-outline', iconLib: 'Ionicons', label: 'Label', value: selectedSongDetails?.label },
                            { icon: 'headphones', iconLib: 'Material', label: 'Play Count', value: selectedSongDetails?.playCount?.toLocaleString() },
                            { icon: 'copyright', iconLib: 'Material', label: 'Copyright', value: selectedSongDetails?.copyright },
                          ].map(({ icon, iconLib, label, value }, i, arr) =>
                            value ? (
                              <View key={label}>
                                <View style={{
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  paddingVertical: 10,
                                }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    {iconLib === 'Ionicons'
                                      ? <Ionicons name={icon} size={15} color="rgba(255,255,255,0.4)" />
                                      : <MaterialIcons name={icon} size={15} color="rgba(255,255,255,0.4)" />
                                    }
                                    <Text style={{
                                      color: 'rgba(255,255,255,0.45)', fontSize: 12,
                                      fontFamily: 'Poppins-Regular',
                                    }}>
                                      {label}
                                    </Text>
                                  </View>
                                  <Text style={{
                                    color: '#fff', fontSize: 12, fontFamily: 'Poppins-Bold',
                                    maxWidth: '55%', textAlign: 'right',
                                  }}>
                                    {value}
                                  </Text>
                                </View>
                                {/* divider — skip after last item */}
                                {i < arr.length - 1 && (
                                  <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                                )}
                              </View>
                            ) : null
                          )}
                        </LinearGradient>
                      </View>
                    )}
                    <View style={styles.descSection}>


                      <View style={styles.descCardModern}>
                        <Text style={styles.descHeader}>ABOUT EPISODE</Text>
                        <Text style={styles.descTextModern}>
                          {currentSong?.Description}
                        </Text>
                      </View>
                    </View>
                  </BottomSheetScrollView>
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
              backgroundStyle={{
                backgroundColor: '#000',
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
              }}
            >
              <View style={{ display: 'flex', flexDirection: 'row', marginLeft: 10, marginTop: 10 }}>
                <MaterialIcons name="lyrics" size={25} color="#1DB954" />

                <Text
                  style={{
                    fontSize: 18,
                    marginLeft: 10,
                    color: "grey",
                    fontFamily: 'Poppins-Bold',
                  }}
                >

                  Lyrics 🎶
                </Text>
              </View>
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
                    fontFamily: 'Poppins-Bold',
                  }}
                >
                  {lyrics}
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



// ====================== Modern Song Item ======================
const SongItem = React.memo(({ index, song, currentSong, handlePlay, handleDownload, fetchLyrics, handleshowqr, formatSongTitle }) => {
  const isPlaying = currentSong?.id === song?.id;

  return (
    <View style={styles.songCard}>
      <TouchableOpacity onPress={() => handlePlay(song, index)} activeOpacity={0.8} style={{ flex: 1 }}>
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
              source={{ uri: song?.more_info?.square_image }}
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
                style={[styles.songTitle, isPlaying && { color: "#1DB954", width: 155, }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatSongTitle(song?.title)}
              </Text>
            </View>
            <Text style={styles.artist} numberOfLines={1}>
              {song?.artists?.primary[0]?.name ? song?.artists?.primary[0]?.name.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.songRight}>
        <TouchableOpacity style={styles.playButton} onPress={() => handlePlay(song, index)} activeOpacity={0.8}>
          <FontAwesome
            name="play"
            size={20}
            color="black"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
        <View style={{ alignItems: 'flex-end', padding: 5, marginRight: -5 }}>
          <Menu>
            <MenuTrigger customStyles={{ optionWrapper: { activeOpacity: 0.6 } }}>
              <MaterialCommunityIcons name="dots-vertical" color="#fff" size={28} />
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: {
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: '#2a2a2a',   // sleek dark background
                  marginTop: 5,
                  width: 140,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 6,
                  paddingHorizontal: 10,
                },
                optionWrapper: {
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                },
                optionText: {
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: '500',
                  marginLeft: 12,


                },
              }}
            >
              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => fetchLyrics(song?.id)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="lyrics" size={20} color="#1DB954" />
                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Lyrics</Text>
                </View>
              </MenuOption>
              <View style={{
                height: 1,
                backgroundColor: '#444',  // softer, modern divider
                marginVertical: 6,
                marginHorizontal: 10,
                width: 'auto'
              }} />
              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleDownload(song?.downloadUrl[4]?.url, `${song?.name}.mp3`)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome6 name="download" size={20} color="#4da6ff" />
                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Download</Text>
                </View>
              </MenuOption>
              <View style={{
                height: 1,
                backgroundColor: '#444',  // softer, modern divider
                marginVertical: 6,
                marginHorizontal: 10,
                width: 'auto'
              }} />
              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleshowqr(song)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="qr-code-outline" color="#cccccc" size={24} />
                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 10, fontFamily: 'Poppins-Bold', }}>QR Code</Text>
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
      </View>

    </View>
  );
});



const styles = StyleSheet.create({
  episodeContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  episodeTitle: {
    color: '#1DB954',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    textAlign: 'left',

  },

  metaRow: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },

  metaChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  metaText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },

  descSection: {
    marginTop: 30,
    marginBottom: 30,
  },

  descHeader: {
    fontSize: 16,
    color: '#1DB954',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 2,
    marginBottom: 12,

  },

  descCardModern: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 20,

    backgroundColor: 'rgba(255,255,255,0.05)',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',

    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },

  descTextModern: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
  },
  container: {
    flex: 1,
  },
  // Album Info
  albumInfoCard: {
    marginHorizontal: 0,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginTop: 20,
  },
  albumInfoGradient: {
    padding: 20,
  },
  albumLabel: {
    color: '#1DB954',
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 3,
    marginBottom: 6,
  },
  albumName: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.3,
    lineHeight: 32,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(29,185,84,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.25)',
  },
  metaBadgeText: {
    color: '#1DB954',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  albumHeader: {
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 30,
    // zIndex: 1000,
  },
  albumImage: {
    width: 260,
    height: 260,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },

  albumInfo: {
    marginTop: 18,
    alignItems: 'center',
  },

  albumTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    textAlign: 'center',
  },

  albumMeta: {
    marginTop: 0,
    fontSize: 14,
    color: '#cfcfcf',
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 50,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#1DB954",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    marginRight: 5,
  },
  // Song item
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(10px)',
  },
  songLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  songImage: { width: 60, height: 60, borderRadius: 10, marginRight: 12, borderWidth: 2 },
  songText: { flex: 1, paddingRight: 8, },
  songTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    marginBottom: -5,
    width: 180,
  },
  artist: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 10,
  },
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
    paddingLeft: 20,
    marginTop: 5,
  },
  songTitled: {
    fontSize: 15,
    color: 'white',
    marginTop: 10,
    width: 280,
    fontFamily: 'Poppins-Bold',
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
  icons: {
    paddingTop: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    letterSpacing: 10,
    width: 100,
    position: 'absolute',
    marginLeft: 290,
  },
  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '2%',
  },
});

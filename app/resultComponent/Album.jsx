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
import TrackPlayer, { useActiveTrack } from 'react-native-track-player';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from "react-native-vector-icons/Entypo";
import LottieView from 'lottie-react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import RNBlobUtil from "react-native-blob-util";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { usePlaylistSheetStore } from '../store/playlistSheetStore';
import { decode } from 'html-entities';


const Album = () => {
  const [albumData, setAlbumData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("rgb(30, 30, 30)");
  const navigation = useNavigation();
  const { dataSearch, setQrdata } = useContext(SearchContext);
  const id = dataSearch;
  const sheetRef = useRef(null);
  const sheet = useRef(null);
  const snapPoints = useMemo(() => ["100%"]);
  const lyricsSnapPoints = useMemo(() => ["50%", "100%"], []);
  const currentSong = useActiveTrack();
  const [lyrics, setLyrics] = useState();
  const [copied, setCopied] = useState(false);
  const [showDownloadAnim, setShowDownloadAnim] = useState(false);
  const lyricsCache = useRef({});
  const openSheet = usePlaylistSheetStore((state) => state.openSheet);
  const songDetailsMap = useRef({});
  console.log('activetrack', currentSong);
  console.log("songData", dataSearch);
  console.log("currentSong", currentSong);



  const matchIds = async (id) => {
    try {
      setLoading(true);
      let responseData;
      const apiUrl1 = await axios.get(`https://musify-api-inky.vercel.app/api/albums?id=${id}`);
      responseData = apiUrl1.data;
      const res = responseData.data;
      console.log('resss', res);
      setAlbumData([res]); // Wrap it in an array
      setTimeout(() => {
        setLoading(false);
      }, 400);
    } catch (error) {
      console.error('Error fetching:', error);
    }
  };
  console.log('albumData', albumData);

  useEffect(() => {
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
      const songs = albumData[0]?.songs || [];
      if (!songs.length) return;
      songs.forEach(s => { songDetailsMap.current[s.id] = s; });
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
        hasArtwork: true,
      }));

      // Add reordered queue
      await TrackPlayer.add(orderedQueue);

      // Play clicked song
      await TrackPlayer.skip(0);
      await TrackPlayer.play();

      sheetRef.current?.snapToIndex(0);

    } catch (error) {
      console.log('handlePlay error:', error);
    }
  };

  const GradientBackground = ({ style }) => (
    <LinearGradient
      colors={[backgroundColor, '#000', 'rgba(0,0,0,0.98)',]}
      style={[style, { borderRadius: 0 }]}
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
          setShowDownloadAnim(true); // show animation
          setTimeout(() => setShowDownloadAnim(false), 100);
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

  const accentColor = '#1DB954';


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

  const handleshowqr = (item) => {
    setQrdata(item);
    openSheet();
  }


  const ListHeader = () => (
    <View>
      <View style={styles.albumHeader}>
        <Image
          source={{ uri: albumData[0]?.image[2]?.url }}
          style={styles.albumImage}
        />
      </View>
      <View style={styles.albumInfoCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
          style={styles.albumInfoGradient}
        >
          <Text style={styles.albumLabel}>{albumData[0]?.type}</Text>
          <Text style={styles.albumName} numberOfLines={2}>
            {albumData[0]?.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="musical-notes" size={12} color={accentColor} />
              <Text style={styles.metaBadgeText}>{albumData[0]?.songCount} Songs</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>

  );
  const selectedSongDetails = songDetailsMap.current[currentSong?.id];

  return (
    <MenuProvider skipInstanceCheck>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={[backgroundColor, 'rgba(0,0,0,0.98)', '#000']}
          locations={[0, 0.5, 1]}
          style={styles.background}>
          <SafeAreaView style={styles.safeArea} className="flex-1 ">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            {albumData.length > 0 && (
              <AverageColorExtractor
                imageUrl={albumData[0]?.image[2]?.url}
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
                <FlatList
                  className='flex-1 '
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 10,
                    paddingBottom: 40
                  }}
                  data={albumData[0]?.songs}
                  keyExtractor={song => song.id}
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
                  key={currentSong?.id}
                  imageUrl={currentSong.artwork}
                  onColorExtracted={(color) => {
                    if (color) setBackgroundColor(color);
                  }}
                />
              )}
              <BottomSheetScrollView
                contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.songContainer}>
                  {currentSong?.artwork ? (
                    <Image
                      source={{ uri: currentSong.artwork }}
                      style={styles.songImages}
                      className="rounded-xl"
                    />
                  ) : (
                    <View style={[styles.songImages, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: 'white' }}>No Image</Text>
                    </View>
                  )}
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
                      <Text
                        style={[
                          styles.songTitles,
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
                      <Text style={styles.artists}>{currentSong?.artist.replace(/\s*\(.*?\)\s*/g, '')}</Text>
                      <View style={styles.icons}>
                        <View style={{ alignItems: 'flex-end', padding: 5 }}>
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
                          color: '#1DB954', fontSize: 11, fontFamily: 'Poppins-Bold',
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
                </View>
              </BottomSheetScrollView>
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
              <Text
                style={{
                  fontSize: 18,
                  marginLeft: 10,
                  marginTop: 5.5,
                  marginBottom: 20,
                  color: "grey",
                  fontFamily: 'Poppins-Bold',
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
  );
};

export default Album;




// ====================== Modern Song Item ======================
const SongItem = React.memo(({ index, song, currentSong, handlePlay, handleDownload, fetchLyrics, handleshowqr, formatSongTitle }) => {
  const isPlaying = currentSong?.id === song?.id;

  return (
    <View style={styles.songCard}>
      <TouchableOpacity onPress={() => handlePlay(song, index)} activeOpacity={0.8} style={{ flex: 1 }}  >
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
              source={{ uri: song?.image[2]?.url }}
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
                style={[styles.songTitle, isPlaying && { color: "#1DB954", width: 145, }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatSongTitle(song?.name)}
              </Text>
            </View>
            <Text style={styles.artist} numberOfLines={1}>
              {song?.artists?.primary[0]?.name ? song?.artists?.primary[0]?.name.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
    marginTop: 20
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
    marginRight: -10,
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
  songImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
    marginRight: 14,
    borderWidth: 2,
  },
  songText: {
    flex: 1,
    paddingRight: 8,
  },
  songTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    marginBottom: -5,

  },
  artist: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 5,
  },
  songRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 6,
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backIcon: {
    marginLeft: 10,
    marginTop: -5,
  },
  songContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  textContainer: {
    alignSelf: 'flex-start',
    paddingLeft: 30,
    marginTop: 10,
  },
  songImages: {
    width: 260,
    height: 260,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  songTitles: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.2,
  },
  album: {
    fontSize: 16,
    color: 'grey',
    marginTop: 5,
  },
  artists: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  icons: {
    paddingTop: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    letterSpacing: 10,
    width: 50,
    position: 'absolute',
    marginLeft: 300,
  },
  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '2%',
  },
  menuTriggerSmall: {
    padding: 6,
  },
});

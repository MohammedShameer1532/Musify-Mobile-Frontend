import React, { useEffect, useContext, useState, useRef, useMemo } from 'react';
import { View, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Text, Button, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AverageColorExtractor from '../common/AverageColorExtractor';
import axios from 'axios';
import { SearchContext } from '../contextProvider/searchContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import LinearGradient from 'react-native-linear-gradient';
import TrackPlayer, { Capability } from 'react-native-track-player';
import Music from '../common/Music';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/Entypo';
import { Alert, PermissionsAndroid, Platform } from "react-native";
import RNBlobUtil from "react-native-blob-util";
import { SmoothSheet } from 'react-native-smooth-sheet';
import Clipboard from '@react-native-clipboard/clipboard';
import { decode } from 'html-entities';
import { usePlaylistSheetStore } from '../store/playlistSheetStore';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';



const Tsongs = () => {
  const [copied, setCopied] = useState(false);
  const sheet = useRef(null);
  const lyricsSnapPoints = useMemo(() => ["50%", "100%"], []);
  const navigation = useNavigation();
  const [backgroundColor, setBackgroundColor] = useState('rgb(30, 30, 30)');
  const [loading, setLoading] = useState(true);
  const [songData, setSongData] = useState([]);
  const [lyrics, setLyrics] = useState();
  const { setCurrentSong, dataSearch, setCurrentIndex, setSongsList, currentSong, setQrdata } = useContext(SearchContext);
  const id = dataSearch;
  console.log('songData', dataSearch);
  console.log('currentSong', currentSong);
  const songId = currentSong?.id;
  console.log("siiii", songId);
  const openSheet = usePlaylistSheetStore((state) => state.openSheet);
  const lyricsCache = useRef({});
  const songDetailsMap = useRef({});


  const songIds = async (id) => {
    try {
      setLoading(true);
      const responseData = await axios.get(`https://saavn.sumit.co/api/songs?ids=${id}`);
      const res = responseData?.data.data[0];
      setSongData([res])
      console.log('resss', res);
      (res);
      setTimeout(() => {
        setLoading(false);
      }, 400);
    } catch (error) {
      console.error('Error fetching:', error);
      setLoading(false);
    }
  }
  console.log('songData', songData);

  useEffect(() => {
    songIds(id);
  }, []);


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

  useEffect(() => {
    if (songData.length > 0) {
      handlePlay(); // Call after songData is available
    }
  }, [songData]);

  const handlePlay = async () => {
    if (songData.length > 0) {
      const item = songData[0]; // Make sure you're using the correct item
      songDetailsMap.current[item.id] = item;
      const track = {
        id: item?.id,
        url: item?.downloadUrl[4]?.url,
        title: formatSongTitle(item?.name),
        artist: item?.artists?.primary[0]?.name,
        artwork: item?.image[2]?.url,
      };

      setCurrentSong(track);
      setCurrentIndex(item);
      setSongsList();

      // Reset and add track to TrackPlayer
      await TrackPlayer.reset();
      await TrackPlayer.add([track]);
      await TrackPlayer.play();

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

    // return cached lyrics
    if (lyricsCache.current[songid]) {
      setLyrics(lyricsCache.current[songid]);
      sheet.current?.snapToIndex(0);
      return;
    }

    try {
      const res = await axios.get(
        `https://jiosaavn-api.vercel.app/lyrics?id=${songid}`
      );

      const rawLyrics = res?.data?.lyrics;

      const cleanLyrics = decode(
        rawLyrics?.replace(/<br\s*\/?>/gi, "\n") || "Lyrics not available"
      );

      lyricsCache.current[songid] = cleanLyrics;

      setLyrics(cleanLyrics);

      sheet.current?.snapToIndex(0);

    } catch (error) {
      console.log("Lyrics error:", error);
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



  const handleshowqr = (item) => {
    setQrdata(item);
    openSheet();
  }

  const selectedSongDetails = songDetailsMap.current[currentSong?.id];

  return (
    <MenuProvider skipInstanceCheck >
      <LinearGradient colors={[backgroundColor, 'rgba(0,0,0,0.98)', '#000']}
        locations={[0, 0.5, 1]} style={styles.background}>
        {console.log('Applying Background Color:', backgroundColor)}
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={25} color="white" />
          </TouchableOpacity>
          {songData.length > 0 && (
            <AverageColorExtractor
              imageUrl={songData[0]?.image[2]?.url}
              onColorExtracted={(color) => {
                setBackgroundColor(color);
              }}
            />
          )}
          {loading ? (
            <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
          ) : (
            <FlatList
              data={songData}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View style={styles.songContainer} key={index}>
                  <Image source={{ uri: item?.image[2]?.url }} style={styles.songImage} className="rounded-xl" />
                  <View
                    style={{
                      marginTop: 30,
                      paddingVertical: 15,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 20,
                      marginHorizontal: 16,
                      alignSelf: 'stretch',
                    }}
                  >
                    <View style={styles.textContainer}>
                      <TouchableOpacity className="w-[100%]">
                        <Text style={styles.songTitle}>{formatSongTitle(item?.name)}</Text>
                        <Text style={styles.artist}>{item?.artists?.all[0]?.name}</Text>
                      </TouchableOpacity>
                      <View style={styles.icons}>
                        <View style={{ alignItems: 'flex-end', padding: 0 }}>
                          <Menu>
                            <MenuTrigger customStyles={{ optionWrapper: { activeOpacity: 0.6 } }}>
                              <MaterialCommunityIcons name="dots-vertical" color="#fff" size={30} />
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
                              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => fetchLyrics(item?.id)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <MaterialIcons name="lyrics" size={20} color="#1DB954" />
                                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold' }}>Lyrics</Text>
                                </View>
                              </MenuOption>
                              <View style={{
                                height: 1,
                                backgroundColor: '#444',  // softer, modern divider
                                marginVertical: 6,
                                marginHorizontal: 10,
                                width: 'auto'
                              }} />
                              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleDownload(item?.downloadUrl[4]?.url, `${item?.name}.mp3`)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <FontAwesome6 name="download" size={20} color="#4da6ff" />
                                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold' }}>Download</Text>
                                </View>
                              </MenuOption>
                              <View style={{
                                height: 1,
                                backgroundColor: '#444',  // softer, modern divider
                                marginVertical: 6,
                                marginHorizontal: 10,
                                width: 'auto'
                              }} />
                              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleshowqr(item)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Ionicons name="qr-code-outline" color="#cccccc" size={24} />
                                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 10, fontFamily: 'Poppins-Bold' }}>QR Code</Text>
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
                      marginBottom: 25,
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
              )}
            />
          )}
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
    </MenuProvider>
  )
}

export default Tsongs;


const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
  backIcon: {
    marginLeft: 10,
    marginTop: 10,
  },
  songContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  textContainer: {
    alignSelf: 'flex-start',
    paddingLeft: 30,
    marginTop: 10,
    width: '100%',
  },
  songImage: {
    width: 260,
    height: 260,
  },
  songTitle: {
    fontSize: 22,
    color: 'white',
    marginTop: 10,
    fontFamily: 'Poppins-Bold',
    width: 280
  },
  album: {
    fontSize: 13.5,
    fontFamily: 'Poppins-Medium',
    color: '#aaa',
    marginTop: 5,
  },
  artist: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
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

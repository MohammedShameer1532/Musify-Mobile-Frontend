import { ActivityIndicator, Alert, Dimensions, FlatList, Image, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import * as Progress from 'react-native-progress';
import { NativeModules } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveDownload } from '../Database/downloadRepository';



const { width } = Dimensions.get('window'); // ✅ screen width
const SONG_IMAGE_SIZE = Math.min(
  width * 0.62,
  320
);

const BASE_WIDTH = 360;

const scale = (size) => (width / BASE_WIDTH) * size;

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

  const url = dataSearch?.permurl;
  const id = url.split("/").pop();
  const [globalDownload, setGlobalDownload] = useState({
    progress: 0,
    isDownloading: false,
  });

  const { Mp3TagModule } = NativeModules;
  const [translatedLyrics, setTranslatedLyrics] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('original');
  const [translating, setTranslating] = useState(false);
  const [lyricsdata, setLyricsdata] = useState(null);



  // Guards against out-of-order translation responses when the user
  // taps through languages quickly.
  const translateRequestId = useRef(0);

  // Caches translations per-song per-language so re-selecting a
  // language you've already viewed doesn't re-hit the API.
  const translationCache = useRef({});

  const lyricLanguages = [
    { code: 'original', name: 'Original' },
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'Tamil' },
    { code: 'hi', name: 'Hindi' },
    { code: 'te', name: 'Telugu' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'kn', name: 'Kannada' },
    { code: 'bn', name: 'Bengali' },
    { code: 'mr', name: 'Marathi' },
  ];
  const selectedLanguageName = lyricLanguages.find((language) => language.code === selectedLanguage)?.name || 'English';

  // Converts phonetic Latin-script spelling of a native-script language
  // (e.g. "Naan unnai kadhalikkiren") into real native script (நான் உன்னை
  // காதலிக்கிறேன்). This is Google's Input Tools / Gboard transliteration
  // engine — a different service from Translate, built specifically for
  // this "same language, different script" conversion.
  const transliterateChunk = async (text, targetLang) => {
    const response = await axios.get(
      'https://inputtools.google.com/request',
      {
        params: {
          text,
          itc: `${targetLang}-t-i0-und`,
          num: 1,
          cp: 0,
          cs: 1,
          ie: 'utf-8',
          oe: 'utf-8',
        },
      }
    );

    const status = response?.data?.[0];
    const candidates = response?.data?.[1]?.[0]?.[1];

    if (status === 'SUCCESS' && Array.isArray(candidates) && candidates[0]) {
      return candidates[0];
    }

    throw new Error('Transliteration failed');
  };

  // Calls Google's public "gtx" translate endpoint directly via axios.
  // (The google-translate-api-x npm package targets a Node.js server
  // runtime; inside React Native/Hermes it frequently resolves without
  // throwing but returns the original, untranslated text — which is
  // why Tamil selection was silently showing English.)
  const translateTextChunk = async (text, targetLang) => {
    const response = await axios.get(
      'https://translate.googleapis.com/translate_a/single',
      {
        params: {
          client: 'gtx',
          sl: 'auto',
          tl: targetLang,
          dt: 't',
          q: text,
        },
      }
    );

    // Response shape: [[[translatedPiece, originalPiece, ...], ...], detectedSourceLang, ...]
    const segments = response?.data?.[0];
    const detectedSourceLang = response?.data?.[2];

    if (!Array.isArray(segments)) {
      throw new Error('Unexpected translate response shape');
    }

    const translated = segments.map((segment) => segment?.[0] ?? '').join('');

    // If Google detects the source text is ALREADY the target language
    // (this happens with Tanglish/Hinglish-style lyrics — words of the
    // target language spelled in the Latin alphabet), dt=t just echoes
    // the input back verbatim instead of converting the script. Fall
    // back to transliteration to actually get native script out.
    if (detectedSourceLang === targetLang && translated.trim() === text.trim()) {
      try {
        const lines = text.split('\n');
        const transliteratedLines = [];

        for (const line of lines) {
          if (!line.trim()) {
            transliteratedLines.push(line);
            continue;
          }
          transliteratedLines.push(await transliterateChunk(line, targetLang));
        }

        return transliteratedLines.join('\n');
      } catch (transliterationError) {
        console.error('Transliteration fallback failed:', transliterationError);
        return translated;
      }
    }

    return translated;
  };

  // Google's endpoint caps request size, so long lyrics are translated
  // in line-based chunks and stitched back together.
  const translateLongText = async (text, targetLang) => {
    const MAX_CHUNK = 3500;
    if (text.length <= MAX_CHUNK) {
      return translateTextChunk(text, targetLang);
    }

    const lines = text.split('\n');
    const chunks = [];
    let current = '';

    for (const line of lines) {
      if ((current + '\n' + line).length > MAX_CHUNK) {
        chunks.push(current);
        current = line;
      } else {
        current = current ? `${current}\n${line}` : line;
      }
    }
    if (current) chunks.push(current);

    const translatedChunks = [];
    for (const chunk of chunks) {
      translatedChunks.push(await translateTextChunk(chunk, targetLang));
    }
    return translatedChunks.join('\n');
  };

  const translateLyrics = async (text, language) => {
    if (!text || !language) return;

    const cacheKey = `${songId || 'unknown'}:${language}`;
    if (translationCache.current[cacheKey]) {
      setTranslatedLyrics(translationCache.current[cacheKey]);
      return;
    }

    const requestId = ++translateRequestId.current;

    try {
      setTranslating(true);

      const translatedText = await translateLongText(text, language);

      // Only apply this result if it's still the most recent request.
      if (requestId === translateRequestId.current) {
        translationCache.current[cacheKey] = translatedText;
        setTranslatedLyrics(translatedText);
      }
    } catch (error) {
      console.error('Translation error:', error);
      if (requestId === translateRequestId.current) {
        setTranslatedLyrics('Translation failed');
      }
    } finally {
      if (requestId === translateRequestId.current) {
        setTranslating(false);
      }
    }
  };





  const poddata = async () => {
    try {
      setLoading(true);
      const ress = await axios.get(
        `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${id}&type=show&season_number=1&sort_order=&includeMetaTags=0&ctx=wap6dot0&api_version=4&_format=json&_marker=0`
      );

      const podres = ress?.data;
      console.log('resp', podres);

      setEpisodedata(podres);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);   // ✅ VERY IMPORTANT
    }
  };



  const loadSeason = async (seasonNum) => {
    try {
      setSelectedEpisode(Number(seasonNum));
      const res = await axios.get(
        `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${id}&type=show&season_number=${seasonNum}&ctx=wap6dot0&api_version=4&_format=json&_marker=0`
      );
      const dd = res?.data;
      setEpisodedata(res.data); // update list to show selected season episodes

    } catch (err) {
      console.error("Error:", err);
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

    } catch (e) {
      console.error("Preload error:", e);
    }
  };

  useEffect(() => {
    if (episodedata?.episodes?.length > 0) {
      preloadAllSongs();
    }

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
      console.error('handlePlay error:', error);
    }
  };




  const handleDownload = async (song) => {

    try {

      const resp = await axios.get(
        `https://musify-api-inky.vercel.app/api/songs?ids=${song?.id}`
      );
      const item = resp?.data?.data?.[0];

      // =========================
      // ANDROID STORAGE PERMISSION
      // =========================

      if (
        Platform.OS === "android" &&
        Platform.Version < 33
      ) {

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs storage access to save songs.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {

          Alert.alert(
            "Permission denied",
            "Cannot download without permission"
          );

          return;
        }
      }

      // =========================
      // SAFE FILE NAME
      // =========================

      const safeName = (
        formatSongTitle(item?.name) || "Song"
      )
        .replace(/[<>:"/\\|?*]+/g, "")
        .trim();

      // =========================
      // SONG URL
      // =========================

      const songUrl = item?.downloadUrl?.[4]?.url;

      if (!songUrl) {

        Alert.alert(
          "Error",
          "Song URL not found"
        );

        return;
      }


      // =========================
      // DETECT FILE TYPE
      // =========================

      const extension =
        songUrl.includes(".mp4")
          ? "m4a"
          : "mp3";


      // =========================
      // PATHS
      // =========================

      const tempPath =
        `${RNBlobUtil.fs.dirs.CacheDir}/${safeName}.${extension}`;

      const finalPath =
        `/storage/emulated/0/Download/${safeName}.${extension}`;

      // =========================
      // START LOADER
      // =========================

      setGlobalDownload({
        progress: 0,
        downloadedMB: 0,
        isDownloading: true,
      });

      // =========================
      // DELETE OLD TEMP FILE
      // =========================

      const tempExists =
        await RNBlobUtil.fs.exists(tempPath);

      if (tempExists) {

        await RNBlobUtil.fs.unlink(tempPath);
      }

      // =========================
      // DELETE OLD FINAL FILE
      // =========================

      const finalExists =
        await RNBlobUtil.fs.exists(finalPath);

      if (finalExists) {

        await RNBlobUtil.fs.unlink(finalPath);
      }

      // =========================
      // DOWNLOAD FILE
      // =========================

      const res = await RNBlobUtil.config({
        path: tempPath,
        fileCache: true,
      })
        .fetch(
          "GET",
          songUrl,
          {
            "Cache-Control": "no-store",
          }
        )
        .progress(
          { interval: 250 },
          (received, total) => {

            const percent = Math.floor(
              (received / total) * 100
            );

            const downloadedMB = (
              received /
              1024 /
              1024
            ).toFixed(2);

            setGlobalDownload({
              progress: percent,
              downloadedMB,
              isDownloading: true,
            });

          }
        );


      // =========================
      // WAIT FOR FILE FLUSH
      // =========================

      await new Promise(resolve =>
        setTimeout(resolve, 3000)
      );

      // =========================
      // VERIFY FILE EXISTS
      // =========================

      const exists =
        await RNBlobUtil.fs.exists(tempPath);

      if (!exists) {

        throw new Error(
          "Downloaded file missing"
        );
      }

      // =========================
      // VERIFY FILE SIZE
      // =========================

      const stat =
        await RNBlobUtil.fs.stat(tempPath);


      if (Number(stat.size) < 1000000) {

        throw new Error(
          "Corrupted audio file"
        );
      }

      // =========================
      // WRITE TAGS
      // =========================

      try {

        if (Mp3TagModule) {

          await Mp3TagModule.writeTags(
            tempPath,
            {
              title: formatSongTitle(item?.name),

              artist: formatSongTitle(
                item?.artists?.primary?.[0]?.name
              ),

              album: formatSongTitle(
                item?.album?.name
              ),

              year: item?.year?.toString(),

              imageUrl:
                item?.image?.[2]?.url,
            }
          );

        }

      } catch (tagError) {

        console.error(
          "Metadata tagging failed:",
          tagError
        );
      }

      // =========================
      // COPY TO DOWNLOADS
      // =========================

      await RNBlobUtil.fs.cp(
        tempPath,
        finalPath
      );

      // =========================
      // DELETE TEMP FILE
      // =========================

      await RNBlobUtil.fs.unlink(
        tempPath
      );

      // =========================
      // MEDIA SCAN
      // =========================

      await RNBlobUtil.fs.scanFile([
        {
          path: finalPath,

          mime:
            extension === "m4a"
              ? "audio/mp4"
              : "audio/mpeg",
        },
      ]);
      // =========================
      // SAVE TO SQLITE DATABASE
      // =========================
      console.log("Saving to database...");
      await saveDownload({
        id: item.id,

        title: formatSongTitle(item?.name),

        artist:
          item?.artists?.primary?.[0]?.name || "Unknown",

        album:
          item?.album?.name || "",

        image:
          item?.image?.[2]?.url || "",

        path: finalPath,

        extension,

        downloadedAt: Date.now(),
      });

      console.log("Saved to database");
      // =========================
      // STOP LOADER
      // =========================

      setGlobalDownload({
        progress: 100,
        downloadedMB: 0,
        isDownloading: false,
      });

      // =========================
      // SHOW SUCCESS ANIMATION
      // =========================

      setShowDownloadAnim(true);

      Alert.alert(
        "Download Complete 🎵",
        `${safeName}.${extension} saved to Download folder`
      );

    } catch (error) {

      console.error(
        "handleDownload error:",
        error
      );

      setGlobalDownload({
        progress: 0,
        downloadedMB: 0,
        isDownloading: false,
      });

      Alert.alert(
        "Error",
        error?.message ||
        "Something went wrong"
      );
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
          <Text style={styles.albumLabel} className='font-bold'>Podcast</Text>
          <Text style={styles.albumName} numberOfLines={2} className='font-bold'>
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
                <Text style={{ color: "white", fontSize: scale(14) }}>
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
              <Ionicons name="arrow-back" size={scale(22)} color="white" />
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
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color="#10b981"
                />
                <Text style={styles.loadingText}>
                  Loading...
                </Text>
              </View>
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
                            color: '#1DB954', fontSize: scale(15),
                            fontFamily: 'Poppins-Bold',
                          }}>
                            About this show
                          </Text>
                        </View>

                        {/* Description */}
                        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                          <Text style={{
                            color: 'rgba(255,255,255,0.75)',
                            fontSize: scale(14),
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
                              fontSize: scale(12),
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
                              fontSize: scale(12),
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
            {globalDownload.isDownloading && globalDownload.progress < 100 && (
              <View style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.85)",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}>
                <Progress.Circle
                  size={110}
                  progress={globalDownload.progress / 100}
                  showsText={true}
                  formatText={() => `${globalDownload.progress}%`}
                  thickness={9}
                  color="#1DB954"
                  unfilledColor="rgba(255,255,255,0.1)"
                  borderWidth={0}
                  strokeCap="round"
                  style={{
                    shadowColor: "#1DB954",
                    shadowOpacity: 0.8,
                    shadowRadius: 15,
                    transform: [{ scale: 1.05 }],
                  }}
                  textStyle={{
                    fontFamily: 'Poppins-Bold',
                    fontSize: scale(18),
                    color: 'white',
                  }}
                />
                <Text style={{
                  color: "white",
                  marginTop: 14,
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: scale(18),
                }}>
                  {globalDownload.downloadedMB} MB
                </Text>
                <Text style={{
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 6,
                  fontFamily: 'Poppins-Regular',
                  fontSize: scale(14),
                }}>
                  Downloading premium content…
                </Text>
              </View>
            )}

            {showDownloadAnim && (
              <View style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.9)",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}>
                <LottieView
                  source={require("../assets/Download.json")}
                  style={{ width: 120, height: 120 }}
                  autoPlay
                  loop={false}
                  onAnimationFinish={() => setShowDownloadAnim(false)}
                />
                <Text style={{
                  marginTop: 12,
                  fontSize: scale(18),
                  fontFamily: 'Poppins-Bold',
                  backgroundClip: "text",
                  color: "white",
                }}>
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
                        style={styles.albumImage}
                        className="rounded-xl"
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
                        marginTop: 20,
                        paddingVertical: 20,
                        backgroundColor: 'rgba(255,255,255,0.07)',
                        borderRadius: 20,
                        marginHorizontal: 16,
                        alignSelf: 'stretch',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <View style={styles.textContainer}>
                        {/* SONG */}
                        <View style={styles.infoRow}>
                          <View style={styles.iconBox}>
                            <Ionicons name="musical-note" size={16} color="#1DB954" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>Song</Text>
                            <Text style={styles.infoValue}>
                              {formatSongTitle(currentSong?.title)}
                            </Text>
                          </View>
                        </View>

                        {/* ARTIST */}
                        <View style={styles.infoRow}>
                          <View style={styles.iconBox}>
                            <Ionicons name="person" size={16} color="#1DB954" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>Episode</Text>
                            <Text style={styles.infoValue}>
                              {formatSongTitle(currentSong?.header)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.menuContainer}>
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
                                  fontSize: scale(15),
                                  fontWeight: '500',
                                  marginLeft: 12,


                                },
                              }}
                            >
                              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => fetchLyrics(currentSong?.id)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <MaterialIcons name="lyrics" size={20} color="#1DB954" />
                                  <Text style={{ color: 'white', fontSize: scale(12), marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Lyrics</Text>
                                </View>
                              </MenuOption>
                              <View style={{
                                height: 1,
                                backgroundColor: '#444',  // softer, modern divider
                                marginVertical: 6,
                                marginHorizontal: 10,
                                width: 'auto'
                              }} />
                              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleDownload(currentSong)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <FontAwesome6 name="download" size={20} color="#4da6ff" />
                                  <Text style={{ color: 'white', fontSize: scale(12), marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Download</Text>
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
                                  <Text style={{ color: 'white', fontSize: scale(12), marginLeft: 10, fontFamily: 'Poppins-Bold', }}>QR Code</Text>
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
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginBottom: 16,
                            }}
                          >
                            <View
                              style={{
                                width: 4,
                                height: 22,
                                borderRadius: 4,
                                backgroundColor: '#1DB954',
                                marginRight: 10,
                              }}
                            />

                            <View>
                              <Text
                                style={{
                                  color: '#fff',
                                  fontSize: scale(16),
                                  fontFamily: 'Poppins-Bold',
                                  letterSpacing: 0.2,
                                }}
                              >
                                Song Details
                              </Text>

                              <Text
                                style={{
                                  color: 'rgba(255,255,255,0.4)',
                                  fontSize: scale(10),
                                  fontFamily: 'Poppins-Regular',
                                  marginTop: 1,
                                }}
                              >
                                Everything about this track
                              </Text>
                            </View>
                          </View>

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
                                      color: 'rgba(255,255,255,0.45)', fontSize: scale(12),
                                      fontFamily: 'Poppins-Regular',
                                    }}>
                                      {label}
                                    </Text>
                                  </View>
                                  <Text style={{
                                    color: '#fff', fontSize: scale(12), fontFamily: 'Poppins-Bold',
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

                        {/* Header */}
                        <View style={styles.descHeaderRow}>
                          <View style={styles.descIconBox}>
                            <Ionicons
                              name="document-text-outline"
                              size={18}
                              color="#1DB954"
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.descHeader}>
                              About Episodes
                            </Text>

                            <Text style={styles.descSubHeader}>
                              Episode description
                            </Text>
                          </View>
                        </View>

                        {/* Divider */}
                        <View style={styles.descDivider} />

                        {/* Description */}
                        <Text style={styles.descTextModern}>
                          {currentSong?.Description || 'No description available for this episode.'}
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
                <MaterialIcons name="lyrics" size={scale(24)} color="#1DB954" />

                <Text
                  style={{
                    fontSize: scale(18),
                    marginLeft: 10,
                    color: "grey",
                    fontFamily: 'Poppins-Bold',
                  }}
                >

                  Lyrics 🎶
                </Text>
              </View>
              <TouchableOpacity style={styles.clearIcon} onPress={() => sheet.current?.close()}>
                <Ionicons name="close-circle" size={scale(24)} color="gray" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ position: "absolute", right: 50, top: "2%" }}
                onPress={handleCopy}
              >
                {copied ? (
                  <Ionicons name="checkbox-outline" size={scale(24)} color="grey" />
                ) : (
                  <MaterialDesignIcons name="clipboard-text-multiple" size={scale(24)} color="grey" />
                )}
              </TouchableOpacity>
              <View style={styles.languageContainer}>
                <Text style={styles.languageLabel}>
                  Translate lyrics
                </Text>

                <Menu>
                  <MenuTrigger customStyles={{ TriggerTouchableComponent: TouchableOpacity }}>
                    <View style={styles.languageSelector}>
                      <MaterialIcons
                        name="translate"
                        size={scale(22)}
                        color="#1DB954"
                      />

                      <Text
                        style={styles.selectedLanguageText}
                        numberOfLines={1}
                      >
                        {selectedLanguageName}
                      </Text>

                      <MaterialIcons
                        name="keyboard-arrow-down"
                        size={scale(22)}
                        color="rgba(255,255,255,0.6)"
                      />
                    </View>
                  </MenuTrigger>

                  <MenuOptions
                    customStyles={{
                      optionsContainer: styles.languageMenu,
                      optionWrapper: {
                        padding: 0,
                      },
                    }}
                  >
                    {lyricLanguages.map((language, index) => (
                      <React.Fragment key={language.code}>

                        <MenuOption
                          onSelect={() => {
                            setSelectedLanguage(language.code);
                          }}
                        >
                          <View
                            style={[
                              styles.languageOption,
                              selectedLanguage === language.code &&
                              styles.languageOptionSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.languageOptionText,
                                selectedLanguage === language.code &&
                                styles.languageOptionTextSelected,
                              ]}
                            >
                              {language.name}
                            </Text>

                            {selectedLanguage === language.code && (
                              <MaterialIcons
                                name="check"
                                size={19}
                                color="#1DB954"
                              />
                            )}
                          </View>
                        </MenuOption>

                        {index < lyricLanguages.length - 1 && (
                          <View style={styles.languageDivider} />
                        )}

                      </React.Fragment>
                    ))}
                  </MenuOptions>
                </Menu>
              </View>

              {/* LYRICS BODY — this was missing before, which is why
                switching languages appeared to do nothing: nothing
                ever rendered the lyrics/translatedLyrics text. */}
              <BottomSheetScrollView
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingBottom: 40,
                  alignItems: translating ? 'center' : 'stretch',
                }}
              >
                {translating ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(29,185,84,0.12)',
                      borderRadius: 20,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      marginTop: 40,
                      gap: 10,
                    }}
                  >
                    <ActivityIndicator size="small" color="#1DB954" />
                    <Text
                      style={{
                        color: '#1DB954',
                        fontSize: scale(13),
                        fontFamily: 'Poppins-SemiBold',
                        letterSpacing: 0.3,
                      }}
                    >
                      translation…
                    </Text>
                  </View>
                ) : (
                  <View>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: scale(16),
                        lineHeight: 24,
                      }}
                      className='font-semibold'
                    >
                      {translatedLyrics ?? lyrics}
                    </Text>
                    {lyricsdata ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 24,
                          paddingHorizontal: 10,
                        }}
                      >
                        <MaterialIcons
                          name="copyright"
                          color="rgba(255,255,255,0.35)"
                          size={14}
                          style={{ marginRight: 5 }}
                        />

                        <Text
                          style={{
                            color: 'rgba(255,255,255,0.35)',
                            fontSize: scale(12),
                            lineHeight: 16,
                            textAlign: 'center',
                            flexShrink: 1,
                          }}
                          className='font-bold'
                        >
                          {lyricsdata}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                )}
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
                style={[styles.songTitle, isPlaying && { color: "#1DB954", }]}
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
                  fontSize: scale(15),
                  fontWeight: '500',
                  marginLeft: 12,


                },
              }}
            >
              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => fetchLyrics(song?.id)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="lyrics" size={20} color="#1DB954" />
                  <Text style={{ color: 'white', fontSize: scale(12), marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Lyrics</Text>
                </View>
              </MenuOption>
              <View style={{
                height: 1,
                backgroundColor: '#444',  // softer, modern divider
                marginVertical: 6,
                marginHorizontal: 10,
                width: 'auto'
              }} />
              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleDownload(song)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome6 name="download" size={20} color="#4da6ff" />
                  <Text style={{ color: 'white', fontSize: scale(12), marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Download</Text>
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
                  <Text style={{ color: 'white', fontSize: scale(12), marginLeft: 10, fontFamily: 'Poppins-Bold', }}>QR Code</Text>
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },

  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(29,185,84,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: scale(10),
    fontFamily: 'Poppins-Regular',
    marginBottom: -1,
  },

  infoValue: {
    color: '#fff',
    fontSize: scale(12),
    fontFamily: 'Poppins-Bold',
  },
  episodeContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  episodeTitle: {
    color: '#1DB954',
    fontSize: scale(14),
    fontFamily: 'Poppins-Bold',
    textAlign: 'left',

  },

  metaRow: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    gap: 4,
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
    fontSize: scale(12),
    fontFamily: 'Poppins-Bold',
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
    fontSize: scale(16),
    marginBottom: 6,
  },
  albumName: {
    color: '#fff',
    fontSize: scale(14),
    lineHeight: 32,
    marginBottom: 12,
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
    fontSize: scale(12),
    fontFamily: 'Poppins-Bold',
  },
  albumHeader: {
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 4,
  },
  backBtn: {
    width: scale(35),
    height: scale(35),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    marginTop: 10,
    // zIndex: 1000,
  },
  albumImage: {
    width: SONG_IMAGE_SIZE,
    height: SONG_IMAGE_SIZE,
    borderRadius: 12,
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
    fontSize: scale(16),
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    textAlign: 'center',
  },

  albumMeta: {
    marginTop: 0,
    fontSize: scale(14),
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
  songImage: {
    width: scale(58),
    height: scale(58),
    borderRadius: 12,
    marginRight: 14,
    borderWidth: 2,
  },
  songText: { flex: 1, paddingRight: 8, },
  songTitle: {
    color: 'white',
    fontSize: scale(12),
    fontFamily: 'Poppins-Bold',
    marginBottom: -5,
    flex: 1,
    minWidth: 0,
  },
  artist: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: scale(10),
    fontFamily: 'Poppins-Regular',
    marginTop: 5,
    flexShrink: 1,
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
    alignSelf: 'stretch',
    paddingHorizontal: 18,
  },
  songTitled: {
    fontSize: scale(15),
    color: 'white',
    marginTop: 10,
    width: 280,
    fontFamily: 'Poppins-Bold',
  },
  songTitles: {
    fontSize: scale(20),
    fontWeight: '700',
    color: 'white',
    marginTop: 10,
    width: 280,
  },
  album: {
    fontSize: scale(16),
    color: 'grey',
    marginTop: 5,
  },
  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '2%',
  },
  menuContainer: {
    position: 'absolute',
    right: 0,
    top: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTriggerSmall: {
    padding: 6,
  },

  languageContainer: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  languageLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: scale(12),
    fontFamily: 'Poppins-Regular',
  },

  languageSelector: {
    minWidth: 145,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedLanguageText: {
    flex: 1,
    marginLeft: 8,
    marginRight: 4,
    color: '#fff',
    fontSize: scale(12),
    fontFamily: 'Poppins-Bold',
  },

  languageMenu: {
    width: 180,
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#202020',
    paddingVertical: 8,
    paddingHorizontal: 6,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },

  languageOption: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 9,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  languageOptionSelected: {
    backgroundColor: 'rgba(29,185,84,0.12)',
  },

  languageOptionText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: scale(12),
    fontFamily: 'Poppins-Medium',
  },

  languageOptionTextSelected: {
    color: '#1DB954',
    fontFamily: 'Poppins-Bold',
  },

  languageDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 8,
  },

  loadingContainer: {
    height: 230,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },

  loadingText: {
    color: '#9ca3af',
    marginTop: 8,
    fontSize: scale(13),
    fontFamily: 'Poppins-Regular',
  },
  descSection: {
    marginTop: 20,
    marginBottom: 30,
  },

  descCardModern: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 20,

    backgroundColor: 'rgba(255,255,255,0.05)',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',

    overflow: 'hidden',
  },

  descHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  descIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,

    backgroundColor: 'rgba(29,185,84,0.12)',

    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.18)',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  descHeader: {
    fontSize: scale(15),
    color: '#1DB954',
    fontFamily: 'Poppins-Bold',
  },

  descSubHeader: {
    marginTop: 2,
    fontSize: scale(10),
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Poppins-Regular',
  },

  descDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 16,
  },

  descTextModern: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: scale(13),
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },
});

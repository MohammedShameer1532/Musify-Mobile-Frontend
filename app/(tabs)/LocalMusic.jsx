import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  Image,
  Dimensions,
  NativeModules,
  NativeEventEmitter,
  ScrollView,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import BottomSheet, {
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import Music from '../common/Music';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FlatList, GestureHandlerRootView } from 'react-native-gesture-handler';
import TrackPlayer, { useActiveTrack } from 'react-native-track-player';

import { SearchContext } from '../contextProvider/searchContext';
import Localsearch from '../common/Localsearch';

import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuProvider,
  MenuTrigger,
} from 'react-native-popup-menu';

import { decode } from 'html-entities';

const { LocalAudio } = NativeModules;
const eventEmitter = new NativeEventEmitter(LocalAudio);

const { width } = Dimensions.get('window');

const BASE_WIDTH = 360;
const scale = (size) => (width / BASE_WIDTH) * size;

// ======================================================
// FIXED ROW HEIGHT (used by getItemLayout)
// songCard: padding 12 top + 12 bottom, image height, marginBottom 12
// ======================================================

const CARD_MARGIN = 12;
const LIST_PADDING_TOP = 12;
const ITEM_HEIGHT = Math.max(scale(50), 40) + 24 + CARD_MARGIN;


// ======================================================
// FORMAT SONG TITLE
// ======================================================

const formatSongTitle = (rawTitle) => {
  if (!rawTitle) return 'Unknown';

  const decoded = decode(rawTitle);

  const titleMatch = decoded.match(
    /^(.+?)\s*\(From\s+"([^"]+)"\)/i,
  );

  if (titleMatch) {
    const mainTitle = titleMatch[1].trim();
    const source = titleMatch[2].trim();

    return `${mainTitle} from ${source}`;
  }

  return decoded.trim();
};


// ======================================================
// GET FIRST LETTER OF SONG TITLE
// ======================================================

const getSongFirstLetter = (title) => {
  const firstCharacter = (title || 'Unknown')
    .trim()
    .charAt(0)
    .toUpperCase();

  return /^[A-Z]$/.test(firstCharacter)
    ? firstCharacter
    : '#';
};


// ======================================================
// A-Z ALPHABET INDEX
// ======================================================

const AlphabetIndex = React.memo(
  ({ onSelectLetter, selectedLetter }) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    return (
      <View style={styles.alphabetContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={styles.alphabetContent}
        >
          {alphabet.map((letter) => (
            <TouchableOpacity
              key={letter}
              onPress={() => onSelectLetter(letter)}
              style={styles.alphabetTouch}
              activeOpacity={0.5}
              accessibilityRole="button"
              accessibilityLabel={`Jump to songs starting with ${letter}`}
            >
              <Text
                style={[
                  styles.alphabetLetter,
                  selectedLetter === letter &&
                  styles.selectedAlphabetLetter,
                ]}
              >
                {letter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  },
);


// ======================================================
// SONG ITEM
// ======================================================

const SongItem = React.memo(
  ({ song, currentSong, handlePlay, handleDeletesong }) => {
    const isPlaying =
      String(currentSong?.id) === String(song?.id);

    return (
      <View style={styles.songCard}>
        {/* SONG IMAGE AND DETAILS */}

        <TouchableOpacity
          onPress={() => handlePlay(song)}
          activeOpacity={0.8}
          style={styles.songLeft}
        >
          <Image
            source={
              song?.artist === '<unknown>' || !song?.artwork
                ? require('../assets/musicphoto.jpg')
                : { uri: song.artwork }
            }
            resizeMode="cover"
            style={[
              styles.songImage,
              {
                borderColor: isPlaying
                  ? '#1DB954'
                  : 'transparent',
              },
            ]}
          />

          <View style={styles.songText}>
            <View style={styles.songTitleRow}>
              {isPlaying && (
                <LottieView
                  source={require('../assets/playing.json')}
                  style={styles.playingAnimation}
                  autoPlay
                  loop
                />
              )}

              <Text
                style={[
                  styles.songTitle,
                  isPlaying && { color: '#1DB954' },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatSongTitle(song?.title)}
              </Text>
            </View>

            <Text
              style={styles.artist}
              numberOfLines={1}
            >
              {formatSongTitle(song?.artist)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* PLAY BUTTON AND DELETE MENU */}

        <View style={styles.songRight}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => handlePlay(song)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Play ${song?.title || 'song'}`}
          >
            <FontAwesome
              name="play"
              size={20}
              color="black"
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          <View style={styles.menuContainer}>
            <Menu>
              <MenuTrigger
                customStyles={{
                  optionWrapper: { activeOpacity: 0.6 },
                }}
              >
                <MaterialCommunityIcons
                  name="dots-vertical"
                  color="#fff"
                  size={28}
                />
              </MenuTrigger>

              <MenuOptions
                customStyles={{
                  optionsContainer: {
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: '#2a2a2a',
                    marginTop: 5,
                    width: 115,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: 6,
                    paddingHorizontal: 10,
                  },
                }}
              >
                <MenuOption
                  onSelect={() => handleDeletesong(song)}
                >
                  <View style={styles.deleteOption}>
                    <MaterialIcons
                      name="delete"
                      size={scale(22)}
                      color="#ff4d4d"
                    />

                    <Text style={styles.deleteText}>
                      Delete
                    </Text>
                  </View>
                </MenuOption>
              </MenuOptions>
            </Menu>
          </View>
        </View>
      </View>
    );
  },
);


// ======================================================
// LOCAL MUSIC SCREEN
// ======================================================

const LocalMusic = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [searchFilteredFiles, setSearchFilteredFiles] = useState([]);

  const [selectedLetter, setSelectedLetter] = useState(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUp, setShowUp] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { setSongsList } = useContext(SearchContext);

  const sheetRef = useRef(null);
  const flatListRef = useRef(null);

  const snapPoints = useMemo(() => ['100%'], []);
  const navigation = useNavigation();
  const currentSong = useActiveTrack();


  // ====================================================
  // SORT SEARCH RESULTS ALPHABETICALLY
  // ====================================================

  const filteredFiles = useMemo(() => {
    return [...searchFilteredFiles].sort((a, b) => {
      const titleA = (a?.title || 'Unknown').trim();
      const titleB = (b?.title || 'Unknown').trim();

      return titleA.localeCompare(
        titleB,
        undefined,
        {
          sensitivity: 'base',
          numeric: true,
        },
      );
    });
  }, [searchFilteredFiles]);


  // ====================================================
  // FETCH LOCAL AUDIO FILES
  // ====================================================

  const fetchAudioFiles = useCallback(async () => {
    try {
      const files = await LocalAudio.getAudioFiles();
      const safeFiles = Array.isArray(files) ? files : [];

      setAudioFiles(safeFiles);
      setSearchFilteredFiles(safeFiles);
      setSongsList(safeFiles);

      setError(null);
    } catch (e) {
      console.error('Failed to fetch local audio files:', e);
      setError('Unable to load local music.');
    }
  }, [setSongsList]);


  // ====================================================
  // AUDIO PERMISSIONS AND AUTO REFRESH
  // ====================================================

  useEffect(() => {
    let mounted = true;
    let subscription;

    const init = async () => {
      try {
        setLoading(true);

        if (Platform.OS !== 'android') {
          if (mounted) {
            setError(
              'Local audio scanning is currently Android-only.',
            );
          }
          return;
        }

        const permission =
          Number(Platform.Version) >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted =
          await PermissionsAndroid.request(permission);

        if (!mounted) return;

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await fetchAudioFiles();

          if (!mounted) return;

          LocalAudio.startWatchingAudio();

          subscription = eventEmitter.addListener(
            'LOCAL_AUDIO_CHANGED',
            async () => {
              await fetchAudioFiles();
            },
          );
        } else {
          setError(
            'Permission denied. Allow audio access to scan your music.',
          );
        }
      } catch (err) {
        console.error(
          'Local music initialization error:',
          err,
        );

        if (mounted) {
          setError(
            err?.message ||
            'Unable to initialize local music.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      subscription?.remove();

      if (Platform.OS === 'android') {
        LocalAudio.stopWatchingAudio();
      }
    };
  }, [fetchAudioFiles]);


  // ====================================================
  // JUMP TO SELECTED LETTER
  // Example: tap M -> first M song
  // The following N, O, P songs remain in the list.
  // ====================================================

  const handleSelectLetter = useCallback(
    (letter) => {
      setSelectedLetter(letter);

      const targetIndex = filteredFiles.findIndex((song) =>
        (song?.title || '')
          .trim()
          .toUpperCase()
          .startsWith(letter),
      );

      if (targetIndex !== -1) {
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: false,
          viewPosition: 0,
        });

        return;
      }

      // If the selected letter has no songs, jump to the
      // next available letter in the sorted list.
      const nextIndex = filteredFiles.findIndex((song) => {
        const firstLetter = getSongFirstLetter(song?.title);

        return (
          firstLetter !== '#' &&
          firstLetter > letter
        );
      });

      if (nextIndex !== -1) {
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: false,
          viewPosition: 0,
        });
      }
    },
    [filteredFiles],
  );


  // ====================================================
  // UPDATE HIGHLIGHTED LETTER WHILE SCROLLING
  // ====================================================

  const onViewableItemsChanged = useRef(
    ({ viewableItems }) => {
      const firstVisibleSong = viewableItems?.find(
        (item) => item.isViewable && item.item,
      )?.item;

      if (!firstVisibleSong) return;

      const firstLetter = getSongFirstLetter(
        firstVisibleSong.title,
      );

      const nextLetter =
        firstLetter === '#' ? null : firstLetter;

      setSelectedLetter(nextLetter);
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;


  // ====================================================
  // PLAY SONG AND CREATE QUEUE
  // ====================================================

  const handlePlay = useCallback(
    async (song) => {
      if (!song) return;

      if (
        String(currentSong?.id) === String(song.id)
      ) {
        sheetRef.current?.snapToIndex(0);
        return;
      }

      try {
        const index = audioFiles.findIndex(
          (item) => item.id === song.id,
        );

        if (index === -1) return;

        await TrackPlayer.reset();

        // Queue begins with the selected song and continues
        // through the rest of the local music library.
        const orderedQueue = [
          audioFiles[index],
          ...audioFiles.slice(index + 1),
          ...audioFiles.slice(0, index),
        ].map((item) => ({
          id: String(item.id),
          title: item.title || 'Unknown',
          artist: item.artist || 'Unknown',
          url: item.path,
          artwork: item.artwork,
          hasArtwork: Boolean(item.artwork),
          album: item.album,
          year: item.year,
        }));

        await TrackPlayer.add(orderedQueue);
        await TrackPlayer.skip(0);

        sheetRef.current?.snapToIndex(0);

        await TrackPlayer.play();
      } catch (err) {
        console.error('Error playing local song:', err);
      }
    },
    [audioFiles, currentSong],
  );


  // ====================================================
  // DELETE SONG
  // ====================================================

  const handleDeletesong = useCallback(
    async (song) => {
      try {
        await LocalAudio.deleteAudioFile(
          song.path,
          song.id,
        );

        const updatedFiles = audioFiles.filter(
          (item) => item.id !== song.id,
        );

        const updatedSearchResults =
          searchFilteredFiles.filter(
            (item) => item.id !== song.id,
          );

        setAudioFiles(updatedFiles);
        setSearchFilteredFiles(updatedSearchResults);
        setSongsList(updatedFiles);
      } catch (e) {
        console.error('Delete error:', e);
      }
    },
    [audioFiles, searchFilteredFiles, setSongsList],
  );


  // ====================================================
  // SCROLL CONTROLS
  // ====================================================

  const handleScroll = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowUp(offsetY > 200);
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  }, []);


  // ====================================================
  // FLATLIST HELPERS
  // ====================================================

  const keyExtractor = useCallback(
    (item) => String(item.id),
    [],
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: ITEM_HEIGHT,
      offset: LIST_PADDING_TOP + ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const onScrollToIndexFailed = useCallback((info) => {
    flatListRef.current?.scrollToOffset({
      offset: LIST_PADDING_TOP + info.index * ITEM_HEIGHT,
      animated: false,
    });
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <SongItem
        song={item}
        currentSong={currentSong}
        handlePlay={handlePlay}
        handleDeletesong={handleDeletesong}
      />
    ),
    [currentSong, handlePlay, handleDeletesong],
  );


  // ====================================================
  // SCREEN UI
  // ====================================================

  return (
    <MenuProvider skipInstanceCheck>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient
          colors={['#050505', '#050505']}
          style={styles.background}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* HEADER */}

            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
              >
                <Ionicons
                  name="arrow-back"
                  size={scale(22)}
                  color="white"
                />
              </TouchableOpacity>

              <View style={styles.centerContainer}>
                <Text style={styles.headerTitle}>
                  Local Music
                </Text>
              </View>

              <View style={{ width: 40 }} />
            </View>


            {/* SEARCH */}

            <Localsearch
              audioFiles={audioFiles}
              setFilteredFiles={setSearchFilteredFiles}
            />


            {/* LOADING */}

            {loading ? (
              <LottieView
                source={require('../assets/music.json')}
                autoPlay
                loop
                style={styles.loadingAnimation}
              />
            ) : audioFiles.length === 0 ? (
              /* NO LOCAL MUSIC */

              <View style={styles.emptyContainer}>
                <Ionicons
                  name="musical-notes"
                  size={30}
                  color="#fff"
                />

                <Text style={styles.emptyTitle}>
                  No Offline Songs Available
                </Text>

                <Text style={styles.emptySubtitle}>
                  {error ||
                    'Your local music will appear here when songs are available on your device.'}
                </Text>
              </View>
            ) : (
              /* SONG LIST + RIGHT-SIDE ALPHABET */

              <View style={styles.listRow}>
                <View style={styles.listColumn}>
                  <FlatList
                    ref={flatListRef}
                    data={filteredFiles}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    getItemLayout={getItemLayout}
                    onScrollToIndexFailed={onScrollToIndexFailed}
                    windowSize={10}
                    initialNumToRender={12}
                    maxToRenderPerBatch={10}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    extraData={currentSong?.id}
                    onScroll={handleScroll}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    ListEmptyComponent={
                      <View style={styles.noSongsForLetter}>
                        <Ionicons
                          name="search-outline"
                          size={28}
                          color="#777"
                        />
                        <Text style={styles.emptySubtitle}>
                          No songs found
                        </Text>
                      </View>
                    }
                  />

                  {/* SCROLL TO TOP */}

                  {!isSheetOpen && showUp && (
                    <TouchableOpacity
                      style={styles.upIcon}
                      onPress={scrollToTop}
                      activeOpacity={0.7}
                    >
                      <AntDesign
                        name="upcircle"
                        size={45}
                        color="white"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* A-Z RIGHT INDEX */}

                <AlphabetIndex
                  selectedLetter={selectedLetter}
                  onSelectLetter={handleSelectLetter}
                />
              </View>
            )}


            {/* BOTTOM MUSIC PLAYER SHEET */}

            <BottomSheet
              ref={sheetRef}
              index={-1}
              snapPoints={snapPoints}
              enableDynamicSizing={false}
              enablePanDownToClose
              handleIndicatorStyle={{
                backgroundColor: 'grey',
                width: 45,
                height: 5,
                borderRadius: 2,
              }}
              backgroundStyle={styles.bottomSheetBackground}
              onChange={(index) =>
                setIsSheetOpen(index >= 0)
              }
            >
              <TouchableOpacity
                onPress={() => sheetRef.current?.close()}
                style={styles.sheetCloseButton}
              >
                <Entypo
                  name="chevron-thin-down"
                  size={30}
                  color="white"
                  style={styles.backIcon}
                />
              </TouchableOpacity>

              <BottomSheetScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.sheetContent}
              >
                {currentSong && (
                  <>
                    <Image
                      source={
                        currentSong.artist !== '<unknown>' &&
                          currentSong.artwork
                          ? { uri: currentSong.artwork }
                          : require('../assets/musicphoto.jpg')
                      }
                      style={styles.songImages}
                      resizeMode="cover"
                    />

                    <View style={styles.songInfoCard}>
                      <View style={styles.textContainer}>
                        {/* ALBUM */}

                        <View style={styles.infoRow}>
                          <View style={styles.iconBox}>
                            <MaterialIcons
                              name="album"
                              size={16}
                              color="#1DB954"
                            />
                          </View>

                          <View style={styles.infoTextColumn}>
                            <Text style={styles.infoLabel}>
                              Album
                            </Text>

                            <Text style={styles.infoValue}>
                              {formatSongTitle(
                                currentSong.album,
                              )}
                            </Text>
                          </View>
                        </View>

                        {/* SONG */}

                        <View style={styles.infoRow}>
                          <View style={styles.iconBox}>
                            <Ionicons
                              name="musical-note"
                              size={16}
                              color="#1DB954"
                            />
                          </View>

                          <View style={styles.infoTextColumn}>
                            <Text style={styles.infoLabel}>
                              Song
                            </Text>

                            <Text style={styles.infoValue}>
                              {formatSongTitle(
                                currentSong.title,
                              )}
                            </Text>
                          </View>
                        </View>

                        {/* ARTIST */}

                        <View style={styles.infoRow}>
                          <View style={styles.iconBox}>
                            <Ionicons
                              name="person"
                              size={16}
                              color="#1DB954"
                            />
                          </View>

                          <View style={styles.infoTextColumn}>
                            <Text style={styles.infoLabel}>
                              Artist
                            </Text>

                            <Text style={styles.infoValue}>
                              {formatSongTitle(
                                currentSong.artist,
                              )}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Music hideActions />
                    </View>
                  </>
                )}
              </BottomSheetScrollView>
            </BottomSheet>
          </SafeAreaView>
        </LinearGradient>
      </GestureHandlerRootView>
    </MenuProvider>
  );
};

export default LocalMusic;


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  background: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },


  // HEADER

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 10,
  },

  backBtn: {
    width: scale(35),
    height: scale(35),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  centerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  headerTitle: {
    color: 'white',
    fontSize: scale(20),
    fontFamily: 'Poppins-Bold',
  },


  // LOADING

  loadingAnimation: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },


  // A-Z ALPHABET

  listRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  listColumn: {
    flex: 1,
    minWidth: 0,
  },

  alphabetContainer: {
    width: 25,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 7,
    paddingBottom: 8,
    marginRight: 3,
  },
  alphabetContent: {
    paddingTop: 7,
    paddingBottom: 8,
  },
  alphabetTouch: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  alphabetLetter: {
    color: '#A0A0A0',
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
  },

  selectedAlphabetLetter: {
    color: '#1DB954',
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
  },


  // EMPTY STATE

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 60,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    marginTop: 12,
  },

  emptySubtitle: {
    color: '#999999',
    fontSize: scale(13),
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },

  noSongsForLetter: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },


  // SONG LIST

  listContent: {
    padding: LIST_PADDING_TOP,
    paddingBottom: 140,
    flexGrow: 1,
  },

  songCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
    marginBottom: CARD_MARGIN,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  songLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },

  songImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 2,
    backgroundColor: '#222',
  },

  songText: {
    flex: 1,
    minWidth: 0,
  },

  songTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  playingAnimation: {
    width: 20,
    height: 20,
    marginRight: 5,
  },

  songTitle: {
    flex: 1,
    fontSize: scale(12),
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },

  artist: {
    fontSize: scale(10),
    color: 'gray',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },

  songRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  menuContainer: {
    alignItems: 'flex-end',
    padding: 6,
    marginRight: -5,
  },

  deleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  deleteText: {
    color: 'white',
    fontSize: scale(13),
    fontFamily: 'Poppins-Bold',
  },

  upIcon: {
    position: 'absolute',
    bottom: 100,
    zIndex: 10,
    alignSelf: 'center',
  },


  // BOTTOM SHEET

  bottomSheetBackground: {
    backgroundColor: '#0b0f0c',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.25)',
    shadowColor: '#1DB954',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },

  sheetCloseButton: {
    width: 50,
    marginTop: -5,
    marginLeft: 20,
  },

  backIcon: {
    marginLeft: 10,
  },

  sheetContent: {
    alignItems: 'center',
    paddingBottom: 120,
  },

  songImages: {
    width: 260,
    height: 260,
    borderRadius: 12,
    backgroundColor: '#222',
  },

  songInfoCard: {
    width: '92%',
    marginTop: 30,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  textContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    marginTop: 5,
    width: '100%',
  },

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

  infoTextColumn: {
    flex: 1,
  },

  infoLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: scale(11),
    fontFamily: 'Poppins-Regular',
    marginBottom: -1,
  },

  infoValue: {
    color: '#fff',
    fontSize: scale(15),
    fontFamily: 'Poppins-Bold',
  },
});
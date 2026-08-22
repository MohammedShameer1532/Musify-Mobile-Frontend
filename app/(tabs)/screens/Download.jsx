import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';

import LinearGradient from 'react-native-linear-gradient';

import { useNavigation } from '@react-navigation/native';

import TrackPlayer, {
  useActiveTrack,
} from 'react-native-track-player';

import LottieView from 'lottie-react-native';

import { LegendList } from '@legendapp/list';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import BottomSheet, {
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import Music from '../../common/Music';
import AverageColorExtractor from '../../common/AverageColorExtractor';

import { decode } from 'html-entities';

import {
  getDownloads,
  deleteDownload,
} from '../../Database/downloadRepository';


const { width } = Dimensions.get('window'); // ✅ screen width
const SONG_IMAGE_SIZE = Math.min(
  width * 0.62,
  320
);

const BASE_WIDTH = 360;

const scale = (size) => (width / BASE_WIDTH) * size;

const Download = () => {
  const navigation = useNavigation();

  const currentSong = useActiveTrack();

  const [downsong, setDownsong] = useState([]);

  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState(null);

  const [backgroundColor, setBackgroundColor] =
    useState('rgb(30,30,30)');

  const sheetRef = useRef(null);

  const snapPoints = useMemo(() => ['100%'], []);

  const [isSheetOpen, setIsSheetOpen] =
    useState(false);


  // =========================================================
  // LOAD DOWNLOADED SONGS
  // =========================================================

  const loadSongs = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getDownloads();

      console.log('🎵 Downloads:', data);

      setDownsong(data?._array || []);
    } catch (error) {
      console.error(
        '❌ Failed to load downloads:',
        error,
      );

      setDownsong([]);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadSongs();
  }, [loadSongs]);


  // =========================================================
  // DELETE DOWNLOAD
  // =========================================================

  const handleDeleteDownload = useCallback(
    async song => {
      if (!song?.id || deletingId) {
        return;
      }

      try {
        setDeletingId(song.id);

        await deleteDownload(song.id);

        setDownsong(prev =>
          prev.filter(
            item =>
              String(item.id) !== String(song.id),
          ),
        );

        console.log(
          '🗑️ Download deleted:',
          song.id,
        );
      } catch (error) {
        console.error(
          '❌ Delete download error:',
          error,
        );
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId],
  );


  // =========================================================
  // PLAY DOWNLOADED SONG
  // =========================================================

  const handlePlay = useCallback(
    async song => {
      if (!song) {
        return;
      }

      try {
        console.log(
          '🎵 Downloaded song clicked:',
          song,
        );

        // Same song already playing
        if (
          String(currentSong?.id) ===
          String(song.id)
        ) {
          sheetRef.current?.snapToIndex(0);
          return;
        }

        const index = downsong.findIndex(
          item =>
            String(item.id) ===
            String(song.id),
        );

        if (index === -1) {
          console.error(
            '❌ Downloaded song not found:',
            song.id,
          );
          return;
        }

        await TrackPlayer.reset();

        // Clicked song first
        const orderedQueue = [
          ...downsong.slice(index),
          ...downsong.slice(0, index),
        ].map(item => {
          const localPath = item.path || '';

          const localUrl =
            localPath.startsWith('file://')
              ? localPath
              : `file://${localPath}`;

          return {
            id: String(item.id),

            title:
              item.title ||
              'Unknown Song',

            artist:
              item.artist ||
              'Unknown Artist',

            album:
              item.album ||
              '',

            url: localUrl,

            artwork:
              item.image ||
              undefined,
          };
        });

        console.log(
          '🎵 TrackPlayer queue:',
          orderedQueue,
        );

        await TrackPlayer.add(
          orderedQueue,
        );

        await TrackPlayer.skip(0);

        await TrackPlayer.play();

        sheetRef.current?.snapToIndex(0);

        console.log(
          '▶️ Playing:',
          orderedQueue[0],
        );
      } catch (error) {
        console.error(
          '❌ Download playback error:',
          error,
        );
      }
    },
    [currentSong, downsong],
  );


  // =========================================================
  // FORMAT TITLE
  // =========================================================

  const formatSongTitle = rawTitle => {
    if (!rawTitle) {
      return 'Unknown';
    }

    const decoded = decode(rawTitle);

    const titleMatch =
      decoded.match(
        /^(.+?)\s*\(From\s+"([^"]+)"\)/i,
      );

    if (titleMatch) {
      const mainTitle =
        titleMatch[1].trim();

      const source =
        titleMatch[2].trim();

      return `${mainTitle} from ${source}`;
    }

    return decoded.trim();
  };


  // =========================================================
  // GRADIENT PLAYER BACKGROUND
  // =========================================================

  const GradientBackground = ({
    style,
  }) => (
    <LinearGradient
      colors={[
        backgroundColor,
        '#080808',
        '#000000',
      ]}
      style={[
        style,
        {
          borderRadius: 0,
        },
      ]}
    />
  );


  // =========================================================
  // EMPTY STATE
  // =========================================================

  const EmptyDownloads = () => (
    <View style={styles.emptyContainer}>

      <View style={styles.emptyIconOuter}>

        <LinearGradient
          colors={[
            '#1DB954',
            '#087F5B',
          ]}
          style={styles.emptyIconGradient}
        >

          <MaterialCommunityIcons
            name="download-off"
            size={scale(52)}
            color="#fff"
          />

        </LinearGradient>

      </View>

      <Text style={styles.emptyTitle}>
        No downloads yet
      </Text>

      <Text style={styles.emptySubtitle}>
        Download your favorite songs and
        {'\n'}
        enjoy them anytime, even offline.
      </Text>

      <View style={styles.emptyFeatureRow}>

        <View style={styles.emptyFeature}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={18}
            color="#1DB954"
          />

          <Text style={styles.emptyFeatureText}>
            Offline
          </Text>
        </View>

        <View style={styles.emptyFeature}>
          <MaterialIcons
            name="headphones"
            size={18}
            color="#1DB954"
          />

          <Text style={styles.emptyFeatureText}>
            Anywhere
          </Text>
        </View>

        <View style={styles.emptyFeature}>
          <MaterialCommunityIcons
            name="music-note"
            size={18}
            color="#1DB954"
          />

          <Text style={styles.emptyFeatureText}>
            Yours
          </Text>
        </View>

      </View>

    </View>
  );


  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <LinearGradient
      colors={[
        '#050507',
        '#0D1010',
        '#111515',
      ]}
      style={styles.container}
    >

      <SafeAreaView
        style={styles.safeArea}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <TouchableOpacity
            onPress={() =>
              navigation.goBack()
            }
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={scale(22)}
              color="#fff"
            />
          </TouchableOpacity>


          <View style={styles.headerCenter}>

            <Text style={styles.headerTitle}>
              Downloads
            </Text>

            <View style={styles.offlineStatus}>

              <View
                style={styles.onlineDot}
              />

              <Text
                style={styles.offlineStatusText}
              >
                Available offline
              </Text>

            </View>

          </View>


          <View style={styles.headerCount}>

            <MaterialCommunityIcons
              name="download"
              size={scale(17)}
              color="#1DB954"
            />

            <Text
              style={styles.headerCountText}
            >
              {downsong.length}
            </Text>

          </View>

        </View>


        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (

          <View
            style={
              styles.loadingContainer
            }
          >

            <LottieView
              source={require(
                '../../assets/playing.json',
              )}
              style={{
                width: scale(90),
                height: 90,
              }}
              autoPlay
              loop
            />

            <Text
              style={styles.loadingText}
            >
              Loading your downloads...
            </Text>

          </View>

        ) : downsong.length === 0 ? (

          <EmptyDownloads />

        ) : (

          <LegendList
            data={downsong}

            keyExtractor={item =>
              String(item.id)
            }

            extraData={[
              currentSong,
              deletingId,
            ]}

            estimatedItemSize={82}

            windowSize={10}

            drawDistance={1200}

            initialNumToRender={8}

            maxToRenderPerBatch={8}

            recycleItems

            removeClippedSubviews

            showsVerticalScrollIndicator={false}

            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 35,
            }}


            //  =================================================
            // DOWNLOAD HERO
            // ================================================= 

            ListHeaderComponent={() => (

              <View>

                <LinearGradient
                  colors={[
                    '#123A2A',
                    '#0C211A',
                    '#0B1110',
                  ]}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 1,
                  }}
                  style={
                    styles.downloadHero
                  }
                >

                  {/* Decorative circles */}

                  <View
                    style={
                      styles.heroCircleOne
                    }
                  />

                  <View
                    style={
                      styles.heroCircleTwo
                    }
                  />


                  <View
                    style={
                      styles.heroContent
                    }
                  >

                    <View
                      style={
                        styles.heroIcon
                      }
                    >

                      <MaterialCommunityIcons
                        name="download"
                        size={32}
                        color="#fff"
                      />

                    </View>


                    <View
                      style={
                        styles.heroTextContainer
                      }
                    >

                      <Text
                        style={
                          styles.heroTitle
                        }
                      >
                        Your Downloads
                      </Text>

                      <Text
                        style={
                          styles.heroSubtitle
                        }
                      >
                        Your music, ready
                        whenever you are.
                      </Text>

                    </View>

                  </View>


                  <View
                    style={
                      styles.heroBottom
                    }
                  >

                    <View>

                      <Text
                        style={
                          styles.heroNumber
                        }
                      >
                        {downsong.length}
                      </Text>

                      <Text
                        style={
                          styles.heroLabel
                        }
                      >
                        {downsong.length === 1
                          ? 'Song downloaded'
                          : 'Songs downloaded'}
                      </Text>

                    </View>


                    <View
                      style={
                        styles.offlineBadge
                      }
                    >

                      <MaterialCommunityIcons
                        name="wifi-off"
                        size={15}
                        color="#1DB954"
                      />

                      <Text
                        style={
                          styles.offlineBadgeText
                        }
                      >
                        OFFLINE
                      </Text>

                    </View>

                  </View>

                </LinearGradient>


                {/* Section title */}

                <View
                  style={
                    styles.sectionHeader
                  }
                >

                  <View>

                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Downloaded Music
                    </Text>

                    <Text
                      style={
                        styles.sectionSubtitle
                      }
                    >
                      Tap a song to start listening
                    </Text>

                  </View>


                  <View
                    style={
                      styles.localBadge
                    }
                  >

                    <MaterialCommunityIcons
                      name="database"
                      size={14}
                      color="#1DB954"
                    />

                    <Text
                      style={
                        styles.localBadgeText
                      }
                    >
                      LOCAL
                    </Text>

                  </View>

                </View>

              </View>
            )}


            renderItem={({ item }) => (

              <SongItem
                song={item}
                currentSong={
                  currentSong
                }
                handlePlay={
                  handlePlay
                }
                handleDeleteDownload={
                  handleDeleteDownload
                }
                deletingId={
                  deletingId
                }
              />

            )}

          />

        )}


        {/* =================================================
            PLAYER BOTTOM SHEET
        ================================================= */}

        <BottomSheet
          ref={sheetRef}
          index={-1}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose
          backgroundComponent={
            GradientBackground
          }
          handleIndicatorStyle={{
            backgroundColor:
              'rgba(255,255,255,0.35)',
            width: scale(45),
            height: 5,
            borderRadius: 3,
          }}
          onChange={index =>
            setIsSheetOpen(
              index >= 0,
            )
          }
        >

          <BottomSheetScrollView
            style={{
              flex: 1,
            }}
            contentContainerStyle={{
              paddingBottom: 80,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={
              false
            }
            nestedScrollEnabled
          >

            {currentSong?.artwork && (

              <AverageColorExtractor
                key={
                  currentSong?.id
                }
                imageUrl={
                  currentSong.artwork
                }
                onColorExtracted={
                  color => {
                    if (color) {
                      setBackgroundColor(
                        color,
                      );
                    }
                  }
                }
              />

            )}


            <TouchableOpacity
              onPress={() =>
                sheetRef.current?.close()
              }
              style={
                styles.sheetClose
              }
            >

              <Entypo
                name="chevron-thin-down"
                size={28}
                color="#fff"
              />

            </TouchableOpacity>


            {currentSong && (

              <View
                style={
                  styles.songContainer
                }
              >

                {currentSong?.artist !==
                  '<unknown>' ? (

                  <Image
                    source={{
                      uri:
                        currentSong?.artwork,
                    }}
                    style={
                      styles.songImages
                    }
                    resizeMode="cover"
                  />

                ) : (

                  <Image
                    source={require(
                      '../../assets/musicphoto.jpg',
                    )}
                    style={
                      styles.songImages
                    }
                    resizeMode="cover"
                  />

                )}


                <View
                  style={
                    styles.playerInfoCard
                  }
                >

                  <View
                    style={
                      styles.textContainer
                    }
                  >

                    {/* ALBUM */}

                    <View
                      style={
                        styles.infoRow
                      }
                    >

                      <View
                        style={
                          styles.iconBox
                        }
                      >

                        <MaterialIcons
                          name="album"
                          size={16}
                          color="#1DB954"
                        />

                      </View>

                      <View
                        style={{
                          flex: 1,
                        }}
                      >

                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          Album
                        </Text>

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {formatSongTitle(
                            currentSong?.album,
                          )}
                        </Text>

                      </View>

                    </View>


                    {/* SONG */}

                    <View
                      style={
                        styles.infoRow
                      }
                    >

                      <View
                        style={
                          styles.iconBox
                        }
                      >

                        <Ionicons
                          name="musical-note"
                          size={16}
                          color="#1DB954"
                        />

                      </View>

                      <View
                        style={{
                          flex: 1,
                        }}
                      >

                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          Song
                        </Text>

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {formatSongTitle(
                            currentSong?.title,
                          )}
                        </Text>

                      </View>

                    </View>


                    {/* ARTIST */}

                    <View
                      style={
                        styles.infoRow
                      }
                    >

                      <View
                        style={
                          styles.iconBox
                        }
                      >

                        <Ionicons
                          name="person"
                          size={16}
                          color="#1DB954"
                        />

                      </View>

                      <View
                        style={{
                          flex: 1,
                        }}
                      >

                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          Artist
                        </Text>

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {formatSongTitle(
                            currentSong?.artist,
                          )}
                        </Text>

                      </View>

                    </View>

                  </View>


                  <Music />

                </View>

              </View>

            )}

          </BottomSheetScrollView>

        </BottomSheet>

      </SafeAreaView>

    </LinearGradient>
  );
};


export default Download;


// =========================================================
// SONG ITEM
// =========================================================

const SongItem = React.memo(
  ({
    song,
    currentSong,
    handlePlay,
    handleDeleteDownload,
    deletingId,
  }) => {

    const isPlaying =
      String(currentSong?.id) ===
      String(song?.id);


    const cleanTitle =
      song?.title
        ? song.title.replace(
          /\s*\(.*?\)\s*/g,
          '',
        )
        : 'Unknown';


    const cleanArtist =
      song?.artist
        ? song.artist.replace(
          /\s*\(.*?\)\s*/g,
          '',
        )
        : 'Unknown Artist';


    return (

      <GestureHandlerRootView>

        <View
          style={[
            styles.songCard,
            isPlaying &&
            styles.songCardPlaying,
          ]}
        >

          {/* PLAY AREA */}

          <TouchableOpacity
            style={styles.songLeft}
            activeOpacity={0.75}
            onPress={() =>
              handlePlay(song)
            }
          >

            <View
              style={
                styles.imageContainer
              }
            >

              {song?.artist ===
                '<unknown>' ? (

                <Image
                  source={require(
                    '../../assets/musicphoto.jpg',
                  )}
                  style={
                    styles.songImage
                  }
                />

              ) : (

                <Image
                  source={{
                    uri: song?.image,
                  }}
                  style={
                    styles.songImage
                  }
                />

              )}

              {/* PLAY OVERLAY */}

              {isPlaying && (

                <View
                  style={
                    styles.playingOverlay
                  }
                >

                  <LottieView
                    source={require(
                      '../../assets/playing.json',
                    )}
                    style={{
                      width: scale(27),
                      height: 27,
                    }}
                    autoPlay
                    loop
                  />

                </View>

              )}

            </View>


            <View
              style={
                styles.songTextContainer
              }
            >

              <Text
                style={[
                  styles.songTitle,
                  isPlaying &&
                  styles.songTitlePlaying,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {cleanTitle}
              </Text>


              <View
                style={
                  styles.artistRow
                }
              >

                <Text
                  style={styles.artist}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {cleanArtist}
                </Text>

              </View>


              <View
                style={
                  styles.downloadedLabel
                }
              >

                <MaterialCommunityIcons
                  name="download"
                  size={11}
                  color="#1DB954"
                />

                <Text
                  style={
                    styles.downloadedText
                  }
                >
                  Downloaded
                </Text>

              </View>

            </View>

          </TouchableOpacity>


          {/* DELETE */}

          <TouchableOpacity
            onPress={() =>
              handleDeleteDownload(song)
            }
            disabled={
              deletingId === song?.id
            }
            style={
              styles.deleteBtn
            }
            activeOpacity={0.7}
          >

            {deletingId === song?.id ? (

              <ActivityIndicator
                size="small"
                color="#fff"
              />

            ) : (

              <AntDesign
                name="delete"
                color="#B8B8B8"
                size={18}
              />

            )}

          </TouchableOpacity>

        </View>

      </GestureHandlerRootView>

    );
  },
);


// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },


  // =======================================================
  // HEADER
  // =======================================================

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },

  backBtn: {
    width: scale(35),
    height: scale(35),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
    marginLeft: 13,
  },

  headerTitle: {
    color: '#fff',
    fontSize: scale(21),
    fontFamily: 'Poppins-Bold',
  },

  offlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },

  onlineDot: {
    width: scale(6),
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1DB954',
    marginRight: 6,
  },

  offlineStatusText: {
    color:
      'rgba(255,255,255,0.42)',
    fontSize: scale(9),
    fontFamily: 'Poppins-Regular',
  },

  headerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    height: 34,
    borderRadius: 17,
    backgroundColor:
      'rgba(29,185,84,0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(29,185,84,0.18)',
  },

  headerCountText: {
    color: '#fff',
    fontSize: scale(12),
    fontFamily: 'Poppins-Bold',
    marginLeft: 5,
  },


  // =======================================================
  // LOADING
  // =======================================================

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },

  loadingText: {
    color:
      'rgba(255,255,255,0.45)',
    fontSize: scale(11),
    fontFamily: 'Poppins-Regular',
    marginTop: -4,
  },


  // =======================================================
  // HERO
  // =======================================================

  downloadHero: {
    minHeight: 190,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 25,
    padding: 20,
    borderWidth: 1,
    borderColor:
      'rgba(29,185,84,0.18)',
  },

  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroIcon: {
    width: scale(62),
    height: 62,
    borderRadius: 20,
    backgroundColor:
      'rgba(29,185,84,0.22)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroTextContainer: {
    flex: 1,
    marginLeft: 15,
  },

  heroTitle: {
    color: '#fff',
    fontSize: scale(20),
    fontFamily: 'Poppins-Bold',
  },

  heroSubtitle: {
    color:
      'rgba(255,255,255,0.55)',
    fontSize: scale(10),
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },

  heroBottom: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  heroNumber: {
    color: '#fff',
    fontSize: scale(27),
    fontFamily: 'Poppins-Bold',
    lineHeight: scale(30),
  },

  heroLabel: {
    color:
      'rgba(255,255,255,0.42)',
    fontSize: scale(9),
    fontFamily: 'Poppins-Regular',
  },

  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    height: 30,
    borderRadius: 15,
    backgroundColor:
      'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor:
      'rgba(29,185,84,0.20)',
  },

  offlineBadgeText: {
    color: '#1DB954',
    fontSize: scale(8),
    fontFamily: 'Poppins-Bold',
    marginLeft: 5,
    letterSpacing: 0.7,
  },

  heroCircleOne: {
    position: 'absolute',
    width: scale(180),
    height: 180,
    borderRadius: 90,
    right: -80,
    top: -85,
    backgroundColor:
      'rgba(29,185,84,0.06)',
  },

  heroCircleTwo: {
    position: 'absolute',
    width: scale(120),
    height: 120,
    borderRadius: 60,
    right: 20,
    bottom: -75,
    backgroundColor:
      'rgba(29,185,84,0.05)',
  },


  // =======================================================
  // SECTION HEADER
  // =======================================================

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: scale(15),
    fontFamily: 'Poppins-Bold',
  },

  sectionSubtitle: {
    color:
      'rgba(255,255,255,0.38)',
    fontSize: scale(9),
    fontFamily: 'Poppins-Regular',
    marginTop: 1,
  },

  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    height: 27,
    borderRadius: 14,
    backgroundColor:
      'rgba(255,255,255,0.05)',
  },

  localBadgeText: {
    color:
      'rgba(255,255,255,0.45)',
    fontSize: scale(7),
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.6,
    marginLeft: 4,
  },


  // =======================================================
  // EMPTY STATE
  // =======================================================

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingBottom: 90,
  },

  emptyIconOuter: {
    padding: 7,
    borderRadius: 30,
    backgroundColor:
      'rgba(29,185,84,0.07)',
    marginBottom: 20,
  },

  emptyIconGradient: {
    width: scale(92),
    height: 92,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: '#fff',
    fontSize: scale(20),
    fontFamily: 'Poppins-Bold',
  },

  emptySubtitle: {
    color:
      'rgba(255,255,255,0.42)',
    fontSize: scale(11),
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: scale(19),
    marginTop: 7,
  },

  emptyFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    gap: 18,
  },

  emptyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emptyFeatureText: {
    color:
      'rgba(255,255,255,0.45)',
    fontSize: scale(9),
    fontFamily: 'Poppins-Regular',
    marginLeft: 5,
  },


  // =======================================================
  // SONG CARD
  // =======================================================

  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 78,
    marginBottom: 7,
    paddingVertical: 9,
    paddingLeft: 9,
    paddingRight: 8,
    borderRadius: 17,
    backgroundColor:
      'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.045)',
  },

  songCardPlaying: {
    backgroundColor:
      'rgba(29,185,84,0.075)',
    borderColor:
      'rgba(29,185,84,0.20)',
  },

  songLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  imageContainer: {
    width: scale(58),
    height: 58,
    borderRadius: 13,
    marginRight: 12,
    position: 'relative',
  },

  songImage: {
    width: scale(58),
    height: 58,
    borderRadius: 13,
    backgroundColor:
      '#202020',
  },

  downloadBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: scale(21),
    height: 21,
    borderRadius: 11,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#101312',
  },

  playingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 13,
    backgroundColor:
      'rgba(0,0,0,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  songTextContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },

  songTitle: {
    color: '#fff',
    fontSize: scale(12),
    fontFamily: 'Poppins-Bold',
    paddingRight: 5,
  },

  songTitlePlaying: {
    color: '#1DB954',
  },

  artistRow: {
    marginTop: 2,
  },

  artist: {
    color:
      'rgba(255,255,255,0.42)',
    fontSize: scale(9.5),
    fontFamily: 'Poppins-Regular',
    paddingRight: 5,
  },

  downloadedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  downloadedText: {
    color:
      'rgba(29,185,84,0.72)',
    fontSize: scale(7.5),
    fontFamily: 'Poppins-Regular',
    marginLeft: 3,
  },

  deleteBtn: {
    width: scale(39),
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.045)',
    marginLeft: 7,
  },


  // =======================================================
  // PLAYER
  // =======================================================

  sheetClose: {
    width: scale(48),
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  songContainer: {
    alignItems: 'center',
    marginTop: 4,
  },

  songImages: {
    width: SONG_IMAGE_SIZE,
    height: SONG_IMAGE_SIZE,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: scale(0), height: 10 },
  },

  playerInfoCard: {
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor:
      'rgba(255,255,255,0.07)',
    borderRadius: 20,
    marginHorizontal: 16,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  textContainer: {
    alignSelf: 'stretch',
    paddingHorizontal: 18,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },

  iconBox: {
    width: scale(34),
    height: 34,
    borderRadius: 10,
    backgroundColor:
      'rgba(29,185,84,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoLabel: {
    color:
      'rgba(255,255,255,0.40)',
    fontSize: scale(9),
    fontFamily: 'Poppins-Regular',
  },

  infoValue: {
    color: '#fff',
    fontSize: scale(12),
    fontFamily: 'Poppins-Bold',
  },

});
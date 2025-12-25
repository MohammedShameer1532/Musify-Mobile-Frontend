import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { SearchContext } from '../contextProvider/searchContext';
import axios from 'axios';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';



const Tartist = () => {
  const { dataSearch, setTokens } = useContext(SearchContext);
  const [backgroundColor, setBackgroundColor] = useState("rgb(30, 30, 30)");
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState([]);
  const [image, setImage] = useState('');
  const [albumData, setAlbumData] = useState([]);
  const [artistToken, setArtistToken] = useState(null);
  const id = dataSearch;
  const [topSongs, setTopSongs] = useState([]);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `https://www.jiosaavn.com/api.php?__call=artist.getArtistPageDetails&artistId=${id}&type=songs&n_song=50&category=&sort_order=&ctx=wap6dot0&api_version=4&_format=json&_marker=0`
        );
        setImage(res?.data?.image);
        setArtist(res?.data);

        console.log('Artist details:', res.data);
        const bioUrl = res?.data?.urls?.bio;

        if (bioUrl) {
          const extractedToken = bioUrl
            .replace(/\/$/, '')
            .split('/')
            .pop(); // LlRWpHzy3Hk_

          setArtistToken(extractedToken);
        }

        setTimeout(() => {
          setLoading(false);
        }, 400);
      } catch (error) {
        console.error('Error fetching artist:', error);
      }
    };

    fetchArtist();
  }, [id]);


  const fetchAlbumPage = async () => {
    if (!artistToken) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${artistToken}&type=artist&p=0&n_song=50&n_album=50&ctx=wap6dot0&api_version=4&_format=json&_marker=0`
      );

      setTopSongs(res?.data?.topSongs || []);
      setAlbumData(res?.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };



  useEffect(() => {
    if (artistToken) {
      fetchAlbumPage(0); // fetch first page
    }
  }, [artistToken]);


  const getHighResImage = (image) => {
    if (!image) return null;

    // ✅ Case 1: JioSaavn image array
    if (Array.isArray(image)) {
      return (
        image.find(img => img.quality === '500x500')?.link ||
        image.find(img => img.quality === '150x150')?.link ||
        image[image.length - 1]?.link
      );
    }

    // ✅ Case 2: String image (Playlists, Artist)
    if (typeof image === 'string') {
      return image
        .replace(/_\d+x\d+/, '_500x500')
        .replace(/-\d+x\d+/, '-500x500');
    }

    return null;
  };


  const sections = [
    { title: 'Dedicated Playlists', data: artist?.dedicated_artist_playlist },
    { title: 'Featured Playlists', data: artist?.featured_artist_playlist },
    { title: 'Top Albums', data: albumData?.topAlbums },
    { title: 'Singles', data: artist?.singles },
    { title: 'Latest Release', data: artist?.latest_release },
  ].filter(section => section.data?.length > 0);

  const HorizontalList = React.memo(({ title, data }) => (
    <View>
      <Text className="text-2xl font-bold text-white ml-5 mt-10 ">
        {title}
      </Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
        ItemSeparatorComponent={() => <View style={{ width: 25 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity>
            <View className="gap-2">
              <Image
                source={{ uri: getHighResImage(item?.image) }}
                style={styles.decImages}
                className="rounded-xl"
              />
              <Text
                style={{ color: 'white', fontSize: 12, width: 110 }}
                numberOfLines={2}
              >
                {item?.title?.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  ));


  const Topsongs = React.memo(() => {
    const handleSeeAll = () => {
      setTokens({ token: artistToken, image: image });
      navigation.navigate('Artistsongs');
    };


    return (
      <View className='mt-4'>
        <TouchableOpacity activeOpacity={0.8}
          onPress={handleSeeAll}>
          <View className='flex flex-row justify-between items-center  mt-10 pr-5'>
            <Text className="text-2xl font-bold text-white ml-5 ">
              Top Songs
            </Text>
            <MaterialCommunityIcons name="chevron-down-box" size={25} color="white" />
          </View>
        </TouchableOpacity>
        <FlatList
          horizontal
          data={topSongs}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
          ItemSeparatorComponent={() => <View style={{ width: 25 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity>
              <View className="gap-2">
                <Image
                  source={{ uri: getHighResImage(item?.image) }}
                  style={styles.decImages}
                  className="rounded-xl"
                />
                <Text
                  style={{ color: 'white', fontSize: 12, width: 110 }}
                  numberOfLines={2}
                >
                  {item?.title?.replace(/\s*\(.*?\)\s*/g, '')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity activeOpacity={0.8}
              onPress={handleSeeAll}>
              <View style={styles.iconCard}>
                <FontAwesome6
                  name="circle-arrow-right"
                  size={40}
                  color="white"
                />
                <Text>load more</Text>
              </View>
            </TouchableOpacity>
          } />
      </View>
    );
  });


  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient colors={[backgroundColor, "#000"]} style={styles.background}>
        <SafeAreaView style={styles.safeArea} className="flex-1 ">
          <View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 35 }} className='w-10 mt-5'>
              <Ionicons name="arrow-back" size={30} color="white" style={styles.backIcon} className="ml-2" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
          ) : (
            <View >
              <FlatList
                data={sections}
                keyExtractor={item => item.title}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80 }}
                initialNumToRender={3}           // only render first 3 items initially
                maxToRenderPerBatch={5}          // render in small batches
                windowSize={5}                    // keep window size small
                removeClippedSubviews={true}
                renderItem={({ item }) => (
                  <HorizontalList title={item.title} data={item.data} />
                )}
                ListHeaderComponent={
                  <View>
                    <View style={{ position: 'relative', alignSelf: 'center' }}>
                      <Image
                        source={{ uri: getHighResImage(image) }}
                        style={styles.songImagee}
                        className="rounded-xl"
                      />
                      <Text
                        style={{
                          position: 'absolute',      // makes it overlay the image
                          bottom: 10,                // distance from bottom
                          left: 10,                  // distance from left
                          color: 'white',
                          fontSize: 24,
                          fontWeight: 'bold',
                          textShadowColor: 'rgba(0,0,0,0.7)', // optional shadow for readability
                          textShadowOffset: { width: 1, height: 1 },
                          textShadowRadius: 5,
                        }}
                      >
                        {albumData?.name || artist?.name}
                      </Text>
                    </View>
                    <Topsongs />
                  </View>
                }
              />
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  )
}

export default Tartist;


const styles = StyleSheet.create({
  decImages: {
    width: 120,
    height: 120,

  },
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
    flexShrink: 1,
    flexWrap: "wrap",
    fontSize: 20,
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
  iconCard: {
    width: 120,        // same as image width
    height: 120,       // same as image height
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 25,
  },

});

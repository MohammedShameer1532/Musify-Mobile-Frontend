import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';
import { LegendList } from '@legendapp/list';

const { width } = Dimensions.get('window'); // ✅ screen width
const Topartist = () => {
  const [trend, setTrend] = useState([]);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const { globalSearch, setDataSearch } = useContext(SearchContext);



  useEffect(() => {
    const trendingData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`https://www.jiosaavn.com/api.php?__call=social.getTopArtists&api_version=4&_format=json&_marker=0&ctx=wap6dot0`
        );
        setTrend(response.data.top_artists);
        console.log('logindata', response);

      } catch (error) {
        console.error('Error fetching artist:', error);
      } finally {
        setLoading(false);
      }
    };

    trendingData();
  }, []);



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

  const handlePress = (artistid) => {
    setDataSearch(artistid);

    navigation.navigate('Tartist', { id: artistid });
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header} className='font-extrabold'>
        Top Artist
      </Text>
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
        <FlatList
          showsHorizontalScrollIndicator={false}
          recycleItems
          horizontal={true}
          data={trend}
          contentContainerStyle={styles.artistList}
          keyExtractor={(song, index) => `${song.id}-${index}`}
          renderItem={({ item: song, index }) => (
            <View style={styles.songContainer} key={index}>
              <TouchableOpacity onPress={() => handlePress(song.artistid)} >
                <Image
                  source={{ uri: getHighResImage(song?.image) }}
                  style={styles.artistImage}
                  resizeMode='cover'
                />
                <View>
                  <Text
                    style={styles.songTitle}
                    numberOfLines={2}
                    ellipsizeMode="tail">{song?.name.replace(/\s*\(.*?\)\s*/g, '')}</Text>
                </View>
                <Text
                  style={styles.artistSubtitle}
                  numberOfLines={1}>
                  Artist
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View >
  )
}

export default Topartist;


const styles = StyleSheet.create({

  container: {
    width: '100%',
    marginTop: 5,
  },

  header: {
    color: 'white',
    fontSize: 16,
    marginLeft: 20,
    marginTop: 5,
    marginBottom: 10,
  },

  loadingContainer: {
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#9ca3af',
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },

  artistList: {
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  artistImage: {
    width: '90%',
    height: 160,
    borderRadius: 20,
  },
  songContainer: {
    width: width * 0.45,
    paddingHorizontal: 0,
  },
  songTitle: {
    color: 'white',
    fontSize: 12,
    marginTop: 10,
    width: '100%',
    fontFamily: 'Poppins-Medium',
  },

  artistSubtitle: {
    color: '#9ca3af',
    fontSize: 10.5,
    marginTop: 3,
    fontFamily: 'Poppins-Regular',
  },
})
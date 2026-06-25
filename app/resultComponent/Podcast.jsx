import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';

const Podcast = () => {
  const [trend, setTrend] = useState([]);
  const navigation = useNavigation();
  const { setDataSearch } = useContext(SearchContext);

  const trendingData = async () => {
    const response = await axios.get(`https://www.jiosaavn.com/api.php?__call=content.getTopShows&api_version=4&_format=json&_marker=0&n=20&p=1&ctx=wap6dot0`)
    const podcast = response?.data?.data ?? [];
    const trendingPodcasts = response?.data?.trendingPodcasts?.[0]?.items ?? [];
    const combained = [...trendingPodcasts, ...podcast];
    setTrend(combained);
  }
  useEffect(() => {
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

  const handlePress = (songId, permurl, imageUrl, title) => {
    setDataSearch({
      songId,
      permurl,
      imageUrl,
      title,
    });
    navigation.navigate('Podresult', { id: songId });
  };
  return (
    <View>
      <View>
        <Text style={styles.header}>Podcast</Text>
      </View>
      <FlatList
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, marginLeft: 20, padding: 5 }}
        horizontal={true}
        data={trend}
        keyExtractor={(song, index) => `${song.id}-${index}`}
        renderItem={({ item: song, index }) => (
          <View style={styles.songContainer} key={index}>
            <TouchableOpacity onPress={() => handlePress(song.id, song.perma_url, getHighResImage(song?.image), song?.title)} >
              <Image
                source={{ uri: getHighResImage(song?.image) }}
                className="rounded-3xl w-44 h-48 p-4"
                resizeMode='cover'
              />
              <View>
                <Text
                  style={styles.songTitle}
                  numberOfLines={2}
                  ellipsizeMode="tail">{song?.title.replace(/\s*\(.*?\)\s*/g, '')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}

export default Podcast;

const styles = StyleSheet.create({
  header: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: 'white',
    marginLeft: 20,
    marginTop:-14,
  },
  songContainer: {
    marginTop: 10,
    alignItems: 'flex-start',
    marginRight: 16,
  },
  songTitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 10,
    width: 176,       // match image width
    fontFamily: 'Poppins-Medium'
  }
})
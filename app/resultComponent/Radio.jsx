import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';
import { LegendList } from '@legendapp/list';



const LANGUAGES = [
  { name: 'Tamil', code: 'tamil' },
  { name: 'Hindi', code: 'hindi' },
  { name: 'Telugu', code: 'telugu' },
  { name: 'English', code: 'english' },
  { name: 'Punjabi', code: 'punjabi' },
  { name: 'Kannada', code: 'kannada' },
];


const Radio = () => {
  const [trend, setTrend] = useState([]);
  const navigation = useNavigation();
  const { setDataSearch, selectedLanguage } = useContext(SearchContext);

  const trendingData = async () => {
    try {
      const langParam = selectedLanguage ? `&languages=${selectedLanguage}` : '';
      const url = `https://www.jiosaavn.com/api.php?__call=webradio.getFeaturedStations&api_version=4&_format=json&_marker=0&ctx=wap6dot0${langParam}`;

      const response = await axios.get(url);
      setTrend(response?.data);


    } catch (error) {
      console.error("Error fetching trending data:", error);
    }
  };

  useEffect(() => {
    trendingData();
  }, [selectedLanguage]);


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


  const handlePress = (songId, moreInfo, imageUrl) => {
    setDataSearch({
      id: songId,
      moreInfo,
      imageUrl,
    });
    navigation.navigate('Rresult', {
      id: songId,
      language: moreInfo?.language,
      moreInfo, // pass full object too if needed
      imageUrl,
    });
  };



  return (
    <View>
      <View>
        <Text style={styles.header}>Radio Stations</Text>
        <LegendList
          estimatedItemSize={150}
          getEstimatedItemSize={() => 150}
          extraData={selectedLanguage}
          // 🚀 Rendering behavior
          recycleItems
          removeClippedSubviews={false}
          drawDistance={500}
          windowSize={17}

          // Batch tuning
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          data={LANGUAGES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.code || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                backgroundColor: selectedLanguage === item.code ? '#10b981' : '#1f2937',
                paddingVertical: 5,
                paddingHorizontal: 16,
                borderRadius: 20,
                marginHorizontal: 8,
              }}
            >
              <Text style={{ color: 'white', fontSize: 14, fontFamily: 'Poppins-Medium', lineHeight: 20 }}>{item.name}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 10, marginBottom: 20 }}
        />
      </View>
      <FlatList
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, marginLeft: 20, padding: 5 }}
        horizontal
        data={trend}
        keyExtractor={(song, index) => `${song.id}-${index}`}
        renderItem={({ item: song }) => (
          <View style={styles.songContainer}>
            <TouchableOpacity onPress={() => handlePress(song.id, song.more_info, getHighResImage(song?.image))}>
              <Image
                source={{ uri: getHighResImage(song?.image) }}
                className="rounded-3xl w-44 h-48 p-4"
                resizeMode="cover"
              />
              <Text
                style={styles.songTitle}
                numberOfLines={2}
                ellipsizeMode="tail">
                {song?.title.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}

export default Radio;

const styles = StyleSheet.create({
  header: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: 'white',
    marginLeft: 20,
    marginTop: 10,
  },
  songContainer: {
    marginTop: 15,
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
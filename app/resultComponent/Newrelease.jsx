import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';



const LANGUAGES = [
  { name: 'All', code: '' },
  { name: 'Tamil', code: 'tamil' },
  { name: 'Hindi', code: 'hindi' },
  { name: 'Telugu', code: 'telugu' },
  { name: 'English', code: 'english' },
  { name: 'Punjabi', code: 'punjabi' },
  { name: 'Marathi', code: 'marathi' },
  { name: 'Gujarati', code: 'gujarati' },
  { name: 'Bengali', code: 'bengali' },
  { name: 'Kannada', code: 'kannada' },
  { name: 'Bhojpuri', code: 'bhojpuri' },
  { name: 'Malayalam', code: 'malayalam' },
  { name: 'Sanskrit', code: 'sanskrit' },
  { name: 'Haryanvi', code: 'haryanvi' },
  { name: 'Rajasthani', code: 'rajasthani' },
  { name: 'Odia', code: 'odia' },
  { name: 'Assamese', code: 'assamese' },
];


const Newrelease = () => {
  const [trend, setTrend] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const navigation = useNavigation();
  const { globalSearch, setDataSearch } = useContext(SearchContext);

  const trendingData = async () => {
    try {
      const langParam = selectedLanguage ? `&languages=${selectedLanguage}` : '';
      const url = `https://www.jiosaavn.com/api.php?__call=content.getAlbums&api_version=4&_format=json&_marker=0&n=50&p=1&ctx=wap6dot0${langParam}`;

      const response = await axios.get(url);
      setTrend(response?.data?.data ?? []);
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

  const handlePress = (songId) => {
    setDataSearch(songId);
    // If songId is only digits, navigate to Tresult
    if (/^\d+$/.test(songId)) {
      navigation.navigate('Tresult', { id: songId });
    }
    // If songId contains letters, navigate to Tsongs
    else {
      navigation.navigate('Tsongs', { id: songId });
    }
  };
  return (
    <View>
      <View>
        <Text className='text-2xl font-bold text-white ml-5 mt-5'>New Releases</Text>
        <FlatList
          data={LANGUAGES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.code || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedLanguage(item.code)}
              style={{
                backgroundColor: selectedLanguage === item.code ? '#10b981' : '#1f2937',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                marginHorizontal: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 14 }}>{item.name}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 10, marginTop: 10 }}
        />
      </View>
      <FlatList
        contentContainerStyle={{ paddingBottom: 20, marginLeft: 20, padding: 5 }}
        horizontal
        data={trend}
        keyExtractor={(song, index) => `${song.id}-${index}`}
        renderItem={({ item: song }) => (
          <View style={styles.songContainer}>
            <TouchableOpacity onPress={() => handlePress(song.id)}>
              <Image
                source={{ uri: getHighResImage(song?.image) }}
                className="rounded-xl w-48 h-48 p-4"
                resizeMode="cover"
              />
              <Text
                style={{ color: 'white', fontSize: 14, width: 192, marginTop: 8 }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {song?.title.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}

export default Newrelease;

const styles = StyleSheet.create({
  songContainer: {
    marginRight: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  songImage: {
    width: 290,
    height: 290,
    borderRadius: 16,
  },
  songTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
})
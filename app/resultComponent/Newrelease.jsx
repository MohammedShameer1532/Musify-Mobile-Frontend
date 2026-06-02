import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';
import { LegendList } from '@legendapp/list';
import { decode } from 'html-entities';



const LANGUAGES = [
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
  const navigation = useNavigation();
  const { setDataSearch, selectedLanguage } = useContext(SearchContext);

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
      navigation.navigate('Album', { id: songId });
    }
    // If songId contains letters, navigate to Tsongs
    else {
      navigation.navigate('Tsongs', { id: songId });
    }
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


  return (
    <View>
      <View>
        <Text style={styles.header} >New Releases</Text>
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
                paddingVertical: 4,
                paddingHorizontal: 16,
                borderRadius: 20,
                marginHorizontal: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 14, fontFamily: 'Poppins-Medium', height: 'auto' }}>{item.name}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 10, marginTop: 5, marginBottom: 0, }}
        />
      </View>
      <FlatList
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10, marginLeft: 20, padding: 5 }}
        horizontal
        data={trend}
        keyExtractor={(song, index) => `${song.id}-${index}`}
        renderItem={({ item: song }) => (
          <View style={styles.songContainer}>
            <TouchableOpacity onPress={() => handlePress(song.id)}>
              <Image
                source={{ uri: getHighResImage(song?.image) }}
                className="rounded-3xl w-44 h-48 "
                resizeMode="cover"
              />
              <Text
                style={styles.songTitle}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {formatSongTitle(song?.title)}
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
    alignItems: 'flex-start',
    marginTop: 15,
    marginRight: 16,
    width: 175
  },
  songTitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 10,
    width: 162,
    fontFamily: 'Poppins-Medium',
  },
  header: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: 'white',
    marginLeft: 20,
    marginTop: 5,
  }
})
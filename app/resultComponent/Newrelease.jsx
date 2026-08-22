import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';
import { LegendList } from '@legendapp/list';
import { decode } from 'html-entities';


const { width } = Dimensions.get('window'); // ✅ screen width

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
  const [loading, setLoading] = useState(false);
  const { setDataSearch, selectedLanguage, setSelectedLanguage } = useContext(SearchContext);

  const trendingData = async () => {
    try {
      setLoading(true);
      const langParam = selectedLanguage ? `&languages=${selectedLanguage}` : '';
      const url = `https://www.jiosaavn.com/api.php?__call=content.getAlbums&api_version=4&_format=json&_marker=0&n=50&p=1&ctx=wap6dot0${langParam}`;

      const response = await axios.get(url);
      setTrend(response?.data?.data ?? []);
    } catch (error) {
      console.error("Error fetching trending data:", error);
    } finally {
      setLoading(false);
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
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header} className='font-extrabold'>
        New Release
      </Text>
      <FlatList
        data={LANGUAGES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.code}
        contentContainerStyle={styles.languageList}
        renderItem={({ item }) => {
          const isSelected = selectedLanguage === item.code;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              // onPress={() => setSelectedLanguage(item.code)}
              style={[
                styles.languageButton,
                isSelected && styles.selectedLanguageButton,
              ]}>
              <Text
                style={[
                  styles.languageText,
                  isSelected && styles.selectedLanguageText,
                ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
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
          contentContainerStyle={styles.artistList}
          horizontal
          data={trend}
          keyExtractor={(song, index) => `${song.id}-${index}`}
          renderItem={({ item: song }) => (
            <View style={styles.songContainer}>
              <TouchableOpacity onPress={() => handlePress(song.id)}>
                <Image
                  source={{ uri: getHighResImage(song?.image) }}
                  resizeMode="cover"
                  style={styles.artistImage}
                />
                <Text
                  style={styles.songTitle}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  allowFontScaling={false}
                >
                  {formatSongTitle(song?.title)}
                </Text>
                <Text
                  style={styles.artistSubtitle}
                  numberOfLines={1}>
                  {song?.type
                    ? song.type.charAt(0).toUpperCase() + song.type.slice(1)
                    : ''}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  )
}

export default Newrelease;

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

  songContainer: {
    width: width * 0.45,
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

  artistList: {
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },

  languageList: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 5,
  },

  languageButton: {
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },

  selectedLanguageButton: {
    backgroundColor: '#10b981',
  },

  languageText: {
    color: '#d1d5db',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },

  selectedLanguageText: {
    color: 'white',
  },
  artistImage: {
    width: '90%',
    height: 160,
    borderRadius: 20,
  },
})
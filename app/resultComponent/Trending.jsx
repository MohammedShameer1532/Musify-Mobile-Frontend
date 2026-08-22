import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { SearchContext } from '../contextProvider/searchContext';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';


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

const Trending = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const {
    setDataSearch,
    selectedLanguage,
    setSelectedLanguage,
  } = useContext(SearchContext);

  // ---------------------------------------
  // Fetch recommendations
  // ---------------------------------------

  const getArtistRecommendations = async () => {
    try {
      setLoading(true);

      const lang = selectedLanguage || 'hindi';

      const response = await axios.get(
        `${API_URL}/api/jiosaavn?lang=${encodeURIComponent(
          lang,
        )}`,
      );

      console.log('Selected language:', lang);
      console.log('JioSaavn data:', response.data);

      const data = response.data;

      let artistData = [];

      if (Array.isArray(data?.new_trending)) {
        artistData = data.new_trending;
      }

      // Remove duplicate IDs
      const uniqueArtists = artistData.filter(
        (item, index, self) =>
          index === self.findIndex(obj => obj.id === item.id),
      );

      setArtists(uniqueArtists);
    } catch (error) {
      console.error(
        'Error fetching recommendations:',
        error.response?.data || error.message,
      );

      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------
  // Refetch when language changes
  // ---------------------------------------

  useEffect(() => {
    getArtistRecommendations();
  }, [selectedLanguage]);

  // ---------------------------------------
  // Image helper
  // ---------------------------------------

  const getHighResImage = image => {
    if (!image) return null;

    if (Array.isArray(image)) {
      return (
        image.find(img => img.quality === '500x500')?.link ||
        image.find(img => img.quality === '150x150')?.link ||
        image[image.length - 1]?.link
      );
    }

    if (typeof image === 'string') {
      return image
        .replace(/_\d+x\d+/, '_500x500')
        .replace(/-\d+x\d+/, '-500x500');
    }

    return null;
  };

  // ---------------------------------------
  // Handle artist press
  // ---------------------------------------

  const handlePress = (item) => {
    if (!item?.id) return;

    setDataSearch(item.id);

    if (item?.type === 'album') {
      navigation.navigate('Album', {
        id: item.id,
      });
    } else if (item?.type === 'song') {
      navigation.navigate('Song', {
        id: item.id,
      });
    } else if (item?.type === 'playlist') {
      navigation.navigate('Playlist', {
        id: item.id,
      });
    }
  };


  // ---------------------------------------
  // Language selection
  // ---------------------------------------

  const handleLanguageChange = language => {
    if (language === selectedLanguage) return;

    setSelectedLanguage(language);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header} className='font-extrabold'>
        Now Trending
      </Text>
      {/* Language selector */}
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
              // onPress={() => handleLanguageChange(item.code)}
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

      {/* Recommendations */}
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
          data={artists}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) =>
            String(item?.id || index)
          }
          contentContainerStyle={styles.artistList}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePress(item)}>
                <Image
                  source={{
                    uri: getHighResImage(item?.image),
                  }}
                  style={styles.artistImage}
                  resizeMode="cover"
                />
                <Text
                  style={styles.artistName}
                  numberOfLines={2}
                  ellipsizeMode="tail">
                  {
                    item?.title ||
                    'Unknown'}
                </Text>
                <Text
                  style={styles.artistSubtitle}
                  numberOfLines={1}>
                  {item?.type
                    ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
                    : ''}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default Trending;

const styles = StyleSheet.create({

  // ---------------------------------------
  // Main container
  // ---------------------------------------

  container: {
    width: '100%',
    marginTop: 5,
  },

  // ---------------------------------------
  // Header
  // ---------------------------------------

  header: {
    color: 'white',
    fontSize: 16,
    marginLeft: 20,
    marginTop: 5,
    marginBottom: 10,
  },

  // ---------------------------------------
  // Language list
  // ---------------------------------------

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

  // ---------------------------------------
  // Loading
  // ---------------------------------------

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

  // ---------------------------------------
  // Artist list
  // ---------------------------------------

  artistList: {
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },

  // ---------------------------------------
  // Card
  // ---------------------------------------

  card: {
    width: width * 0.45,
    paddingHorizontal: 0,
  },

  // ---------------------------------------
  // Image
  // ---------------------------------------

  artistImage: {
    width: '90%',
    height: 160,
    borderRadius: 20,
  },

  // ---------------------------------------
  // Artist name
  // ---------------------------------------

  artistName: {
    color: 'white',
    fontSize: 12,
    marginTop: 10,
    width: '100%',
    fontFamily: 'Poppins-Medium',
  },

  // ---------------------------------------
  // Subtitle
  // ---------------------------------------

  artistSubtitle: {
    color: '#9ca3af',
    fontSize: 10.5,
    marginTop: 3,
    fontFamily: 'Poppins-Regular',
  },
});
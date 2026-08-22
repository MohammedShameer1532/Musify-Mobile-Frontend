import React, {useCallback, useState} from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {getDownloads} from '../../Database/downloadRepository';

const Download = () => {
  const [songs, setSongs] = useState([]);

  const loadSongs = async () => {
    const data = await getDownloads();

    console.log('🎵 Download screen:', data);

    setSongs(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadSongs();
    }, []),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={songs}
        keyExtractor={item => String(item.id)}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.card}>
            <Image
              source={{uri: item.image}}
              style={styles.image}
            />

            <View style={{flex: 1}}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>

              <Text style={styles.artist} numberOfLines={1}>
                {item.artist}
              </Text>

              <Text style={styles.path} numberOfLines={1}>
                {item.path}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              No downloads yet
            </Text>

            <Text style={styles.emptyText}>
              Songs you download will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default Download;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 15,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },

  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  artist: {
    color: '#aaa',
    marginTop: 3,
  },

  path: {
    color: '#666',
    fontSize: 11,
    marginTop: 3,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },

  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  emptyText: {
    color: '#777',
    fontSize: 14,
    marginTop: 8,
  },
});
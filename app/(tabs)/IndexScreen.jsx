import {
  FlatList,
  KeyboardAvoidingView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navbar from '../common/Navbar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import networkContext from '../contextProvider/networkContext';
import Suggestion from '../resultComponent/Suggestion';
import Newrelease from '../resultComponent/Newrelease';
import Tplaylist from '../resultComponent/Tplaylist';
import Radio from '../resultComponent/Radio';
import Podcast from '../resultComponent/Podcast';
import Topartist from '../resultComponent/Topartist';

const IndexScreen = () => {
  console.log('Rendering IndexScreen');
  const isConnected = networkContext();
  const sections = [
    { id: '1', component: <Suggestion /> },
    { id: '2', component: <Newrelease /> },
    { id: '3', component: <Tplaylist /> },
    { id: '4', component: <Radio /> },
    { id: '5', component: <Podcast /> },
    { id: '6', component: <Topartist /> },
  ];


  return (
    <SafeAreaView className="flex-1 bg-stone-950 h-full" >
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <View className="flex-row items-center gap-3 p-2 ml-4">
          <Icon name="music-box" size={40} color="white" />
          <Text className="text-[22px] font-semibold text-white">Musify</Text>
        </View>
        <View>
          <Navbar />
        </View>
        {!isConnected && (
          <View className="bg-orange-500 py-2 px-4 mx-4 mt-2 rounded">
            <Text className="text-white text-center font-medium">
              You're offline. Some features may not work.
            </Text>
          </View>
        )}
        <FlatList
          data={sections}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => item.component}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110, marginTop: 10 }}
          ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
        />
        {/* <App /> */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default IndexScreen;

import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// Import your screen components
import IndexScreen from './IndexScreen';
import LocalMusic from './LocalMusic';
import Setting from './Setting';
import { Keyboard, View } from 'react-native';

const Tab = createBottomTabNavigator();

export default function TabsLayout() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarActiveTintColor: '#0a7ea4', // Active tab color
        tabBarInactiveTintColor: '#888888', // Inactive tab color
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: '#0f0D23', borderRadius: 50 }} />
        ),
        tabBarStyle: keyboardVisible
          ? { display: 'none' }   // 👈 HIDE
          : {
            backgroundColor: '#0f0D23',
            borderRadius: 50,
            marginHorizontal: 20,
            marginBottom: 10,
            height: 60,
            position: 'absolute',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#0f0D23',
            bottom: 0,
          },
        tabBarItemStyle: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tab.Screen
        name="IndexScreen"
        component={IndexScreen}  // Add the correct component
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={28} color={color} />,
        }}
      />
      <Tab.Screen
        name="LocalMusic"
        component={LocalMusic}  // Add the correct component
        options={{
          title: 'Local Music',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="folder-music-outline" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Setting"
        component={Setting}  // Add the correct component
        options={{
          title: 'Setting',
          tabBarIcon: ({ color }) => <Feather name="settings" size={28} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

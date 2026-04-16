import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { Keyboard, View, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import IndexScreen from './IndexScreen';
import LocalMusic from './LocalMusic';
import Setting from './Setting';
import Library from './screens/Library';
import AntDesign from 'react-native-vector-icons/AntDesign'
import LinearGradient from 'react-native-linear-gradient';

const Tab = createBottomTabNavigator();

const COLORS = {
  background: '#0B0B0F',
  tabBar: '#14141A',
  active: '#2196f3',      // modern violet
  inactive: '#4B5563',
};

function AnimatedIcon({ children, focused }) {
  const scale = new Animated.Value(focused ? 1.15 : 1);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
}

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
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarShowLabel: true,
        tabBarStyle: keyboardVisible
          ? { display: 'none' }
          : {
            position: 'absolute',
            marginLeft: 20,
            marginRight: 20,
            bottom: 10,
            height: 70,
            borderRadius: 30,
            backgroundColor: COLORS.tabBar,
            borderTopWidth: 0,
            shadowColor: COLORS.active,
            shadowOpacity: 0.15,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 15,
            elevation: 25,

          },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
          letterSpacing: 0.5,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              borderRadius: 30,
              backgroundColor: '#14141A',

              // iOS shadow (all sides)
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.35,
              shadowRadius: 20,

              // Android workaround
              elevation: 25,
            }}
          >
            <LinearGradient
              colors={[
                'rgba(33,150,243,0.25)',
                'rgba(33,150,243,0.15)',
                '#14141A',
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                flex: 1,
                borderRadius: 30,
              }}
            />
          </View>
        ),
      }}
    >
      <Tab.Screen
        name="Home"
        component={IndexScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon focused={focused}>
              <AntDesign name="home" color={color} size={26} />
            </AnimatedIcon>
          ),
        }}
      />

      <Tab.Screen
        name="Library"
        component={Library}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon focused={focused}>
              <Ionicons name="library" color={color} size={26} />
            </AnimatedIcon>
          ),
        }}
      />

      <Tab.Screen
        name="Local"
        component={LocalMusic}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon focused={focused}>
              <MaterialDesignIcons
                name="book-music"
                size={26}
                color={color}
              />
            </AnimatedIcon>
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={Setting}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon focused={focused}>
              <Feather name="settings" size={26} color={color} />
            </AnimatedIcon>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
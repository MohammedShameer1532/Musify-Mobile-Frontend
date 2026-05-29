import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Keyboard,
  View,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';

import LinearGradient from 'react-native-linear-gradient';

import IndexScreen from './IndexScreen';
import LocalMusic from './LocalMusic';
import Setting from './Setting';
import Library from './screens/Library';

const Tab = createBottomTabNavigator();

const COLORS = {
  background: '#07070A',
  tabBar: '#111114',
  active: '#4DA6FF',
  inactive: '#6B7280',
};

function AnimatedTabIcon({
  focused,
  children,
}) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const translateAnim = useRef(new Animated.Value(focused ? -4 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.08 : 0.92,
        useNativeDriver: true,
        friction: 4,
      }),

      Animated.spring(translateAnim, {
        toValue: focused ? -4 : 0,
        useNativeDriver: true,
        friction: 5,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { translateY: translateAnim },
        ],
      }}
    >
      {focused ? (
        <LinearGradient
          colors={['#2196f3', '#6a5cff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeIconContainer}
        >
          {children}
        </LinearGradient>
      ) : (
        <View style={styles.inactiveIconContainer}>
          {children}
        </View>
      )}
    </Animated.View>
  );
}

export default function TabsLayout() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );

    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,

          tabBarHideOnKeyboard: true,

          tabBarShowLabel: true,

          tabBarActiveTintColor: '#ffffff',

          tabBarInactiveTintColor: COLORS.inactive,

          tabBarStyle: keyboardVisible
            ? { display: 'none' }
            : styles.tabBar,

          tabBarLabelStyle: styles.label,

          tabBarItemStyle: styles.tabItem,

          tabBarBackground: () => (
            <View style={styles.tabBackground}>
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.06)',
                  'rgba(255,255,255,0.02)',
                  '#111114',
                ]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.gradient}
              />
            </View>
          ),
        }}
      >
        {/* HOME */}
        <Tab.Screen
          name="Home"
          component={IndexScreen}
          options={{
            tabBarButton: props => (
              <TouchableOpacity
                activeOpacity={0.9}
                {...props}
              />
            ),

            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused}>
                <AntDesign
                  name="home"
                  size={22}
                  color={focused ? '#fff' : color}
                />
              </AnimatedTabIcon>
            ),
          }}
        />

        {/* LIBRARY */}
        <Tab.Screen
          name="Library"
          component={Library}
          options={{
            tabBarButton: props => (
              <TouchableOpacity
                activeOpacity={0.9}
                {...props}
              />
            ),

            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused}>
                <Ionicons
                  name="library"
                  size={22}
                  color={focused ? '#fff' : color}
                />
              </AnimatedTabIcon>
            ),
          }}
        />

        {/* LOCAL */}
        <Tab.Screen
          name="Local"
          component={LocalMusic}
          options={{
            tabBarButton: props => (
              <TouchableOpacity
                activeOpacity={0.9}
                {...props}
              />
            ),

            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused}>
                <MaterialDesignIcons
                  name="music-circle-outline"
                  size={24}
                  color={focused ? '#fff' : color}
                />
              </AnimatedTabIcon>
            ),
          }}
        />

        {/* SETTINGS */}
        <Tab.Screen
          name="Settings"
          component={Setting}
          options={{
            tabBarButton: props => (
              <TouchableOpacity
                activeOpacity={0.9}
                {...props}
              />
            ),

            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused}>
                <Feather
                  name="settings"
                  size={22}
                  color={focused ? '#fff' : color}
                />
              </AnimatedTabIcon>
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',

    left: 18,
    right: 18,
    bottom: 10,

    height: 86, // increased

    borderRadius: 30,

    backgroundColor: 'transparent',

    borderTopWidth: 0,

    elevation: 0,
  },

  tabBackground: {
    flex: 1,

    borderRadius: 30,

    overflow: 'hidden',

    backgroundColor: '#111114',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 18,

    elevation: 20,
  },

  gradient: {
    flex: 1,
    borderRadius: 30,
  },

  tabItem: {
    paddingTop: 20,
    paddingBottom: 30,
  },

  label: {
    fontSize: 11,

    fontFamily: 'Poppins-SemiBold',

    marginTop: 4,
    top: 4,
  },

  activeIconContainer: {
    width: 50,
    height: 50,

    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#2196f3',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.45,
    shadowRadius: 10,

    elevation: 10,
  },

  inactiveIconContainer: {
    width: 50,
    height: 50,

    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',

    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.45,
    shadowRadius: 10,

    elevation: 10,

    backgroundColor: 'rgba(255,255,255,0.03)',
  },
});
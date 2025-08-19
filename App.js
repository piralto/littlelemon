// App.js
import React, { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Onboarding from "./screens/Onboarding";
import Profile from "./screens/Profile";
import Home from "./screens/Home";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerTitleAlign: "center" }}>
        {/* 1) Onboarding → navigate to Profile with params */}
        <Stack.Screen name="Onboarding" options={{ title: "Welcome" }}>
          {(props) => (
            <Onboarding
              {...props}
              onComplete={({ name, email }) => {
                props.navigation.navigate("Profile", { name, email });
              }}
            />
          )}
        </Stack.Screen>

        {/* 2) Profile → replace with Home when completed */}
        <Stack.Screen name="Profile" options={{ title: "Your Profile" }}>
          {(props) => (
            <Profile
              {...props}
              onCompleteProfile={() => {
                props.navigation.replace("Home");
              }}
            />
          )}
        </Stack.Screen>

        {/* 3) Home (final destination) */}
        <Stack.Screen name="Home" component={Home} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
});

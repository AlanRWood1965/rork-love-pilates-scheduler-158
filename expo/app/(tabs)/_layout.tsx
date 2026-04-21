import { Tabs } from "expo-router";
import { CalendarDays, PersonStanding, Mail } from "lucide-react-native";
import React from "react";

import Colors from "@/constants/colors";

export const unstable_settings = {
  initialRouteName: "schedule",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
        },
      }}
    >
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: "Choose my class",
          tabBarIcon: ({ color, size }) => <PersonStanding size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: "Contact",
          tabBarIcon: ({ color, size }) => <Mail size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

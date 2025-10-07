// src/types/declarations.d.ts
declare module '@react-native-community/datetimepicker';
declare module '@react-navigation/native' {
  export * from '@react-navigation/core';
}
declare module '@react-navigation/native-stack';
declare module '@react-navigation/bottom-tabs';
declare module '@react-native-async-storage/async-storage';
declare module 'expo-notifications' {
  export interface DateTriggerInput {
    type: 'date';
    date: Date;
    channelId?: string;
  }
  export * from 'expo-notifications';
}
declare module 'expo-device';
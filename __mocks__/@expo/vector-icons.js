// Mock para @expo/vector-icons
import React from 'react';
import { Text } from 'react-native';

const createIconSetMock = (name) => {
  const IconComponent = (props) => {
    return React.createElement(Text, {
      ...props,
      testID: props.testID || `${name}-icon`,
    }, props.name || '★');
  };
  IconComponent.displayName = name;
  return IconComponent;
};

export const Ionicons = createIconSetMock('Ionicons');
export const MaterialIcons = createIconSetMock('MaterialIcons');
export const MaterialCommunityIcons = createIconSetMock('MaterialCommunityIcons');
export const FontAwesome = createIconSetMock('FontAwesome');
export const FontAwesome5 = createIconSetMock('FontAwesome5');
export const AntDesign = createIconSetMock('AntDesign');
export const Entypo = createIconSetMock('Entypo');
export const EvilIcons = createIconSetMock('EvilIcons');
export const Feather = createIconSetMock('Feather');
export const Foundation = createIconSetMock('Foundation');
export const Octicons = createIconSetMock('Octicons');
export const SimpleLineIcons = createIconSetMock('SimpleLineIcons');
export const Zocial = createIconSetMock('Zocial');

export default {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome5,
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  Foundation,
  Octicons,
  SimpleLineIcons,
  Zocial,
};

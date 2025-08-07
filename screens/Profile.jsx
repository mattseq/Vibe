import React from 'react';
import { Text, View, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Profile({ navigation }) {
    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Profile
            </Text>
            <Text style={{ fontSize: 16, marginTop: 10 }}>This is the profile screen.</Text>
        </SafeAreaView>
    );
}
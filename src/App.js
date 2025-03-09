// src/App.js
import React from 'react';
import { SafeAreaView } from 'react-native';
import LandingPage from './screens/LandingPage';

const App = () => {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LandingPage />
        </SafeAreaView>
    );
};

export default App;

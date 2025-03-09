/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App'; // App.js 파일 경로를 맞춰주세요.
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);

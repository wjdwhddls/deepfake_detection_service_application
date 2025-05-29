import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const CreatePostScreen = ({ navigation }) => {
  const { isLightMode } = useTheme();
  const styles = getStyles(isLightMode);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !text.trim()) {
      Alert.alert('입력 오류', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('로그인이 필요합니다.');

      await axios.post(
        'http://172.30.1.63:3000/api/dashboard',
        {
          title,
          text,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('작성 완료', '게시글이 등록되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('글 작성 오류:', error);
      Alert.alert(
        '오류 발생',
        error.response?.data?.message || '게시글 등록에 실패했습니다.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.innerContainer}>
        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="제목을 입력하세요"
          placeholderTextColor={isLightMode ? '#999' : '#ccc'}
        />

        <Text style={styles.label}>내용</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={text}
          onChangeText={setText}
          placeholder="내용을 입력하세요"
          placeholderTextColor={isLightMode ? '#999' : '#ccc'}
          multiline={true}
          numberOfLines={6}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>작성하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (isLightMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isLightMode ? '#FFF' : '#000',
    },
    innerContainer: {
      padding: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: isLightMode ? '#000' : '#FFF',
    },
    input: {
      borderWidth: 1,
      borderColor: '#007AFF',
      borderRadius: 6,
      padding: 10,
      marginBottom: 20,
      color: isLightMode ? '#000' : '#FFF',
    },
    textArea: {
      height: 120,
    },
    submitButton: {
      backgroundColor: '#007AFF',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default CreatePostScreen;
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext'; // 테마 컨텍스트 추가

const FAQScreen = ({ navigation }) => {
    const [expandedQuestionIndex, setExpandedQuestionIndex] = useState(null);
    const { isLightMode } = useTheme(); // 테마 상태 가져오기
    const styles = getStyles(isLightMode); // 동적 스타일 적용

    // 질문 목록 데이터
    const questions = [
        {
            question: "자주 묻는 질문 1",
            answer: "자주 묻는 질문 내용 1",
        },
        {
            question: "자주 묻는 질문 2",
            answer: "자주 묻는 질문 내용 2",
        },
        {
            question: "자주 묻는 질문 3",
            answer: "자주 묻는 질문 내용 3입니다. 내용 내용 내용 내용 내용 내용 내용 내용 내용 내용.",
        },
        {
            question: "자주 묻는 질문 4",
            answer: "자주 묻는 질문 내용 4",
        },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                >
                    <Icon 
                        name="arrow-back" 
                        size={24} 
                        color={isLightMode ? "#000" : "#FFF"} 
                    />
                </TouchableOpacity>
                <Text style={styles.title}>자주 묻는 질문</Text>
            </View>

            <ScrollView>
                {questions.map((item, index) => (
                    <View key={index}>
                        <TouchableOpacity
                            style={styles.questionContainer}
                            onPress={() => setExpandedQuestionIndex(expandedQuestionIndex === index ? null : index)}
                        >
                            <Text style={styles.question}>{item.question}</Text>
                            <Icon
                                name={expandedQuestionIndex === index ? "chevron-up" : "chevron-down"}
                                size={24}
                                color={isLightMode ? "#000" : "#FFF"}
                            />
                        </TouchableOpacity>
                        {expandedQuestionIndex === index && (
                            <Text style={styles.answer}>{item.answer}</Text>
                        )}
                    </View>
                ))}
            </ScrollView>
            <Text style={styles.footer}>
                ※ 추가 문의사항은 HONGIK123@g.hongik.ac.kr로 문의주시길 바랍니다.
            </Text>
        </View>
    );
};

// 테마에 따른 스타일 동적 생성
const getStyles = (isLightMode) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isLightMode ? '#FFF' : '#000',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 30,
        marginTop: 40,
    },
    backButton: {
        marginRight: 10,
    },
    title: {
        fontSize: 24,
        color: isLightMode ? '#000' : '#FFF',
        textAlign: 'center',
        flex: 1,
    },
    questionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: isLightMode ? '#EEE' : '#1f1f1f',
        borderRadius: 10,
        marginBottom: 10,
    },
    question: {
        color: isLightMode ? '#000' : '#FFF',
        fontSize: 18,
    },
    answer: {
        color: isLightMode ? '#666' : '#B0B0B0',
        padding: 15,
        backgroundColor: isLightMode ? '#F5F5F5' : '#333',
        borderRadius: 10,
        marginBottom: 10,
    },
    footer: {
        color: isLightMode ? '#666' : '#B0B0B0',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 20,
    },
});

export default FAQScreen;

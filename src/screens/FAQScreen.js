import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const FAQScreen = ({ navigation }) => {
    const [expandedQuestionIndex, setExpandedQuestionIndex] = useState(null); // 클릭된 질문 인덱스 저장

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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#FFFFFF" />
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
                                color="#FFF"
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // 왼쪽 정렬
        marginBottom: 30, // 헤더와 내용 간격 추가
        marginTop: 40,     // 헤더 위 간격 추가
    },
    backButton: {
        marginRight: 10,
    },
    title: {
        fontSize: 24,
        color: '#FFF',
        textAlign: 'center',
        flex: 1,
    },
    questionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#1f1f1f',
        borderRadius: 10,
        marginBottom: 10,
    },
    question: {
        color: '#FFF',
        fontSize: 18,
    },
    answer: {
        color: '#B0B0B0',
        padding: 15,
        backgroundColor: '#333',
        borderRadius: 10,
        marginBottom: 10,
    },
    footer: {
        color: '#B0B0B0',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 20,
    },
});

export default FAQScreen;

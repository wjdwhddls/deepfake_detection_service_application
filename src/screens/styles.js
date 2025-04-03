import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 60,                  // 높이 증가
    width: '80%',                // 너비 설정
    borderColor: '#A9A9A9',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,         // 수직 패딩 추가
    backgroundColor: '#222',      // 배경 색상 추가
    color: '#FFF',
    marginBottom: 15,
    fontSize: 16,                // 폰트 크기 조정
  },
  orText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginVertical: 15,
  },
  authButton: {
    height: 55,
    width: '80%',
    borderRadius: 10,
    backgroundColor: '#DB4437',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  authButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  footerText: {
    color: '#A9A9A9',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default styles;

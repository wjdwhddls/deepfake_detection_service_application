import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 60,
    width: '100%',                  // 폭을 100%로 설정
    borderColor: '#A9A9A9',
    borderWidth: 1,
    borderRadius: 25,               // 둥근 모서리
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#222',
    color: '#FFF',
    marginBottom: 15,
    fontSize: 16,
  },
  orText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginVertical: 15,
  },
  authButton: {
    height: 55,
    width: '100%',                  // 폭을 100%로 설정
    borderRadius: 25,               // 둥근 모서리
    backgroundColor: '#DB4437',     // 구글 버튼 색상
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  naverButton: {
    height: 55,
    width: '100%',                  // 폭을 100%로 설정
    borderRadius: 25,               // 둥글게
    backgroundColor: '#1EC800',     // 네이버 색상
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
  linkText: {
    color: '#DB4437', // 회원가입 텍스트 색상
  },
});

export default styles;

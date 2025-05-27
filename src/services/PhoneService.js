import { PermissionsAndroid, Platform } from "react-native";

export const checkPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ];

      // Android 13+ 전용 권한 추가
      if (Platform.Version >= 33) {
        permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO);
      }

      const statuses = await PermissionsAndroid.requestMultiple(permissions);

      Object.entries(statuses).forEach(([permission, status]) => {
        if (status === PermissionsAndroid.RESULTS.GRANTED) {
          console.log(`${permission} 권한이 허용되었습니다.`);
        } else {
          console.warn(`${permission} 권한이 거부되었습니다.`);
        }
      });
    } catch (error) {
      console.error('권한 요청 중 오류 발생', error);
    }
  }
};

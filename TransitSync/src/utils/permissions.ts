import { PermissionsAndroid, Platform } from "react-native";

export const requestStoragePermission = async () => {
  if (Platform.OS === "android") {
    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
          PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission Needed 📁",
            message:
              "TransitSync requires storage access to save exported Excel spreadsheets to your Downloads folder.",
            buttonNeutral: "Ask Later",
            buttonNegative: "Cancel",
            buttonPositive: "Allow Permission",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn("Storage permission request error:", err);
      return false;
    }
  }
  return true;
};

import { File } from 'expo-file-system';

/**
 * Append a local image for multipart upload. Uses expo-file-system `File` so
 * Expo's fetch can serialize FormData (RN `{ uri, name, type }` is not supported).
 */
export function appendImageToFormData(formData: FormData, fieldName: string, imageUri: string) {
  formData.append(fieldName, new File(imageUri));
}

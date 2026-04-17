import { profileService } from "@/services/profileService";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [regions, setRegions] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
    name: "",
    phone: "",
    email: "",
    gender: "",
    birthdate: "",
    region: "",
    province: "",
    city: "",
    barangay: "",
    valid_id_type: "",
    valid_id_number: "",
    street: "",
    postal_code: "",
    front_valid_id_picture: null,
    back_valid_id_picture: null,
  });

  // --- VALIDATION LOGIC ---
  const isFormComplete = () => {
    const requiredFields = [
      "name",
      "phone",
      "email",
      "gender",
      "birthdate",
      "region",
      "province",
      "city",
      "barangay",
      "valid_id_type",
      "valid_id_number",
      "street",
      "postal_code",
    ];

    const fieldsFilled = requiredFields.every((field) => !!form[field]);
    const imagesUploaded =
      !!form.front_valid_id_picture && !!form.back_valid_id_picture;

    return fieldsFilled && imagesUploaded;
  };

  useEffect(() => {
    fetchProfile();
    fetchRegions();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await profileService.getProfile();
      setForm({
        ...res,
        front_valid_id_picture: res.front_valid_id_picture
          ? { uri: res.front_valid_id_picture }
          : null,
        back_valid_id_picture: res.back_valid_id_picture
          ? { uri: res.back_valid_id_picture }
          : null,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    const res = await fetch("https://psgc.gitlab.io/api/regions/");
    setRegions(await res.json());
  };

  const fetchProvinces = async (regionCode: string) => {
    const res = await fetch(
      `https://psgc.gitlab.io/api/regions/${regionCode}/provinces/`,
    );
    setProvinces(await res.json());
  };

  const fetchCities = async (provinceCode: string) => {
    const res = await fetch(
      `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`,
    );
    setCities(await res.json());
  };

  const fetchBarangays = async (cityCode: string) => {
    const res = await fetch(
      `https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays/`,
    );
    setBarangays(await res.json());
  };

  const pickImage = async (field: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets?.[0];
    if (!file) return;

    // Validation for 5120 KB (5MB)
    const maxSize = 5120 * 1024;
    if (file.size && file.size > maxSize) {
      Alert.alert("File Too Large", "Please select an image smaller than 5MB.");
      return;
    }

    setForm((prev: any) => ({
      ...prev,
      [field]: {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "image/jpeg",
      },
    }));
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await profileService.updateProfile(form);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  // Styles
  const card = "bg-white p-5 rounded-3xl mb-4 shadow-sm border border-gray-100";
  const label =
    "text-gray-500 mb-2 font-semibold text-xs uppercase tracking-wider";
  const inputStyle =
    "border border-gray-200 bg-gray-50 p-4 rounded-2xl mb-4 text-gray-800 font-medium";
  const pickerContainer =
    "border border-gray-200 rounded-2xl bg-gray-50 mb-4 overflow-hidden";

  return (
    <ScrollView
      className="flex-1 bg-[#F8F9FB] px-4"
      showsVerticalScrollIndicator={false}
    >
      {/* BASIC INFO */}
      <View className={`${card} mt-4`}>
        <View className="flex-row items-center mb-4">
          <Ionicons name="person-circle-outline" size={24} color="#034194" />
          <Text className="text-lg font-bold ml-2 text-gray-800">
            Basic Information
          </Text>
        </View>

        <Text className={label}>Full Name</Text>
        <TextInput
          value={form.name}
          placeholder="Juan Dela Cruz"
          onChangeText={(t) => setForm({ ...form, name: t })}
          className={inputStyle}
        />

        <Text className={label}>Phone Number</Text>
        <TextInput
          value={form.phone}
          keyboardType="phone-pad"
          placeholder="09123456789"
          onChangeText={(t) => setForm({ ...form, phone: t })}
          className={inputStyle}
        />

        <Text className={label}>Email Address</Text>
        <TextInput
          value={form.email}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="example@gmail.com"
          onChangeText={(t) => setForm({ ...form, email: t })}
          className={inputStyle}
        />

        <Text className={label}>Gender</Text>
        <View className={pickerContainer}>
          <Picker
            selectedValue={form.gender}
            onValueChange={(value) => setForm({ ...form, gender: value })}
          >
            <Picker.Item label="Select Gender" value="" color="#9CA3AF" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
          </Picker>
        </View>

        <Text className={label}>Birthdate</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className={inputStyle}
        >
          <Text className={form.birthdate ? "text-gray-800" : "text-gray-400"}>
            {form.birthdate || "YYYY-MM-DD"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={
              form.birthdate ? new Date(form.birthdate) : new Date(2000, 0, 1)
            }
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setForm({
                  ...form,
                  birthdate: selectedDate.toISOString().split("T")[0],
                });
              }
            }}
          />
        )}
      </View>

      {/* ADDRESS */}
      <View className={card}>
        <View className="flex-row items-center mb-4">
          <Ionicons name="location-outline" size={24} color="#034194" />
          <Text className="text-lg font-bold ml-2 text-gray-800">
            Address Details
          </Text>
        </View>

        <Text className={label}>Region</Text>
        <View className={pickerContainer}>
          <Picker
            selectedValue={form.region}
            onValueChange={(value) => {
              setForm({
                ...form,
                region: value,
                province: "",
                city: "",
                barangay: "",
              });
              fetchProvinces(value);
            }}
          >
            <Picker.Item label="Select Region" value="" color="#9CA3AF" />
            {regions.map((r) => (
              <Picker.Item key={r.code} label={r.name} value={r.code} />
            ))}
          </Picker>
        </View>

        <Text className={label}>Province</Text>
        <View className={pickerContainer}>
          <Picker
            selectedValue={form.province}
            onValueChange={(value) => {
              setForm({ ...form, province: value, city: "", barangay: "" });
              fetchCities(value);
            }}
          >
            <Picker.Item label="Select Province" value="" color="#9CA3AF" />
            {provinces.map((p) => (
              <Picker.Item key={p.code} label={p.name} value={p.code} />
            ))}
          </Picker>
        </View>

        <Text className={label}>City</Text>
        <View className={pickerContainer}>
          <Picker
            selectedValue={form.city}
            onValueChange={(value) => {
              setForm({ ...form, city: value, barangay: "" });
              fetchBarangays(value);
            }}
          >
            <Picker.Item label="Select City" value="" color="#9CA3AF" />
            {cities.map((c) => (
              <Picker.Item key={c.code} label={c.name} value={c.code} />
            ))}
          </Picker>
        </View>

        <Text className={label}>Barangay</Text>
        <View className={pickerContainer}>
          <Picker
            selectedValue={form.barangay}
            onValueChange={(value) => setForm({ ...form, barangay: value })}
          >
            <Picker.Item label="Select Barangay" value="" color="#9CA3AF" />
            {barangays.map((b) => (
              <Picker.Item key={b.code} label={b.name} value={b.code} />
            ))}
          </Picker>
        </View>

        <Text className={label}>Street / House No.</Text>
        <TextInput
          value={form.street}
          onChangeText={(t) => setForm({ ...form, street: t })}
          className={inputStyle}
        />

        <Text className={label}>Postal Code</Text>
        <TextInput
          value={form.postal_code}
          keyboardType="numeric"
          onChangeText={(t) => setForm({ ...form, postal_code: t })}
          className={inputStyle}
        />
      </View>

      {/* VALID ID */}
      <View className={card}>
        <View className="flex-row items-center mb-4">
          <Ionicons name="id-card-outline" size={24} color="#034194" />
          <Text className="text-lg font-bold ml-2 text-gray-800">
            Identity Verification
          </Text>
        </View>

        <Text className={label}>ID Type</Text>
        <View className={pickerContainer}>
          <Picker
            selectedValue={form.valid_id_type}
            onValueChange={(value) =>
              setForm({ ...form, valid_id_type: value })
            }
          >
            <Picker.Item label="Select ID Type" value="" color="#9CA3AF" />
            <Picker.Item label="National ID" value="National ID" />
            <Picker.Item label="Passport" value="Passport" />
            <Picker.Item label="Driver License" value="Driver License" />
          </Picker>
        </View>

        <Text className={label}>ID Number</Text>
        <TextInput
          value={form.valid_id_number}
          onChangeText={(t) => setForm({ ...form, valid_id_number: t })}
          className={inputStyle}
        />

        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={() => pickImage("front_valid_id_picture")}
            className="w-[48%] border-2 border-dashed border-gray-200 rounded-3xl p-2 items-center justify-center bg-gray-50 h-32"
          >
            {form.front_valid_id_picture?.uri ? (
              <Image
                source={{ uri: form.front_valid_id_picture.uri }}
                className="w-full h-full rounded-2xl"
              />
            ) : (
              <>
                <Ionicons name="camera-outline" size={24} color="#9CA3AF" />
                <Text className="text-[10px] text-gray-400 mt-1 font-bold">
                  FRONT ID
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => pickImage("back_valid_id_picture")}
            className="w-[48%] border-2 border-dashed border-gray-200 rounded-3xl p-2 items-center justify-center bg-gray-50 h-32"
          >
            {form.back_valid_id_picture?.uri ? (
              <Image
                source={{ uri: form.back_valid_id_picture.uri }}
                className="w-full h-full rounded-2xl"
              />
            ) : (
              <>
                <Ionicons name="camera-outline" size={24} color="#9CA3AF" />
                <Text className="text-[10px] text-gray-400 mt-1 font-bold">
                  BACK ID
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* SAVE BUTTON */}
      <TouchableOpacity
        onPress={handleUpdate}
        disabled={saving || !isFormComplete()}
        style={{ opacity: saving || !isFormComplete() ? 0.5 : 1 }}
        className="bg-primary py-5 rounded-3xl mb-12 shadow-lg shadow-primary/40"
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-bold text-lg">
            Save Changes
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

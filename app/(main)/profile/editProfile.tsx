import { profileService } from "@/services/profileService";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const hasNoParams = Object.keys(params).length === 0;
  const showInfo = "info" in params || hasNoParams;
  const showLocation = "location" in params || hasNoParams;
  const showID = "vakidID" in params || hasNoParams;

  const [isEditing, setIsEditing] = useState(false);
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

  // Helper to get the Name from the Code for display mode
  const getNameFromCode = (list: any[], code: string) => {
    const item = list.find((i) => i.code === code);
    return item ? item.name : null;
  };

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
    return (
      requiredFields.every((field) => !!form[field]) &&
      !!form.front_valid_id_picture &&
      !!form.back_valid_id_picture
    );
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Load regions first so we have the list
      await fetchRegions();

      const res = await profileService.getProfile();
      // Handle JSON API structure if attributes exists
      const userData = res.data?.attributes || res;

      setForm({
        ...userData,
        front_valid_id_picture: userData.front_valid_id_picture
          ? { uri: userData.front_valid_id_picture }
          : null,
        back_valid_id_picture: userData.back_valid_id_picture
          ? { uri: userData.back_valid_id_picture }
          : null,
      });

      // 2. Cascade load the address lists based on stored codes
      if (userData.region) await fetchProvinces(userData.region);
      if (userData.province) await fetchCities(userData.province);
      if (userData.city) await fetchBarangays(userData.city);
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
    if (!isEditing) return;
    const result = await DocumentPicker.getDocumentAsync({ type: "image/*" });
    if (result.canceled) return;
    const file = result.assets?.[0];
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
    if (!isFormComplete()) {
      Alert.alert("Incomplete", "Please fill in all fields.");
      return;
    }
    setSaving(true);
    try {
      await profileService.updateProfile(form);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated.");
    } catch (err) {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setForm((prev: any) => ({
        ...prev,
        birthdate: selectedDate.toISOString().split("T")[0],
      }));
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  const card = "bg-white p-5 rounded-3xl mb-4 shadow-sm border border-gray-100";
  const label =
    "text-gray-500 mb-1 font-semibold text-[10px] uppercase tracking-wider";
  const valueStyle = "text-gray-800 font-bold text-base mb-4";
  const inputStyle =
    "border border-gray-200 bg-gray-50 p-4 rounded-2xl mb-4 text-gray-800 font-medium";
  const pickerContainer =
    "border border-gray-200 rounded-2xl bg-gray-50 mb-4 overflow-hidden";

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1 bg-[#F8F9FB] px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-between items-center mt-6 mb-4">
          <Text className="text-2xl font-black text-gray-800">
            Account Details
          </Text>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-full ${isEditing ? "bg-red-50" : "bg-blue-50"}`}
          >
            <Text
              className={`font-bold ${isEditing ? "text-red-500" : "text-[#034194]"}`}
            >
              {isEditing ? "Cancel" : "Edit Details"}
            </Text>
          </TouchableOpacity>
        </View>

        {showInfo && (
          <View className={card}>
            <Text className="text-lg font-bold mb-4 text-gray-800">
              Basic Info
            </Text>

            <Text className={label}>Full Name</Text>
            {isEditing ? (
              <TextInput
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
                className={inputStyle}
              />
            ) : (
              <Text className={valueStyle}>{form.name || "---"}</Text>
            )}

            <Text className={label}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                value={form.phone}
                keyboardType="phone-pad"
                onChangeText={(t) => setForm({ ...form, phone: t })}
                className={inputStyle}
              />
            ) : (
              <Text className={valueStyle}>{form.phone || "---"}</Text>
            )}

            <Text className={label}>Gender</Text>
            {isEditing ? (
              <View className={pickerContainer}>
                <Picker
                  selectedValue={form.gender}
                  onValueChange={(v) => setForm({ ...form, gender: v })}
                >
                  <Picker.Item label="Select Gender" value="" />
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                </Picker>
              </View>
            ) : (
              <Text className={valueStyle}>{form.gender || "---"}</Text>
            )}

            <Text className={label}>Birthdate</Text>
            {isEditing ? (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className={inputStyle}
              >
                <Text>{form.birthdate || "YYYY-MM-DD"}</Text>
              </TouchableOpacity>
            ) : (
              <Text className={valueStyle}>{form.birthdate || "---"}</Text>
            )}
          </View>
        )}

        {showLocation && (
          <View className={card}>
            <Text className="text-lg font-bold mb-4 text-gray-800">
              Address
            </Text>

            <Text className={label}>Region</Text>
            {isEditing ? (
              <View className={pickerContainer}>
                <Picker
                  selectedValue={form.region}
                  onValueChange={(v) => {
                    setForm({
                      ...form,
                      region: v,
                      province: "",
                      city: "",
                      barangay: "",
                    });
                    fetchProvinces(v);
                  }}
                >
                  <Picker.Item label="Select Region" value="" />
                  {regions.map((r) => (
                    <Picker.Item key={r.code} label={r.name} value={r.code} />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text className={valueStyle}>
                {getNameFromCode(regions, form.region) || "---"}
              </Text>
            )}

            <Text className={label}>Province</Text>
            {isEditing ? (
              <View className={pickerContainer}>
                <Picker
                  selectedValue={form.province}
                  onValueChange={(v) => {
                    setForm({ ...form, province: v, city: "", barangay: "" });
                    fetchCities(v);
                  }}
                >
                  <Picker.Item label="Select Province" value="" />
                  {provinces.map((p) => (
                    <Picker.Item key={p.code} label={p.name} value={p.code} />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text className={valueStyle}>
                {getNameFromCode(provinces, form.province) || "---"}
              </Text>
            )}

            <Text className={label}>City / Municipality</Text>
            {isEditing ? (
              <View className={pickerContainer}>
                <Picker
                  selectedValue={form.city}
                  onValueChange={(v) => {
                    setForm({ ...form, city: v, barangay: "" });
                    fetchBarangays(v);
                  }}
                >
                  <Picker.Item label="Select City" value="" />
                  {cities.map((c) => (
                    <Picker.Item key={c.code} label={c.name} value={c.code} />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text className={valueStyle}>
                {getNameFromCode(cities, form.city) || "---"}
              </Text>
            )}

            <Text className={label}>Barangay</Text>
            {isEditing ? (
              <View className={pickerContainer}>
                <Picker
                  selectedValue={form.barangay}
                  onValueChange={(v) => setForm({ ...form, barangay: v })}
                >
                  <Picker.Item label="Select Barangay" value="" />
                  {barangays.map((b) => (
                    <Picker.Item key={b.code} label={b.name} value={b.code} />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text className={valueStyle}>
                {getNameFromCode(barangays, form.barangay) || "---"}
              </Text>
            )}

            <Text className={label}>Street</Text>
            {isEditing ? (
              <TextInput
                value={form.street}
                onChangeText={(t) => setForm({ ...form, street: t })}
                className={inputStyle}
              />
            ) : (
              <Text className={valueStyle}>{form.street || "---"}</Text>
            )}

            <Text className={label}>Postal Code</Text>
            {isEditing ? (
              <TextInput
                value={form.postal_code}
                onChangeText={(t) => setForm({ ...form, postal_code: t })}
                className={inputStyle}
              />
            ) : (
              <Text className={valueStyle}>{form.postal_code || "---"}</Text>
            )}
          </View>
        )}

        {showID && (
          <View className={card}>
            <Text className="text-lg font-bold mb-4 text-gray-800">
              Verification
            </Text>
            <Text className={label}>ID Type & Number</Text>
            {isEditing ? (
              <>
                <View className={pickerContainer}>
                  <Picker
                    selectedValue={form.valid_id_type}
                    onValueChange={(v) =>
                      setForm({ ...form, valid_id_type: v })
                    }
                  >
                    <Picker.Item label="Select ID Type" value="" />
                    <Picker.Item label="National ID" value="National ID" />
                    <Picker.Item label="Passport" value="Passport" />
                  </Picker>
                </View>
                <TextInput
                  value={form.valid_id_number}
                  onChangeText={(t) => setForm({ ...form, valid_id_number: t })}
                  className={inputStyle}
                />
              </>
            ) : (
              <Text className={valueStyle}>
                {form.valid_id_type} - {form.valid_id_number || "---"}
              </Text>
            )}

            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                onPress={() => pickImage("front_valid_id_picture")}
                className="w-[48%] bg-gray-50 h-32 rounded-3xl items-center justify-center overflow-hidden border border-gray-100"
              >
                {form.front_valid_id_picture?.uri ? (
                  <Image
                    source={{ uri: form.front_valid_id_picture.uri }}
                    className="w-full h-full"
                  />
                ) : (
                  <Ionicons name="camera" size={24} color="#ccc" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickImage("back_valid_id_picture")}
                className="w-[48%] bg-gray-50 h-32 rounded-3xl items-center justify-center overflow-hidden border border-gray-100"
              >
                {form.back_valid_id_picture?.uri ? (
                  <Image
                    source={{ uri: form.back_valid_id_picture.uri }}
                    className="w-full h-full"
                  />
                ) : (
                  <Ionicons name="camera" size={24} color="#ccc" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {isEditing && (
        <View className="p-6 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={saving || !isFormComplete()}
            className="py-5 rounded-3xl bg-[#034194]"
            style={{ opacity: saving || !isFormComplete() ? 0.6 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-bold text-lg">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

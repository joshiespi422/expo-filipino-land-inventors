import { CustomAlert } from "@/components/CustomAlert";
import { profileService } from "@/services/profileService";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Custom Alert State
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

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
      "gender",
      "birthdate",
      "email",
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
      !!form.front_valid_id_picture?.uri && !!form.back_valid_id_picture?.uri;

    return fieldsFilled && imagesUploaded;
  };

  useEffect(() => {
    const init = async () => {
      await fetchRegions();
      await fetchProfile();
    };
    init();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await profileService.getProfile();
      setForm({ ...res });

      if (res.region) fetchProvinces(res.region);
      if (res.province) fetchCities(res.province);
      if (res.city) fetchBarangays(res.city);
    } catch (err) {
      console.error("Profile Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- ADDRESS API FETCHERS ---
  const fetchRegions = async () => {
    try {
      const res = await fetch("https://psgc.gitlab.io/api/regions/");
      setRegions(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProvinces = async (code: string) => {
    const res = await fetch(
      `https://psgc.gitlab.io/api/regions/${code}/provinces/`,
    );
    setProvinces(await res.json());
  };

  const fetchCities = async (code: string) => {
    const res = await fetch(
      `https://psgc.gitlab.io/api/provinces/${code}/cities-municipalities/`,
    );
    setCities(await res.json());
  };

  const fetchBarangays = async (code: string) => {
    const res = await fetch(
      `https://psgc.gitlab.io/api/cities-municipalities/${code}/barangays/`,
    );
    setBarangays(await res.json());
  };

  const pickImage = async (field: string) => {
    const result = await DocumentPicker.getDocumentAsync({ type: "image/*" });
    if (result.canceled) return;
    const file = result.assets?.[0];

    if (file && file.size && file.size > 5120 * 1024) {
      setAlert({
        visible: true,
        title: "File Too Large",
        message: "Please select an image smaller than 5MB.",
      });
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
    if (!isFormComplete()) return;

    setSaving(true);
    try {
      await profileService.updateProfile(form);
      router.replace("/profile/congratulations");
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const errorMessage = errors
        ? (Object.values(errors).flat()[0] as string)
        : "Failed to update profile. Please try again.";

      setAlert({
        visible: true,
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");

    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      setForm((prev: any) => ({
        ...prev,
        birthdate: formattedDate,
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

  // Common Styles
  const card = "bg-white p-5 rounded-3xl mb-4 shadow-sm border border-gray-100";
  const label = "text-primary mb-1 ps-2 text-sm";
  const inputStyle =
    "border border-gray-200 bg-white p-4 rounded-2xl mb-4 text-gray-800 font-medium";
  const pickerContainer =
    "border border-gray-200 rounded-2xl bg-white mb-4 overflow-hidden";

  return (
    <View className="flex-1 bg-white">
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

          <Text className={label}>Full Name (Locked)</Text>
          <TextInput
            value={form.name}
            editable={false}
            className={`${inputStyle} bg-gray-100 border-gray-200 color-gray-500`}
          />

          <Text className={label}>Phone Number (Locked)</Text>
          <TextInput
            value={form.phone}
            editable={false}
            className={`${inputStyle} bg-gray-100 border-gray-200 color-gray-500`}
          />

          <Text className={label}>Email Address</Text>
          <TextInput
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
            className={inputStyle}
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
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
            <Text
              className={form.birthdate ? "text-gray-800" : "text-gray-400"}
            >
              {form.birthdate || "YYYY-MM-DD"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={
                form.birthdate ? new Date(form.birthdate) : new Date(2000, 0, 1)
              }
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={handleDateChange}
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
              onValueChange={(v) => {
                setForm({
                  ...form,
                  region: v,
                  province: "",
                  city: "",
                  barangay: "",
                });
                if (v) fetchProvinces(v);
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
              onValueChange={(v) => {
                setForm({ ...form, province: v, city: "", barangay: "" });
                if (v) fetchCities(v);
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
              onValueChange={(v) => {
                setForm({ ...form, city: v, barangay: "" });
                if (v) fetchBarangays(v);
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
              onValueChange={(v) => setForm({ ...form, barangay: v })}
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
            placeholder="Street / House No."
            onChangeText={(t) => setForm({ ...form, street: t })}
            className={inputStyle}
          />

          <Text className={label}>Postal Code</Text>
          <TextInput
            value={form.postal_code}
            placeholder="Postal Code"
            keyboardType="numeric"
            onChangeText={(t) => setForm({ ...form, postal_code: t })}
            className={inputStyle}
          />
        </View>

        {/* VERIFICATION */}
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
              onValueChange={(v) => setForm({ ...form, valid_id_type: v })}
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
            placeholder="ID Number"
            onChangeText={(t) => setForm({ ...form, valid_id_number: t })}
            className={inputStyle}
          />

          <View className="flex-row justify-between mt-2">
            {[
              { key: "front_valid_id_picture", label: "FRONT ID" },
              { key: "back_valid_id_picture", label: "BACK ID" },
            ].map((side) => (
              <TouchableOpacity
                key={side.key}
                onPress={() => pickImage(side.key)}
                className="w-[48%] border-2 border-dashed border-gray-200 rounded-3xl p-2 items-center justify-center bg-gray-50 h-32"
              >
                {form[side.key]?.uri ? (
                  <Image
                    source={{ uri: form[side.key].uri }}
                    className="w-full h-full rounded-2xl"
                  />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={24} color="#9CA3AF" />
                    <Text className="text-[10px] text-gray-400 mt-1 font-bold">
                      {side.label}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* FOOTER SUBMIT BUTTON */}
      <View className="w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={saving || !isFormComplete()}
          activeOpacity={0.8}
          className={`h-16 rounded-2xl justify-center items-center ${
            saving || !isFormComplete() ? "bg-slate-300" : "bg-[#034194]"
          }`}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {isFormComplete() ? "Submit for Approval" : "Complete All Fields"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Alert Implementation */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </View>
  );
}

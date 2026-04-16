import { profileService } from "@/services/profileService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

  useEffect(() => {
    fetchProfile();
    fetchRegions();
  }, []);

  const fetchProfile = async () => {
    const res = await profileService.getProfile();

    setForm({
      name: res.name || "",
      phone: res.phone || "",
      email: res.email || "",
      gender: res.gender || "",
      birthdate: res.birthdate || "",

      region: res.region || "",
      province: res.province || "",
      city: res.city || "",
      barangay: res.barangay || "",

      valid_id_type: res.valid_id_type || "",
      valid_id_number: res.valid_id_number || "",

      street: res.street || "",
      postal_code: res.postal_code || "",

      front_valid_id_picture: res.front_valid_id_picture
        ? { uri: res.front_valid_id_picture }
        : null,

      back_valid_id_picture: res.back_valid_id_picture
        ? { uri: res.back_valid_id_picture }
        : null,
    });

    setLoading(false);
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
      alert("Profile updated successfully!");
    } catch (err) {
      console.log(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const card = "bg-white p-4 rounded-2xl mb-4 shadow-sm";
  const label = "text-gray-600 mb-1 font-medium";
  const input =
    "border border-gray-200 bg-gray-50 p-3 rounded-xl mb-3 text-gray-800";

  return (
    <ScrollView className="flex-1 bg-gray-100 px-4 pt-6">
      <Text className="text-3xl font-bold mb-4">Edit Profile</Text>

      {/* ================= BASIC INFO ================= */}
      <View className={card}>
        <Text className="text-lg font-semibold mb-3">Basic Information</Text>

        <Text className={label}>Full Name</Text>
        <TextInput
          value={form.name}
          onChangeText={(t) => setForm({ ...form, name: t })}
          className={input}
        />

        <Text className={label}>Phone</Text>
        <TextInput
          value={form.phone}
          onChangeText={(t) => setForm({ ...form, phone: t })}
          className={input}
        />

        <Text className={label}>Email</Text>
        <TextInput
          value={form.email}
          onChangeText={(t) => setForm({ ...form, email: t })}
          className={input}
        />

        <Text className={label}>Gender</Text>
        <View className="border border-gray-200 rounded-xl bg-gray-50 mb-3">
          <Picker
            selectedValue={form.gender}
            onValueChange={(value) => setForm({ ...form, gender: value })}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
            <Picker.Item label="Prefer not to say" value="Prefer not to say" />
          </Picker>
        </View>

        {/* ================= BIRTHDATE (NEW DATE PICKER) ================= */}
        <Text className={label}>Birthdate</Text>

        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className={input}
        >
          <Text className="text-gray-800">
            {form.birthdate || "Select Birthdate"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={
              form.birthdate ? new Date(form.birthdate) : new Date(2000, 0, 1)
            }
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);

              if (selectedDate) {
                const formatted = selectedDate.toISOString().split("T")[0];

                setForm({
                  ...form,
                  birthdate: formatted,
                });
              }
            }}
          />
        )}
      </View>

      {/* ================= ADDRESS ================= */}
      <View className={card}>
        <Text className="text-lg font-semibold mb-3">Address</Text>

        <Text className={label}>Region</Text>
        <View className="border border-gray-200 rounded-xl bg-gray-50 mb-3">
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
            <Picker.Item label="Select Region" value="" />
            {regions.map((r) => (
              <Picker.Item key={r.code} label={r.name} value={r.code} />
            ))}
          </Picker>
        </View>

        <Text className={label}>Province</Text>
        <View className="border border-gray-200 rounded-xl bg-gray-50 mb-3">
          <Picker
            selectedValue={form.province}
            onValueChange={(value) => {
              setForm({ ...form, province: value, city: "", barangay: "" });
              fetchCities(value);
            }}
          >
            <Picker.Item label="Select Province" value="" />
            {provinces.map((p) => (
              <Picker.Item key={p.code} label={p.name} value={p.code} />
            ))}
          </Picker>
        </View>

        <Text className={label}>City / Municipality</Text>
        <View className="border border-gray-200 rounded-xl bg-gray-50 mb-3">
          <Picker
            selectedValue={form.city}
            onValueChange={(value) => {
              setForm({ ...form, city: value, barangay: "" });
              fetchBarangays(value);
            }}
          >
            <Picker.Item label="Select City" value="" />
            {cities.map((c) => (
              <Picker.Item key={c.code} label={c.name} value={c.code} />
            ))}
          </Picker>
        </View>

        <Text className={label}>Barangay</Text>
        <View className="border border-gray-200 rounded-xl bg-gray-50 mb-3">
          <Picker
            selectedValue={form.barangay}
            onValueChange={(value) => setForm({ ...form, barangay: value })}
          >
            <Picker.Item label="Select Barangay" value="" />
            {barangays.map((b) => (
              <Picker.Item key={b.code} label={b.name} value={b.code} />
            ))}
          </Picker>
        </View>

        <Text className={label}>Street</Text>
        <TextInput
          value={form.street}
          onChangeText={(t) => setForm({ ...form, street: t })}
          className={input}
        />

        <Text className={label}>Postal Code</Text>
        <TextInput
          value={form.postal_code}
          onChangeText={(t) => setForm({ ...form, postal_code: t })}
          className={input}
        />
      </View>

      {/* ================= VALID ID ================= */}
      <View className={card}>
        <Text className="text-lg font-semibold mb-3">Valid ID</Text>

        <Text className={label}>ID Type</Text>
        <View className="border border-gray-200 rounded-xl bg-gray-50 mb-3">
          <Picker
            selectedValue={form.valid_id_type}
            onValueChange={(value) =>
              setForm({ ...form, valid_id_type: value })
            }
          >
            <Picker.Item label="Select ID Type" value="" />
            <Picker.Item label="National ID" value="National ID" />
            <Picker.Item label="Passport" value="Passport" />
            <Picker.Item label="Driver License" value="Driver License" />
          </Picker>
        </View>

        <Text className={label}>ID Number</Text>
        <TextInput
          value={form.valid_id_number}
          onChangeText={(t) => setForm({ ...form, valid_id_number: t })}
          className={input}
        />

        {/* FRONT ID */}
        <TouchableOpacity
          onPress={() => pickImage("front_valid_id_picture")}
          className="border border-dashed border-gray-300 rounded-xl p-3 mb-3 items-center bg-gray-50"
        >
          {form.front_valid_id_picture?.uri ? (
            <Image
              source={{ uri: form.front_valid_id_picture.uri }}
              className="w-full h-40 rounded-xl"
            />
          ) : (
            <Text className="text-gray-500">Upload Front ID</Text>
          )}
        </TouchableOpacity>

        {/* BACK ID */}
        <TouchableOpacity
          onPress={() => pickImage("back_valid_id_picture")}
          className="border border-dashed border-gray-300 rounded-xl p-3 items-center bg-gray-50"
        >
          {form.back_valid_id_picture?.uri ? (
            <Image
              source={{ uri: form.back_valid_id_picture.uri }}
              className="w-full h-40 rounded-xl"
            />
          ) : (
            <Text className="text-gray-500">Upload Back ID</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* SAVE */}
      <TouchableOpacity
        onPress={handleUpdate}
        disabled={saving}
        className="bg-primary py-4 rounded-2xl mb-16"
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Save Changes
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

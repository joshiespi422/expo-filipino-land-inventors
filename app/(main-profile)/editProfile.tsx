import { CustomAlert } from "@/components/CustomAlert";
import { profileService } from "@/services/profileService";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams } from "expo-router";
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

const MAX_ID_IMAGE_MB = 10;
const MAX_ID_IMAGE_BYTES = MAX_ID_IMAGE_MB * 1024 * 1024;

// Picker text must stay visible even when the device is using dark mode.
const pickerTextStyle = {
  color: "#1f2937",
};

export default function EditProfileScreen() {
  const params = useLocalSearchParams();

  const hasNoParams = Object.keys(params).length === 0;

  const showInfo = "info" in params || hasNoParams;
  const showLocation = "location" in params || hasNoParams;
  const showID = "vakidID" in params || hasNoParams;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  // ---------------------------------------------------------
  // GET NAME FROM PSGC CODE
  // ---------------------------------------------------------

  const getNameFromCode = (list: any[], code: string) => {
    const item = list.find((i) => i.code === code);

    return item ? item.name : null;
  };

  // ---------------------------------------------------------
  // FORM VALIDATION
  // ---------------------------------------------------------

  const isFormComplete = () => {
    const requiredFields = [
      "name",
      "phone",
      "email",
      "gender",
      "birthdate",
      "region",
      "city",
      "barangay",
      "valid_id_type",
      "valid_id_number",
      "street",
      "postal_code",
    ];

    const baseFieldsComplete = requiredFields.every(
      (field) =>
        form[field] !== null &&
        form[field] !== undefined &&
        String(form[field]).trim() !== "",
    );

    const imagesComplete =
      !!form.front_valid_id_picture && !!form.back_valid_id_picture;

    // NCR region code
    const isNCR = form.region === "130000000";

    // NCR does not have a province.
    const isProvinceComplete = isNCR ? true : !!form.province;

    return baseFieldsComplete && imagesComplete && isProvinceComplete;
  };

  // ---------------------------------------------------------
  // INITIAL DATA
  // ---------------------------------------------------------

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      await fetchRegions();

      const res = await profileService.getProfile();

      const userData = res.data?.attributes || res.attributes || res;

      console.log("EDIT PROFILE DATA:", userData);

      setForm({
        name: userData.name || "",
        phone: userData.phone || "",
        email: userData.email || "",
        gender: userData.gender || "",
        birthdate: userData.birthdate || "",
        region: userData.region || "",
        province: userData.province || "",
        city: userData.city || "",
        barangay: userData.barangay || "",
        valid_id_type: userData.valid_id_type || "",
        valid_id_number: userData.valid_id_number || "",
        street: userData.street || "",
        postal_code: userData.postal_code || "",

        front_valid_id_picture: userData.front_valid_id_picture
          ? {
              uri: userData.front_valid_id_picture,
            }
          : null,

        back_valid_id_picture: userData.back_valid_id_picture
          ? {
              uri: userData.back_valid_id_picture,
            }
          : null,
      });

      // Load dependent PSGC data.
      if (userData.region) {
        await fetchProvinces(userData.region);
      }

      if (userData.province) {
        await fetchCities(userData.province);
      }

      if (userData.city) {
        await fetchBarangays(userData.city);
      }
    } catch (err) {
      console.error("Load Profile Error:", err);

      setAlert({
        visible: true,
        title: "Error",
        message: "Failed to load profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // PSGC API
  // ---------------------------------------------------------

  const fetchRegions = async () => {
    const res = await fetch("https://psgc.gitlab.io/api/regions/");

    const data = await res.json();

    setRegions(data);
  };

  const fetchProvinces = async (regionCode: string) => {
    if (!regionCode) {
      setProvinces([]);
      return;
    }

    try {
      const res = await fetch(
        `https://psgc.gitlab.io/api/regions/${regionCode}/provinces/`,
      );

      const data = await res.json();

      setProvinces(data);
    } catch (error) {
      console.error("Fetch Provinces Error:", error);
      setProvinces([]);
    }
  };

  const fetchCities = async (provinceCode: string) => {
    if (!provinceCode) {
      setCities([]);
      return;
    }

    try {
      const res = await fetch(
        `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`,
      );

      const data = await res.json();

      setCities(data);
    } catch (error) {
      console.error("Fetch Cities Error:", error);
      setCities([]);
    }
  };

  const fetchBarangays = async (cityCode: string) => {
    if (!cityCode) {
      setBarangays([]);
      return;
    }

    try {
      const res = await fetch(
        `https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays/`,
      );

      const data = await res.json();

      setBarangays(data);
    } catch (error) {
      console.error("Fetch Barangays Error:", error);
      setBarangays([]);
    }
  };

  // ---------------------------------------------------------
  // IMAGE PICKER
  // ---------------------------------------------------------

  const pickImage = async (field: string) => {
    if (!isEditing) {
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets?.[0];

      if (!file) {
        return;
      }

      if (file.size && file.size > MAX_ID_IMAGE_BYTES) {
        setAlert({
          visible: true,
          title: "File Too Large",
          message: `Please select an image smaller than ${MAX_ID_IMAGE_MB}MB.`,
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
    } catch (err) {
      console.error("Image Pick Error:", err);

      setAlert({
        visible: true,
        title: "Selection Failed",
        message: "Could not select that image. Please try another one.",
      });
    }
  };

  // ---------------------------------------------------------
  // UPDATE PROFILE
  // ---------------------------------------------------------

  const handleUpdate = async () => {
    if (!isFormComplete()) {
      setAlert({
        visible: true,
        title: "Incomplete",
        message: "Please fill in all fields.",
      });

      return;
    }

    setSaving(true);

    try {
      console.log("EDIT PROFILE VALID ID TYPE:", form.valid_id_type);

      console.log("EDIT PROFILE FORM:", form);

      await profileService.updateProfile(form);

      setIsEditing(false);

      setAlert({
        visible: true,
        title: "Success",
        message: "Profile updated successfully.",
      });
    } catch (err: any) {
      console.error("Profile update error:", err.response?.data || err);

      const errors = err.response?.data?.errors;

      const errorMessage = errors
        ? (Object.values(errors).flat()[0] as string)
        : err.response?.data?.message || "Failed to update profile.";

      setAlert({
        visible: true,
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // DATE
  // ---------------------------------------------------------

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");

    if (event?.type === "dismissed") {
      return;
    }

    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];

      setForm((prev: any) => ({
        ...prev,
        birthdate: formattedDate,
      }));
    }
  };

  const getBirthdateValue = () => {
    if (!form.birthdate) {
      return new Date();
    }

    const parsedDate = new Date(`${form.birthdate}T00:00:00`);

    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  // ---------------------------------------------------------
  // STYLES
  // ---------------------------------------------------------

  const card = "bg-white p-5 rounded-3xl mb-4 shadow-sm border border-gray-100";

  const label =
    "text-gray-500 mb-1 font-semibold text-[10px] uppercase tracking-wider";

  const valueStyle = "text-gray-800 font-bold text-base mb-4";

  const inputStyle =
    "border border-gray-200 bg-white p-4 rounded-2xl mb-4 text-gray-800 font-medium";

  const pickerContainer =
    "border border-gray-200 rounded-2xl bg-white mb-4 overflow-hidden";

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1 bg-[#F8F9FB] px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: isEditing ? 120 : 30,
        }}
      >
        {/* HEADER */}
        <View className="flex-row justify-between items-center mt-6 mb-4">
          <Text className="text-2xl font-black text-gray-800">
            Account Details
          </Text>

          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-full ${
              isEditing ? "bg-[#FEF2F2]" : "bg-blue"
            }`}
          >
            <Text
              className={`font-bold ${
                isEditing ? "text-[#D70127]" : "text-[#034194]"
              }`}
            >
              {isEditing ? "Cancel" : "Edit Details"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================================================= */}
        {/* BASIC INFO */}
        {/* ================================================= */}

        {showInfo && (
          <View className={card}>
            <Text className="text-lg font-bold mb-4 text-gray-800">
              Basic Info
            </Text>

            {/* NAME */}
            <Text className={label}>Full Name (Locked)</Text>

            {isEditing ? (
              <TextInput
                value={form.name}
                editable={false}
                className={
                  inputStyle + " bg-gray-100 border-gray-200 color-gray-500"
                }
              />
            ) : (
              <Text className={valueStyle}>{form.name || "---"}</Text>
            )}

            {/* PHONE */}
            <Text className={label}>Phone Number (Locked)</Text>

            {isEditing ? (
              <TextInput
                value={form.phone}
                editable={false}
                className={
                  inputStyle + " bg-gray-100 border-gray-200 color-gray-500"
                }
              />
            ) : (
              <Text className={valueStyle}>{form.phone || "---"}</Text>
            )}

            {/* EMAIL */}
            <Text className={label}>Email</Text>

            {isEditing ? (
              <TextInput
                value={form.email}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    email: text,
                  })
                }
                keyboardType="email-address"
                autoCapitalize="none"
                className={inputStyle}
              />
            ) : (
              <Text className={valueStyle}>{form.email || "---"}</Text>
            )}

            {/* GENDER */}
            <Text className={label}>Gender</Text>

            {isEditing ? (
              <View className={pickerContainer}>
                <Picker
                  selectedValue={form.gender}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      gender: v,
                    })
                  }
                  style={pickerTextStyle}
                  dropdownIconColor="#034194"
                >
                  <Picker.Item label="Select Gender" value="" color="#9CA3AF" />

                  <Picker.Item label="Male" value="Male" color="#1f2937" />

                  <Picker.Item label="Female" value="Female" color="#1f2937" />

                  <Picker.Item label="Other" value="Other" color="#1f2937" />

                  <Picker.Item
                    label="Prefer not to say"
                    value="Prefer not to say"
                    color="#1f2937"
                  />
                </Picker>
              </View>
            ) : (
              <Text className={valueStyle}>{form.gender || "---"}</Text>
            )}

            {/* BIRTHDATE */}
            <Text className={label}>Birthdate</Text>

            {isEditing ? (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className={inputStyle}
              >
                <Text className="text-gray-800 font-medium">
                  {form.birthdate || "YYYY-MM-DD"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className={valueStyle}>{form.birthdate || "---"}</Text>
            )}
          </View>
        )}

        {/* ================================================= */}
        {/* ADDRESS */}
        {/* ================================================= */}

        {showLocation && (
          <View className={card}>
            <Text className="text-lg font-bold mb-4 text-gray-800">
              Address
            </Text>

            {/* REGION */}
            <Text className={label}>Region</Text>

            {isEditing ? (
              <View className={pickerContainer}>
                <Picker
                  selectedValue={form.region}
                  onValueChange={async (v) => {
                    setForm({
                      ...form,
                      region: v,
                      province: "",
                      city: "",
                      barangay: "",
                    });

                    setProvinces([]);
                    setCities([]);
                    setBarangays([]);

                    if (v) {
                      await fetchProvinces(v);
                    }
                  }}
                  style={pickerTextStyle}
                  dropdownIconColor="#034194"
                >
                  <Picker.Item label="Select Region" value="" color="#9CA3AF" />

                  {regions.map((r) => (
                    <Picker.Item
                      key={r.code}
                      label={r.name}
                      value={r.code}
                      color="#1f2937"
                    />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text className={valueStyle}>
                {getNameFromCode(regions, form.region) || "---"}
              </Text>
            )}

            {/* PROVINCE */}
            <Text className={label}>Province</Text>

            {isEditing ? (
              <View className={pickerContainer}>
                <Picker
                  selectedValue={form.province}
                  onValueChange={async (v) => {
                    setForm({
                      ...form,
                      province: v,
                      city: "",
                      barangay: "",
                    });

                    setCities([]);
                    setBarangays([]);

                    if (v) {
                      await fetchCities(v);
                    }
                  }}
                  style={pickerTextStyle}
                  dropdownIconColor="#034194"
                >
                  <Picker.Item
                    label={
                      form.region === "130000000"
                        ? "N/A (NCR Selected)"
                        : "Select Province"
                    }
                    value=""
                    color="#9CA3AF"
                  />

                  {provinces.map((p) => (
                    <Picker.Item
                      key={p.code}
                      label={p.name}
                      value={p.code}
                      color="#1f2937"
                    />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text className={valueStyle}>
                {form.region === "130000000"
                  ? "N/A (NCR)"
                  : getNameFromCode(provinces, form.province) || "---"}
              </Text>
            )}

            {/* CITY */}
            <Text className={label}>City / Municipality</Text>

            {isEditing ? (
              <View className={pickerContainer}>
                <Picker
                  selectedValue={form.city}
                  onValueChange={async (v) => {
                    setForm({
                      ...form,
                      city: v,
                      barangay: "",
                    });

                    setBarangays([]);

                    if (v) {
                      await fetchBarangays(v);
                    }
                  }}
                  style={pickerTextStyle}
                  dropdownIconColor="#034194"
                >
                  <Picker.Item label="Select City" value="" color="#9CA3AF" />

                  {cities.map((c) => (
                    <Picker.Item
                      key={c.code}
                      label={c.name}
                      value={c.code}
                      color="#1f2937"
                    />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text className={valueStyle}>
                {getNameFromCode(cities, form.city) || "---"}
              </Text>
            )}

            {/* BARANGAY */}
            <Text className={label}>Barangay</Text>

            {isEditing ? (
              <View className={pickerContainer}>
                <Picker
                  selectedValue={form.barangay}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      barangay: v,
                    })
                  }
                  style={pickerTextStyle}
                  dropdownIconColor="#034194"
                >
                  <Picker.Item
                    label="Select Barangay"
                    value=""
                    color="#9CA3AF"
                  />

                  {barangays.map((b) => (
                    <Picker.Item
                      key={b.code}
                      label={b.name}
                      value={b.code}
                      color="#1f2937"
                    />
                  ))}
                </Picker>
              </View>
            ) : (
              <Text className={valueStyle}>
                {getNameFromCode(barangays, form.barangay) || "---"}
              </Text>
            )}

            {/* STREET */}
            <Text className={label}>Street</Text>

            {isEditing ? (
              <TextInput
                value={form.street}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    street: text,
                  })
                }
                className={inputStyle}
              />
            ) : (
              <Text className={valueStyle}>{form.street || "---"}</Text>
            )}

            {/* POSTAL CODE */}
            <Text className={label}>Postal Code</Text>

            {isEditing ? (
              <TextInput
                value={form.postal_code}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    postal_code: text,
                  })
                }
                keyboardType="number-pad"
                className={inputStyle}
              />
            ) : (
              <Text className={valueStyle}>{form.postal_code || "---"}</Text>
            )}
          </View>
        )}

        {/* ================================================= */}
        {/* VALID ID */}
        {/* ================================================= */}

        {showID && (
          <View className={card}>
            <Text className="text-lg font-bold mb-4 text-gray-800">
              Verification
            </Text>

            <Text className={label}>ID Type</Text>

            {isEditing ? (
              <>
                <View className={pickerContainer}>
                  <Picker
                    selectedValue={form.valid_id_type}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        valid_id_type: v,
                      })
                    }
                    style={pickerTextStyle}
                    dropdownIconColor="#034194"
                  >
                    <Picker.Item
                      label="Select ID Type"
                      value=""
                      color="#9CA3AF"
                    />

                    {/* IMPORTANT:
                        Display text is descriptive,
                        backend value remains "National ID".
                    */}

                    <Picker.Item
                      label="Philippine National ID (PhilSys)"
                      value="National ID"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="Passport"
                      value="Passport"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="Driver License"
                      value="Driver License"
                      color="#1f2937"
                    />

                    <Picker.Item label="UMID" value="UMID" color="#1f2937" />

                    <Picker.Item
                      label="SSS ID"
                      value="SSS ID"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="PhilHealth ID"
                      value="PhilHealth ID"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="Pag-IBIG Loyalty Card"
                      value="Pag-IBIG Loyalty Card"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="Postal ID"
                      value="Postal ID"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="PRC ID"
                      value="PRC ID"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="Voter ID"
                      value="Voter ID"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="Senior Citizen ID"
                      value="Senior Citizen ID"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="PWD ID"
                      value="PWD ID"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="School ID"
                      value="School ID"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="Company ID"
                      value="Company ID"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="Barangay ID"
                      value="Barangay ID"
                      color="#1f2937"
                    />

                    <Picker.Item
                      label="National Police Clearance"
                      value="National Police Clearance"
                      color="#1f2937"
                    />
                  </Picker>
                </View>

                {/* ID NUMBER */}
                <Text className={label}>ID Number</Text>

                <TextInput
                  value={form.valid_id_number}
                  onChangeText={(text) =>
                    setForm({
                      ...form,
                      valid_id_number: text,
                    })
                  }
                  className={inputStyle}
                  autoCapitalize="characters"
                />
              </>
            ) : (
              <>
                <Text className={valueStyle}>
                  {form.valid_id_type || "---"}
                </Text>

                <Text className={label}>ID Number</Text>

                <Text className={valueStyle}>
                  {form.valid_id_number || "---"}
                </Text>
              </>
            )}

            {/* ID IMAGES */}
            <Text className={label}>Valid ID Images</Text>

            <View className="flex-row justify-between mt-2">
              {/* FRONT */}
              <TouchableOpacity
                onPress={() => pickImage("front_valid_id_picture")}
                disabled={!isEditing}
                className="w-[48%] bg-gray-50 h-32 rounded-3xl items-center justify-center overflow-hidden border border-gray-100"
              >
                {form.front_valid_id_picture?.uri ? (
                  <Image
                    source={{
                      uri: form.front_valid_id_picture.uri,
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Ionicons name="camera" size={24} color="#ccc" />

                    <Text className="text-gray-400 text-xs mt-1">Front ID</Text>
                  </>
                )}

                {isEditing && form.front_valid_id_picture?.uri && (
                  <View className="absolute bottom-2 right-2 bg-black/60 rounded-full p-2">
                    <Ionicons name="camera" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              {/* BACK */}
              <TouchableOpacity
                onPress={() => pickImage("back_valid_id_picture")}
                disabled={!isEditing}
                className="w-[48%] bg-gray-50 h-32 rounded-3xl items-center justify-center overflow-hidden border border-gray-100"
              >
                {form.back_valid_id_picture?.uri ? (
                  <Image
                    source={{
                      uri: form.back_valid_id_picture.uri,
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Ionicons name="camera" size={24} color="#ccc" />

                    <Text className="text-gray-400 text-xs mt-1">Back ID</Text>
                  </>
                )}

                {isEditing && form.back_valid_id_picture?.uri && (
                  <View className="absolute bottom-2 right-2 bg-black/60 rounded-full p-2">
                    <Ionicons name="camera" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {isEditing && (
              <Text className="text-gray-400 text-xs mt-3">
                Maximum image size: {MAX_ID_IMAGE_MB}MB per image.
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* ================================================= */}
      {/* SAVE BUTTON */}
      {/* ================================================= */}

      {isEditing && (
        <View className="w-full p-5 bg-white border-t border-slate-200">
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={saving || !isFormComplete()}
            className="h-16 rounded-2xl justify-center items-center bg-primary"
            style={{
              opacity: saving || !isFormComplete() ? 0.6 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ================================================= */}
      {/* DATE PICKER */}
      {/* ================================================= */}

      {showDatePicker && (
        <DateTimePicker
          value={getBirthdateValue()}
          mode="date"
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* ================================================= */}
      {/* ALERT */}
      {/* ================================================= */}

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() =>
          setAlert({
            ...alert,
            visible: false,
          })
        }
      />
    </View>
  );
}

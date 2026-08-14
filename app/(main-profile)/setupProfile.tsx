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

const MAX_ID_IMAGE_MB = 10;
const MAX_ID_IMAGE_BYTES = MAX_ID_IMAGE_MB * 1024 * 1024;

const NCR_REGION_CODE = "130000000";

const PICKER_TEXT_STYLE = {
  color: "#1f2937",
};

export default function SetupProfileScreen() {
  const router = useRouter();

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

  /*
  |--------------------------------------------------------------------------
  | FORM VALIDATION
  |--------------------------------------------------------------------------
  */

  const isFormComplete = () => {
    const requiredFields = [
      "gender",
      "birthdate",
      "email",
      "region",
      "city",
      "barangay",
      "valid_id_type",
      "valid_id_number",
      "street",
      "postal_code",
    ];

    const baseFieldsComplete = requiredFields.every((field) => !!form[field]);

    const imagesUploaded =
      !!form.front_valid_id_picture?.uri && !!form.back_valid_id_picture?.uri;

    const isNCR = form.region === NCR_REGION_CODE;

    const provinceComplete = isNCR ? true : !!form.province;

    return baseFieldsComplete && imagesUploaded && provinceComplete;
  };

  /*
  |--------------------------------------------------------------------------
  | INITIALIZE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const init = async () => {
      await fetchRegions();
      await fetchProfile();
    };

    init();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH PROFILE
  |--------------------------------------------------------------------------
  */

  const fetchProfile = async () => {
    try {
      const res = await profileService.getProfile();

      const userData = res.data?.attributes || res;

      console.log("Profile data:", userData);

      /*
       * IMPORTANT:
       * Do NOT use:
       *
       * ...userData
       *
       * here.
       *
       * We explicitly map every field so that one backend
       * property cannot accidentally overwrite another form field.
       */

      setForm((prev: any) => ({
        ...prev,

        name: userData.name ?? "",
        phone: userData.phone ?? "",
        email: userData.email ?? "",
        gender: userData.gender ?? "",
        birthdate: userData.birthdate ?? "",

        region: userData.region ?? "",
        province: userData.province ?? "",
        city: userData.city ?? "",
        barangay: userData.barangay ?? "",

        /*
         * ADDRESS
         *
         * street ONLY receives userData.street.
         */
        street: userData.street ?? "",
        postal_code: userData.postal_code ?? "",

        /*
         * IDENTITY
         *
         * valid_id_number ONLY receives userData.valid_id_number.
         */
        valid_id_type: userData.valid_id_type ?? "",
        valid_id_number: userData.valid_id_number ?? "",

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
      }));

      /*
       * Load address dropdown data.
       */

      if (userData.region) {
        if (userData.region === NCR_REGION_CODE) {
          /*
           * NCR does not need provinces.
           * Directly load NCR cities.
           */
          setProvinces([]);
          await fetchCitiesForNCR(userData.region);
        } else {
          /*
           * Normal region.
           */
          await fetchProvinces(userData.region);

          /*
           * Only load province cities for non-NCR.
           */
          if (userData.province) {
            await fetchCities(userData.province);
          }
        }
      }

      /*
       * Load barangays based on the selected city.
       */
      if (userData.city) {
        await fetchBarangays(userData.city);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REGIONS
  |--------------------------------------------------------------------------
  */

  const fetchRegions = async () => {
    try {
      const response = await fetch("https://psgc.gitlab.io/api/regions/");

      const data = await response.json();

      setRegions(data);
    } catch (error) {
      console.error("Region fetch error:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PROVINCES
  |--------------------------------------------------------------------------
  */

  const fetchProvinces = async (regionCode: string) => {
    try {
      const response = await fetch(
        `https://psgc.gitlab.io/api/regions/${regionCode}/provinces/`,
      );

      const data = await response.json();

      setProvinces(data);
    } catch (error) {
      console.error("Province fetch error:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CITIES
  |--------------------------------------------------------------------------
  */

  const fetchCities = async (provinceCode: string) => {
    try {
      const response = await fetch(
        `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`,
      );

      const data = await response.json();

      setCities(data);
    } catch (error) {
      console.error("City fetch error:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | NCR CITIES
  |--------------------------------------------------------------------------
  */

  const fetchCitiesForNCR = async (regionCode: string) => {
    try {
      const response = await fetch(
        `https://psgc.gitlab.io/api/regions/${regionCode}/cities-municipalities/`,
      );

      const data = await response.json();

      setCities(data);
    } catch (error) {
      console.error("NCR city fetch error:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | BARANGAYS
  |--------------------------------------------------------------------------
  */

  const fetchBarangays = async (cityCode: string) => {
    try {
      const response = await fetch(
        `https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays/`,
      );

      const data = await response.json();

      setBarangays(data);
    } catch (error) {
      console.error("Barangay fetch error:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REGION CHANGE
  |--------------------------------------------------------------------------
  */

  const handleRegionChange = (value: string) => {
    setForm((prev: any) => ({
      ...prev,
      region: value,
      province: "",
      city: "",
      barangay: "",
    }));

    setProvinces([]);
    setCities([]);
    setBarangays([]);

    if (!value) {
      return;
    }

    if (value === NCR_REGION_CODE) {
      fetchCitiesForNCR(value);
    } else {
      fetchProvinces(value);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PICK IMAGE
  |--------------------------------------------------------------------------
  */

  const pickImage = async (field: string) => {
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
    } catch (error) {
      console.error("Image picker error:", error);

      setAlert({
        visible: true,
        title: "Selection Failed",
        message: "Could not select that image. Please try another one.",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE PROFILE
  |--------------------------------------------------------------------------
  */

  const handleUpdate = async () => {
    if (!isFormComplete()) {
      setAlert({
        visible: true,
        title: "Incomplete Form",
        message:
          "Please fill out all required fields and upload both sides of your valid ID.",
      });

      return;
    }

    setSaving(true);

    try {
      await profileService.updateProfile(form);

      router.replace("/(main-profile)/congratulations");
    } catch (error: any) {
      console.error("Profile update error:", error?.response?.data || error);

      const errors = error?.response?.data?.errors;

      let errorMessage =
        error?.response?.data?.message ||
        "Failed to update profile. Please try again.";

      if (errors) {
        const firstError = Object.values(errors).flat()[0];

        if (firstError) {
          errorMessage = String(firstError);
        }
      }

      setAlert({
        visible: true,
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DATE
  |--------------------------------------------------------------------------
  */

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }

    setShowDatePicker(Platform.OS === "ios");

    if (!selectedDate) {
      return;
    }

    const year = selectedDate.getFullYear();

    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");

    const day = String(selectedDate.getDate()).padStart(2, "0");

    setForm((prev: any) => ({
      ...prev,
      birthdate: `${year}-${month}-${day}`,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | STYLES
  |--------------------------------------------------------------------------
  */

  const CARD_STYLE =
    "bg-white p-5 rounded-3xl mb-4 shadow-sm border border-gray-100";

  const LABEL_STYLE = "text-[#034194] mb-1 ps-2 text-sm";

  const INPUT_STYLE =
    "border border-gray-200 bg-white p-4 rounded-2xl mb-4 text-gray-800 font-medium overflow-hidden";

  const PICKER_CONTAINER_STYLE =
    "border border-gray-200 rounded-2xl bg-white mb-4 overflow-hidden";

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1 bg-[#F8F9FB] px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* =====================================================
            BASIC INFORMATION
        ====================================================== */}

        <View className={`${CARD_STYLE} mt-4`}>
          <View className="flex-row items-center mb-4">
            <Ionicons name="person-circle-outline" size={24} color="#034194" />

            <Text className="text-lg font-bold ml-2 text-gray-800">
              Basic Information
            </Text>
          </View>

          {/* NAME */}

          <Text className={LABEL_STYLE}>Full Name</Text>

          <TextInput
            value={form.name}
            editable={false}
            className={`${INPUT_STYLE} bg-gray-100 text-gray-500`}
          />

          {/* PHONE */}

          <Text className={LABEL_STYLE}>Phone Number</Text>

          <TextInput
            value={form.phone}
            editable={false}
            className={`${INPUT_STYLE} bg-gray-100 text-gray-500`}
          />

          {/* EMAIL */}

          <Text className={LABEL_STYLE}>Email Address</Text>

          <TextInput
            value={form.email}
            onChangeText={(value) =>
              setForm((prev: any) => ({
                ...prev,
                email: value,
              }))
            }
            className={INPUT_STYLE}
            placeholder="Email Address"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none"
          />

          {/* GENDER */}

          <Text className={LABEL_STYLE}>Gender</Text>

          <View className={PICKER_CONTAINER_STYLE}>
            <Picker
              selectedValue={form.gender}
              onValueChange={(value) =>
                setForm((prev: any) => ({
                  ...prev,
                  gender: value,
                }))
              }
              style={PICKER_TEXT_STYLE}
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

          {/* BIRTHDATE */}

          <Text className={LABEL_STYLE}>Birthdate</Text>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className={INPUT_STYLE}
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

        {/* =====================================================
            ADDRESS
        ====================================================== */}

        <View className={CARD_STYLE}>
          <View className="flex-row items-center mb-4">
            <Ionicons name="location-outline" size={24} color="#034194" />

            <Text className="text-lg font-bold ml-2 text-gray-800">
              Address Details
            </Text>
          </View>

          {/* REGION */}

          <Text className={LABEL_STYLE}>Region</Text>

          <View className={PICKER_CONTAINER_STYLE}>
            <Picker
              selectedValue={form.region}
              onValueChange={handleRegionChange}
              style={PICKER_TEXT_STYLE}
              dropdownIconColor="#034194"
            >
              <Picker.Item label="Select Region" value="" color="#9CA3AF" />

              {regions.map((region) => (
                <Picker.Item
                  key={region.code}
                  label={region.name}
                  value={region.code}
                  color="#1f2937"
                />
              ))}
            </Picker>
          </View>

          {/* PROVINCE */}

          <Text className={LABEL_STYLE}>Province</Text>

          <View className={PICKER_CONTAINER_STYLE}>
            <Picker
              selectedValue={form.province}
              enabled={form.region !== NCR_REGION_CODE}
              onValueChange={(value) => {
                setForm((prev: any) => ({
                  ...prev,
                  province: value,
                  city: "",
                  barangay: "",
                }));

                setCities([]);
                setBarangays([]);

                if (value) {
                  fetchCities(value);
                }
              }}
              style={PICKER_TEXT_STYLE}
              dropdownIconColor="#034194"
            >
              <Picker.Item
                label={
                  form.region === NCR_REGION_CODE
                    ? "N/A (NCR Selected)"
                    : "Select Province"
                }
                value=""
                color="#9CA3AF"
              />

              {provinces.map((province) => (
                <Picker.Item
                  key={province.code}
                  label={province.name}
                  value={province.code}
                  color="#1f2937"
                />
              ))}
            </Picker>
          </View>

          {/* CITY */}

          <Text className={LABEL_STYLE}>City / Municipality</Text>

          <View className={PICKER_CONTAINER_STYLE}>
            <Picker
              selectedValue={form.city}
              onValueChange={(value) => {
                setForm((prev: any) => ({
                  ...prev,
                  city: value,
                  barangay: "",
                }));

                setBarangays([]);

                if (value) {
                  fetchBarangays(value);
                }
              }}
              style={PICKER_TEXT_STYLE}
              dropdownIconColor="#034194"
            >
              <Picker.Item
                label="Select City / Municipality"
                value=""
                color="#9CA3AF"
              />

              {cities.map((city) => (
                <Picker.Item
                  key={city.code}
                  label={city.name}
                  value={city.code}
                  color="#1f2937"
                />
              ))}
            </Picker>
          </View>

          {/* BARANGAY */}

          <Text className={LABEL_STYLE}>Barangay</Text>

          <View className={PICKER_CONTAINER_STYLE}>
            <Picker
              selectedValue={form.barangay}
              onValueChange={(value) =>
                setForm((prev: any) => ({
                  ...prev,
                  barangay: value,
                }))
              }
              style={PICKER_TEXT_STYLE}
              dropdownIconColor="#034194"
            >
              <Picker.Item label="Select Barangay" value="" color="#9CA3AF" />

              {barangays.map((barangay) => (
                <Picker.Item
                  key={barangay.code}
                  label={barangay.name}
                  value={barangay.code}
                  color="#1f2937"
                />
              ))}
            </Picker>
          </View>

          {/* STREET */}

          <Text className={LABEL_STYLE}>Street / House No.</Text>

          <TextInput
            value={form.street}
            onChangeText={(value) =>
              setForm((prev: any) => ({
                ...prev,
                street: value,
              }))
            }
            className={INPUT_STYLE}
            placeholder="Street / House No."
            placeholderTextColor="#9CA3AF"
            /*
             * Prevent the phone from suggesting
             * previously entered ID numbers or other
             * autofill information.
             */
            autoComplete="off"
            textContentType="none"
            autoCorrect={false}
            autoCapitalize="words"
          />

          {/* POSTAL CODE */}

          <Text className={LABEL_STYLE}>Postal Code</Text>

          <TextInput
            value={form.postal_code}
            onChangeText={(value) =>
              setForm((prev: any) => ({
                ...prev,
                postal_code: value,
              }))
            }
            className={INPUT_STYLE}
            placeholder="Postal Code"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            autoComplete="postal-code"
            textContentType="postalCode"
          />
        </View>

        {/* =====================================================
            IDENTITY VERIFICATION
        ====================================================== */}

        <View className={CARD_STYLE}>
          <View className="flex-row items-center mb-4">
            <Ionicons name="card-outline" size={24} color="#034194" />

            <Text className="text-lg font-bold ml-2 text-gray-800">
              Identity Verification
            </Text>
          </View>

          {/* ID TYPE */}

          <Text className={LABEL_STYLE}>Valid ID Type</Text>

          <View className={PICKER_CONTAINER_STYLE}>
            <Picker
              selectedValue={form.valid_id_type}
              onValueChange={(value) =>
                setForm((prev: any) => ({
                  ...prev,
                  valid_id_type: value,
                }))
              }
              style={PICKER_TEXT_STYLE}
              dropdownIconColor="#034194"
            >
              <Picker.Item label="Select ID Type" value="" color="#9CA3AF" />

              {/* GOVERNMENT IDs */}

              <Picker.Item
                label="Philippine National ID (PhilSys)"
                value="National ID"
                color="#1f2937"
              />

              <Picker.Item label="Passport" value="Passport" color="#1f2937" />

              <Picker.Item
                label="Driver License"
                value="Driver License"
                color="#1f2937"
              />

              <Picker.Item label="UMID" value="UMID" color="#1f2937" />

              <Picker.Item label="SSS ID" value="SSS ID" color="#1f2937" />

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

              <Picker.Item label="PRC ID" value="PRC ID" color="#1f2937" />

              <Picker.Item label="Voter ID" value="Voter ID" color="#1f2937" />

              {/* OTHER VALID IDs */}

              <Picker.Item
                label="Senior Citizen ID"
                value="Senior Citizen ID"
                color="#1f2937"
              />

              <Picker.Item label="PWD ID" value="PWD ID" color="#1f2937" />

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

          <Text className={LABEL_STYLE}>ID Number</Text>

          <TextInput
            value={form.valid_id_number}
            onChangeText={(value) =>
              setForm((prev: any) => ({
                ...prev,
                valid_id_number: value,
              }))
            }
            className={INPUT_STYLE}
            placeholder="ID Number"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            /*
             * Prevent the device from using this field
             * as a source for autofill suggestions.
             */
            autoComplete="off"
            textContentType="none"
            autoCorrect={false}
          />

          {/* ID IMAGES */}

          <Text className={LABEL_STYLE}>Valid ID Images</Text>

          <View className="flex-row justify-between mt-2">
            {/* FRONT */}

            <TouchableOpacity
              onPress={() => pickImage("front_valid_id_picture")}
              className="w-[48%] bg-gray-50 h-32 rounded-3xl items-center justify-center overflow-hidden border border-gray-200"
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
                <View className="items-center">
                  <Ionicons name="camera-outline" size={28} color="#9CA3AF" />

                  <Text className="text-xs text-gray-400 font-medium mt-1">
                    Front ID
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* BACK */}

            <TouchableOpacity
              onPress={() => pickImage("back_valid_id_picture")}
              className="w-[48%] bg-gray-50 h-32 rounded-3xl items-center justify-center overflow-hidden border border-gray-200"
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
                <View className="items-center">
                  <Ionicons name="camera-outline" size={28} color="#9CA3AF" />

                  <Text className="text-xs text-gray-400 font-medium mt-1">
                    Back ID
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-gray-400 mt-3 px-2">
            Maximum file size: 10MB per image.
          </Text>
        </View>

        {/* =====================================================
            SUBMIT
        ====================================================== */}

        <TouchableOpacity
          onPress={handleUpdate}
          disabled={saving || !isFormComplete()}
          className="h-16 rounded-2xl justify-center items-center bg-[#034194] mb-8"
          style={{
            opacity: saving || !isFormComplete() ? 0.5 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-lg">Complete Setup</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* =====================================================
          ALERT
      ====================================================== */}

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() =>
          setAlert({
            visible: false,
            title: "",
            message: "",
          })
        }
      />
    </View>
  );
}

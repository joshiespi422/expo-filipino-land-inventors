import { CustomAlert } from "@/components/CustomAlert";
import { profileService } from "@/services/profileService";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const MAX_ID_IMAGE_MB = 10;
const MAX_ID_IMAGE_BYTES = MAX_ID_IMAGE_MB * 1024 * 1024;

const NCR_REGION_CODE = "130000000";

const PICKER_TEXT_STYLE = {
  color: "#1f2937",
};

// ---------------------------------------------------------------------
// ID CROP FRAME — supports both landscape and portrait orientations
// Landscape: standard ID card ratio (85.6mm x 53.98mm) = 1.586
// Portrait: school ID ratio (85.6mm x 53.98mm rotated) = 0.631
// Same accurate crop system used for the avatar and the Edit Profile
// ID images: a rectangular ID-card-ratio frame. See IdCropScreen
// further down for the centering fix that makes the exported crop match
// what's shown on screen 1:1.
// ---------------------------------------------------------------------
const ID_ASPECT_RATIO_LANDSCAPE = 1.586; // landscape ID card ratio
const ID_ASPECT_RATIO_PORTRAIT = 0.631; // portrait ID card ratio (1 / 1.586)
const FRAME_WIDTH = Math.min(Dimensions.get("window").width - 60, 340);
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

type IdField = "front_valid_id_picture" | "back_valid_id_picture";
type IdOrientation = "landscape" | "portrait";

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
  | ID IMAGE PICK + CROP STATE
  |--------------------------------------------------------------------------
  */

  // Which ID slot ("front" / "back") the option sheet / cropper is
  // currently acting on.
  const [idOptionsField, setIdOptionsField] = useState<IdField | null>(null);

  const [rawIdImage, setRawIdImage] = useState<{
    field: IdField;
    uri: string;
    width: number;
    height: number;
  } | null>(null);

  const [showIdCropModal, setShowIdCropModal] = useState(false);
  const [processingId, setProcessingId] = useState<IdField | null>(null);

  // Full-screen "View Photo" state — same pattern as the avatar's
  // showFullImage modal in ProfileScreen.
  const [showFullIdImage, setShowFullIdImage] = useState<IdField | null>(null);

  useEffect(() => {
    if (rawIdImage) {
      setShowIdCropModal(true);
    }
  }, [rawIdImage]);

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
  | ID IMAGE PICKER — pick from camera/library, then open the accurate
  | crop screen, compress, and store the cropped result on the form.
  | Same flow as the avatar cropper and the Edit Profile ID images.
  |--------------------------------------------------------------------------
  */

  const openIdOptions = (field: IdField) => {
    setIdOptionsField(field);
  };

  const openIdImageSource = async (
    field: IdField,
    source: "library" | "camera",
  ) => {
    setIdOptionsField(null);

    const permission =
      source === "library"
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setAlert({
        visible: true,
        title: "Permission Needed",
        message:
          source === "library"
            ? "Please allow photo library access to upload your ID."
            : "Please allow camera access to take a photo.",
      });
      return;
    }

    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // we crop ourselves — do NOT set this to true
      quality: 1,
    };

    const result =
      source === "library"
        ? await ImagePicker.launchImageLibraryAsync(pickerOptions)
        : await ImagePicker.launchCameraAsync(pickerOptions);

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;

    if (asset.fileSize && asset.fileSize > MAX_ID_IMAGE_BYTES) {
      setAlert({
        visible: true,
        title: "File Too Large",
        message: `Please choose an image under ${MAX_ID_IMAGE_MB}MB.`,
      });
      return;
    }

    setRawIdImage({
      field,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
    });
  };

  const handleIdCropped = async (field: IdField, croppedUri: string) => {
    try {
      setProcessingId(field);

      // Downscale/compress so uploads stay reasonably sized, same idea
      // as the avatar's post-crop compression step.
      const compressed = await ImageManipulator.manipulateAsync(
        croppedUri,
        [{ resize: { width: 1600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      setForm((prev: any) => ({
        ...prev,
        [field]: {
          uri: compressed.uri,
          name: `${field}.jpg`,
          type: "image/jpeg",
        },
      }));
    } catch (error) {
      console.error("ID Compress Error:", error);

      setAlert({
        visible: true,
        title: "Error",
        message: "Could not process that image. Please try again.",
      });
    } finally {
      setShowIdCropModal(false);
      setRawIdImage(null);
      setProcessingId(null);
    }
  };

  const formatBirthdate = (dateString: string) => {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleIdCropCancel = () => {
    setShowIdCropModal(false);
    setRawIdImage(null);
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

  const idFieldLabel = (field: IdField) =>
    field === "front_valid_id_picture" ? "Front ID" : "Back ID";

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
              {form.birthdate ? formatBirthdate(form.birthdate) : ""}
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
              onPress={() => openIdOptions("front_valid_id_picture")}
              className="w-[48%] bg-gray-50 h-32 rounded-3xl items-center justify-center overflow-hidden border border-gray-200"
            >
              {processingId === "front_valid_id_picture" ? (
                <ActivityIndicator color="#034194" />
              ) : form.front_valid_id_picture?.uri ? (
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

              {form.front_valid_id_picture?.uri && (
                <View className="absolute bottom-2 right-2 bg-black/60 rounded-full p-2">
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* BACK */}

            <TouchableOpacity
              onPress={() => openIdOptions("back_valid_id_picture")}
              className="w-[48%] bg-gray-50 h-32 rounded-3xl items-center justify-center overflow-hidden border border-gray-200"
            >
              {processingId === "back_valid_id_picture" ? (
                <ActivityIndicator color="#034194" />
              ) : form.back_valid_id_picture?.uri ? (
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

              {form.back_valid_id_picture?.uri && (
                <View className="absolute bottom-2 right-2 bg-black/60 rounded-full p-2">
                  <Ionicons name="camera" size={16} color="#fff" />
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
          ID IMAGE SOURCE OPTIONS MODAL
      ====================================================== */}

      <Modal
        visible={!!idOptionsField}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setIdOptionsField(null)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center px-5">
          <View className="bg-white p-8 rounded-[40px] items-center w-full max-w-[380px] shadow-2xl">
            <View className="w-16 h-16 bg-blue rounded-full items-center justify-center mb-4">
              <Ionicons name="card" size={32} color="#034194" />
            </View>
            <Text className="text-xl font-bold text-[#333] mb-2 text-center">
              {idOptionsField ? idFieldLabel(idOptionsField) : ""} Photo
            </Text>
            <View className="w-full gap-y-3 mt-4">
              {idOptionsField && form[idOptionsField]?.uri && (
                <TouchableOpacity
                  onPress={() => {
                    const field = idOptionsField;
                    setIdOptionsField(null);
                    setShowFullIdImage(field);
                  }}
                  className="w-full flex-row items-center p-4 bg-gray-50 rounded-2xl border border-gray-100"
                >
                  <Ionicons name="eye-outline" size={20} color="#034194" />
                  <Text className="ml-3 font-bold text-gray-700">
                    View Photo
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() =>
                  idOptionsField && openIdImageSource(idOptionsField, "camera")
                }
                className="w-full flex-row items-center p-4 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <Ionicons name="camera-outline" size={20} color="#034194" />
                <Text className="ml-3 font-bold text-gray-700">Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  idOptionsField && openIdImageSource(idOptionsField, "library")
                }
                className="w-full flex-row items-center p-4 bg-blue rounded-2xl border border-[#DBEAFE]"
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color="#034194"
                />
                <Text className="ml-3 font-bold text-[#034194]">
                  Upload New
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIdOptionsField(null)}
                className="w-full mt-2 p-4 items-center"
              >
                <Text className="text-gray-400 font-bold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =====================================================
          ID CROP MODAL
      ====================================================== */}

      <Modal
        visible={showIdCropModal && !!rawIdImage}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={handleIdCropCancel}
      >
        {rawIdImage && (
          <IdCropScreen
            uri={rawIdImage.uri}
            naturalWidth={rawIdImage.width}
            naturalHeight={rawIdImage.height}
            title={`Position your ${idFieldLabel(rawIdImage.field)}`}
            onCancel={handleIdCropCancel}
            onDone={(croppedUri) =>
              handleIdCropped(rawIdImage.field, croppedUri)
            }
          />
        )}
      </Modal>

      {/* =====================================================
          FULL ID IMAGE VIEW — same pattern as the avatar's full-image
          modal in ProfileScreen.
      ====================================================== */}

      <Modal
        visible={!!showFullIdImage}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setShowFullIdImage(null)}
      >
        <View className="flex-1 bg-black items-center justify-center">
          <TouchableOpacity
            onPress={() => setShowFullIdImage(null)}
            className="absolute top-12 right-6 p-2 bg-white/20 rounded-full z-10"
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          {showFullIdImage && (
            <Text className="absolute top-14 left-6 text-white font-bold text-base z-10">
              {idFieldLabel(showFullIdImage)}
            </Text>
          )}

          {showFullIdImage && form[showFullIdImage]?.uri && (
            <Image
              source={{ uri: form[showFullIdImage].uri }}
              style={{
                width: "100%",
                aspectRatio: ID_ASPECT_RATIO_PORTRAIT,
              }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

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

/*
|--------------------------------------------------------------------------
| ID CROP SCREEN — same crop system as the avatar's CropScreen in
| ProfileScreen, generalized to a rectangular ID-card frame with
| orientation selector. Now supports both landscape and portrait
| orientations. User can switch between them while cropping.
| One finger drags, two fingers pinch-zoom.
|
| ACCURACY FIX (ported from the avatar cropper): the crop math in
| handleCropConfirm / getMaxPan assumes the image is CENTERED inside the
| frame box before any translate/scale is applied. The frame <View> has
| justifyContent/alignItems: "center" so React Native lays the image
| centered, matching what the math assumes.
|--------------------------------------------------------------------------
*/
function IdCropScreen({
  uri,
  naturalWidth,
  naturalHeight,
  title,
  onCancel,
  onDone,
}: {
  uri: string;
  naturalWidth: number;
  naturalHeight: number;
  title: string;
  onCancel: () => void;
  onDone: (croppedUri: string) => void;
}) {
  const [cropping, setCropping] = useState(false);
  const [zoomDisplay, setZoomDisplay] = useState(MIN_ZOOM);
  const [orientation, setOrientation] = useState<IdOrientation>("landscape");

  // Calculate frame dimensions based on current orientation
  const aspectRatio =
    orientation === "landscape"
      ? ID_ASPECT_RATIO_LANDSCAPE
      : ID_ASPECT_RATIO_PORTRAIT;

  const frameWidth = FRAME_WIDTH;
  const frameHeight = frameWidth / aspectRatio;

  // Base scale so the image fully COVERS the rectangular frame (both
  // dimensions) with no gaps, before any user zoom is applied. OVERSCAN
  // gives a bit of extra scale so panning always has room to move, even
  // before the user zooms in further.
  const OVERSCAN = 1.15;
  const baseScale =
    Math.max(frameWidth / naturalWidth, frameHeight / naturalHeight) * OVERSCAN;
  const baseWidth = naturalWidth * baseScale;
  const baseHeight = naturalHeight * baseScale;

  // Shared values driving the gesture — read/written on the UI thread for
  // smooth 60fps response, and readable from JS (handleCropConfirm) too.
  const scale = useSharedValue(MIN_ZOOM);
  const savedScale = useSharedValue(MIN_ZOOM);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const clamp = (val: number, min: number, max: number) => {
    "worklet";
    return Math.min(Math.max(val, min), max);
  };

  const getMaxPan = (currentZoom: number) => {
    "worklet";
    const totalScale = baseScale * currentZoom;
    const displayedWidth = naturalWidth * totalScale;
    const displayedHeight = naturalHeight * totalScale;
    return {
      maxX: Math.max(0, (displayedWidth - frameWidth) / 2),
      maxY: Math.max(0, (displayedHeight - frameHeight) / 2),
    };
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      const { maxX, maxY } = getMaxPan(scale.value);
      translateX.value = clamp(
        savedTranslateX.value + e.translationX,
        -maxX,
        maxX,
      );
      translateY.value = clamp(
        savedTranslateY.value + e.translationY,
        -maxY,
        maxY,
      );
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      const newScale = clamp(savedScale.value * e.scale, MIN_ZOOM, MAX_ZOOM);
      scale.value = newScale;

      // Re-clamp pan so we never end up showing empty space around the
      // frame after zooming out.
      const { maxX, maxY } = getMaxPan(newScale);
      translateX.value = clamp(translateX.value, -maxX, maxX);
      translateY.value = clamp(translateY.value, -maxY, maxY);

      runOnJS(setZoomDisplay)(newScale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Simultaneous (not exclusive) so one finger can be dragging while a
  // second finger joins to pinch, without either gesture cancelling out.
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedImageStyle = useAnimatedStyle(() => ({
    width: baseWidth,
    height: baseHeight,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleReset = () => {
    scale.value = withTiming(MIN_ZOOM);
    savedScale.value = MIN_ZOOM;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    setZoomDisplay(MIN_ZOOM);
  };

  const handleCropConfirm = async () => {
    try {
      setCropping(true);

      const currentZoom = scale.value;
      const pan = { x: translateX.value, y: translateY.value };

      const totalScale = baseScale * currentZoom;
      const displayedWidth = naturalWidth * totalScale;
      const displayedHeight = naturalHeight * totalScale;

      // Top-left of the displayed image relative to the frame's top-left.
      // Valid because the frame container actually centers the image
      // (see the justifyContent/alignItems fix on the frame View below).
      const offsetX = (frameWidth - displayedWidth) / 2 + pan.x;
      const offsetY = (frameHeight - displayedHeight) / 2 + pan.y;

      const origWidth = frameWidth / totalScale;
      const origHeight = frameHeight / totalScale;

      let origX = -offsetX / totalScale;
      let origY = -offsetY / totalScale;

      origX = Math.min(Math.max(origX, 0), naturalWidth - origWidth);
      origY = Math.min(Math.max(origY, 0), naturalHeight - origHeight);

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: origX,
              originY: origY,
              width: origWidth,
              height: origHeight,
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
      );

      onDone(result.uri);
    } catch (error) {
      console.error("ID Crop error:", error);
    } finally {
      setCropping(false);
    }
  };

  return (
    // GestureHandlerRootView must be an ancestor of GestureDetector.
    // Scoped here on purpose, same as the avatar cropper — this is the
    // only place on this screen using gesture-handler.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-black items-center justify-center px-5">
        <TouchableOpacity
          onPress={onCancel}
          className="absolute top-12 left-6 p-2 bg-white/20 rounded-full z-10"
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleReset}
          className="absolute top-12 right-6 p-2 bg-white/20 rounded-full z-10"
        >
          <Ionicons name="refresh" size={22} color="white" />
        </TouchableOpacity>

        <Text className="text-white font-bold text-lg mb-2 text-center">
          {title}
        </Text>
        {/* <Text className="text-white/70 text-xs mb-6 text-center">
          Drag with 1 finger to move • Pinch with 2 fingers to zoom
        </Text> */}

        <GestureDetector gesture={composedGesture}>
          <View
            style={{
              width: frameWidth,
              height: frameHeight,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#111",
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.9)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Animated.Image source={{ uri }} style={animatedImageStyle} />
          </View>
        </GestureDetector>

        {/* ORIENTATION SELECTOR */}
        <View className="flex-row gap-x-2 mt-6 justify-center">
          <TouchableOpacity
            onPress={() => setOrientation("landscape")}
            className={`px-5 py-2 rounded-full border-2 flex-row items-center gap-x-2 ${
              orientation === "landscape"
                ? "bg-[#034194] border-[#034194]"
                : "bg-transparent border-white/30"
            }`}
          >
            <Ionicons
              name="phone-landscape-outline"
              size={18}
              color={orientation === "landscape" ? "#fff" : "#fff"}
            />
            <Text
              className={`font-bold text-sm ${
                orientation === "landscape" ? "text-white" : "text-white/70"
              }`}
            >
              Landscape
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setOrientation("portrait")}
            className={`px-5 py-2 rounded-full border-2 flex-row items-center gap-x-2 ${
              orientation === "portrait"
                ? "bg-[#034194] border-[#034194]"
                : "bg-transparent border-white/30"
            }`}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={18}
              color={orientation === "portrait" ? "#fff" : "#fff"}
            />
            <Text
              className={`font-bold text-sm ${
                orientation === "portrait" ? "text-white" : "text-white/70"
              }`}
            >
              Portrait
            </Text>
          </TouchableOpacity>
        </View>

        {/* <Text className="text-white/70 font-bold mt-4">
          {zoomDisplay.toFixed(2)}x
        </Text> */}

        <View className="w-full mt-8 gap-y-3 max-w-[320px]">
          <TouchableOpacity
            onPress={handleCropConfirm}
            disabled={cropping}
            className="w-full py-3.5 bg-[#034194] rounded-2xl items-center flex-row justify-center"
          >
            {cropping ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-bold text-base ml-2">
                  Done
                </Text>
              </>
            )}
          </TouchableOpacity>
          {/* <TouchableOpacity
            onPress={onCancel}
            disabled={cropping}
            className="w-full py-3.5 items-center"
          >
            <Text className="text-white/70 font-bold text-base">Cancel</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

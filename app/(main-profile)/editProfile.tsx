import { CustomAlert } from "@/components/CustomAlert";
import { profileService } from "@/services/profileService";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
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

// Picker text must stay visible even when the device is using dark mode.
const pickerTextStyle = {
  color: "#1f2937",
};

// ---------------------------------------------------------------------
// ID CROP FRAME — same accurate crop system as the avatar cropper, but
// rectangular (standard ID-card ratio) instead of circular. See the
// CropScreen component further down for the centering fix that makes
// the exported crop match what's shown on screen 1:1.
// ---------------------------------------------------------------------
const ID_ASPECT_RATIO = 1.586; // standard ID card ratio (85.6mm x 53.98mm)
const FRAME_WIDTH = Math.min(Dimensions.get("window").width - 60, 340);
const FRAME_HEIGHT = FRAME_WIDTH / ID_ASPECT_RATIO;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

type IdField = "front_valid_id_picture" | "back_valid_id_picture";

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
  // ID IMAGE PICK + CROP STATE
  // ---------------------------------------------------------

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
  // ID IMAGE PICKER — mirrors the avatar flow in ProfileScreen:
  // pick from camera/library -> open the accurate crop screen ->
  // compress -> store the cropped result on the form field.
  // ---------------------------------------------------------

  const openIdOptions = (field: IdField) => {
    const hasImage = !!form[field]?.uri;

    // Nothing to view and nothing editable yet — tapping does nothing.
    if (!isEditing && !hasImage) return;

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
    } catch (err) {
      console.error("ID Compress Error:", err);
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

  const idFieldLabel = (field: IdField) =>
    field === "front_valid_id_picture" ? "Front ID" : "Back ID";

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
                  {form.birthdate
                    ? formatBirthdate(form.birthdate)
                    : "Select Birthdate"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className={valueStyle}>
                {form.birthdate ? formatBirthdate(form.birthdate) : "---"}
              </Text>
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
                onPress={() => openIdOptions("front_valid_id_picture")}
                className="w-[48%] bg-gray-50 h-32 rounded-3xl items-center justify-center overflow-hidden border border-gray-100"
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
                onPress={() => openIdOptions("back_valid_id_picture")}
                className="w-[48%] bg-gray-50 h-32 rounded-3xl items-center justify-center overflow-hidden border border-gray-100"
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
          display="spinner"
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* ================================================= */}
      {/* ID IMAGE SOURCE OPTIONS MODAL */}
      {/* ================================================= */}

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

              {isEditing && (
                <>
                  <TouchableOpacity
                    onPress={() =>
                      idOptionsField &&
                      openIdImageSource(idOptionsField, "camera")
                    }
                    className="w-full flex-row items-center p-4 bg-gray-50 rounded-2xl border border-gray-100"
                  >
                    <Ionicons name="camera-outline" size={20} color="#034194" />
                    <Text className="ml-3 font-bold text-gray-700">
                      Take Photo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      idOptionsField &&
                      openIdImageSource(idOptionsField, "library")
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
                </>
              )}

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

      {/* ================================================= */}
      {/* ID CROP MODAL */}
      {/* ================================================= */}

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

      {/* ================================================= */}
      {/* FULL ID IMAGE VIEW — same pattern as the avatar's full-image */}
      {/* modal in ProfileScreen. */}
      {/* ================================================= */}

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
              style={{ width: "100%", aspectRatio: ID_ASPECT_RATIO }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

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

/*
|--------------------------------------------------------------------------
| ID CROP SCREEN — same crop system as the avatar's CropScreen in
| ProfileScreen, generalized to a rectangular ID-card frame instead of a
| circle. One finger drags, two fingers pinch-zoom.
|
| ACCURACY FIX (ported from the avatar cropper): the crop math in
| handleCropConfirm / getMaxPan assumes the image is CENTERED inside the
| FRAME_WIDTH x FRAME_HEIGHT box before any translate/scale is applied —
| that's what the "(FRAME_WIDTH - displayedWidth) / 2" terms mean. The
| frame <View> that wraps the Animated.Image has
| justifyContent/alignItems: "center" so React Native actually lays the
| image out centered, matching what the math assumes. Without that, the
| exported crop drifts from what's shown in the frame — exactly the bug
| that was fixed on the avatar screen.
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

  // Base scale so the image fully COVERS the rectangular frame (both
  // dimensions) with no gaps, before any user zoom is applied. OVERSCAN
  // gives a bit of extra scale so panning always has room to move, even
  // before the user zooms in further.
  const OVERSCAN = 1.15;
  const baseScale =
    Math.max(FRAME_WIDTH / naturalWidth, FRAME_HEIGHT / naturalHeight) *
    OVERSCAN;
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
      maxX: Math.max(0, (displayedWidth - FRAME_WIDTH) / 2),
      maxY: Math.max(0, (displayedHeight - FRAME_HEIGHT) / 2),
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
      const offsetX = (FRAME_WIDTH - displayedWidth) / 2 + pan.x;
      const offsetY = (FRAME_HEIGHT - displayedHeight) / 2 + pan.y;

      const origWidth = FRAME_WIDTH / totalScale;
      const origHeight = FRAME_HEIGHT / totalScale;

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
        <Text className="text-white/70 text-xs mb-6 text-center">
          Drag with 1 finger to move • Pinch with 2 fingers to zoom
        </Text>

        <GestureDetector gesture={composedGesture}>
          <View
            style={{
              width: FRAME_WIDTH,
              height: FRAME_HEIGHT,
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

        <Text className="text-white/70 font-bold mt-6">
          {zoomDisplay.toFixed(2)}x
        </Text>

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
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="white"
                />
                <Text className="text-white font-bold text-base ml-2">
                  Done
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCancel}
            disabled={cropping}
            className="w-full py-3.5 items-center"
          >
            <Text className="text-white/70 font-bold text-base">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

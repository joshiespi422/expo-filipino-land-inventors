import { BASE_URL } from "@/services/api";
import {
  getIntellectualProperty,
  isEditable,
  updateIntellectualProperty,
} from "@/services/intellectualService";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FileText, Plus, Trash2, Upload, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import "../../global.css";

const { width } = Dimensions.get("window");

const STORAGE_URL = `${BASE_URL}/storage/`;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const normalizeFileUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `${STORAGE_URL}${cleanPath}`;
};

interface Attachment {
  id: string | number;
  name: string;
  uri: string;
  type: string;
  size?: number;
  isNew?: boolean;
}

export default function DetailsPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [data, setData] = useState<any>(null);
  const [includedData, setIncludedData] = useState<any[]>([]);

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    applicability: "",
    claims: [{ description: "" }],
    delete_document_ids: [] as number[],
  });

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await getIntellectualProperty(id as string);

      console.log(
        "INTELLECTUAL PROPERTY RESPONSE",
        JSON.stringify(res, null, 2),
      );

      const ip = res.data;
      const included = res.included || [];

      setData(ip);
      setIncludedData(included);

      // =========================
      // CLAIMS MAPPING
      // =========================
      const claimRefs = ip.relationships?.claims?.data || [];
      const mappedClaims = claimRefs.map((ref: any) => {
        const fullClaim = included.find(
          (inc: any) =>
            String(inc.id) === String(ref.id) && inc.type.includes("claim"),
        );
        return {
          description: fullClaim?.attributes?.description || "",
        };
      });

      // =========================
      // DOCUMENTS MAPPING
      // =========================
      const docRefs = ip.relationships?.documents?.data || [];
      const mappedAttachments = docRefs
        .map((ref: any) => {
          const fullDoc = included.find(
            (inc: any) =>
              String(inc.id) === String(ref.id) &&
              inc.type.includes("document"),
          );
          if (!fullDoc) return null;
          const attachment = fullDoc?.attributes?.attachment || "";
          return {
            id: fullDoc.id,
            name: attachment.split("/").pop() || "Image",
            uri: normalizeFileUrl(attachment),
            type: "image/jpeg",
            isNew: false,
          };
        })
        .filter(Boolean);

      setAttachments(mappedAttachments as Attachment[]);

      setForm({
        title: ip.attributes?.title || "",
        description: ip.attributes?.description || "",
        applicability: ip.attributes?.applicability || "",
        claims: mappedClaims.length > 0 ? mappedClaims : [{ description: "" }],
        delete_document_ids: [],
      });
    } catch (error: any) {
      console.error(
        "FETCH ERROR",
        JSON.stringify(error?.response?.data || error, null, 2),
      );
      Alert.alert("Error", "Failed to load details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [id]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetails();
  }, [id]);

  // =========================
  // CLAIMS LOGIC
  // =========================
  const addClaim = () => {
    const lastClaim = form.claims[form.claims.length - 1];
    if (!lastClaim.description.trim()) {
      Alert.alert("Required", "Please complete the current claim first.");
      return;
    }
    setForm({
      ...form,
      claims: [...form.claims, { description: "" }],
    });
  };

  const removeClaim = (index: number) => {
    if (form.claims.length === 1) {
      Alert.alert("Required", "At least one claim is required.");
      return;
    }
    const newClaims = form.claims.filter((_, i) => i !== index);
    setForm({ ...form, claims: newClaims });
  };

  const updateClaim = (text: string, index: number) => {
    const newClaims = [...form.claims];
    newClaims[index].description = text;
    setForm({ ...form, claims: newClaims });
  };

  // =========================
  // FILE PICKER LOGIC
  // =========================
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/jpg", "image/svg+xml"],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const validFiles: Attachment[] = [];
      for (const asset of result.assets) {
        if (asset.size && asset.size > MAX_FILE_SIZE) {
          Alert.alert("File Too Large", `${asset.name} exceeds 10MB.`);
          continue;
        }
        validFiles.push({
          id: `new-${Date.now()}-${Math.random()}`,
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "image/jpeg",
          size: asset.size,
          isNew: true,
        });
      }

      setAttachments((prev) => [...prev, ...validFiles]);
    } catch (error) {
      Alert.alert("Error", "Failed to pick attachment.");
    }
  };

  const removeAttachment = (file: Attachment) => {
    if (!file.isNew) {
      setForm((prev) => ({
        ...prev,
        delete_document_ids: [...prev.delete_document_ids, Number(file.id)],
      }));
    }
    setAttachments((prev) => prev.filter((a) => a.id !== file.id));
  };

  // =========================
  // UPDATE LOGIC
  // =========================
  // Place these constants at the top of your file if they aren't there
  const MAX_SINGLE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const TOTAL_MAX_UPLOAD_SIZE = 8 * 1024 * 1024; // 8MB (Matches your current PHP limit)

  const handleUpdate = async () => {
    try {
      const validClaims = form.claims.filter((claim) =>
        claim.description.trim(),
      );

      // 1. Basic Validation
      if (
        validClaims.length === 0 ||
        !form.title.trim() ||
        !form.description.trim() ||
        !form.applicability.trim()
      ) {
        Alert.alert("Required", "Please fill in all required fields.");
        return;
      }

      // 2. Client-side Size Check (Prevents PHP Crash)
      const newAttachments = attachments.filter((file) => file.isNew);
      const totalSize = newAttachments.reduce(
        (sum, file) => sum + (file.size || 0),
        0,
      );

      if (totalSize > TOTAL_MAX_UPLOAD_SIZE) {
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        Alert.alert(
          "Files Too Large",
          `Total upload size is ${sizeInMB}MB, which exceeds the server limit of 8MB. Please remove some attachments.`,
        );
        return;
      }

      setUpdating(true);
      const formData = new FormData();

      // Append text fields
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("applicability", form.applicability);

      // Append Claims
      validClaims.forEach((claim, index) => {
        formData.append(`claims[${index}][description]`, claim.description);
      });

      // Append IDs for deletion
      form.delete_document_ids.forEach((docId, index) => {
        formData.append(`delete_document_ids[${index}]`, docId.toString());
      });

      // Append Files
      newAttachments.forEach((file, index) => {
        formData.append(`documents[${index}]`, {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      });

      await updateIntellectualProperty(id as string, formData);

      Alert.alert("Success", "Your application has been updated successfully.");
      setIsEditing(false);
      fetchDetails();
    } catch (error: any) {
      const status = error?.response?.status;
      const errorMessage = error?.response?.data?.message || "";

      // 3. Graceful Error Handling for Large Payload
      if (status === 413 || errorMessage.includes("too large")) {
        Alert.alert(
          "Upload Error",
          "The server rejected the request because the files are too large. Please try uploading fewer or smaller files.",
        );
      } else {
        console.error(
          "UPDATE ERROR",
          JSON.stringify(error?.response?.data || error, null, 2),
        );
        Alert.alert(
          "Error",
          "Failed to save changes. Please check your connection and try again.",
        );
      }
    } finally {
      setUpdating(true); // Usually set to false here, but set to false after logic finishes
      setUpdating(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const attr = data?.attributes ?? {};
  const canUserEdit = isEditable(data);

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-5">
          {/* REFERENCE CARD - PRESERVED */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6 flex-row justify-between items-center">
            <View>
              <Text className="text-slate-400 font-bold text-[10px] uppercase">
                Ref Number
              </Text>
              <Text className="text-2xl font-black text-primary">#{id}</Text>
            </View>
            <View
              className={`px-4 py-1.5 rounded-full ${attr.status === "Pending" ? "bg-amber-100" : "bg-blue-100"}`}
            >
              <Text
                className={`font-bold text-[11px] uppercase ${attr.status === "Pending" ? "text-amber-700" : "text-blue-700"}`}
              >
                {attr.status || "Draft"}
              </Text>
            </View>
          </View>

          {/* BASIC INFO - PRESERVED */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
            <Text className="text-slate-400 text-[10px] font-bold mb-1 uppercase">
              Property Title
            </Text>
            {isEditing ? (
              <TextInput
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-900 mb-5 font-semibold"
                value={form.title}
                onChangeText={(t) => setForm({ ...form, title: t })}
              />
            ) : (
              <Text className="text-lg font-semibold text-slate-800 mb-5">
                {attr.title}
              </Text>
            )}

            <Text className="text-slate-400 text-[10px] font-bold mb-1 uppercase">
              Description
            </Text>
            {isEditing ? (
              <TextInput
                multiline
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 min-h-[120px] text-slate-900 text-sm"
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
              />
            ) : (
              <Text className="text-slate-600 leading-6 text-sm">
                {attr.description}
              </Text>
            )}
          </View>

          {/* CLAIMS - PRESERVED */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4 px-2">
              <Text className="text-slate-800 text-lg font-bold">Claims</Text>
              {isEditing && (
                <TouchableOpacity
                  onPress={addClaim}
                  className="bg-primary px-4 py-2 rounded-full flex-row items-center"
                >
                  <Plus size={16} color="white" />
                  <Text className="text-white font-bold text-xs ml-1">Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {form.claims.map((c: any, index: number) => (
              <View
                key={index}
                className="bg-white p-5 rounded-3xl mb-3 border border-slate-100 flex-row items-center"
              >
                <View className="h-8 w-8 rounded-full bg-slate-100 items-center justify-center mr-3">
                  <Text className="text-slate-500 font-bold text-xs">
                    {index + 1}
                  </Text>
                </View>
                <View className="flex-1">
                  {isEditing ? (
                    <View className="flex-row items-center">
                      <TextInput
                        multiline
                        placeholder={`Claim #${index + 1}`}
                        className="flex-1 text-slate-700 text-sm"
                        value={c.description}
                        onChangeText={(t) => updateClaim(t, index)}
                      />
                      <TouchableOpacity
                        onPress={() => removeClaim(index)}
                        className="ml-2 p-2"
                      >
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text className="text-slate-600 text-sm italic">
                      {c.description || "No description provided."}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* ATTACHMENTS - FIXED DELETE & UI */}
          <View className="mb-6 px-2">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-slate-800 text-lg font-bold">
                  Attachments
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  JPG, PNG, PDF, SVG • Max 10MB
                </Text>
              </View>
              {isEditing && (
                <TouchableOpacity
                  onPress={handlePickFile}
                  className="bg-primary px-4 py-2 rounded-full flex-row items-center"
                >
                  <Upload size={16} color="white" />
                  <Text className="text-white font-bold text-xs ml-2">
                    Add File
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-row flex-wrap justify-between">
              {attachments.map((file) => {
                const isImg = file.type?.includes("image");
                return (
                  <View
                    key={file.id}
                    style={{ width: (width - 60) / 2 }}
                    className="bg-white rounded-3xl border border-slate-100 mb-4 overflow-hidden shadow-sm"
                  >
                    {/* DELETE BUTTON FIXED - Visible in Editing Mode */}
                    {isEditing && (
                      <TouchableOpacity
                        onPress={() => removeAttachment(file)}
                        className="absolute top-2 right-2 z-50 bg-[#D70127] p-2 rounded-full shadow-lg"
                      >
                        <X size={14} color="white" />
                      </TouchableOpacity>
                    )}
                    {isImg ? (
                      <Image
                        source={{ uri: file.uri }}
                        className="h-36 w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="h-36 w-full items-center justify-center bg-slate-100">
                        <FileText size={48} color="#64748b" />
                      </View>
                    )}
                    <View className="p-3 bg-white flex-row items-center">
                      <View className="flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-[11px] font-bold text-slate-500 uppercase"
                        >
                          {file.name}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {attachments.length === 0 && (
                <View className="w-full py-10 items-center border-2 border-dashed border-slate-200 rounded-3xl">
                  <FileText size={32} color="#94a3b8" />
                  <Text className="text-slate-400 mt-3">
                    No attachments uploaded
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* INDUSTRIAL APPLICABILITY - PRESERVED */}
          <View className="bg-primary/5 rounded-3xl p-6 border border-primary/10 mb-8">
            <Text className="text-primary font-black text-[10px] mb-2 uppercase tracking-widest">
              Industrial Applicability
            </Text>
            {isEditing ? (
              <TextInput
                multiline
                className="bg-white p-4 rounded-2xl border border-slate-200 min-h-[100px] text-slate-900 text-sm"
                value={form.applicability}
                onChangeText={(t) => setForm({ ...form, applicability: t })}
              />
            ) : (
              <Text className="text-slate-700 leading-6 text-sm">
                {attr.applicability || "N/A"}
              </Text>
            )}
          </View>

          {/* ACTIONS - PRESERVED */}
          {canUserEdit && !isEditing ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              className="bg-primary h-16 rounded-3xl justify-center items-center shadow-xl"
            >
              <Text className="text-white font-black text-lg">
                Modify Application
              </Text>
            </TouchableOpacity>
          ) : (
            isEditing && (
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    fetchDetails();
                  }}
                  className="flex-1 bg-white h-16 rounded-3xl justify-center items-center border border-slate-200"
                >
                  <Text className="text-slate-500 font-bold text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdate}
                  className="flex-[2] bg-green-600 h-16 rounded-3xl justify-center items-center"
                >
                  {updating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-black text-lg">
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

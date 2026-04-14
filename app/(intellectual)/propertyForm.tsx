import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import {
  Check,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

interface AgreedState {
  original: boolean;
  terms: boolean;
  privacy: boolean;
}

interface Attachment {
  id: string;
  name: string;
  uri: string;
  type: string;
}

export default function PropertyForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // --- Form States ---
  const [generalInfo, setGeneralInfo] = useState({
    title: "",
    description: "",
  });
  const [claims, setClaims] = useState(["", "", ""]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [industrial, setIndustrial] = useState({ applicability: "" });
  const [agreed, setAgreed] = useState<AgreedState>({
    original: false,
    terms: false,
    privacy: false,
  });

  // --- Handlers ---
  const addClaim = () => setClaims([...claims, ""]);
  const removeClaim = (index: number) => {
    const newClaims = claims.filter((_, i) => i !== index);
    setClaims(newClaims);
  };

  // REAL FILE ACCESS FUNCTION
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allows all file types (Images, PDFs, etc.)
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const newAttachment: Attachment = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          uri: file.uri,
          type: file.mimeType || "file",
        };
        setAttachments([...attachments, newAttachment]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not access files.");
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  // --- Validation Logic ---
  const validateStep = () => {
    if (step === 1) {
      if (!generalInfo.title.trim() || !generalInfo.description.trim()) {
        Alert.alert(
          "Required",
          "Title and Description are mandatory to proceed.",
        );
        return false;
      }
    }
    if (step === 2) {
      if (!claims.some((c) => c.trim() !== "")) {
        Alert.alert("Required", "Please enter at least one claim.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = () => {
    if (!agreed.original || !agreed.terms || !agreed.privacy) {
      Alert.alert("Required", "Please accept all terms and declarations.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Application Submitted Successfully!", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    }, 2000);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header Titles */}
      <View className="px-6 pt-6 mb-4">
        <Text className="text-xl font-bold text-slate-900 text-center uppercase tracking-widest">
          {step === 1 && "General Information"}
          {step === 2 && "Claims"}
          {step === 3 && "Attachments"}
          {step === 4 && "Industrial Use"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <View className="flex-row justify-between mb-8 px-2">
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              className={`h-1.5 flex-1 mx-1 rounded-full ${step >= i ? "bg-primary" : "bg-slate-200"}`}
            />
          ))}
        </View>

        {/* STEP 1: GENERAL INFO */}
        {step === 1 && (
          <View className="gap-y-6">
            <View>
              <Text className="text-slate-600 font-bold mb-2">
                Property Title *
              </Text>
              <TextInput
                placeholder="Invention or Design Title"
                className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-900"
                value={generalInfo.title}
                onChangeText={(text) =>
                  setGeneralInfo({ ...generalInfo, title: text })
                }
              />
            </View>
            <View>
              <Text className="text-slate-600 font-bold mb-2">
                Description *
              </Text>
              <TextInput
                placeholder="Detailed explanation of the invention..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="bg-slate-50 border border-slate-200 p-4 rounded-2xl h-44 text-slate-900"
                value={generalInfo.description}
                onChangeText={(text) =>
                  setGeneralInfo({ ...generalInfo, description: text })
                }
              />
            </View>
          </View>
        )}

        {/* STEP 2: CLAIMS */}
        {step === 2 && (
          <View>
            <Text className="text-slate-500 mb-6 italic text-sm">
              Define what makes your invention unique (At least 1 required).
            </Text>
            {claims.map((claim, index) => (
              <View key={index} className="flex-row items-center mb-4">
                <TextInput
                  placeholder={`Claim #${index + 1}`}
                  className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl"
                  value={claim}
                  onChangeText={(text) => {
                    const updated = [...claims];
                    updated[index] = text;
                    setClaims(updated);
                  }}
                />
                <TouchableOpacity
                  onPress={() => removeClaim(index)}
                  className="ml-2 p-2"
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={addClaim}
              className="flex-row items-center justify-center border border-dashed border-primary p-4 rounded-2xl mt-2"
            >
              <Plus size={20} color="#007AFF" />
              <Text className="text-primary font-bold ml-2">
                Add Another Claim
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: UPLOADS (Real File Access) */}
        {step === 3 && (
          <View className="gap-y-4">
            <Text className="text-slate-500 mb-2">
              Upload your Drawing, Diagram, or Photos below.
            </Text>

            {attachments.map((file) => (
              <View
                key={file.id}
                className="flex-row items-center bg-slate-50 border border-slate-200 p-4 rounded-2xl"
              >
                <View className="bg-slate-200 p-2 rounded-lg">
                  {file.type.includes("image") ? (
                    <ImageIcon size={20} color="#64748b" />
                  ) : (
                    <FileText size={20} color="#64748b" />
                  )}
                </View>
                <Text
                  className="text-slate-700 ml-3 flex-1 font-medium"
                  numberOfLines={1}
                >
                  {file.name}
                </Text>
                <TouchableOpacity onPress={() => removeAttachment(file.id)}>
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              onPress={handlePickFile}
              className="flex-row items-center justify-center bg-primary/10 p-5 rounded-2xl mt-2 border border-dashed border-primary"
            >
              <Upload size={22} color="#007AFF" />
              <Text className="text-primary font-bold ml-3 text-lg">
                Select File / Image
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              className="mt-10 p-4 items-center"
            >
              <Text className="text-slate-400 font-bold tracking-widest text-xs uppercase">
                Not Applicable (Skip Step)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: FINAL */}
        {step === 4 && (
          <View className="gap-y-6">
            <View>
              <Text className="text-slate-600 font-bold mb-2">
                Industrial Applicability
              </Text>
              <TextInput
                placeholder="How will this be used in the real world?"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-slate-50 border border-slate-200 p-4 rounded-2xl h-36"
                value={industrial.applicability}
                onChangeText={(text) => setIndustrial({ applicability: text })}
              />
            </View>

            <View className="gap-y-5 pt-4">
              {(Object.keys(agreed) as (keyof AgreedState)[]).map((key) => {
                const labels = {
                  original: "I declare that this invention is original.",
                  terms: "I agree to the Terms and Conditions.",
                  privacy: "I agree to the Data Privacy Policy.",
                };
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() =>
                      setAgreed({ ...agreed, [key]: !agreed[key] })
                    }
                    className="flex-row items-center"
                  >
                    <View
                      className={`w-6 h-6 rounded border ${agreed[key] ? "bg-primary border-primary" : "border-slate-300"} items-center justify-center mr-4`}
                    >
                      {agreed[key] && <Check size={16} color="white" />}
                    </View>
                    <Text className="text-slate-600 flex-1 text-sm">
                      {labels[key]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        <View className="h-24" />
      </ScrollView>

      {/* Footer Navigation */}
      <View className="p-6 bg-white border-t border-slate-100 flex-row gap-x-3">
        {step > 1 && (
          <TouchableOpacity
            onPress={handleBack}
            className="flex-1 h-16 rounded-2xl justify-center items-center border border-slate-200 bg-white"
          >
            <Text className="text-slate-600 font-bold text-lg">Previous</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={step === 4 ? handleSubmit : handleNext}
          disabled={loading}
          className={`flex-[2] h-16 rounded-2xl flex-row justify-center items-center shadow-md ${loading ? "bg-slate-400" : "bg-primary"}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {step === 4 ? "Submit Files" : "Continue"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

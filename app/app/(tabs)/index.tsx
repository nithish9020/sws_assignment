import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  Button,
  ProgressBar,
  IconButton,
  ActivityIndicator,
  Chip,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect } from "expo-router";
import {
  uploadFile,
  fetchDocuments,
  deleteDocument,
  type DocumentItem,
} from "../../src/api/documents";

type UploadItem = {
  id: string;
  name: string;
  size: number;
  status: "queued" | "uploading" | "complete" | "failed";
  progress: number;
  error?: string;
};

export default function UploadScreen() {
  const { colors } = useTheme();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch {
      // silently fail on load
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  }, [loadDocuments]);

  const pickAndUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const uploadId = Date.now().toString();

      const newUpload: UploadItem = {
        id: uploadId,
        name: file.name,
        size: file.size ?? 0,
        status: "uploading",
        progress: 0,
      };

      setUploads((prev) => [newUpload, ...prev]);

      try {
        await uploadFile(
          file.uri,
          file.name,
          file.mimeType ?? "application/pdf",
          (percent) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadId ? { ...u, progress: percent } : u
              )
            );
          }
        );

        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? { ...u, status: "complete", progress: 100 }
              : u
          )
        );

        // Refresh documents list
        await loadDocuments();
      } catch (err: any) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? { ...u, status: "failed", error: err.message }
              : u
          )
        );
      }
    } catch {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    Alert.alert("Delete Document", `Delete "${doc.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDocument(doc.id);
            setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
          } catch {
            Alert.alert("Error", "Failed to delete document");
          }
        },
      },
    ]);
  };

  const handleView = (url: string) => {
    Linking.openURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusColor = (status: UploadItem["status"]) => {
    switch (status) {
      case "uploading":
        return colors.primary;
      case "complete":
        return "#22C55E";
      case "failed":
        return "#EF4444";
      default:
        return "#9AABBA";
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Upload Drop Zone */}
      <Card style={styles.dropZone} mode="outlined">
        <Card.Content style={styles.dropZoneContent}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="file-upload-outline"
              size={36}
              color={colors.primary}
            />
          </View>
          <Text variant="titleMedium" style={styles.dropTitle}>
            Tap to browse & upload
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: "#6B7B8D", marginTop: 4 }}
          >
            PDF files only · Up to 50 MB per file
          </Text>

          <Button
            mode="contained"
            icon="upload"
            onPress={pickAndUpload}
            style={styles.uploadButton}
            labelStyle={{ fontWeight: "600" }}
          >
            Select PDF
          </Button>
        </Card.Content>
      </Card>

      {/* Upload Progress Queue */}
      {uploads.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Upload Queue
          </Text>
          {uploads.map((item) => (
            <Card key={item.id} style={styles.uploadCard} mode="elevated">
              <Card.Content>
                <View style={styles.uploadRow}>
                  <MaterialCommunityIcons
                    name="file-pdf-box"
                    size={28}
                    color="#EF4444"
                  />
                  <View style={styles.uploadInfo}>
                    <Text
                      variant="bodyMedium"
                      numberOfLines={1}
                      style={{ fontWeight: "600" }}
                    >
                      {item.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: "#6B7B8D" }}>
                      {formatSize(item.size)}
                    </Text>
                  </View>
                  <Chip
                    textStyle={{ fontSize: 11, fontWeight: "600" }}
                    style={{
                      backgroundColor:
                        item.status === "complete"
                          ? "#DCFCE7"
                          : item.status === "failed"
                          ? "#FEE2E2"
                          : colors.primaryContainer,
                    }}
                    compact
                  >
                    {item.status}
                  </Chip>
                </View>
                {item.status === "uploading" && (
                  <View style={styles.progressSection}>
                    <ProgressBar
                      progress={item.progress / 100}
                      color={colors.primary}
                      style={styles.progressBar}
                    />
                    <Text
                      variant="labelSmall"
                      style={{ color: "#6B7B8D", marginTop: 4 }}
                    >
                      {item.progress}%
                    </Text>
                  </View>
                )}
                {item.status === "failed" && item.error && (
                  <Text
                    variant="bodySmall"
                    style={{ color: "#EF4444", marginTop: 8 }}
                  >
                    {item.error}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Document Library */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionTitle}>
          Document Library
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 32 }}
          />
        ) : documents.length === 0 ? (
          <Card style={styles.emptyCard} mode="outlined">
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="folder-open-outline"
                size={48}
                color="#CBD5E1"
              />
              <Text
                variant="titleSmall"
                style={{ color: "#6B7B8D", marginTop: 12 }}
              >
                No documents yet
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: "#9AABBA", marginTop: 4, textAlign: "center" }}
              >
                Upload files above — they'll appear here once complete
              </Text>
            </Card.Content>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} style={styles.docCard} mode="elevated">
              <Card.Content>
                <View style={styles.docRow}>
                  <MaterialCommunityIcons
                    name="file-pdf-box"
                    size={32}
                    color="#EF4444"
                  />
                  <View style={styles.docInfo}>
                    <Text
                      variant="bodyMedium"
                      numberOfLines={1}
                      style={{ fontWeight: "600" }}
                    >
                      {doc.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: "#6B7B8D" }}>
                      {formatSize(doc.size)} · {formatDate(doc.createdAt)}
                    </Text>
                  </View>
                </View>
                <Divider style={{ marginVertical: 10 }} />
                <View style={styles.docActions}>
                  <Button
                    mode="text"
                    compact
                    icon="eye"
                    onPress={() => handleView(doc.url)}
                    textColor={colors.primary}
                  >
                    View
                  </Button>
                  <Button
                    mode="text"
                    compact
                    icon="delete-outline"
                    onPress={() => handleDelete(doc)}
                    textColor="#EF4444"
                  >
                    Delete
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  dropZone: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#D0E3FF",
    borderRadius: 16,
    backgroundColor: "#F8FBFF",
  },
  dropZoneContent: {
    alignItems: "center",
    paddingVertical: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  dropTitle: {
    fontWeight: "700",
    marginTop: 4,
  },
  uploadButton: {
    marginTop: 20,
    borderRadius: 24,
    paddingHorizontal: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: 12,
    color: "#1A1A1A",
  },
  uploadCard: {
    marginBottom: 10,
    borderRadius: 12,
  },
  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  uploadInfo: {
    flex: 1,
  },
  progressSection: {
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  emptyCard: {
    borderRadius: 16,
    borderColor: "#E2E8F0",
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 32,
  },
  docCard: {
    marginBottom: 10,
    borderRadius: 12,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  docInfo: {
    flex: 1,
  },
  docActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
  },
});

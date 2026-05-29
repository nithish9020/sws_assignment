import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  Button,
  IconButton,
  ActivityIndicator,
  Divider,
  Searchbar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import {
  fetchDocuments,
  deleteDocument,
  type DocumentItem,
} from "../../src/api/documents";

export default function LibraryScreen() {
  const { colors } = useTheme();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
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

  const filtered = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDoc = ({ item: doc }: { item: DocumentItem }) => (
    <Card style={styles.docCard} mode="elevated">
      <Card.Content>
        <View style={styles.docRow}>
          <View style={[styles.fileIcon, { backgroundColor: "#FEE2E2" }]}>
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={28}
              color="#EF4444"
            />
          </View>
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
            mode="outlined"
            compact
            icon="eye"
            onPress={() => handleView(doc.url)}
            textColor={colors.primary}
            style={styles.actionBtn}
          >
            View
          </Button>
          <Button
            mode="outlined"
            compact
            icon="download"
            onPress={() => handleView(doc.url)}
            textColor={colors.primary}
            style={styles.actionBtn}
          >
            Download
          </Button>
          <IconButton
            icon="delete-outline"
            iconColor="#EF4444"
            size={20}
            onPress={() => handleDelete(doc)}
            style={styles.deleteBtn}
          />
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Searchbar
          placeholder="Search documents..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={{ fontSize: 14 }}
          elevation={0}
        />
      </View>

      {/* Document Count */}
      <View style={styles.countRow}>
        <Text variant="bodySmall" style={{ color: "#6B7B8D" }}>
          {filtered.length} document{filtered.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons
            name="folder-open-outline"
            size={64}
            color="#CBD5E1"
          />
          <Text
            variant="titleSmall"
            style={{ color: "#6B7B8D", marginTop: 16 }}
          >
            {searchQuery ? "No matching documents" : "No documents yet"}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: "#9AABBA", marginTop: 4, textAlign: "center" }}
          >
            {searchQuery
              ? "Try a different search term"
              : "Upload files from the Upload tab"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderDoc}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchbar: {
    borderRadius: 12,
    backgroundColor: "#F0F6FF",
  },
  countRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  docInfo: {
    flex: 1,
  },
  docActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtn: {
    borderRadius: 8,
    borderColor: "#D0E3FF",
  },
  deleteBtn: {
    marginLeft: "auto",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
});

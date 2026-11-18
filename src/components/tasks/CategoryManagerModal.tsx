import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Category } from '../../types';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  CATEGORY_COLOR_SWATCHES,
  CATEGORY_ICON_OPTIONS,
} from '../../db/seed';
import { CategoryGlyph, PawPrintIcon } from '../cat/CatGraphics';

interface CategoryManagerModalProps {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onSaveCategory: (payload: {
    id?: string;
    name: string;
    color: string;
    icon: string;
  }) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  visible,
  categories,
  onClose,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const { theme } = useAppTheme();
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLOR_SWATCHES[0]);
  const [icon, setIcon] = useState('paw');

  if (!visible) return null;

  const resetForm = () => {
    setEditingId(undefined);
    setName('');
    setColor(CATEGORY_COLOR_SWATCHES[0]);
    setIcon('paw');
  };

  const handleSelectEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color);
    setIcon(cat.icon);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSaveCategory({
      id: editingId,
      name: name.trim(),
      color,
      icon,
    });
    resetForm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <PawPrintIcon size={18} color={theme.accent} />
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Kelola Kategori Kegiatan
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceMuted }]}
            >
              <Text style={[styles.closeText, { color: theme.textPrimary }]}>
                Selesai
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Form Tambah / Edit Kategori */}
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </Text>

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nama kategori (misal: Organisasi, Olahraga)"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
              />

              <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                Pilih Warna:
              </Text>
              <View style={styles.swatchRow}>
                {CATEGORY_COLOR_SWATCHES.map((sw) => {
                  const selected = sw === color;
                  return (
                    <Pressable
                      key={sw}
                      onPress={() => setColor(sw)}
                      style={[
                        styles.swatchCircle,
                        {
                          backgroundColor: sw,
                          borderWidth: selected ? 3 : 0,
                          borderColor: theme.textPrimary,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                Pilih Ikon:
              </Text>
              <View style={styles.iconRow}>
                {CATEGORY_ICON_OPTIONS.map((opt) => {
                  const selected = opt.id === icon;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setIcon(opt.id)}
                      style={[
                        styles.iconChip,
                        {
                          backgroundColor: selected
                            ? theme.accent
                            : theme.surfaceMuted,
                          borderColor: selected ? theme.accent : theme.border,
                        },
                      ]}
                    >
                      <CategoryGlyph
                        icon={opt.id}
                        color={selected ? theme.onAccent : color}
                        size={13}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: selected ? theme.onAccent : theme.textPrimary,
                          marginLeft: 6,
                        }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.formActionRow}>
                {editingId ? (
                  <Pressable
                    onPress={resetForm}
                    style={[
                      styles.resetBtn,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <Text
                      style={{ color: theme.textPrimary, fontWeight: '700' }}
                    >
                      Batal Edit
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={handleSave}
                  style={[
                    styles.saveBtn,
                    { backgroundColor: theme.accent, flex: 1 },
                  ]}
                >
                  <Text style={{ color: theme.onAccent, fontWeight: '800' }}>
                    {editingId ? 'Simpan Kategori' : '+ Tambah Kategori'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Daftar Kategori Saat Ini */}
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textPrimary, marginTop: 18, marginBottom: 10 },
              ]}
            >
              Daftar Kategori ({categories.length})
            </Text>

            {categories.map((cat) => (
              <View
                key={cat.id}
                style={[
                  styles.catRow,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.catLeft}>
                  <View
                    style={[
                      styles.catBadge,
                      { backgroundColor: cat.color },
                    ]}
                  >
                    <CategoryGlyph icon={cat.icon} color="#FFFFFF" size={14} />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: theme.textPrimary,
                      }}
                    >
                      {cat.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      {cat.isDefault ? 'Kategori Bawaan' : 'Kategori Custom'}
                    </Text>
                  </View>
                </View>

                <View style={styles.catActions}>
                  <Pressable
                    onPress={() => handleSelectEdit(cat)}
                    style={[
                      styles.smallActionBtn,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: theme.textPrimary,
                      }}
                    >
                      Edit
                    </Text>
                  </Pressable>
                  {!cat.isDefault ? (
                    <Pressable
                      onPress={() => onDeleteCategory(cat.id)}
                      style={[
                        styles.smallActionBtn,
                        { backgroundColor: theme.statusOverdueBg },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: theme.statusOverdue,
                        }}
                      >
                        Hapus
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '88%',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  subLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconChip: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  formActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  resetBtn: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    minHeight: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catActions: {
    flexDirection: 'row',
    gap: 6,
  },
  smallActionBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

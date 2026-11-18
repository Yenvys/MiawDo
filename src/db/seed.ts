import { Category, AppSettings } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-kerja',
    name: 'Kerja',
    color: '#D96B43',
    icon: 'briefcase',
    isDefault: true,
    sortOrder: 1,
  },
  {
    id: 'cat-kuliah',
    name: 'Kuliah',
    color: '#3B7496',
    icon: 'book',
    isDefault: true,
    sortOrder: 2,
  },
  {
    id: 'cat-belanja',
    name: 'Belanja',
    color: '#2E8B63',
    icon: 'cart',
    isDefault: true,
    sortOrder: 3,
  },
  {
    id: 'cat-keinginan',
    name: 'Keinginan',
    color: '#B86E14',
    icon: 'star',
    isDefault: true,
    sortOrder: 4,
  },
  {
    id: 'cat-pribadi',
    name: 'Pribadi',
    color: '#8E5B96',
    icon: 'paw',
    isDefault: true,
    sortOrder: 5,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'auto_time',
  morningDigestEnabled: true,
  morningDigestTime: '07:00',
  userName: 'Cat Lover',
};

export const CATEGORY_COLOR_SWATCHES = [
  '#D96B43',
  '#3B7496',
  '#2E8B63',
  '#B86E14',
  '#8E5B96',
  '#C93B3B',
  '#3D7A7A',
  '#7A6248',
];

export const CATEGORY_ICON_OPTIONS = [
  { id: 'paw', label: 'Jejak Kaki' },
  { id: 'briefcase', label: 'Kerja' },
  { id: 'book', label: 'Kuliah / Buku' },
  { id: 'cart', label: 'Belanja' },
  { id: 'star', label: 'Keinginan' },
  { id: 'heart', label: 'Kesehatan' },
  { id: 'home', label: 'Rumah' },
  { id: 'code', label: 'Project' },
];

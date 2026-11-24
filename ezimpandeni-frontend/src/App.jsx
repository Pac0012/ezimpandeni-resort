import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Chip,
  TextField,
  MenuItem,
  CircularProgress,
  Stack,
  IconButton,
  Dialog,
  DialogContent,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ParkRoundedIcon from '@mui/icons-material/ParkRounded';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import SpaRoundedIcon from '@mui/icons-material/SpaRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';

import apiClient from './api/client';
import BookingModal from './components/BookingModal';
import ContactModal from './components/ContactModal';
import InclusionsModal from './components/InclusionsModal';
import AdminModal from './components/AdminModal';
import Footer from './components/Footer';

const assetModules = import.meta.glob('./assets/*', { eager: true });
const assetsByName = Object.entries(assetModules).reduce((acc, [path, mod]) => {
  const fileName = path.split('/').pop()?.toLowerCase() || '';
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const url = mod?.default || '';
  if (url) {
    acc[fileName] = url;
    if (!acc[baseName]) acc[baseName] = url;
  }
  return acc;
}, {});

const resolveAsset = (candidates) => {
  for (const name of candidates) {
    const key = name.toLowerCase();
    if (assetsByName[key]) return assetsByName[key];
  }
  return '';
};

const logoImg = resolveAsset(['logo.jpg', 'logo.png', 'logo.jpeg', 'logo']);
const homeHeroBg = resolveAsset(['homepg.jpg', 'homepg.png', 'homepg.jpeg', 'homepg']);
const image1 = resolveAsset(['image1.jpg', 'image1.png', 'image1.jpeg', 'image1']);
const image2 = resolveAsset(['image2.jpg', 'image2.png', 'image2.jpeg', 'image2']);
const image3 = resolveAsset(['image3.jpg', 'image3.png', 'image3.jpeg', 'image3']);
const image5 = resolveAsset(['image5.jpg', 'image5.png', 'image5.jpeg', 'image5']);
const wedpg = resolveAsset(['wedpg.jpg', 'wedpg.png', 'wedpg.jpeg', 'wedpg']);
const eventpg = resolveAsset(['eventpg.jpg', 'eventpg.png', 'eventpg.jpeg', 'eventpg']);

const GALLERY_FOLDERS = [
  {
    name: 'Day Visit',
    tagline: 'Sunlit lawns, braai stands & family picnic spots',
    fallbackCover: image1 || homeHeroBg,
  },
  {
    name: 'Photoshoots',
    tagline: 'Scenic backdrops for weddings, portraits & matric shoots',
    fallbackCover: image2 || image3 || homeHeroBg,
  },
  {
    name: 'Weddings & Functions',
    tagline: 'Garden ceremonies, marquee setups & private functions',
    fallbackCover: wedpg || image5 || homeHeroBg,
  },
  {
    name: 'Events & Festivals',
    tagline: 'Full resort grounds for gatherings, music & celebrations',
    fallbackCover: eventpg || homeHeroBg,
  },
];

const FOLDER_TO_SERVICE_ID = {
  'Day Visit': 'day-visit',
  Photoshoots: 'photoshoot',
  'Weddings & Functions': 'weddings-functions',
  'Events & Festivals': 'events-festivals',
};

const FALLBACK_SERVICES = [
  {
    id: 'day-visit',
    title: 'Day Visit / Picnic',
    category: 'Day Visit',
    description:
      'Enjoy peaceful outdoor gardens, clean rest areas, braai stands, and serene picnic spots.',
    base_price: 100,
    pricing_type: 'day_visit',
    requires_weekend_block: false,
  },
  {
    id: 'photoshoot',
    title: 'Photoshoot Venue',
    category: 'Photoshoot',
    description:
      'Ideal location for wedding photoshoots, family portraits, matric dance, or commercial shoots.',
    base_price: 1500,
    pricing_type: 'flat',
    requires_weekend_block: false,
  },
  {
    id: 'weddings-functions',
    title: 'Weddings & Functions',
    category: 'Weddings & Functions',
    description:
      'The perfect outdoor setting for elegant garden weddings, farewell functions, business & corporate events, anniversary celebrations, and private milestone.',
    base_price: 10000,
    pricing_type: 'flat',
    requires_weekend_block: true,
  },
  {
    id: 'events-festivals',
    title: 'Events & Festivals',
    category: 'Events & Festivals',
    description:
      'Complete resort venue rental for large corporate events, music festivals, and community celebrations. Includes full setup prep & 3-day weekend.',
    base_price: 12000,
    pricing_type: 'event',
    requires_weekend_block: true,
  },
];

const isVideoMedia = (item) =>
  item?.media_type === 'video' ||
  item?.type === 'video' ||
  /\.(mp4|mov|webm|avi|mkv)$/i.test(item?.url || item?.filename || '');

function HighlightVideoCard({ item, idx }) {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }, []);

  const handleActivate = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  };

  return (
    <Grid item xs={12} sm={6} md={6}>
      <Card
        onMouseEnter={handleActivate}
        onClick={handleActivate}
        sx={{
          cursor: 'pointer',
          height: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'rgba(12, 32, 23, 0.92)',
          border: '1px solid rgba(255, 215, 0, 0.28)',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.48)',
          animation: `cardRise 0.65s ease-out ${idx * 0.12}s both`,
          transition: 'transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
          '&:hover': {
            transform: 'translateY(-6px)',
            borderColor: '#FFD700',
            boxShadow: '0 20px 38px rgba(255, 215, 0, 0.22)',
            '& .video-overlay-text': {
              transform: 'translateY(-2px)',
            },
          },
          '@keyframes cardRise': {
            '0%': { opacity: 0, transform: 'translateY(22px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 10',
            bgcolor: '#06120d',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {item.posterSrc && !videoReady && (
            <Box
              component="img"
              src={item.posterSrc}
              alt={item.title}
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                filter: 'none',
              }}
            />
          )}

          <Box
            component="video"
            ref={videoRef}
            src={item.videoSrc}
            poster={item.posterSrc || undefined}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
            onPlaying={() => setVideoReady(true)}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              filter: 'none',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: 'rgba(8, 22, 16, 0.88)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 215, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            {item.icon}
          </Box>

          <Box
            className="video-overlay-text"
            sx={{
              position: 'relative',
              zIndex: 2,
              pt: 4.5,
              pb: 2.25,
              px: { xs: 2, sm: 2.5 },
              background:
                'linear-gradient(180deg, rgba(6,18,13,0) 0%, rgba(6,18,13,0.75) 45%, rgba(6,18,13,0.94) 100%)',
              transition: 'transform 0.3s ease',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 700,
                fontSize: { xs: '1.05rem', sm: '1.15rem' },
                color: '#FFD700',
                textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                mb: 0.35,
                lineHeight: 1.25,
              }}
            >
              {item.title}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: { xs: '0.84rem', sm: '0.9rem' },
                lineHeight: 1.48,
                color: '#ffffff',
                textShadow: '0 2px 8px rgba(0,0,0,0.95)',
              }}
            >
              {item.desc}
            </Typography>
          </Box>
        </Box>
      </Card>
    </Grid>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [selectedService, setSelectedService] = useState(null);
  const [openBooking, setOpenBooking] = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const [openInclusions, setOpenInclusions] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);
  const [notification, setNotification] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState('success');

  const [openedFolder, setOpenedFolder] = useState(null);
  const [allMediaMode, setAllMediaMode] = useState(false);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const [galleryItems, setGalleryItems] = useState(() => [
    {
      id: 'seed-1',
      type: 'image',
      title: 'Day Visit & Picnics Lawn',
      category: 'Day Visit',
      url: image1 || homeHeroBg,
    },
    {
      id: 'seed-2',
      type: 'image',
      title: 'Photoshoot Gardens',
      category: 'Photoshoots',
      url: image2 || homeHeroBg,
    },
    {
      id: 'seed-3',
      type: 'image',
      title: 'Weddings & Functions Grounds',
      category: 'Weddings & Functions',
      url: wedpg || image5 || homeHeroBg,
    },
    {
      id: 'seed-4',
      type: 'image',
      title: 'Events & Festivals Arena',
      category: 'Events & Festivals',
      url: eventpg || homeHeroBg,
    },
  ]);

  const [selectedPackageId, setSelectedPackageId] = useState('day-visit');
  const [checkDate, setCheckDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [isChecking, setIsChecking] = useState(false);

  const packageImages = {
    'day-visit': image1 || homeHeroBg,
    photoshoot: image2 || homeHeroBg,
    'weddings-functions': wedpg || image5 || homeHeroBg,
    'events-festivals': eventpg || homeHeroBg,
  };

  const resortHighlights = [
    {
      icon: <ParkRoundedIcon sx={{ fontSize: 22, color: '#FFD700' }} />,
      videoSrc: '/videos/gardens.mp4',
      posterSrc: image1 || homeHeroBg,
      title: 'Green Scenic Gardens',
      desc: 'Wide green lawns surrounded by nature in Umzinyathi, great for picnics and resting.',
    },
    {
      icon: <CameraAltRoundedIcon sx={{ fontSize: 22, color: '#FFD700' }} />,
      videoSrc: '/videos/photoshoots.mp4',
      posterSrc: image2 || homeHeroBg,
      title: 'Great Photo Spots',
      desc: 'Bright outdoor views for wedding photos, matric dance pictures, and family moments.',
    },
    {
      icon: <CelebrationRoundedIcon sx={{ fontSize: 22, color: '#FFD700' }} />,
      videoSrc: '/videos/events.mp4',
      posterSrc: eventpg || homeHeroBg,
      title: 'Big Event Hosting',
      desc: 'Private venue hire for weddings, parties, and work events with room to set up your way.',
    },
    {
      icon: <SpaRoundedIcon sx={{ fontSize: 22, color: '#FFD700' }} />,
      videoSrc: '/videos/comfort.mp4',
      posterSrc: wedpg || homeHeroBg,
      title: 'Easy Guest Comfort',
      desc: 'Clean toilets, braai stands, changing rooms, and running tap water for a smooth visit.',
    },
  ];

  const fetchServices = useCallback(async () => {
    try {
      const res = await apiClient.get('/services');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mergedServices = res.data.map((srv) => {
          const fallbackMatch = FALLBACK_SERVICES.find(
            (f) =>
              f.id === srv.id ||
              f.title.toLowerCase() === String(srv.title || '').toLowerCase()
          );
          return {
            ...srv,
            description: fallbackMatch ? fallbackMatch.description : srv.description,
          };
        });
        setServices(mergedServices);
        setSelectedPackageId((prev) =>
          mergedServices.some((s) => s.id === prev) ? prev : mergedServices[0].id
        );
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  }, []);

  const fetchGallery = useCallback(async () => {
    try {
      const res = await apiClient.get('/gallery');
      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : null;

      if (rawList) {
        const backendBase = apiClient.defaults?.baseURL || '';
        const normalized = rawList.map((item) => ({
          ...item,
          url:
            item.url && item.url.startsWith('/') && backendBase
              ? `${backendBase.replace(/\/$/, '')}${item.url}`
              : item.url,
        }));
        setGalleryItems((prev) => {
          const seedItems = prev.filter((p) => String(p.id || '').startsWith('seed-'));
          return [...normalized, ...seedItems];
        });
      }
    } catch {
      // Keeps local/seeded gallery items if backend /gallery is not yet active
    }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchGallery();
  }, [fetchServices, fetchGallery]);

  const handleUploadGalleryItem = async ({ category, title, file, headers = {} }) => {
    const isVideo =
      (file.type && file.type.startsWith('video/')) ||
      /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name || '');
    const localUrl = URL.createObjectURL(file);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('title', title);
      formData.append('file', file);
      const res = await apiClient.post('/gallery/upload', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });
      const payloadItem = res.data?.item || res.data || {};
      const backendBase = apiClient.defaults?.baseURL || '';
      const created = {
        ...payloadItem,
        id: payloadItem.id || `srv-${Date.now()}`,
        category: payloadItem.category || category,
        title: payloadItem.title || title,
        url:
          payloadItem.url && payloadItem.url.startsWith('/') && backendBase
            ? `${backendBase.replace(/\/$/, '')}${payloadItem.url}`
            : payloadItem.url || localUrl,
      };
      setGalleryItems((prev) => [created, ...prev]);
    } catch {
      const localItem = {
        id: `local-${Date.now()}`,
        title,
        category,
        type: isVideo ? 'video' : 'image',
        url: localUrl,
      };
      setGalleryItems((prev) => [localItem, ...prev]);
    }

    setNotificationSeverity('success');
    setNotification(`Added "${title}" to ${category} folder.`);
  };

  const handleDeleteGalleryItem = async (item, headers = {}) => {
    try {
      if (
        item.id &&
        !String(item.id).startsWith('seed-') &&
        !String(item.id).startsWith('local-')
      ) {
        await apiClient.delete(`/gallery/${item.id}`, { headers });
      }
    } catch {
      // Remove locally even if backend item was local/seeded
    }
    setGalleryItems((prev) => prev.filter((g) => g.id !== item.id));
    setNotificationSeverity('success');
    setNotification(`Removed "${item.title}" from ${item.category}.`);
  };

  const handleOpenBooking = (service, prefillDate = '') => {
    setSelectedService(service ? { ...service, initialDate: prefillDate } : null);
    setOpenBooking(true);
  };

  const handleBookFromCategory = (categoryName) => {
    const targetServiceId = FOLDER_TO_SERVICE_ID[categoryName] || 'day-visit';
    const matchedService =
      services.find((s) => s.id === targetServiceId) ||
      services.find(
        (s) => String(s.category || '').toLowerCase() === String(categoryName || '').toLowerCase()
      ) ||
      services[0];
    setLightboxIndex(null);
    handleOpenBooking(matchedService);
  };

  const handleCheckAvailability = async () => {
    if (!checkDate) {
      setNotificationSeverity('error');
      setNotification('Please pick a date to check availability.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (checkDate < todayStr) {
      setNotificationSeverity('error');
      setNotification('Please pick today or a future date.');
      return;
    }

    setIsChecking(true);
    try {
      const targetPkg = services.find((s) => s.id === selectedPackageId) || services[0];
      const res = await apiClient.get('/availability/check', {
        params: { service_id: targetPkg.id, date: checkDate },
      });

      setIsChecking(false);
      if (res.data.available) {
        setNotificationSeverity('success');
        setNotification(res.data.message);
        setTimeout(() => handleOpenBooking(targetPkg, checkDate), 900);
      } else {
        setNotificationSeverity('error');
        setNotification(res.data.message);
      }
    } catch {
      setIsChecking(false);
      setNotificationSeverity('error');
      setNotification('Could not check dates right now. Please make sure the server is running.');
    }
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
    setMobileDrawerOpen(false);
    setLightboxIndex(null);
    if (page === 'gallery') {
      setOpenedFolder(null);
      setAllMediaMode(false);
      setMediaTypeFilter('all');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const foldersWithMedia = useMemo(() => {
    return GALLERY_FOLDERS.map((folder) => {
      const itemsInFolder = galleryItems.filter((item) => item.category === folder.name);
      const firstItem = itemsInFolder[0] || null;
      return {
        ...folder,
        items: itemsInFolder,
        count: itemsInFolder.length,
        firstItem,
        thumbUrl: firstItem?.url || folder.fallbackCover,
        thumbIsVideo: firstItem ? isVideoMedia(firstItem) : false,
      };
    });
  }, [galleryItems]);

  const activeMediaList = useMemo(() => {
    let baseList = [];
    if (openedFolder) {
      baseList = galleryItems.filter((item) => item.category === openedFolder);
    } else if (allMediaMode) {
      baseList = galleryItems;
    }

    return baseList.filter((item) => {
      const vid = isVideoMedia(item);
      if (mediaTypeFilter === 'video') return vid;
      if (mediaTypeFilter === 'image') return !vid;
      return true;
    });
  }, [galleryItems, openedFolder, allMediaMode, mediaTypeFilter]);

  const activeLightboxItem =
    lightboxIndex !== null && activeMediaList[lightboxIndex]
      ? activeMediaList[lightboxIndex]
      : null;

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight' && activeMediaList.length > 0) {
        setLightboxIndex((prev) => (prev + 1) % activeMediaList.length);
      }
      if (e.key === 'ArrowLeft' && activeMediaList.length > 0) {
        setLightboxIndex((prev) => (prev - 1 + activeMediaList.length) % activeMediaList.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, activeMediaList.length]);

  const backgroundImageStyle = homeHeroBg
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(8, 22, 16, 0.92) 0%, rgba(10, 28, 20, 0.96) 100%), url(${homeHeroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(180deg, #081610 0%, #0d241a 100%)',
      };

  const renderMediaCard = (item, idx) => {
    const video = isVideoMedia(item);
    const folderMeta = GALLERY_FOLDERS.find((f) => f.name === item.category);
    const mediaSrc = item.url || folderMeta?.fallbackCover || homeHeroBg;

    return (
      <Grid item xs={12} sm={6} md={4} key={item.id || `${item.title}-${idx}`}>
        <Card
          onClick={() => setLightboxIndex(idx)}
          sx={{
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: 3.5,
            overflow: 'hidden',
            bgcolor: 'rgba(13, 35, 25, 0.95)',
            border: '1px solid rgba(255, 215, 0, 0.24)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
            transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              borderColor: '#FFD700',
              boxShadow: '0 20px 38px rgba(0, 0, 0, 0.65)',
              '& .media-thumb-zoom': { transform: 'scale(1.04)' },
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 10',
              overflow: 'hidden',
              bgcolor: '#06130d',
            }}
          >
            {video ? (
              <>
                <Box
                  component="video"
                  src={mediaSrc}
                  muted
                  playsInline
                  preload="metadata"
                  className="media-thumb-zoom"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.35s ease',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PlayCircleRoundedIcon sx={{ fontSize: 58, color: '#FFD700' }} />
                </Box>
              </>
            ) : mediaSrc ? (
              <Box
                component="img"
                src={mediaSrc}
                alt={item.title || item.category || 'Ezimpandeni Resort'}
                className="media-thumb-zoom"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.35s ease',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ImageRoundedIcon sx={{ fontSize: 44, color: '#94a3b8' }} />
              </Box>
            )}

            <Chip
              label={item.category || 'Resort'}
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                bgcolor: '#FFD700',
                color: '#081610',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
              }}
            />

            {video && (
              <Chip
                icon={<VideocamRoundedIcon sx={{ color: '#FFD700 !important', fontSize: 15 }} />}
                label="Video"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  bgcolor: 'rgba(8, 22, 16, 0.88)',
                  color: '#ffffff',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 215, 0, 0.45)',
                }}
              />
            )}
          </Box>

          <CardContent
            sx={{
              p: 2.25,
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontSize: '1.02rem',
                color: '#ffffff',
                mb: 1.5,
                lineHeight: 1.35,
              }}
            >
              {item.title || 'Resort Highlight'}
            </Typography>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 500 }}>
                Tap to open preview
              </Typography>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookFromCategory(item.category);
                }}
                sx={{
                  color: '#FFD700',
                  fontWeight: 800,
                  textTransform: 'none',
                  px: 1.25,
                  borderRadius: '999px',
                  '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.14)' },
                }}
              >
                Book Package →
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        overflowX: 'clip',
        display: 'flex',
        flexDirection: 'column',
        color: '#ffffff',
        fontFamily: "'Poppins', sans-serif",
        backgroundAttachment: { xs: 'scroll', md: 'fixed' },
        ...backgroundImageStyle,
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(18, 46, 34, 0.82) 100%)',
          backdropFilter: 'blur(22px) saturate(160%)',
          WebkitBackdropFilter: 'blur(22px) saturate(160%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.28)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 0.85, gap: 1 }}>
            <Box
              onClick={() => navigateTo('home')}
              sx={{
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.06)',
                  filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.6))',
                },
              }}
            >
              {logoImg ? (
                <Box
                  component="img"
                  src={logoImg}
                  alt="Ezimpandeni Resort Logo"
                  sx={{
                    height: { xs: 40, sm: 50 },
                    width: { xs: 40, sm: 50 },
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #FFD700',
                    boxShadow: '0 0 14px rgba(255, 215, 0, 0.45)',
                    display: 'block',
                  }}
                />
              ) : null}
            </Box>

            <Box
              display={{ xs: 'none', md: 'flex' }}
              gap={1}
              alignItems="center"
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '999px',
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
              }}
            >
              {[
                { label: 'Home', page: 'home' },
                { label: 'Gallery', page: 'gallery' },
                { label: 'Packages', page: 'packages' },
              ].map((item) => {
                const active = currentPage === item.page;
                return (
                  <Button
                    key={item.page}
                    onClick={() => navigateTo(item.page)}
                    sx={{
                      color: active ? '#081610' : '#ffffff',
                      bgcolor: active ? '#FFD700' : 'transparent',
                      fontWeight: active ? 800 : 500,
                      fontSize: '0.88rem',
                      borderRadius: '999px',
                      px: 2,
                      py: 0.6,
                      '&:hover': {
                        bgcolor: active ? '#FFD700' : 'rgba(255, 255, 255, 0.14)',
                        color: active ? '#081610' : '#FFD700',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}

              <Button
                onClick={() => setOpenInclusions(true)}
                sx={{
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  borderRadius: '999px',
                  px: 2,
                  py: 0.6,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.14)', color: '#FFD700' },
                }}
              >
                Inclusions
              </Button>

              <Button
                onClick={() => setOpenContact(true)}
                sx={{
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  borderRadius: '999px',
                  px: 2,
                  py: 0.6,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.14)', color: '#FFD700' },
                }}
              >
                Contact Us
              </Button>
            </Box>

            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<LockRoundedIcon sx={{ color: '#FFD700', fontSize: { xs: 15, sm: 18 } }} />}
                onClick={() => setOpenAdmin(true)}
                sx={{
                  borderColor: 'rgba(255, 215, 0, 0.75)',
                  color: '#FFD700',
                  fontWeight: 800,
                  borderRadius: '30px',
                  px: { xs: 1.35, sm: 2.5 },
                  py: { xs: 0.6, sm: 0.75 },
                  fontSize: { xs: '0.7rem', sm: '0.85rem' },
                  whiteSpace: 'nowrap',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 14px rgba(255,215,0,0.2)',
                  '&:hover': {
                    bgcolor: '#FFD700',
                    color: '#0b1d15',
                    borderColor: '#FFD700',
                  },
                }}
              >
                STAFF PORTAL
              </Button>

              <IconButton
                aria-label="Open navigation menu"
                onClick={() => setMobileDrawerOpen(true)}
                sx={{
                  display: { xs: 'inline-flex', md: 'none' },
                  color: '#FFD700',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: 2,
                  p: 0.65,
                }}
              >
                <MenuRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 260,
            bgcolor: '#081610',
            color: '#ffffff',
            borderLeft: '1px solid rgba(255, 215, 0, 0.3)',
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 2, py: 1.75 }}
        >
          <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#FFD700' }}>
            Ezimpandeni Resort
          </Typography>
          <IconButton onClick={() => setMobileDrawerOpen(false)} sx={{ color: '#ffffff' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Divider sx={{ borderColor: 'rgba(255, 215, 0, 0.2)' }} />
        <List sx={{ px: 1, pt: 1 }}>
          <ListItemButton
            selected={currentPage === 'home'}
            onClick={() => navigateTo('home')}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemText primary="Home" />
          </ListItemButton>
          <ListItemButton
            selected={currentPage === 'packages'}
            onClick={() => navigateTo('packages')}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemText primary="Packages" />
          </ListItemButton>
          <ListItemButton
            selected={currentPage === 'gallery'}
            onClick={() => navigateTo('gallery')}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemText primary="Gallery" />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              setMobileDrawerOpen(false);
              setOpenInclusions(true);
            }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemText primary="Inclusions" />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              setMobileDrawerOpen(false);
              setOpenContact(true);
            }}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemText primary="Contact Us" />
          </ListItemButton>
        </List>
        <Box sx={{ px: 2, pt: 1 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<LockRoundedIcon />}
            onClick={() => {
              setMobileDrawerOpen(false);
              setOpenAdmin(true);
            }}
            sx={{
              bgcolor: '#FFD700',
              color: '#081610',
              fontWeight: 800,
              py: 1.1,
              '&:hover': { bgcolor: '#ffca28' },
            }}
          >
            STAFF PORTAL
          </Button>
        </Box>
      </Drawer>

      {/* ---------------- HOME PAGE ---------------- */}
      {currentPage === 'home' && (
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          <Box
            sx={{
              position: 'relative',
              minHeight: { xs: 'auto', md: '92vh' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              textAlign: 'center',
              px: { xs: 1.5, sm: 2 },
              py: { xs: 4.5, md: 6 },
            }}
          >
            <Container maxWidth="lg">
              {logoImg && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: { xs: 2.5, md: 4 },
                    animation: 'fadeInLogo 1.2s ease-out forwards',
                    '@keyframes fadeInLogo': {
                      '0%': { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
                      '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      p: '5px',
                      borderRadius: '50%',
                      background:
                        'linear-gradient(135deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)',
                      boxShadow: '0 0 25px rgba(255, 215, 0, 0.45)',
                      animation: 'logoGlow 3s ease-in-out infinite alternate',
                      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'scale(1.08) rotate(3deg)',
                        boxShadow: '0 0 40px rgba(255, 215, 0, 0.8)',
                      },
                      '@keyframes logoGlow': {
                        '0%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.35)' },
                        '100%': { boxShadow: '0 0 38px rgba(255, 215, 0, 0.75)' },
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={logoImg}
                      alt="Ezimpandeni Resort Full Emblem"
                      sx={{
                        height: { xs: 100, sm: 130, md: 150 },
                        width: { xs: 100, sm: 130, md: 150 },
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                        border: '3px solid #081610',
                      }}
                    />
                  </Box>
                </Box>
              )}

              <Typography
                variant="h1"
                fontWeight={900}
                sx={{
                  fontSize: { xs: '2.1rem', sm: '3.8rem', md: '5.2rem' },
                  lineHeight: 1.1,
                  mb: { xs: 2, md: 3 },
                  letterSpacing: '-1px',
                  color: '#ffffff',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  animation: 'fadeUp 1s ease-out 0.2s forwards',
                  textShadow: `
                    0 1px 0 #E6A100,
                    0 2px 0 #C98B00,
                    0 3px 0 #AD7600,
                    0 4px 0 #8F6000,
                    0 8px 25px rgba(0,0,0,0.9),
                    0 0 35px rgba(255,215,0,0.4)
                  `,
                  '@keyframes fadeUp': {
                    '0%': { opacity: 0, transform: 'translateY(30px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                Experience Outdoor Luxury At Ezimpandeni Resort
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: '#ffffff',
                  opacity: 0.95,
                  maxWidth: '820px',
                  mx: 'auto',
                  mb: 3,
                  fontWeight: 300,
                  lineHeight: 1.65,
                  fontSize: { xs: '0.98rem', sm: '1.15rem', md: '1.35rem' },
                  textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                }}
              >
                Relax in open green gardens with nice views and clean spaces for family day
                visits, photos, and big outdoor events.
              </Typography>

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: { xs: 2, sm: 2.5 },
                  py: 1,
                  mb: { xs: 3, md: 4 },
                  borderRadius: { xs: '18px', sm: '999px' },
                  bgcolor: 'rgba(11, 29, 21, 0.85)',
                  border: '1px solid rgba(255, 215, 0, 0.45)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <AccessTimeRoundedIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: { xs: '0.82rem', sm: '0.88rem' },
                  }}
                >
                  Open Monday – Sunday:{' '}
                  <Box component="span" sx={{ color: '#FFD700', fontWeight: 800 }}>
                    08:00 – 18:00
                  </Box>{' '}
                  •{' '}
                  <Box component="span" sx={{ color: '#81c784', fontWeight: 700 }}>
                    Open on Public Holidays
                  </Box>
                </Typography>
              </Box>

              <Box
                sx={{
                  maxWidth: '860px',
                  mx: 'auto',
                  mb: { xs: 3.5, md: 5 },
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 4,
                  bgcolor: 'rgba(18, 43, 32, 0.88)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={5}>
                    <TextField
                      select
                      fullWidth
                      label="Select Package"
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      size="small"
                      sx={{
                        bgcolor: '#0b1d15',
                        borderRadius: 1,
                        label: { color: '#FFD700' },
                        '& .MuiOutlinedInput-root': { color: '#fff' },
                      }}
                    >
                      {services.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.title} (R{Number(s.base_price).toLocaleString()})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Check Date"
                      value={checkDate}
                      onChange={(e) => setCheckDate(e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: new Date().toISOString().split('T')[0] }}
                      sx={{
                        bgcolor: '#0b1d15',
                        borderRadius: 1,
                        label: { color: '#FFD700' },
                        '& .MuiOutlinedInput-root': { color: '#fff' },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleCheckAvailability}
                      disabled={isChecking}
                      startIcon={
                        isChecking ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <EventAvailableRoundedIcon />
                        )
                      }
                      sx={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #E6A100 100%)',
                        color: '#0b1d15',
                        fontWeight: 900,
                        py: 1.1,
                        fontSize: '0.88rem',
                        borderRadius: '25px',
                        '&:hover': { background: '#FFD700' },
                      }}
                    >
                      {isChecking ? 'CHECKING...' : 'CHECK DATE'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
                alignItems="center"
              >
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => navigateTo('packages')}
                  endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: '1.35rem !important' }} />}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    background: 'linear-gradient(135deg, #FFD700 0%, #E6A100 100%)',
                    color: '#0b1d15',
                    fontWeight: 900,
                    px: { xs: 3, sm: 5 },
                    py: { xs: 1.45, sm: 1.8 },
                    borderRadius: '40px',
                    fontSize: { xs: '0.96rem', sm: '1.1rem' },
                    boxShadow: '0 10px 30px rgba(255, 215, 0, 0.45)',
                    '&:hover': { background: '#FFD700', transform: 'translateY(-3px)' },
                  }}
                >
                  EXPLORE PACKAGES
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={
                    <PlayCircleRoundedIcon
                      sx={{ color: '#FFD700', fontSize: '1.35rem !important' }}
                    />
                  }
                  onClick={() => navigateTo('gallery')}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    color: '#ffffff',
                    borderColor: '#FFD700',
                    fontWeight: 800,
                    px: { xs: 3, sm: 4.5 },
                    py: { xs: 1.45, sm: 1.8 },
                    borderRadius: '40px',
                    fontSize: { xs: '0.94rem', sm: '1.05rem' },
                    bgcolor: 'rgba(18, 43, 32, 0.65)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 215, 0, 0.14)',
                      borderColor: '#FFD700',
                    },
                  }}
                >
                  VIEW GALLERY
                </Button>
              </Stack>
            </Container>
          </Box>

          <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 }, px: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h4"
              align="center"
              fontWeight={800}
              sx={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#FFD700',
                fontSize: { xs: '1.35rem', sm: '2rem', md: '2.125rem' },
                lineHeight: 1.25,
                maxWidth: '100%',
                overflowWrap: 'break-word',
                mb: { xs: 3, md: 4 },
              }}
            >
              Why Guests Love Ezimpandeni Resort
            </Typography>
            <Grid container spacing={3}>
              {resortHighlights.map((item, idx) => (
                <HighlightVideoCard key={item.title} item={item} idx={idx} />
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* ---------------- PACKAGES PAGE ---------------- */}
      {currentPage === 'packages' && (
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 }, px: { xs: 2, sm: 3 }, flexGrow: 1 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
            mb={4}
          >
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigateTo('home')}
              sx={{
                color: '#FFD700',
                fontWeight: 700,
                bgcolor: 'rgba(14, 38, 27, 0.85)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                borderRadius: '999px',
                px: 2.5,
                justifyContent: { xs: 'flex-start', sm: 'center' },
                '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.15)' },
              }}
            >
              Back to Home
            </Button>

            <Button
              variant="outlined"
              onClick={() => setOpenInclusions(true)}
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255, 215, 0, 0.6)',
                fontWeight: 700,
                borderRadius: '999px',
                px: 2.5,
                '&:hover': { borderColor: '#FFD700', color: '#FFD700' },
              }}
            >
              View Resort Inclusions
            </Button>
          </Stack>

          <Box mb={4}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 900,
                fontSize: { xs: '1.9rem', sm: '2.5rem', md: '2.85rem' },
                color: '#FFD700',
                mb: 1,
              }}
            >
              Resort Packages & Rates
            </Typography>
            <Typography variant="body1" sx={{ color: '#cbd5e1', maxWidth: 640 }}>
              Choose a package below to check availability and reserve your date directly from
              your phone or computer.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {services.map((srv) => {
              const cover = packageImages[srv.id] || homeHeroBg;
              return (
                <Grid item xs={12} sm={6} key={srv.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: 3.5,
                      overflow: 'hidden',
                      bgcolor: 'rgba(13, 35, 25, 0.95)',
                      border: '1px solid rgba(255, 215, 0, 0.28)',
                      boxShadow: '0 14px 30px rgba(0, 0, 0, 0.45)',
                    }}
                  >
                    <Box>
                      {cover && (
                        <Box
                          component="img"
                          src={cover}
                          alt={srv.title}
                          sx={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      )}
                      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={1}
                          mb={1}
                          flexWrap="wrap"
                        >
                          <Chip
                            size="small"
                            label={srv.category || 'Package'}
                            sx={{
                              bgcolor: 'rgba(255, 215, 0, 0.16)',
                              color: '#FFD700',
                              fontWeight: 700,
                            }}
                          />
                          {srv.requires_weekend_block && (
                            <Chip
                              size="small"
                              label="3-Day Weekend (Fri–Sun)"
                              sx={{
                                bgcolor: 'rgba(129, 199, 132, 0.18)',
                                color: '#a5d6a7',
                                fontWeight: 700,
                              }}
                            />
                          )}
                        </Stack>

                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 800, color: '#ffffff', mb: 0.75 }}
                        >
                          {srv.title}
                        </Typography>

                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 900, color: '#FFD700', mb: 1.25 }}
                        >
                          R{Number(srv.base_price || 0).toLocaleString()}
                          {srv.pricing_type === 'day_visit' ? ' / person' : ' / booking'}
                        </Typography>

                        <Typography variant="body2" sx={{ color: '#cbd5e1', lineHeight: 1.6 }}>
                          {srv.description}
                        </Typography>
                      </CardContent>
                    </Box>

                    <Box sx={{ p: { xs: 2, sm: 2.5 }, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleOpenBooking(srv)}
                        sx={{
                          background: 'linear-gradient(135deg, #FFD700 0%, #E6A100 100%)',
                          color: '#081610',
                          fontWeight: 900,
                          py: 1.2,
                          borderRadius: '25px',
                          '&:hover': { background: '#FFD700' },
                        }}
                      >
                        Book {srv.title}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      )}

      {/* ---------------- GALLERY PAGE (PC/PHONE FOLDER STYLE) ---------------- */}
      {currentPage === 'gallery' && (
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 }, px: { xs: 2, sm: 3 }, flexGrow: 1 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
            mb={4}
          >
            {openedFolder || allMediaMode ? (
              <Button
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => {
                  setOpenedFolder(null);
                  setAllMediaMode(false);
                  setMediaTypeFilter('all');
                }}
                sx={{
                  color: '#FFD700',
                  fontWeight: 700,
                  bgcolor: 'rgba(14, 38, 27, 0.85)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '999px',
                  px: 2.5,
                  justifyContent: { xs: 'flex-start', sm: 'center' },
                  '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.15)' },
                }}
              >
                Back to Folders
              </Button>
            ) : (
              <Button
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigateTo('home')}
                sx={{
                  color: '#FFD700',
                  fontWeight: 700,
                  bgcolor: 'rgba(14, 38, 27, 0.85)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '999px',
                  px: 2.5,
                  justifyContent: { xs: 'flex-start', sm: 'center' },
                  '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.15)' },
                }}
              >
                Back to Home
              </Button>
            )}

            <Stack
              direction="row"
              spacing={0.75}
              flexWrap="wrap"
              sx={{
                bgcolor: 'rgba(11, 29, 21, 0.92)',
                p: 0.5,
                borderRadius: '999px',
                border: '1px solid rgba(255, 215, 0, 0.3)',
              }}
            >
              <Button
                size="small"
                startIcon={<PhotoLibraryRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={() => {
                  setOpenedFolder(null);
                  setAllMediaMode(true);
                  setMediaTypeFilter('all');
                }}
                sx={{
                  borderRadius: '999px',
                  px: 2,
                  py: 0.6,
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  bgcolor: allMediaMode && mediaTypeFilter === 'all' ? '#FFD700' : 'transparent',
                  color: allMediaMode && mediaTypeFilter === 'all' ? '#081610' : '#ffffff',
                  '&:hover': {
                    bgcolor:
                      allMediaMode && mediaTypeFilter === 'all'
                        ? '#FFD700'
                        : 'rgba(255, 255, 255, 0.12)',
                  },
                }}
              >
                All Media ({galleryItems.length})
              </Button>

              <Button
                size="small"
                startIcon={<ImageRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={() => {
                  if (!openedFolder) setAllMediaMode(true);
                  setMediaTypeFilter((prev) => (prev === 'image' ? 'all' : 'image'));
                }}
                sx={{
                  borderRadius: '999px',
                  px: 2,
                  py: 0.6,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  bgcolor: mediaTypeFilter === 'image' ? '#FFD700' : 'transparent',
                  color: mediaTypeFilter === 'image' ? '#081610' : '#ffffff',
                  '&:hover': {
                    bgcolor:
                      mediaTypeFilter === 'image' ? '#FFD700' : 'rgba(255, 255, 255, 0.12)',
                  },
                }}
              >
                Photos
              </Button>

              <Button
                size="small"
                startIcon={<VideocamRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={() => {
                  if (!openedFolder) setAllMediaMode(true);
                  setMediaTypeFilter((prev) => (prev === 'video' ? 'all' : 'video'));
                }}
                sx={{
                  borderRadius: '999px',
                  px: 2,
                  py: 0.6,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  bgcolor: mediaTypeFilter === 'video' ? '#FFD700' : 'transparent',
                  color: mediaTypeFilter === 'video' ? '#081610' : '#ffffff',
                  '&:hover': {
                    bgcolor:
                      mediaTypeFilter === 'video' ? '#FFD700' : 'rgba(255, 255, 255, 0.12)',
                  },
                }}
              >
                Videos
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              p: { xs: 2.5, md: 4 },
              mb: 4.5,
              borderRadius: 4,
              background:
                'linear-gradient(135deg, rgba(16, 46, 33, 0.94) 0%, rgba(8, 22, 16, 0.96) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.35)',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'center' }}
              spacing={2.5}
            >
              <Box>
                <Chip
                  icon={<FolderOpenRoundedIcon sx={{ color: '#081610 !important', fontSize: 16 }} />}
                  label={
                    openedFolder
                      ? `FOLDER • ${openedFolder.toUpperCase()}`
                      : allMediaMode
                      ? 'ALL RESORT MEDIA'
                      : 'RESORT FOLDERS'
                  }
                  size="small"
                  sx={{
                    bgcolor: '#FFD700',
                    color: '#081610',
                    fontWeight: 900,
                    mb: 1.25,
                  }}
                />
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: 900,
                    fontSize: { xs: '1.85rem', sm: '2.5rem', md: '2.85rem' },
                    color: '#ffffff',
                    lineHeight: 1.15,
                  }}
                >
                  {openedFolder
                    ? openedFolder
                    : allMediaMode
                    ? 'All Photos & Videos'
                    : 'Photos & Video Folders'}
                </Typography>
                <Typography variant="body1" sx={{ color: '#cbd5e1', mt: 0.75, maxWidth: 620 }}>
                  {openedFolder
                    ? `Viewing photos and videos inside ${openedFolder}. Click any item to open full preview.`
                    : allMediaMode
                    ? 'Every photo and video uploaded across all Ezimpandeni Resort folders.'
                    : 'Open a folder below to view the photos and videos inside.'}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={() => handleBookFromCategory(openedFolder || 'Day Visit')}
                sx={{
                  width: { xs: '100%', md: 'auto' },
                  background: 'linear-gradient(135deg, #FFD700 0%, #E6A100 100%)',
                  color: '#081610',
                  fontWeight: 800,
                  borderRadius: '999px',
                  px: 3,
                  py: 1.15,
                  fontSize: '0.88rem',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)',
                  '&:hover': { background: '#FFD700', transform: 'translateY(-2px)' },
                }}
              >
                Book This Experience
              </Button>
            </Stack>
          </Box>

          {!openedFolder && !allMediaMode && (
            <Grid container spacing={3}>
              {foldersWithMedia.map((folder) => (
                <Grid item xs={12} sm={6} md={3} key={folder.name}>
                  <Card
                    onClick={() => {
                      setOpenedFolder(folder.name);
                      setMediaTypeFilter('all');
                    }}
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3.5,
                      overflow: 'hidden',
                      bgcolor: 'rgba(13, 35, 25, 0.95)',
                      border: '1.5px solid rgba(255, 215, 0, 0.28)',
                      boxShadow: '0 14px 30px rgba(0, 0, 0, 0.45)',
                      transition:
                        'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        borderColor: '#FFD700',
                        boxShadow: '0 22px 42px rgba(0, 0, 0, 0.65)',
                        '& .folder-cover-img': { transform: 'scale(1.05)' },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16 / 10',
                        bgcolor: '#06130d',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        component="img"
                        src={folder.thumbUrl}
                        alt={`${folder.name} folder cover`}
                        className="folder-cover-img"
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.35s ease',
                        }}
                      />

                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          px: 1.25,
                          py: 0.4,
                          borderRadius: '8px 12px 8px 8px',
                          bgcolor: 'rgba(8, 22, 16, 0.88)',
                          border: '1px solid rgba(255, 215, 0, 0.55)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.6,
                        }}
                      >
                        <FolderOpenRoundedIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                        <Typography
                          variant="caption"
                          sx={{ color: '#FFD700', fontWeight: 800, fontSize: '0.72rem' }}
                        >
                          {folder.count} {folder.count === 1 ? 'item' : 'items'}
                        </Typography>
                      </Box>
                    </Box>

                    <CardContent sx={{ p: 2.25, flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          fontSize: '1.08rem',
                          color: '#ffffff',
                          mb: 0.5,
                          lineHeight: 1.25,
                        }}
                      >
                        {folder.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#cbd5e1', fontSize: '0.84rem', lineHeight: 1.45 }}
                      >
                        {folder.tagline}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {(openedFolder || allMediaMode) && (
            <>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
                flexWrap="wrap"
                gap={1}
              >
                <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 700 }}>
                  {activeMediaList.length} {activeMediaList.length === 1 ? 'file' : 'files'} inside{' '}
                  {openedFolder || 'All Media'}
                </Typography>

                {!openedFolder && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {GALLERY_FOLDERS.map((f) => (
                      <Chip
                        key={f.name}
                        label={f.name}
                        clickable
                        onClick={() => {
                          setAllMediaMode(false);
                          setOpenedFolder(f.name);
                          setMediaTypeFilter('all');
                        }}
                        sx={{
                          bgcolor: 'rgba(13, 35, 25, 0.9)',
                          color: '#ffffff',
                          border: '1px solid rgba(255, 215, 0, 0.35)',
                          fontWeight: 700,
                          '&:hover': { bgcolor: '#FFD700', color: '#081610' },
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>

              {activeMediaList.length === 0 ? (
                <Box
                  sx={{
                    p: { xs: 4, sm: 6 },
                    textAlign: 'center',
                    borderRadius: 4,
                    bgcolor: 'rgba(13, 35, 25, 0.85)',
                    border: '1px dashed rgba(255, 215, 0, 0.4)',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', mb: 1 }}>
                    No media found in this folder
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2.5 }}>
                    Staff can upload photos and videos to this folder from the Staff Portal.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => setMediaTypeFilter('all')}
                    sx={{
                      borderColor: '#FFD700',
                      color: '#FFD700',
                      fontWeight: 800,
                      borderRadius: '999px',
                      px: 3,
                    }}
                  >
                    Show All in Folder
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {activeMediaList.map((item, idx) => renderMediaCard(item, idx))}
                </Grid>
              )}
            </>
          )}

          <Dialog
            open={Boolean(activeLightboxItem)}
            onClose={() => setLightboxIndex(null)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                bgcolor: '#081610',
                color: '#ffffff',
                borderRadius: { xs: 2, sm: 4 },
                border: '1px solid rgba(255, 215, 0, 0.4)',
                overflow: 'hidden',
              },
            }}
          >
            {activeLightboxItem && (
              <DialogContent sx={{ p: 0, position: 'relative' }}>
                <IconButton
                  onClick={() => setLightboxIndex(null)}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 3,
                    bgcolor: 'rgba(0, 0, 0, 0.65)',
                    color: '#ffffff',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.85)' },
                  }}
                >
                  <CloseRoundedIcon />
                </IconButton>

                {activeMediaList.length > 1 && (
                  <>
                    <IconButton
                      onClick={() =>
                        setLightboxIndex(
                          (prev) => (prev - 1 + activeMediaList.length) % activeMediaList.length
                        )
                      }
                      sx={{
                        position: 'absolute',
                        top: '44%',
                        left: 12,
                        zIndex: 3,
                        bgcolor: 'rgba(0, 0, 0, 0.65)',
                        color: '#ffffff',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.85)' },
                      }}
                    >
                      <ArrowBackIosNewRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        setLightboxIndex((prev) => (prev + 1) % activeMediaList.length)
                      }
                      sx={{
                        position: 'absolute',
                        top: '44%',
                        right: 12,
                        zIndex: 3,
                        bgcolor: 'rgba(0, 0, 0, 0.65)',
                        color: '#ffffff',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.85)' },
                      }}
                    >
                      <ArrowForwardIosRoundedIcon fontSize="small" />
                    </IconButton>
                  </>
                )}

                <Box
                  sx={{
                    bgcolor: '#040c08',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxHeight: '70vh',
                  }}
                >
                  {isVideoMedia(activeLightboxItem) ? (
                    <Box
                      component="video"
                      src={activeLightboxItem.url}
                      controls
                      autoPlay
                      playsInline
                      sx={{ maxWidth: '100%', maxHeight: '70vh' }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={activeLightboxItem.url}
                      alt={activeLightboxItem.title || 'Resort media'}
                      sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                    />
                  )}
                </Box>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  spacing={2}
                  sx={{ p: 2.5, bgcolor: '#0e261b' }}
                >
                  <Box>
                    <Chip
                      size="small"
                      label={activeLightboxItem.category}
                      sx={{ bgcolor: '#FFD700', color: '#081610', fontWeight: 800, mb: 0.75 }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
                      {activeLightboxItem.title || 'Resort Highlight'}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleBookFromCategory(activeLightboxItem.category)}
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      bgcolor: '#FFD700',
                      color: '#081610',
                      fontWeight: 800,
                      borderRadius: '999px',
                      px: 2.5,
                      '&:hover': { bgcolor: '#ffca28' },
                    }}
                  >
                    Book This Package
                  </Button>
                </Stack>
              </DialogContent>
            )}
          </Dialog>
        </Container>
      )}

      {/* ---------------- MODALS ---------------- */}
      <BookingModal
        open={openBooking}
        onClose={() => setOpenBooking(false)}
        service={selectedService}
        onBookingSuccess={(msg) => {
          setNotificationSeverity('success');
          setNotification(msg || 'Reservation confirmed.');
          fetchServices();
        }}
      />

      <ContactModal
        open={openContact}
        onClose={() => setOpenContact(false)}
        onSuccess={(msg) => {
          setNotificationSeverity('success');
          setNotification(msg || 'Message sent to resort team.');
        }}
      />

      <InclusionsModal
        open={openInclusions}
        onClose={() => setOpenInclusions(false)}
        services={services}
        onSelectService={(srv) => {
          setOpenInclusions(false);
          handleOpenBooking(srv);
        }}
      />

      <AdminModal
        open={openAdmin}
        onClose={() => setOpenAdmin(false)}
        onDataUpdated={() => {
          fetchServices();
          fetchGallery();
        }}
        galleryItems={galleryItems}
        onUploadGalleryItem={handleUploadGalleryItem}
        onDeleteGalleryItem={handleDeleteGalleryItem}
      />

      <Footer
        onNavigate={navigateTo}
        onOpenContact={() => setOpenContact(true)}
        onOpenInclusions={() => setOpenInclusions(true)}
        onOpenAdmin={() => setOpenAdmin(true)}
      />

      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={4500}
        onClose={() => setNotification('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification('')}
          severity={notificationSeverity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 600 }}
        >
          {notification}
        </Alert>
      </Snackbar>
    </Box>
  );
}
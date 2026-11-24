import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardContent,
  InputAdornment,
  Divider,
  Tooltip,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import VideocamIcon from '@mui/icons-material/Videocam';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PaymentsIcon from '@mui/icons-material/Payments';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import apiClient from '../api/client';

const GALLERY_FOLDERS = [
  'Day Visit',
  'Photoshoots',
  'Weddings & Functions',
  'Events & Festivals',
];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const THEME = {
  navy: '#081d28',
  navyLight: '#102d3d',
  forest: '#0c241b',
  forestCard: '#123327',
  gold: '#f5b800',
  goldHover: '#ffca28',
  teal: '#0d9488',
  tealHover: '#0f766e',
  surface: '#f1f5f9',
  card: '#ffffff',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
};

const statusColorMap = {
  Confirmed: { bg: '#dcfce7', color: '#166534' },
  Pending: { bg: '#fef3c7', color: '#92400e' },
  Completed: { bg: '#dbeafe', color: '#1e40af' },
  Cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

const formatZAR = (val) =>
  `R${Number(val || 0).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const extractArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    for (const key of keys) {
      if (Array.isArray(payload[key])) return payload[key];
    }
  }
  return [];
};

export default function AdminModal({
  open,
  onClose,
  onDataUpdated,
  galleryItems = [],
  onUploadGalleryItem,
  onDeleteGalleryItem,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loggedInStaff, setLoggedInStaff] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [otpStage, setOtpStage] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);

  const [tab, setTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);
  const [services, setServices] = useState([]);
  const [messages, setMessages] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [statusNotice, setStatusNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPasscode, setNewStaffPasscode] = useState('');
  const [editingStaffKey, setEditingStaffKey] = useState(null);
  const [editingStaffEmail, setEditingStaffEmail] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Day Visit');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWeekendBlock, setNewWeekendBlock] = useState(false);

  const [staffGuestName, setStaffGuestName] = useState('');
  const [staffGuestEmail, setStaffGuestEmail] = useState('');
  const [staffGuestPhone, setStaffGuestPhone] = useState('');
  const [staffServiceId, setStaffServiceId] = useState('day-visit');
  const [staffDate, setStaffDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [staffGuests, setStaffGuests] = useState(1);
  const [staffNotes, setStaffNotes] = useState('Walk-in / Staff Portal Booking');

  const [galleryFolder, setGalleryFolder] = useState('Day Visit');
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryFilterFolder, setGalleryFilterFolder] = useState('All');
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  const loadAdminData = async (tokenOverride) => {
    const activeToken = tokenOverride || authToken;
    if (!activeToken) return;
    setErrorNotice('');
    setLoadingData(true);
    const headers = { Authorization: `Bearer ${activeToken}` };

    try {
      let nextBookings = [];
      let nextBookedDates = [];
      let nextServices = [];
      let nextMessages = [];
      let nextStaff = [];

      try {
        const dashRes = await apiClient.get('/portal/dashboard', { headers });
        const dashData = dashRes?.data || {};
        nextBookings = extractArray(dashData, ['bookings', 'reservations']);
        nextBookedDates = extractArray(dashData, ['booked_dates', 'blocked_dates']);
        nextServices = extractArray(dashData, ['services', 'packages']);
        nextMessages = extractArray(dashData, ['messages', 'enquiries']);
        nextStaff = extractArray(dashData, ['staff']);
      } catch (dashErr) {
        if (dashErr?.response?.status === 401) throw dashErr;

        const [bookingsRes, datesRes, servicesRes, messagesRes, staffRes] =
          await Promise.allSettled([
            apiClient.get('/admin/bookings', { headers }),
            apiClient.get('/booked-dates', { headers }),
            apiClient.get('/services', { headers }),
            apiClient.get('/admin/contact', { headers }),
            apiClient.get('/admin/staff', { headers }),
          ]);

        for (const res of [bookingsRes, datesRes, servicesRes, messagesRes, staffRes]) {
          if (res.status === 'rejected' && res.reason?.response?.status === 401) {
            throw res.reason;
          }
        }

        if (bookingsRes.status === 'fulfilled') {
          nextBookings = extractArray(bookingsRes.value?.data, ['bookings', 'reservations']);
        }
        if (datesRes.status === 'fulfilled') {
          nextBookedDates = extractArray(datesRes.value?.data, ['booked_dates', 'blocked_dates']);
        }
        if (servicesRes.status === 'fulfilled') {
          nextServices = extractArray(servicesRes.value?.data, ['services', 'packages']);
        }
        if (messagesRes.status === 'fulfilled') {
          nextMessages = extractArray(messagesRes.value?.data, ['messages', 'enquiries']);
        }
        if (staffRes.status === 'fulfilled') {
          nextStaff = extractArray(staffRes.value?.data, ['staff']);
        }
      }

      setBookings(nextBookings);
      setBookedDates(nextBookedDates);
      setServices(nextServices);
      setMessages(nextMessages);
      setStaffList(nextStaff);
      if (nextServices.length > 0 && !nextServices.some((s) => s.id === staffServiceId)) {
        setStaffServiceId(nextServices[0].id);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setLoggedInStaff(null);
        setAuthToken('');
        setOtpStage(false);
        setChallengeId('');
        setOtpInput('');
        setLoginError('Your session expired. Please sign in again.');
      } else {
        setErrorNotice(
          err?.response?.data?.detail ||
            'Could not load Staff Portal data. Ensure the backend server is running.'
        );
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (open && loggedInStaff && authToken) {
      loadAdminData(authToken);
    }
  }, [open, loggedInStaff, authToken]);

  const requestOtpForPasscode = async (cleanedPasscode) => {
    setLoginError('');
    setOtpNotice('');
    setDevOtpHint('');
    setSubmittingAuth(true);
    try {
      const res = await apiClient.post('/staff/login/request-otp', {
        passcode: cleanedPasscode,
        channel: 'email',
      });
      const data = res.data || {};
      setChallengeId(data.challenge_id || '');
      setOtpStage(true);
      setOtpInput('');
      setOtpNotice(
        data.message || `OTP sent to ${data.masked_destination || 'your registered email'}.`
      );
      if (data.dev_otp_hint) {
        setDevOtpHint(data.dev_otp_hint);
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setLoginError(
        typeof detail === 'string'
          ? detail
          : err?.response?.statusText || 'Could not send OTP. Check passcode or server status.'
      );
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const cleaned = passcodeInput.trim();
    if (!/^\d{6}$/.test(cleaned)) {
      setLoginError('Please enter a valid 6-digit staff passcode.');
      return;
    }
    await requestOtpForPasscode(cleaned);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoginError('');

    const cleanedOtp = otpInput.trim();
    if (!/^\d{6}$/.test(cleanedOtp)) {
      setLoginError('Please enter the 6-digit OTP code.');
      return;
    }
    if (!challengeId) {
      setLoginError('OTP session missing. Please enter your passcode again.');
      setOtpStage(false);
      return;
    }

    setSubmittingAuth(true);
    try {
      const res = await apiClient.post('/staff/login/verify-otp', {
        challenge_id: challengeId,
        otp: cleanedOtp,
      });
      const data = res.data || {};
      const nextToken = data.token || '';
      const nextStaff = data.staff || { full_name: 'Staff Member' };
      setAuthToken(nextToken);
      setLoggedInStaff(nextStaff);
      setPasscodeInput('');
      setOtpInput('');
      setChallengeId('');
      setOtpStage(false);
      setOtpNotice('');
      setDevOtpHint('');
      setStatusNotice(`Signed in as ${nextStaff.full_name || 'Staff Member'}.`);
      await loadAdminData(nextToken);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setLoginError(
        typeof detail === 'string'
          ? detail
          : err?.response?.statusText || 'Invalid or expired OTP.'
      );
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleBackToPasscode = () => {
    setOtpStage(false);
    setChallengeId('');
    setOtpInput('');
    setOtpNotice('');
    setDevOtpHint('');
    setLoginError('');
  };

  const handleLogout = () => {
    setLoggedInStaff(null);
    setAuthToken('');
    setPasscodeInput('');
    setShowPasscode(false);
    setOtpStage(false);
    setChallengeId('');
    setOtpInput('');
    setOtpNotice('');
    setDevOtpHint('');
    setLoginError('');
    setStatusNotice('');
    setErrorNotice('');
    setEditingStaffKey(null);
    setEditingStaffEmail('');
    setTab(0);
  };

  const handleAddStaffMember = async (e) => {
    e.preventDefault();
    setErrorNotice('');
    if (!newStaffName.trim() || !/^\d{6}$/.test(newStaffPasscode.trim())) {
      setErrorNotice('Enter full name & surname and a 6-digit numeric passcode.');
      return;
    }
    const cleanEmail = newStaffEmail.trim().toLowerCase();
    try {
      await apiClient.post(
        '/staff',
        {
          full_name: newStaffName.trim(),
          email: cleanEmail || null,
          contact_details: cleanEmail || '',
          passcode: newStaffPasscode.trim(),
        },
        { headers: authHeaders }
      );
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPasscode('');
      setStatusNotice('Staff member added. You can add or update their email anytime.');
      await loadAdminData();
    } catch (err) {
      setErrorNotice(err?.response?.data?.detail || 'Could not add staff member.');
    }
  };

  const handleSaveStaffEmail = async (staffMember) => {
    setErrorNotice('');
    const identifier = staffMember.id ?? staffMember.passcode;
    const cleanEmail = editingStaffEmail.trim().toLowerCase();
    try {
      await apiClient.patch(
        `/staff/${identifier}`,
        {
          email: cleanEmail || null,
          contact_details: cleanEmail || '',
        },
        { headers: authHeaders }
      );
      setEditingStaffKey(null);
      setEditingStaffEmail('');
      setStatusNotice(`Updated email for ${staffMember.full_name || staffMember.passcode}.`);
      await loadAdminData();
    } catch (err) {
      setErrorNotice(err?.response?.data?.detail || 'Could not update staff email.');
    }
  };

  const handleDeleteStaffMember = async (staffMember) => {
    setErrorNotice('');
    const identifier = staffMember.id ?? staffMember.passcode;
    try {
      await apiClient.delete(`/staff/${identifier}`, { headers: authHeaders });
      setStatusNotice('Staff member removed.');
      await loadAdminData();
    } catch (err) {
      setErrorNotice(err?.response?.data?.detail || 'Could not remove staff member.');
    }
  };

  const handleStatusChange = async (bookingId, nextStatus) => {
    try {
      await apiClient.patch(
        `/bookings/${bookingId}/status`,
        { status: nextStatus },
        { headers: authHeaders }
      );
      setStatusNotice(`Booking #EZP-${bookingId} marked as ${nextStatus}.`);
      await loadAdminData();
      if (onDataUpdated) onDataUpdated();
    } catch {
      setErrorNotice('Failed to update booking status.');
    }
  };

  const handleResendReceipt = async (bookingId) => {
    setErrorNotice('');
    try {
      const res = await apiClient.post(
        `/bookings/${bookingId}/email-receipt`,
        {},
        { headers: authHeaders }
      );
      setStatusNotice(
        res?.data?.email_receipt_status?.detail ||
          res?.data?.email_notification?.detail ||
          `Receipt dispatched for #EZP-${bookingId}.`
      );
    } catch (err) {
      setErrorNotice(err?.response?.data?.detail || 'Could not send email receipt.');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      await apiClient.delete(`/bookings/${bookingId}`, { headers: authHeaders });
      setStatusNotice(`Booking #EZP-${bookingId} removed and blocked dates updated.`);
      await loadAdminData();
      if (onDataUpdated) onDataUpdated();
    } catch {
      setErrorNotice('Failed to delete booking.');
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) {
      setErrorNotice('Please enter a package title and price.');
      return;
    }
    try {
      await apiClient.post(
        '/services',
        {
          title: newTitle.trim(),
          category: newCategory.trim() || 'Package',
          description: newDesc.trim() || `${newTitle.trim()} package at Ezimpandeni Resort.`,
          base_price: Number(newPrice),
          pricing_type: newWeekendBlock ? 'event' : 'flat',
          requires_weekend_block: Boolean(newWeekendBlock),
        },
        { headers: authHeaders }
      );
      setNewTitle('');
      setNewPrice('');
      setNewDesc('');
      setNewWeekendBlock(false);
      setStatusNotice('Package added to resort offerings.');
      await loadAdminData();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setErrorNotice(err?.response?.data?.detail || 'Could not add package.');
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await apiClient.delete(`/services/${serviceId}`, { headers: authHeaders });
      setStatusNotice('Package removed.');
      await loadAdminData();
      if (onDataUpdated) onDataUpdated();
    } catch {
      setErrorNotice('Could not delete package.');
    }
  };

  const handleStaffCreateBooking = async (e) => {
    e.preventDefault();
    if (
      !staffGuestName.trim() ||
      !staffGuestEmail.trim() ||
      !staffGuestPhone.trim() ||
      !staffDate
    ) {
      setErrorNotice('Please fill in guest name, email, phone, and date.');
      return;
    }
    const svc = services.find((s) => s.id === staffServiceId) || services[0];
    const price =
      svc?.pricing_type === 'day_visit'
        ? Number(svc.base_price || 100) * Math.max(1, Number(staffGuests || 1))
        : Number(svc?.base_price || 0);

    try {
      await apiClient.post('/bookings', {
        full_name: staffGuestName.trim(),
        email: staffGuestEmail.trim(),
        phone: staffGuestPhone.trim(),
        service_id: svc?.id || staffServiceId,
        booking_date: staffDate,
        total_price: price,
        guest_count: Math.max(1, Number(staffGuests || 1)),
        notes: staffNotes.trim(),
        recorded_by: loggedInStaff?.full_name || 'Staff Portal',
      });
      setStaffGuestName('');
      setStaffGuestEmail('');
      setStaffGuestPhone('');
      setStatusNotice(`Reservation saved for ${loggedInStaff?.full_name}.`);
      await loadAdminData();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setErrorNotice(err?.response?.data?.detail || 'Could not create booking.');
    }
  };

  const handleGalleryFilePick = (e) => {
    const file = e.target.files?.[0] || null;
    setErrorNotice('');
    if (!file) {
      setGalleryFile(null);
      return;
    }
    const isVid =
      file.type?.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name || '');
    const maxBytes = isVid ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      setErrorNotice(
        isVid ? 'Video exceeds the 50 MB limit.' : 'Image exceeds the 10 MB limit.'
      );
      setGalleryFile(null);
      return;
    }
    setGalleryFile(file);
    if (!galleryTitle.trim()) {
      setGalleryTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleGalleryUploadSubmit = async (e) => {
    e.preventDefault();
    setErrorNotice('');
    if (!galleryFile) {
      setErrorNotice('Please select a photo or video file to upload.');
      return;
    }
    setUploadingGallery(true);
    try {
      if (onUploadGalleryItem) {
        await onUploadGalleryItem({
          category: galleryFolder,
          title: galleryTitle.trim() || galleryFile.name.replace(/\.[^.]+$/, ''),
          file: galleryFile,
          headers: authHeaders,
        });
      }
      setGalleryTitle('');
      setGalleryFile(null);
      setStatusNotice(`Uploaded media to "${galleryFolder}".`);
      await loadAdminData();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setErrorNotice(err?.response?.data?.detail || 'Could not upload photo or video.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleGalleryDeleteSubmit = async (item) => {
    setErrorNotice('');
    try {
      if (onDeleteGalleryItem) {
        await onDeleteGalleryItem(item, authHeaders);
      }
      setStatusNotice(`Deleted "${item.title}" from ${item.category}.`);
      await loadAdminData();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setErrorNotice(err?.response?.data?.detail || 'Could not delete gallery item.');
    }
  };

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesStatus =
        bookingStatusFilter === 'All' ||
        String(b.status || 'Confirmed').toLowerCase() ===
          bookingStatusFilter.toLowerCase();
      if (!matchesStatus) return false;
      if (!q) return true;
      const haystack = `${b.booking_id} ${b.full_name} ${b.email} ${b.phone} ${
        b.service_title || b.service_id
      }`.toLowerCase();
      return haystack.includes(q);
    });
  }, [bookings, bookingSearch, bookingStatusFilter]);

  const totalConfirmedRevenue = useMemo(
    () =>
      bookings
        .filter((b) => String(b.status || 'Confirmed').toLowerCase() !== 'cancelled')
        .reduce((sum, b) => sum + Number(b.total_price || 0), 0),
    [bookings]
  );

  const filteredGalleryItems =
    galleryFilterFolder === 'All'
      ? galleryItems
      : galleryItems.filter((item) => item.category === galleryFilterFolder);

  if (!loggedInStaff) {
    const canSubmit = otpStage ? otpInput.length === 6 : passcodeInput.length === 6;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            overflow: 'hidden',
            bgcolor: THEME.forest,
            border: isMobile ? 'none' : `1px solid ${THEME.navyLight}`,
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: THEME.navy,
            color: THEME.gold,
            px: { xs: 2, sm: 3 },
            py: 2.2,
            borderBottom: `1px solid ${THEME.navyLight}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: 'rgba(245, 184, 0, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {otpStage ? (
                  <VerifiedUserIcon sx={{ color: THEME.gold }} />
                ) : (
                  <LockIcon sx={{ color: THEME.gold }} />
                )}
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, lineHeight: 1.2, color: '#fff' }}
                >
                  {otpStage ? 'Verify One-Time OTP' : 'Staff Portal Login'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Ezimpandeni Resort • Step {otpStage ? '2 of 2' : '1 of 2'}
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: '#94a3b8', '&:hover': { color: '#fff' } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <form onSubmit={otpStage ? handleVerifyOtp : handleRequestOtp}>
          <DialogContent
            sx={{ px: { xs: 2, sm: 3 }, py: 3, bgcolor: THEME.forest, color: '#f8fafc' }}
          >
            {!otpStage ? (
              <>
                <Typography
                  variant="body2"
                  sx={{ color: '#cbd5e1', mb: 2.5, lineHeight: 1.55 }}
                >
                  Enter your <strong>6-digit staff passcode</strong>. We will send a
                  one-time verification code to your registered email address.
                </Typography>

                {loginError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {loginError}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  autoFocus
                  required
                  type={showPasscode ? 'text' : 'password'}
                  label="6-Digit Staff Passcode"
                  placeholder="Enter 6 digits"
                  value={passcodeInput}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPasscodeInput(digitsOnly);
                  }}
                  InputLabelProps={{
                    shrink: true,
                    sx: { color: '#cbd5e1', '&.Mui-focused': { color: THEME.gold } },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasscode((prev) => !prev)}
                          edge="end"
                          size="small"
                          sx={{ color: '#94a3b8', '&:hover': { color: THEME.gold } }}
                          aria-label="Toggle passcode visibility"
                        >
                          {showPasscode ? (
                            <VisibilityOffIcon fontSize="small" />
                          ) : (
                            <VisibilityIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    maxLength: 6,
                    inputMode: 'numeric',
                    style: {
                      letterSpacing: showPasscode ? '0.35em' : '0.45em',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      textAlign: 'center',
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: THEME.forestCard,
                      borderRadius: 2,
                      '& fieldset': { borderColor: '#295243' },
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    },
                  }}
                />
              </>
            ) : (
              <>
                {otpNotice && (
                  <Alert
                    severity="info"
                    icon={<EmailIcon fontSize="small" />}
                    sx={{ mb: 2, borderRadius: 2 }}
                  >
                    {otpNotice}
                  </Alert>
                )}

                {devOtpHint && (
                  <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    SMTP inactive — Dev OTP: <strong>{devOtpHint}</strong>
                  </Alert>
                )}

                {loginError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {loginError}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  autoFocus
                  required
                  label="6-Digit Verification OTP"
                  placeholder="000000"
                  value={otpInput}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpInput(digitsOnly);
                  }}
                  InputLabelProps={{
                    shrink: true,
                    sx: { color: '#cbd5e1', '&.Mui-focused': { color: THEME.gold } },
                  }}
                  inputProps={{
                    maxLength: 6,
                    inputMode: 'numeric',
                    style: {
                      letterSpacing: '0.45em',
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      color: THEME.gold,
                      textAlign: 'center',
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: THEME.forestCard,
                      borderRadius: 2,
                      '& fieldset': { borderColor: '#295243' },
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    },
                  }}
                />

                <Box display="flex" justifyContent="flex-end" mt={1}>
                  <Button
                    type="button"
                    size="small"
                    disabled={submittingAuth}
                    onClick={() => requestOtpForPasscode(passcodeInput.trim())}
                    sx={{ color: THEME.gold, textTransform: 'none', fontWeight: 600 }}
                  >
                    Resend OTP Code
                  </Button>
                </Box>
              </>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              bgcolor: THEME.navy,
              px: { xs: 2, sm: 3 },
              py: 2,
              borderTop: `1px solid ${THEME.navyLight}`,
              justifyContent: 'space-between',
            }}
          >
            <Button
              type="button"
              onClick={otpStage ? handleBackToPasscode : onClose}
              sx={{
                color: '#cbd5e1',
                fontWeight: 600,
                px: 2,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#fff' },
              }}
            >
              {otpStage ? 'Change Passcode' : 'Cancel'}
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={submittingAuth || !canSubmit}
              sx={{
                bgcolor: THEME.gold,
                color: THEME.navy,
                fontWeight: 800,
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': { bgcolor: THEME.goldHover, boxShadow: 'none' },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(245, 184, 0, 0.22)',
                  color: 'rgba(255, 255, 255, 0.45)',
                },
              }}
            >
              {submittingAuth
                ? otpStage
                  ? 'Verifying...'
                  : 'Sending OTP...'
                : otpStage
                ? 'Verify & Sign In'
                : 'Send OTP'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden',
          bgcolor: THEME.surface,
          minHeight: isMobile ? '100%' : '78vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: THEME.navy,
          color: '#ffffff',
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: `1px solid ${THEME.navyLight}`,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
              Ezimpandeni Resort
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
              Staff Operations Portal
            </Typography>
            <Chip
              icon={<PersonIcon sx={{ color: `${THEME.navy} !important`, fontSize: 18 }} />}
              label={loggedInStaff.full_name}
              size="small"
              sx={{
                bgcolor: THEME.gold,
                color: THEME.navy,
                fontWeight: 800,
                px: 0.5,
              }}
            />
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}
          >
            <Tooltip title="Refresh all portal data">
              <IconButton
                onClick={() => loadAdminData()}
                disabled={loadingData}
                size="small"
                sx={{
                  color: THEME.gold,
                  bgcolor: 'rgba(245, 184, 0, 0.1)',
                  '&:hover': { bgcolor: 'rgba(245, 184, 0, 0.2)' },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              startIcon={<LogoutIcon fontSize="small" />}
              onClick={handleLogout}
              sx={{
                borderColor: 'rgba(245, 184, 0, 0.5)',
                color: THEME.gold,
                fontWeight: 700,
                borderRadius: 1.5,
                '&:hover': {
                  borderColor: THEME.gold,
                  bgcolor: 'rgba(245, 184, 0, 0.1)',
                },
              }}
            >
              Logout
            </Button>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 2, md: 2.5 }, bgcolor: THEME.surface }}>
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2.5,
                bgcolor: THEME.card,
                border: `1px solid ${THEME.border}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography
                  variant="caption"
                  sx={{
                    color: THEME.textSecondary,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Reservations
                </Typography>
                <EventAvailableIcon sx={{ color: THEME.teal, fontSize: 20 }} />
              </Stack>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                sx={{ fontWeight: 800, color: THEME.textPrimary, mt: 0.5 }}
              >
                {bookings.length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2.5,
                bgcolor: THEME.card,
                border: `1px solid ${THEME.border}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography
                  variant="caption"
                  sx={{
                    color: THEME.textSecondary,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Active Revenue
                </Typography>
                <PaymentsIcon sx={{ color: THEME.gold, fontSize: 20 }} />
              </Stack>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                sx={{ fontWeight: 800, color: THEME.textPrimary, mt: 0.5 }}
              >
                {formatZAR(totalConfirmedRevenue)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2.5,
                bgcolor: THEME.card,
                border: `1px solid ${THEME.border}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography
                  variant="caption"
                  sx={{
                    color: THEME.textSecondary,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Blocked Dates
                </Typography>
                <CloseIcon sx={{ color: '#dc2626', fontSize: 20 }} />
              </Stack>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                sx={{ fontWeight: 800, color: THEME.textPrimary, mt: 0.5 }}
              >
                {bookedDates.length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2.5,
                bgcolor: THEME.card,
                border: `1px solid ${THEME.border}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography
                  variant="caption"
                  sx={{
                    color: THEME.textSecondary,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Enquiries
                </Typography>
                <MarkEmailReadIcon sx={{ color: THEME.navyLight, fontSize: 20 }} />
              </Stack>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                sx={{ fontWeight: 800, color: THEME.textPrimary, mt: 0.5 }}
              >
                {messages.length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {statusNotice && (
          <Alert
            severity="success"
            onClose={() => setStatusNotice('')}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            {statusNotice}
          </Alert>
        )}
        {errorNotice && (
          <Alert
            severity="error"
            onClose={() => setErrorNotice('')}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            {errorNotice}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            bgcolor: THEME.card,
            border: `1px solid ${THEME.border}`,
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              px: { xs: 0.5, sm: 1.5 },
              borderBottom: `1px solid ${THEME.border}`,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: { xs: '0.8rem', sm: '0.88rem' },
                minHeight: 48,
                color: THEME.textSecondary,
              },
              '& .Mui-selected': {
                color: `${THEME.navy} !important`,
              },
              '& .MuiTabs-indicator': {
                bgcolor: THEME.teal,
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab label={`Reservations (${bookings.length})`} />
            <Tab label={`Blocked Dates (${bookedDates.length})`} />
            <Tab label={`Packages (${services.length})`} />
            <Tab label={`Enquiries (${messages.length})`} />
            <Tab label={`Staff Members (${staffList.length})`} />
            <Tab label={`Gallery Folders (${galleryItems.length})`} />
          </Tabs>

          <Box sx={{ p: { xs: 1.5, md: 3 } }}>
            {tab === 0 && (
              <>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2.25 },
                    mb: 2.5,
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    border: `1px solid ${THEME.border}`,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                    Record Walk-In / Phone Reservation
                  </Typography>
                  <Box
                    component="form"
                    onSubmit={handleStaffCreateBooking}
                    display="flex"
                    gap={1.5}
                    flexWrap="wrap"
                    alignItems="center"
                  >
                    <TextField
                      size="small"
                      fullWidth={isMobile}
                      label="Guest Full Name *"
                      value={staffGuestName}
                      onChange={(e) => setStaffGuestName(e.target.value)}
                      sx={{ bgcolor: '#fff', minWidth: { sm: 165 } }}
                    />
                    <TextField
                      size="small"
                      fullWidth={isMobile}
                      label="Guest Email *"
                      type="email"
                      value={staffGuestEmail}
                      onChange={(e) => setStaffGuestEmail(e.target.value)}
                      sx={{ bgcolor: '#fff', minWidth: { sm: 185 } }}
                    />
                    <TextField
                      size="small"
                      fullWidth={isMobile}
                      label="Guest Phone *"
                      value={staffGuestPhone}
                      onChange={(e) => setStaffGuestPhone(e.target.value)}
                      sx={{ bgcolor: '#fff', minWidth: { sm: 145 } }}
                    />
                    <TextField
                      select
                      size="small"
                      fullWidth={isMobile}
                      label="Package *"
                      value={staffServiceId}
                      onChange={(e) => setStaffServiceId(e.target.value)}
                      sx={{ bgcolor: '#fff', minWidth: { sm: 180 } }}
                    >
                      {services.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.title} (R{Number(s.base_price || 0).toLocaleString()})
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      fullWidth={isMobile}
                      type="date"
                      label="Reservation Date *"
                      InputLabelProps={{ shrink: true }}
                      value={staffDate}
                      onChange={(e) => setStaffDate(e.target.value)}
                      sx={{ bgcolor: '#fff' }}
                    />
                    <TextField
                      size="small"
                      fullWidth={isMobile}
                      type="number"
                      label="Guests *"
                      inputProps={{ min: 1 }}
                      value={staffGuests}
                      onChange={(e) => setStaffGuests(e.target.value)}
                      sx={{ bgcolor: '#fff', width: { xs: '100%', sm: 95 } }}
                    />
                    <TextField
                      size="small"
                      fullWidth={isMobile}
                      label="Notes"
                      value={staffNotes}
                      onChange={(e) => setStaffNotes(e.target.value)}
                      sx={{ bgcolor: '#fff', minWidth: { sm: 210 } }}
                    />
                    <Button
                      type="submit"
                      fullWidth={isMobile}
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{
                        bgcolor: THEME.teal,
                        fontWeight: 700,
                        '&:hover': { bgcolor: THEME.tealHover },
                      }}
                    >
                      Save Reservation
                    </Button>
                  </Box>
                </Paper>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  sx={{ mb: 2 }}
                >
                  <TextField
                    size="small"
                    fullWidth={isMobile}
                    placeholder="Search guest, email, phone, or #EZP ID"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ minWidth: { sm: 300 }, bgcolor: '#fff' }}
                  />

                  <TextField
                    select
                    size="small"
                    fullWidth={isMobile}
                    label="Status Filter"
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    sx={{ minWidth: { sm: 165 }, bgcolor: '#fff' }}
                  >
                    <MenuItem value="All">All Statuses</MenuItem>
                    <MenuItem value="Confirmed">Confirmed</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </TextField>
                </Stack>

                {isMobile ? (
                  <Stack spacing={1.5}>
                    {filteredBookings.length === 0 ? (
                      <Paper
                        elevation={0}
                        sx={{ p: 3, textAlign: 'center', border: `1px solid ${THEME.border}` }}
                      >
                        No matching reservations found.
                      </Paper>
                    ) : (
                      filteredBookings.map((b) => {
                        const badge = statusColorMap[b.status] || {
                          bg: '#e2e8f0',
                          color: '#1e293b',
                        };
                        return (
                          <Paper
                            key={b.booking_id}
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: `1px solid ${THEME.border}`,
                              bgcolor: '#fff',
                            }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{ mb: 1 }}
                            >
                              <Typography variant="subtitle2" fontWeight={800}>
                                #EZP-{b.booking_id} • {b.full_name}
                              </Typography>
                              <Chip
                                size="small"
                                label={b.status || 'Confirmed'}
                                sx={{
                                  bgcolor: badge.bg,
                                  color: badge.color,
                                  fontWeight: 700,
                                }}
                              />
                            </Stack>

                            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                              {formatZAR(b.total_price)} • {b.service_title || b.service_id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Dates: {(b.blocked_dates || [b.booking_date]).join(', ')} •{' '}
                              {b.guest_count} guests
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {b.email} • {b.phone}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mb: 1.25 }}
                            >
                              Recorded by: {b.recorded_by || 'Online / Guest'}
                            </Typography>

                            <Divider sx={{ mb: 1.25 }} />

                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <TextField
                                select
                                size="small"
                                value={b.status || 'Confirmed'}
                                onChange={(e) =>
                                  handleStatusChange(b.booking_id, e.target.value)
                                }
                                sx={{ flex: 1, bgcolor: '#fff' }}
                              >
                                <MenuItem value="Confirmed">Confirmed</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                              </TextField>

                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleResendReceipt(b.booking_id)}
                              >
                                <EmailIcon fontSize="small" />
                              </IconButton>

                              {b.whatsapp_url && (
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={b.whatsapp_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  sx={{ color: '#16a34a' }}
                                >
                                  <WhatsAppIcon fontSize="small" />
                                </IconButton>
                              )}

                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteBooking(b.booking_id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Paper>
                        );
                      })
                    )}
                  </Stack>
                ) : (
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{ border: `1px solid ${THEME.border}`, borderRadius: 2 }}
                  >
                    <Table size="small">
                      <TableHead sx={{ bgcolor: THEME.navy }}>
                        <TableRow>
                          <TableCell sx={{ color: '#fff', fontWeight: 700 }}>ID</TableCell>
                          <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Guest</TableCell>
                          <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Package</TableCell>
                          <TableCell sx={{ color: '#fff', fontWeight: 700 }}>
                            Blocked Dates
                          </TableCell>
                          <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Amount</TableCell>
                          <TableCell sx={{ color: '#fff', fontWeight: 700 }}>
                            Recorded By
                          </TableCell>
                          <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ color: '#fff', fontWeight: 700 }} align="right">
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredBookings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                              No matching reservations found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredBookings.map((b) => {
                            const badge = statusColorMap[b.status] || {
                              bg: '#e2e8f0',
                              color: '#1e293b',
                            };
                            return (
                              <TableRow key={b.booking_id} hover>
                                <TableCell sx={{ fontWeight: 700 }}>
                                  #EZP-{b.booking_id}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={700}>
                                    {b.full_name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    {b.email}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {b.phone} • {b.guest_count} guests
                                  </Typography>
                                </TableCell>
                                <TableCell>{b.service_title || b.service_id}</TableCell>
                                <TableCell>
                                  {(b.blocked_dates || [b.booking_date]).join(', ')}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>
                                  {formatZAR(b.total_price)}
                                </TableCell>
                                <TableCell>{b.recorded_by || 'Online / Guest'}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={b.status || 'Confirmed'}
                                    sx={{
                                      bgcolor: badge.bg,
                                      color: badge.color,
                                      fontWeight: 700,
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    justifyContent="flex-end"
                                    alignItems="center"
                                  >
                                    <TextField
                                      select
                                      size="small"
                                      value={b.status || 'Confirmed'}
                                      onChange={(e) =>
                                        handleStatusChange(b.booking_id, e.target.value)
                                      }
                                      sx={{ minWidth: 118, bgcolor: '#fff' }}
                                    >
                                      <MenuItem value="Confirmed">Confirmed</MenuItem>
                                      <MenuItem value="Pending">Pending</MenuItem>
                                      <MenuItem value="Completed">Completed</MenuItem>
                                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                                    </TextField>
                                    <Tooltip title="Send / Resend Email Receipt">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleResendReceipt(b.booking_id)}
                                      >
                                        <EmailIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    {b.whatsapp_url && (
                                      <Tooltip title="Share on WhatsApp">
                                        <IconButton
                                          size="small"
                                          component="a"
                                          href={b.whatsapp_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          sx={{ color: '#16a34a' }}
                                        >
                                          <WhatsAppIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    <Tooltip title="Delete Booking">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteBooking(b.booking_id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}

            {tab === 1 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                  Currently Blocked / Reserved Dates
                </Typography>
                {bookedDates.length === 0 ? (
                  <Alert severity="info">No dates are currently blocked.</Alert>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {bookedDates.map((d) => (
                      <Chip
                        key={d}
                        label={d}
                        color="error"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {tab === 2 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                  Add Resort Package
                </Typography>
                <Box
                  component="form"
                  onSubmit={handleCreateService}
                  display="flex"
                  gap={1.5}
                  flexWrap="wrap"
                  alignItems="center"
                  sx={{ mb: 2.5 }}
                >
                  <TextField
                    size="small"
                    fullWidth={isMobile}
                    label="Package Title *"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    sx={{ minWidth: { sm: 200 }, bgcolor: '#fff' }}
                  />
                  <TextField
                    size="small"
                    fullWidth={isMobile}
                    label="Category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    sx={{ minWidth: { sm: 160 }, bgcolor: '#fff' }}
                  />
                  <TextField
                    size="small"
                    fullWidth={isMobile}
                    type="number"
                    label="Base Price (ZAR) *"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 150 }, bgcolor: '#fff' }}
                  />
                  <TextField
                    size="small"
                    fullWidth={isMobile}
                    label="Description"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    sx={{ minWidth: { sm: 240 }, bgcolor: '#fff' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newWeekendBlock}
                        onChange={(e) => setNewWeekendBlock(e.target.checked)}
                      />
                    }
                    label="3-Day Weekend Block"
                  />
                  <Button
                    type="submit"
                    fullWidth={isMobile}
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ bgcolor: THEME.teal, fontWeight: 700 }}
                  >
                    Add Package
                  </Button>
                </Box>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ border: `1px solid ${THEME.border}`, borderRadius: 2 }}
                >
                  <Table size="small">
                    <TableHead sx={{ bgcolor: THEME.navy }}>
                      <TableRow>
                        <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Title</TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Category</TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Base Price</TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 700 }}>
                          Weekend Block
                        </TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 700 }} align="right">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {services.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            No packages configured.
                          </TableCell>
                        </TableRow>
                      ) : (
                        services.map((s) => (
                          <TableRow key={s.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700}>
                                {s.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {s.description}
                              </Typography>
                            </TableCell>
                            <TableCell>{s.category}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                              {formatZAR(s.base_price)}
                            </TableCell>
                            <TableCell>
                              {s.requires_weekend_block ? 'Yes (Fri–Sun)' : 'No'}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteService(s.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {tab === 3 && (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: `1px solid ${THEME.border}`, borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead sx={{ bgcolor: THEME.navy }}>
                    <TableRow>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Sender</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Subject</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {messages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          No enquiries received yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      messages.map((m, idx) => (
                        <TableRow key={m.id || idx} hover>
                          <TableCell>{m.created_at}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {m.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {m.email}
                            </Typography>
                            {m.phone && (
                              <Typography variant="caption" color="text.secondary">
                                {m.phone}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{m.subject || 'General Enquiry'}</TableCell>
                          <TableCell>{m.message}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tab === 4 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                  Add Staff Member
                </Typography>
                <Box
                  component="form"
                  onSubmit={handleAddStaffMember}
                  display="flex"
                  gap={1.5}
                  flexWrap="wrap"
                  alignItems="center"
                  sx={{ mb: 2.5 }}
                >
                  <TextField
                    size="small"
                    fullWidth={isMobile}
                    label="Full Name & Surname *"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    sx={{ minWidth: { sm: 210 }, bgcolor: '#fff' }}
                  />
                  <TextField
                    size="small"
                    fullWidth={isMobile}
                    label="Email Address"
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    sx={{ minWidth: { sm: 220 }, bgcolor: '#fff' }}
                  />
                  <TextField
                    size="small"
                    fullWidth={isMobile}
                    label="6-Digit Passcode *"
                    value={newStaffPasscode}
                    onChange={(e) =>
                      setNewStaffPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                    sx={{ width: { xs: '100%', sm: 165 }, bgcolor: '#fff' }}
                  />
                  <Button
                    type="submit"
                    fullWidth={isMobile}
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ bgcolor: THEME.teal, fontWeight: 700 }}
                  >
                    Add Staff
                  </Button>
                </Box>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ border: `1px solid ${THEME.border}`, borderRadius: 2 }}
                >
                  <Table size="small">
                    <TableHead sx={{ bgcolor: THEME.navy }}>
                      <TableRow>
                        <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Name</TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 700 }}>
                          Email / Contact
                        </TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Passcode</TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 700 }} align="right">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {staffList.map((member) => {
                        const rowKey = member.id ?? member.full_name;
                        const isEditing = editingStaffKey === rowKey;
                        return (
                          <TableRow key={rowKey} hover>
                            <TableCell sx={{ fontWeight: 700 }}>
                              {member.full_name}
                              {member.is_default && (
                                <Chip label="Default Admin" size="small" sx={{ ml: 1 }} />
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <TextField
                                  size="small"
                                  value={editingStaffEmail}
                                  onChange={(e) => setEditingStaffEmail(e.target.value)}
                                  sx={{ minWidth: { sm: 220 }, bgcolor: '#fff' }}
                                />
                              ) : (
                                member.email || member.contact_details || '—'
                              )}
                            </TableCell>
                            <TableCell>{member.masked_passcode || '******'}</TableCell>
                            <TableCell align="right">
                              {isEditing ? (
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleSaveStaffEmail(member)}
                                >
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                              ) : (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingStaffKey(rowKey);
                                    setEditingStaffEmail(member.email || '');
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              )}
                              {!member.is_default && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteStaffMember(member)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {tab === 5 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                  Upload Photo or Video to Gallery Folder
                </Typography>
                <Box
                  component="form"
                  onSubmit={handleGalleryUploadSubmit}
                  display="flex"
                  gap={1.5}
                  flexWrap="wrap"
                  alignItems="center"
                  sx={{ mb: 2.5 }}
                >
                  <TextField
                    select
                    size="small"
                    fullWidth={isMobile}
                    label="Folder"
                    value={galleryFolder}
                    onChange={(e) => setGalleryFolder(e.target.value)}
                    sx={{ minWidth: { sm: 190 }, bgcolor: '#fff' }}
                  >
                    {GALLERY_FOLDERS.map((folder) => (
                      <MenuItem key={folder} value={folder}>
                        {folder}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    fullWidth={isMobile}
                    label="Media Title"
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    sx={{ minWidth: { sm: 200 }, bgcolor: '#fff' }}
                  />
                  <Button
                    component="label"
                    fullWidth={isMobile}
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{ bgcolor: '#fff' }}
                  >
                    {galleryFile ? galleryFile.name : 'Choose Image / Video'}
                    <input
                      hidden
                      type="file"
                      accept="image/*,video/mp4,video/quicktime,video/webm"
                      onChange={handleGalleryFilePick}
                    />
                  </Button>
                  <Button
                    type="submit"
                    fullWidth={isMobile}
                    variant="contained"
                    disabled={uploadingGallery || !galleryFile}
                    sx={{ bgcolor: THEME.teal, fontWeight: 700 }}
                  >
                    {uploadingGallery ? 'Uploading...' : 'Upload Media'}
                  </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  {['All', ...GALLERY_FOLDERS].map((folder) => (
                    <Chip
                      key={folder}
                      icon={<FolderIcon fontSize="small" />}
                      label={folder}
                      clickable
                      color={galleryFilterFolder === folder ? 'primary' : 'default'}
                      onClick={() => setGalleryFilterFolder(folder)}
                    />
                  ))}
                </Stack>

                <Grid container spacing={2}>
                  {filteredGalleryItems.length === 0 ? (
                    <Grid item xs={12}>
                      <Alert severity="info">No media items in this folder.</Alert>
                    </Grid>
                  ) : (
                    filteredGalleryItems.map((item) => {
                      const isVideo =
                        item.media_type === 'video' || item.type === 'video';
                      return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                          <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            {isVideo ? (
                              <Box
                                sx={{
                                  height: 150,
                                  bgcolor: '#0f172a',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <VideocamIcon sx={{ fontSize: 40 }} />
                              </Box>
                            ) : (
                              <CardMedia
                                component="img"
                                height="150"
                                image={item.url}
                                alt={item.title}
                                sx={{ objectFit: 'cover' }}
                              />
                            )}
                            <CardContent sx={{ py: 1.5 }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={700}>
                                    {item.title}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.category} •{' '}
                                    {isVideo ? (
                                      <VideocamIcon
                                        sx={{ fontSize: 12, verticalAlign: 'middle' }}
                                      />
                                    ) : (
                                      <ImageIcon
                                        sx={{ fontSize: 12, verticalAlign: 'middle' }}
                                      />
                                    )}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleGalleryDeleteSubmit(item)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })
                  )}
                </Grid>
              </Box>
            )}
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          bgcolor: THEME.navy,
          px: { xs: 2, sm: 3 },
          py: 1.5,
          borderTop: `1px solid ${THEME.navyLight}`,
        }}
      >
        <Button fullWidth={isMobile} onClick={onClose} sx={{ color: '#fff', fontWeight: 700 }}>
          Close Portal
        </Button>
      </DialogActions>
    </Dialog>
  );
}
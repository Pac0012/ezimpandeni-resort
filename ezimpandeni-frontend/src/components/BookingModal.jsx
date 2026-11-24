import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Stack,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Popper,
  Paper,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import apiClient from '../api/client';

const RESORT_WHATSAPP = '27839545203';

const fieldSx = {
  bgcolor: '#07150e',
  borderRadius: 2,
  '& .MuiOutlinedInput-root': {
    color: '#ffffff',
    '& fieldset': { borderColor: 'rgba(255, 215, 0, 0.28)' },
    '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.6)' },
    '&.Mui-focused fieldset': { borderColor: '#FFD700' },
  },
  '& .MuiInputLabel-root': { color: '#cbd5e1' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#FFD700' },
};

const printReceiptStyles = `
@media print {
  @page {
    size: A4 portrait;
    margin: 12mm;
  }
  body * {
    visibility: hidden;
  }
  #ezp-receipt-sheet,
  #ezp-receipt-sheet * {
    visibility: visible;
  }
  #ezp-receipt-sheet {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 16px 20px;
    background: #ffffff !important;
    color: #111827 !important;
    border: 1px solid #d1d5db !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
`;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

export default function BookingModal({ open, onClose, service, services = [], onBookingCreated }) {
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('utf-8')[0] || d.toISOString().split('T')[0];
  }, []);

  const serviceList = Array.isArray(services) ? services : [];
  const confirmBtnRef = useRef(null);

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [buttonPopupMsg, setButtonPopupMsg] = useState('');
  const [receipt, setReceipt] = useState(null);

  const resetFormFields = useCallback(
    (nextService = service) => {
      const initialId =
        nextService?.id ||
        (serviceList.length > 0 ? serviceList[0].id : 'day-visit');
      setSelectedServiceId(initialId);
      setFullName('');
      setEmail('');
      setPhone('');
      setDate(nextService?.initialDate || defaultDate);
      setAdults(1);
      setKids(0);
      setNotes('');
      setErrorMsg('');
      setButtonPopupMsg('');
      setSubmitting(false);
    },
    [service, serviceList, defaultDate]
  );

  useEffect(() => {
    if (!open) return;
    setReceipt(null);
    resetFormFields(service);
  }, [open, service, resetFormFields]);

  useEffect(() => {
    if (!buttonPopupMsg) return;
    const timer = setTimeout(() => setButtonPopupMsg(''), 5000);
    return () => clearTimeout(timer);
  }, [buttonPopupMsg]);

  const activeService = useMemo(() => {
    return (
      serviceList.find((s) => s.id === selectedServiceId) ||
      service ||
      serviceList[0] || {
        id: 'day-visit',
        title: 'Day Visit / Picnic',
        base_price: 100,
        pricing_type: 'day_visit',
      }
    );
  }, [serviceList, selectedServiceId, service]);

  const estimatedTotal = useMemo(() => {
    const base = Number(activeService?.base_price);
    const safeBase = Number.isFinite(base) ? base : 0;
    const numAdults = Math.max(1, Number(adults) || 1);
    const numKids = Math.max(0, Number(kids) || 0);
    if (activeService?.pricing_type === 'day_visit') {
      return Number((safeBase * (numAdults + numKids * 0.5)).toFixed(2));
    }
    return Number(safeBase.toFixed(2));
  }, [activeService, adults, kids]);

  const buildReceiptMessage = (rec) => {
    const safeTotal = Number(rec?.total) || 0;
    return [
      'EZIMPANDENI RESORT - RESERVATION RECEIPT',
      '----------------------------------------',
      `Reference: ${rec?.reference || ''}`,
      `Guest Name: ${rec?.fullName || ''}`,
      `Email: ${rec?.email || ''}`,
      `Phone / WhatsApp: ${rec?.phone || ''}`,
      `Package: ${rec?.packageTitle || ''}`,
      `Reservation Date: ${rec?.date || ''}`,
      `Guests: ${rec?.adults || 1} Adult(s), ${rec?.kids || 0} Kid(s) (${rec?.guestCount || 1} total)`,
      `Total Amount: R${safeTotal.toLocaleString()}`,
      rec?.notes ? `Notes: ${rec.notes}` : '',
      'Location: Nqutu, 3135, Umzinyathi Bridge',
      'Contact: 083 954 5203 | luyandakhaya93@gmail.com',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const buildMailtoHref = (rec) => {
    const subject = encodeURIComponent(`Ezimpandeni Resort Receipt - ${rec?.reference || ''}`);
    const body = encodeURIComponent(buildReceiptMessage(rec));
    return `mailto:${encodeURIComponent(String(rec?.email || ''))}?subject=${subject}&body=${body}`;
  };

  const buildResortWhatsAppHref = (rec) => {
    if (rec?.whatsappUrl) return rec.whatsappUrl;
    const msg = buildReceiptMessage(rec);
    return `https://wa.me/${RESORT_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (submitting) return;

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanDate = String(date || '').trim();
    const numAdults = Math.max(1, Number(adults) || 1);
    const numKids = Math.max(0, Number(kids) || 0);
    const guestCount = numAdults + numKids;

    setErrorMsg('');
    setButtonPopupMsg('');

    if (!cleanName) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address so your receipt copy can be sent.');
      return;
    }
    if (!cleanPhone) {
      setErrorMsg('Please enter your phone or WhatsApp number.');
      return;
    }
    if (!cleanDate) {
      setErrorMsg('Please choose a reservation date.');
      return;
    }

    setSubmitting(true);

    const payload = {
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      service_id: String(activeService?.id || 'day-visit'),
      booking_date: cleanDate,
      total_price: Number(estimatedTotal) || 0,
      guest_count: guestCount,
      notes: notes.trim(),
    };

    try {
      const res = await apiClient.post('/bookings', payload);
      const data = res?.data || {};
      const bookingObj = data.booking || {};

      const createdRef = String(
        data.reference ||
          bookingObj.reference ||
          (bookingObj.booking_id ? `EZP-${bookingObj.booking_id}` : `EZP-${Date.now().toString().slice(-6)}`)
      );

      const numericId = bookingObj.booking_id || createdRef.replace(/^EZP-/i, '');
      let emailDispatched = Boolean(
        data.receipt_sent ??
          bookingObj.receipt_sent ??
          data.email_receipt_status?.sent
      );

      if (!emailDispatched && numericId) {
        try {
          const mailRes = await apiClient.post(`/bookings/${numericId}/email-receipt`);
          emailDispatched = Boolean(mailRes?.data?.receipt_sent ?? mailRes?.data?.email_receipt_status?.sent);
        } catch {
          // Keep fallback available
        }
      }

      const finalTotal =
        typeof bookingObj.total_price === 'number' && Number.isFinite(bookingObj.total_price)
          ? bookingObj.total_price
          : Number(estimatedTotal) || 0;

      const receiptData = {
        reference: createdRef,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        packageTitle: String(bookingObj.service_title || activeService?.title || 'Resort Package'),
        date: cleanDate,
        adults: numAdults,
        kids: numKids,
        guestCount,
        notes: notes.trim(),
        total: finalTotal,
        emailDispatched,
        whatsappUrl: data.whatsapp_url || bookingObj.whatsapp_url || '',
        createdAt: bookingObj.created_at || new Date().toLocaleString(),
      };

      setSubmitting(false);
      setReceipt(receiptData);

      // Clear form inputs immediately once booking is completed
      setFullName('');
      setEmail('');
      setPhone('');
      setDate(defaultDate);
      setAdults(1);
      setKids(0);
      setNotes('');

      if (typeof onBookingCreated === 'function') {
        try {
          onBookingCreated(`Reservation ${createdRef} confirmed! Receipt for ${cleanEmail}.`);
        } catch {
          // Keep receipt view displayed
        }
      }
    } catch (err) {
      setSubmitting(false);
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      const messageText =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail) && detail.length > 0
          ? detail.map((item) => item?.msg || JSON.stringify(item)).join(' | ')
          : err?.message || 'Could not complete reservation right now.';

      const isBookedConflict =
        status === 409 ||
        /already booked|already reserved|conflict|unavailable/i.test(String(messageText));

      if (isBookedConflict) {
        setButtonPopupMsg(messageText);
      } else {
        setErrorMsg(messageText);
      }
    }
  };

  const handleCloseModal = () => {
    setReceipt(null);
    resetFormFields(service);
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handlePrintOnePageReceipt = () => {
    window.print();
  };

  return (
    <>
      <style>{printReceiptStyles}</style>
      <Dialog
        open={Boolean(open)}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 1500 }}
        PaperProps={{
          sx: {
            bgcolor: '#0b1e15',
            color: '#ffffff',
            borderRadius: 4,
            border: '1px solid rgba(255, 215, 0, 0.35)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
            overflow: 'hidden',
            pointerEvents: 'auto',
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#0f2c1f',
            borderBottom: '1px solid rgba(255, 215, 0, 0.25)',
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 800,
              color: '#FFD700',
            }}
          >
            {receipt ? 'Booking Receipt & Confirmation' : `Reserve: ${activeService?.title || 'Package'}`}
          </Typography>
          <IconButton onClick={handleCloseModal} sx={{ color: '#cbd5e1', '&:hover': { color: '#FFD700' } }}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        {receipt ? (
          <>
            <DialogContent sx={{ p: { xs: 2.25, sm: 3 } }}>
              <Alert
                icon={<MarkEmailReadRoundedIcon />}
                severity={receipt.emailDispatched ? 'success' : 'info'}
                sx={{ mb: 2, borderRadius: 2.5, fontWeight: 600 }}
              >
                {receipt.emailDispatched
                  ? `Receipt copy automatically sent to ${receipt.email}.`
                  : `Booking saved. Add MAIL_PASSWORD in .env for automatic email delivery, or use Email Copy / WhatsApp below for ${receipt.email}.`}
              </Alert>

              <Box
                id="ezp-receipt-sheet"
                sx={{
                  p: 2.25,
                  borderRadius: 2.5,
                  bgcolor: '#07150e',
                  border: '1px solid rgba(255, 215, 0, 0.35)',
                  '@media print': {
                    bgcolor: '#ffffff',
                    color: '#111827',
                    border: '1px solid #cbd5e1',
                    p: 2,
                  },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: '#FFD700',
                        fontWeight: 900,
                        letterSpacing: 0.6,
                        '@media print': { color: '#0b1e15' },
                      }}
                    >
                      EZIMPANDENI RESORT RECEIPT
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#94a3b8',
                        fontSize: '0.75rem',
                        '@media print': { color: '#4b5563' },
                      }}
                    >
                      Nqutu, 3135, Umzinyathi Bridge • 083 954 5203
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: '#4ade80',
                        fontWeight: 900,
                        '@media print': { color: '#15803d' },
                      }}
                    >
                      CONFIRMED
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#ffffff',
                        fontWeight: 700,
                        '@media print': { color: '#111827' },
                      }}
                    >
                      Ref: {receipt.reference}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.14)', my: 1.25, '@media print': { borderColor: '#d1d5db' } }} />

                <Stack spacing={0.65} sx={{ '@media print': { '& *': { color: '#111827 !important' } } }}>
                  <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                    <strong>Guest:</strong> {receipt.fullName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                    <strong>Receipt Email:</strong> {receipt.email}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                    <strong>Phone / WhatsApp:</strong> {receipt.phone}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                    <strong>Package:</strong> {receipt.packageTitle}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                    <strong>Date:</strong> {receipt.date}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                    <strong>Guests:</strong> {receipt.adults} Adult(s), {receipt.kids} Kid(s) ({receipt.guestCount} total)
                  </Typography>
                  {receipt.notes && (
                    <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                      <strong>Notes:</strong> {receipt.notes}
                    </Typography>
                  )}
                </Stack>

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.14)', my: 1.25, '@media print': { borderColor: '#d1d5db' } }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography
                    variant="caption"
                    sx={{ color: '#94a3b8', '@media print': { color: '#4b5563' } }}
                  >
                    Issued: {receipt.createdAt}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#FFD700',
                      fontWeight: 900,
                      '@media print': { color: '#0b1e15' },
                    }}
                  >
                    Total: R{Number(receipt.total || 0).toLocaleString()}
                  </Typography>
                </Stack>
              </Box>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                py: 2,
                bgcolor: '#0f2c1f',
                borderTop: '1px solid rgba(255, 215, 0, 0.2)',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  component="a"
                  href={buildMailtoHref(receipt)}
                  size="small"
                  variant="outlined"
                  startIcon={<MarkEmailReadRoundedIcon />}
                  sx={{
                    borderColor: 'rgba(255, 215, 0, 0.65)',
                    color: '#FFD700',
                    fontWeight: 700,
                    borderRadius: '999px',
                    px: 2,
                  }}
                >
                  Email Copy
                </Button>
                <Button
                  component="a"
                  href={buildResortWhatsAppHref(receipt)}
                  target="_blank"
                  rel="noreferrer"
                  size="small"
                  variant="outlined"
                  startIcon={<WhatsAppIcon />}
                  sx={{
                    borderColor: 'rgba(74, 222, 128, 0.65)',
                    color: '#4ade80',
                    fontWeight: 700,
                    borderRadius: '999px',
                    px: 2,
                  }}
                >
                  Send to Ezimpandeni Resort WhatsApp
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PrintRoundedIcon />}
                  onClick={handlePrintOnePageReceipt}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#e2e8f0',
                    fontWeight: 700,
                    borderRadius: '999px',
                    px: 2,
                  }}
                >
                  1-Page PDF / Print
                </Button>
              </Stack>

              <Button
                variant="contained"
                onClick={handleCloseModal}
                sx={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #E6A100 100%)',
                  color: '#081610',
                  fontWeight: 900,
                  borderRadius: '999px',
                  px: 3,
                }}
              >
                DONE
              </Button>
            </DialogActions>
          </>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <DialogContent sx={{ p: { xs: 2.25, sm: 3 } }}>
              {errorMsg && (
                <Alert severity="error" sx={{ mb: 2.25, borderRadius: 2.5 }}>
                  {errorMsg}
                </Alert>
              )}

              <Stack spacing={1.75}>
                {serviceList.length > 0 && (
                  <TextField
                    select
                    fullWidth
                    label="Package"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    sx={fieldSx}
                  >
                    {serviceList.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.title} — R{Number(s.base_price || 0).toLocaleString()}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  sx={fieldSx}
                />

                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Email Address (Receives Receipt Copy)"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  helperText="Your receipt copy is sent automatically to this email address."
                  FormHelperTextProps={{ sx: { color: '#94a3b8' } }}
                  sx={fieldSx}
                />

                <TextField
                  fullWidth
                  required
                  label="Phone / WhatsApp Number"
                  placeholder="083 000 0000"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  sx={fieldSx}
                />

                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Reservation Date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (buttonPopupMsg) setButtonPopupMsg('');
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  sx={fieldSx}
                />

                <Grid container spacing={1.75}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Adults"
                      value={adults}
                      onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))}
                      inputProps={{ min: 1 }}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Kids"
                      value={kids}
                      onChange={(e) => setKids(Math.max(0, Number(e.target.value) || 0))}
                      inputProps={{ min: 0 }}
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Special Requests / Notes (Optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={fieldSx}
                />

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(255, 215, 0, 0.08)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                    Estimated Total
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 900 }}>
                    R{Number(estimatedTotal || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>

            <Popper
              open={Boolean(buttonPopupMsg)}
              anchorEl={confirmBtnRef.current}
              placement="top-end"
              sx={{ zIndex: 2000, maxWidth: 340 }}
            >
              <Paper
                elevation={8}
                sx={{
                  p: 1.5,
                  mb: 1,
                  bgcolor: '#2a0c0c',
                  color: '#fecaca',
                  border: '1px solid #f87171',
                  borderRadius: 2.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                <EventBusyRoundedIcon sx={{ color: '#f87171', fontSize: 20, mt: 0.2, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
                  {buttonPopupMsg}
                </Typography>
              </Paper>
            </Popper>

            <DialogActions
              sx={{
                px: 3,
                py: 2,
                bgcolor: '#0f2c1f',
                borderTop: '1px solid rgba(255, 215, 0, 0.2)',
                justifyContent: 'flex-end',
                gap: 1.5,
                pointerEvents: 'auto',
              }}
            >
              <Button
                type="button"
                onClick={handleCloseModal}
                sx={{ color: '#cbd5e1', fontWeight: 700, borderRadius: '999px', px: 2.5 }}
              >
                Cancel
              </Button>
              <Button
                ref={confirmBtnRef}
                type="submit"
                onClick={handleSubmit}
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #E6A100 100%)',
                  color: '#081610',
                  fontWeight: 900,
                  borderRadius: '999px',
                  px: 3.5,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  '&:hover': { background: '#FFD700' },
                }}
              >
                {submitting ? 'CONFIRMING...' : 'CONFIRM & GET RECEIPT'}
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </>
  );
}
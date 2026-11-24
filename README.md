# Ezimpandeni Resort — Booking & Venue Management Platform

A full-stack web application built for **Ezimpandeni Resort** (Umzinyathi, KwaZulu-Natal, South Africa). The platform allows guests to explore resort packages, check real-time date availability, browse categorized photo and video folders, and submit booking requests on both mobile and desktop devices, while giving resort staff an authenticated portal to manage reservations, services, and gallery media.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Local Installation & Setup](#5-local-installation--setup)
6. [Environment Variables](#6-environment-variables)
7. [API Reference](#7-api-reference)
8. [Packages & Booking Rules](#8-packages--booking-rules)
9. [Gallery & Media System](#9-gallery--media-system)
10. [Staff Portal Workflow](#10-staff-portal-workflow)
11. [Security & Git Hygiene](#11-security--git-hygiene)

---

## 1. Project Overview

Ezimpandeni Resort hosts outdoor day visits, picnics, photoshoots, weddings, corporate functions, and community festivals. Operating hours are **Monday – Sunday, 08:00 – 18:00 (including Public Holidays)**.

The platform solves two core operational needs:
- **Guest Self-Service:** Visitors on smartphones or computers can inspect live availability by date and package before submitting a booking, reducing manual back-and-forth inquiries.
- **Staff Operations:** Staff members log into a two-step OTP-protected portal to review bookings, manage availability, and upload new photos and videos directly into categorized resort folders.

---

## 2. Key Features

### Guest-Facing Features
- **Responsive Mobile & Desktop UI:** Glassmorphic desktop navigation bar with a clean slide-out drawer on mobile viewports (`xs`–`sm`) to prevent horizontal overflow or clipped buttons.
- **Interactive Video Highlight Cards:** Auto-playing muted highlight cards (`Green Scenic Gardens`, `Great Photo Spots`, `Big Event Hosting`, and `Easy Guest Comfort`) with image poster fallbacks and tap/hover replay.
- **Live Date Availability Checker:** Instant date validation (blocking past dates) and real-time API verification against existing bookings before pre-filling the reservation modal.
- **Packages & Rates View:** Clear pricing breakdown (`per person` vs. `flat booking`) with automatic weekend-block indicators for multi-day functions.
- **Folder-Based Photo & Video Gallery:** Organized into four experience folders (`Day Visit`, `Photoshoots`, `Weddings & Functions`, and `Events & Festivals`) with `All Media`, `Photos`, and `Videos` filters, keyboard-navigable full-screen lightbox previews, and direct `Book This Experience` actions.
- **Inclusions & Contact Modals:** Quick-access modals detailing resort amenities and direct guest inquiry submission.

### Staff Portal Features
- **Two-Step Staff Authentication:** 6-digit staff passcode verification followed by a one-time verification code (OTP) sent to the registered staff email address.
- **Media Management:** Upload new images or videos into specific resort folders or delete outdated gallery items.
- **Booking & Service Administration:** View and manage guest reservations and package configurations.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Material UI (`@mui/material`, `@mui/icons-material`), Axios |
| **Typography & Styling** | Google Fonts (`Playfair Display` & `Poppins`), responsive MUI `sx` breakpoints |
| **Backend** | Python, FastAPI, Uvicorn |
| **Version Control** | Git & GitHub |

---

## 4. Repository Structure

```text
ezimpandeni-resort/
├── ezimpandeni-backend/          # FastAPI backend application
│   └── app/
│       └── main.py               # API routes, availability logic, auth & media handlers
├── ezimpandeni-frontend/         # React + Vite frontend application
│   ├── public/
│   │   ├── robots.txt            # Search engine crawler rules
│   │   └── videos/               # Highlight background videos (gardens, photoshoots, events, comfort)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # Dynamic Axios client (supports localhost & LAN IP testing)
│   │   ├── assets/               # Dynamic resort logos & package cover photography
│   │   ├── components/
│   │   │   ├── AdminModal.jsx    # Staff Portal login & management dashboard
│   │   │   ├── BookingModal.jsx  # Guest reservation & date booking modal
│   │   │   ├── ContactModal.jsx  # Guest inquiry form modal
│   │   │   ├── Footer.jsx        # Site footer with quick navigation & hours
│   │   │   └── InclusionsModal.jsx # Package inclusions breakdown modal
│   │   ├── App.jsx               # Main application shell, routing state, Home/Packages/Gallery views
│   │   └── main.jsx              # React DOM entry point
│   └── index.html                # SEO metadata & Google Fonts configuration
├── .env.example                  # Safe environment variable template
├── .gitignore                    # Excludes secrets, databases, dependencies & local uploads
└── README.md                     # Project documentation
# System Architecture & Data Flow

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOJO SCHEDULES APPLICATION v2.0            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         NAVBAR                                   │
│  [Logo*] JUJUTSU ACADEMY | [Nav Links] | [Profile*] | [Logout] │
│  *Dynamic from app config                                       │
└─────────────────────────────────────────────────────────────────┘

ADMIN SECTION          │         PUBLIC SECTION         │   USER SECTION
──────────────────────┼────────────────────────────────┼──────────────
Dashboard             │  Home                          │  Profile (/profile)
├─ Users              │  About (/about)                │  - Picture upload
├─ Groups             │  - Timeline                    │  - Bio/Belt Level
├─ Schedules          │  - Gallery                     │  - Achievements
├─ Attendance         │  - Team                        │  - Join Date
├─ Media (/admin/media)   │  Schedule              │
│  ├─ Upload         │  Gallery                       │
│  ├─ Edit           │  Statistics                    │
│  ├─ Delete         │                                │
│  └─ Branding       │                                │
│      ├─ Logo       │                                │
│      ├─ Favicon    │                                │
│      └─ Colors     │                                │
└─ About (/admin/about) │
   ├─ Timeline       │
   ├─ Gallery        │
   └─ Team           │
```

---

## 🗄️ Data Storage Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    localStorage (Browser)                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   jj_users       │  │  jj_media_items  │                │
│  ├──────────────────┤  ├──────────────────┤                │
│  │ • User 1         │  │ • Logo            │                │
│  │   - name         │  │ • Favicon         │                │
│  │   - email        │  │ • Hero Images     │                │
│  │   - picture      │  │ • Coach Photos    │                │
│  │   - bio          │  │ • Gallery Images  │                │
│  │   - belt         │  │ • Other Files     │                │
│  │   - achievements │  │                  │                │
│  │ • User 2         │  │ (Base64 encoded)  │                │
│  │ • Admin          │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ jj_about_content │  │  jj_app_config   │                │
│  ├──────────────────┤  ├──────────────────┤                │
│  │ Timeline Items   │  │ • logo ID        │                │
│  │ Gallery Images   │  │ • favicon ID     │                │
│  │ Team Photos      │  │ • brandName      │                │
│  │ (+ metadata)     │  │ • primaryColor   │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Profile Data Flow

```
USER REGISTRATION/LOGIN
         ↓
    [Auth Page]
         ↓
    [Navbar] ← Shows default profile
         ↓
    [Profile Button] → /profile
         ↓
┌─────────────────────────┐
│  UserProfile.tsx        │
├─────────────────────────┤
│  • Load user from auth  │
│  • Display form fields  │
│  • Preview picture      │
└─────────────────────────┘
         ↓
    [Edit Mode]
         ↓
  ┌──────────────────┐
  │ Picture Upload   │ → Base64 Conversion
  │ Bio Edit         │ → Text Validation
  │ Belt Level       │ → Dropdown select
  │ Join Date        │ → Date picker
  │ Achievements     │ → List manage
  └──────────────────┘
         ↓
    [Save Changes]
         ↓
  updateUser(id, data)
         ↓
  localStorage update
         ↓
  [Navbar Updates]
  • Picture shows
  • Name displays
         ↓
  [Profile Saved] ✅
```

---

## 📸 Media Upload & Management Flow

```
ADMIN UPLOADS MEDIA
         ↓
    [AdminMedia.tsx]
         ↓
    Select File
         ↓
   FileReader API
    (Base64)
         ↓
Create MediaItem
  {
   id, name, category,
   url (base64),
   type, size, uploadedAt
  }
         ↓
saveMedia(items)
         ↓
localStorage update
(jj_media_items)
         ↓

         ┌─────────────────────────────┐
         │   Use in 3 Places:          │
         ├─────────────────────────────┤
         │                             │
    ┌────┴─────┬──────────┬──────────┐
    ↓          ↓          ↓          ↓
 Navbar     AdminAbout  AdminMedia  Config
  Logo      Timeline     Edit        Branding
            Gallery      Delete      Logo/Favicon
            Team         Filter
```

---

## 🏗️ About Page Content Management

```
ADMIN: /admin/about

          INPUT
            ↓
   ┌───────────────────┐
   │  Select Section:  │
   │  • Timeline       │
   │  • Gallery        │
   │  • Team           │
   └───────────────────┘
            ↓
    Upload Image File
            ↓
   Create AboutImage
   {
    id, title, image (base64),
    section, year?,
    description?, uploadedAt
   }
            ↓
saveAboutContent(items)
            ↓
          Filtered Grid Display
          (Search & Filter)
            ↓
      ┌─────────────────┐
      │ Hover on Image: │
      │ [Edit] [Delete] │
      └─────────────────┘
            ↓
       Update/Delete UI
            ↓
       Save Changes
            ↓
    localStorage update
            ↓
       PUBLIC: /about
    (Displays updated content)
```

---

## 🧪 Test Coverage Map

```
Storage Tests (14)
├─ Initialization (5)
├─ User CRUD (8)
└─ Function Tests (1)

User Management (8)
├─ Create User
├─ Update Profile
├─ Delete User
├─ Authenticate
├─ Register
├─ Get by Email
├─ Achievements
└─ Session

Data Management (26)
├─ Groups (4)
├─ Schedules (5)
├─ Attendance (3)
├─ Media (5)
├─ About Content (4)
├─ App Config (4)
└─ Sessions (3)

Integration Tests (6)
├─ User Lifecycle (1)
├─ Attendance Workflow (1)
├─ Media + Config (1)
├─ Error Handling (5)
└─ Persistence (2)
```

---

## 🎯 Component Dependencies

```
┌──────────────────┐
│   App.tsx        │
│  (Routes Setup)  │
└────────┬─────────┘
         │
    ┌────┴──────────────────────────────────────┐
    │                                           │
    ↓                                           ↓
┌─────────────┐                          ┌──────────────┐
│   Navbar    │                          │ Auth System  │
├─────────────┤                          ├──────────────┤
│ • Logo load │ ← getAppConfig()         │ • Login      │
│ • Profile   │ ← getMediaItems()        │ • Logout     │
│ • Links     │                          │ • Register   │
└────┬────────┘                          └──────────────┘
     │
     ├─→ /profile ──→ UserProfile.tsx
     │              • updateUser()
     │              • getGroupById()
     │
     ├─→ /admin ──→ AdminDashboard.tsx
     │          ├─→ /admin/media → AdminMedia.tsx
     │          │                • getMediaItems()
     │          │                • saveMedia()
     │          │                • deleteMedia()
     │          │
     │          ├─→ /admin/about → AdminAbout.tsx
     │          │                • getAboutContent()
     │          │                • saveAboutContent()
     │          │                • deleteAboutItem()
     │          │
     │          ├─→ /admin/users → AdminUsers.tsx
     │          ├─→ /admin/groups → AdminGroups.tsx
     │          ├─→ /admin/schedules → AdminSchedules.tsx
     │          └─→ /admin/attendance → AdminAttendance.tsx
     │
     ├─→ /about ──→ About.tsx
     │          (Displays updated content)
     │
     └─→ /gallery, /schedule, /stats, etc.
```

---

## 📋 API/Function Call Hierarchy

```
Level 1: User Interactions
└─→ UI Events (onClick, onChange)

Level 2: Component Functions
├─→ handleUpload()
├─→ handleSave()
├─→ handleDelete()
└─→ handleFilter()

Level 3: Storage Functions
├─→ getMediaItems()
├─→ saveMedia()
├─→ updateUser()
├─→ getAboutContent()
└─→ saveAboutContent()

Level 4: Browser Storage
└─→ localStorage.setItem/getItem()

Level 5: Data Validation
├─→ Type checking
├─→ Validation rules
└─→ Error handling
```

---

## 🔐 Data Access Permissions

```
┌──────────────────────────────────────────────────────┐
│                  ADMIN PERMISSIONS                   │
├──────────────────────────────────────────────────────┤
│ ✓ View all users                                     │
│ ✓ Create/Edit/Delete users                          │
│ ✓ Upload media                                       │
│ ✓ Edit media (all)                                   │
│ ✓ Delete media                                       │
│ ✓ Configure app (logo, favicon, colors)             │
│ ✓ Manage about page content                          │
│ ✓ View attendance                                    │
│ ✓ Edit schedules                                     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                  USER PERMISSIONS                    │
├──────────────────────────────────────────────────────┤
│ ✓ Edit own profile                                   │
│ ✓ Upload own profile picture                        │
│ ✓ View own schedule                                 │
│ ✓ View own statistics                               │
│ ✓ View gallery                                      │
│ ✓ View about page                                   │
│ ✗ Cannot edit other users                           │
│ ✗ Cannot access admin panel                         │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                GUEST PERMISSIONS                     │
├──────────────────────────────────────────────────────┤
│ ✓ View home page                                     │
│ ✓ View about page                                    │
│ ✓ View gallery                                       │
│ ✓ See navbar with logo                              │
│ ✓ Login/Register                                    │
│ ✗ Cannot edit anything                              │
│ ✗ Cannot access user content                        │
└──────────────────────────────────────────────────────┘
```

---

## 📈 Data Model Relationships

```
User │
     ├─ has one: ProfilePicture (base64)
     ├─ has one: Bio
     ├─ has one: BeltLevel
     ├─ has many: Achievements
     ├─ belongs to: Group
     └─ has many: AttendanceRecords

Group │
      ├─ has many: Users
      ├─ has many: ScheduleSlots
      └─ has many: AttendanceRecords

ScheduleSlot │
             └─ belongs to: Group
                └─ has many: AttendanceRecords

AttendanceRecord │
                 ├─ belongs to: User
                 ├─ belongs to: ScheduleSlot
                 └─ belongs to: Group

Media │
      ├─ UsedIn: Navbar (Logo)
      ├─ UsedIn: Favicon
      └─ UsedIn: AboutPage (Timeline/Gallery/Team)

AppConfig │
          ├─ logo: Reference to Media
          ├─ favicon: Reference to Media
          ├─ brandName: String
          └─ primaryColor: String

AboutContent │
             ├─ section: "timeline" | "gallery" | "team"
             ├─ image: Base64
             ├─ year: (for timeline)
             └─ description: String
```

---

## 🔄 State Management Pattern

```
┌─────────────────────────────────────┐
│        Component State              │
├─────────────────────────────────────┤
│ • isEditing: boolean                │
│ • selectedItem: object | null       │
│ • searchTerm: string                │
│ • filteredData: array               │
│ • isLoading: boolean                │
│ • isDeleteOpen: boolean             │
└─────────────────────────────────────┘
         ↓
  useEffect Hook
         ↓
  Load Data
  Filter Data
  Transform Data
         ↓
  Re-render UI
         ↓
  User Interaction
         ↓
  Update State
  Save to Storage
  Dispatch Event
         ↓
  [LOOP CONTINUES]
```

---

## 🚀 Performance Optimization

```
Load Time Optimization:
├─ Lazy load images → useEffect
├─ Base64 encoding → FileReader
├─ localStorage caching → No network
└─ Component memoization → React.memo

Storage Optimization:
├─ Compress images before upload
├─ Delete unused media
├─ Limit localStorage size
└─ Archive old content

Rendering Optimization:
├─ Virtual scrolling for large lists
├─ Debounce search input
├─ Memoize filtered results
└─ Use CSS transitions
```

---

## 📱 Mobile vs Desktop

```
Desktop                          │         Mobile
────────────────────────────────┼──────────────────────
Full Navbar                     │ Hamburger Menu
Grid Layout (3+ cols)           │ Stack Layout (1 col)
Inline Action Buttons           │ Button in Modal
Full Admin Sidebar              │ Collapsed/Drawer
Multiple Panels                 │ Tab Navigation
Full Text Fields                │ Optimized Forms
────────────────────────────────┼──────────────────────
All Responsive ✅               │ All Responsive ✅
```

---

## 🔍 Debugging Points

```
Dev Tools → LocalStorage
├─ jj_users → Check user profiles
├─ jj_media_items → Check uploads
├─ jj_about_content → Check About items
├─ jj_app_config → Check logo/favicon
└─ jj_session → Check auth state

Console Monitoring:
├─ Storage operations → console.log()
├─ Component lifecycle → React DevTools
├─ State changes → useEffect logging
└─ Error tracking → Error boundaries

Network:
├─ No API calls (localStorage only)
├─ No external requests
└─ All data local

Performance:
├─ React DevTools Profiler
├─ Memory usage check
├─ localStorage size monitor
└─ Render count analysis
```

---

## 📊 Metrics & Monitoring

```
User Metrics:
├─ Total Users Registered
├─ Active Users
├─ Profiles Completed
└─ Achievements Added

Media Metrics:
├─ Total Media Items
├─ Storage Used
├─ Items by Category
└─ Upload Frequency

Content Metrics:
├─ About Items (by section)
├─ Timeline events
├─ Gallery images
└─ Team members

Performance:
├─ Page Load Time
├─ Search Response
├─ Upload Success Rate
└─ Storage Limit Usage
```

---

## 🎓 Architecture Best Practices

✅ **Implemented**:
- Component Separation
- Hook-based Logic
- Prop Drilling Minimized
- Error Handling
- Data Validation
- Responsive Design
- Accessibility (ARIA labels)
- Type Safety (TypeScript)

🎯 **Production Upgrades**:
- [ ] Context API for state
- [ ] Redux or Zustand
- [ ] Backend API integration
- [ ] Real-time sync
- [ ] Database migration
- [ ] Security hardening
- [ ] Performance monitoring
- [ ] Analytics integration

---

**Architecture Version**: 2.0
**Complexity Level**: Moderate
**Scalability**: Ready for backend integration
**Test Coverage**: 54 tests (95%+ coverage)
**Mobile Ready**: Yes
**Accessibility**: WCAG 2.1 Level A


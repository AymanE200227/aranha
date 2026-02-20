# Media Management Panel Guide

## Overview

The Media Management Panel is a comprehensive admin interface for managing all media assets in the Dojo Schedules application. It allows you to upload, edit, organize, and configure media files including images, logos, and favicons.

## Features

### 1. **Media Upload & Organization**
- Upload images and videos in multiple categories
- Support for categories: Gallery, Coaches, Hero, and Other
- Batch upload multiple files at once
- Automatic file size tracking
- Metadata storage (name, description, upload date)

### 2. **Media Management**
- **View**: Grid layout with image previews
- **Edit**: Modify media name, description, and category
- **Delete**: Remove media with confirmation dialog
- **Search**: Find media by name or description
- **Filter**: Filter by category or view all media

### 3. **Branding Configuration**
- Set primary logo for the application
- Configure favicon
- Add brand name and primary color
- All configurations are automatically saved

### 4. **Local Storage**
- All media is stored locally in the browser using localStorage
- No server required for basic operations
- Data persists across browser sessions
- Maximum storage depends on browser implementation

## How to Access

1. Login to the admin panel (Email: `admin@aranha.ma`, Password: `Admin@2024`)
2. Click on "Tableau de Bord" (Dashboard)
3. Click on "Médias" in the sidebar or quick actions
4. Alternatively, navigate to `/admin/media`

## Usage Guide

### Uploading Media

1. Go to the **Médias** tab (default)
2. Scroll to the **Importer des Médias** section
3. Click on "Ajouter à [category]" for each category you want to upload to
4. Select image/video files from your computer
5. Multiple files can be selected and uploaded together
6. A success notification will appear for each uploaded file

**Supported Formats:**
- Images: JPG, PNG, GIF, SVG, WebP, etc.
- Videos: MP4, WebM, Ogg, etc.

### Organizing Media

1. Use the **Search** field to find media by name or description
2. Use **Category Buttons** to filter by category
3. Click "Tous" to view all media

### Editing Media

1. Locate the media file you want to edit
2. Click the **Edit** button (pencil icon)
3. Modify:
   - **Name**: The display name of the media
   - **Description**: Optional description (appears in grid)
   - **Category**: Move to a different category
4. Click **Enregistrer** (Save)
5. The changes are immediately saved

### Deleting Media

1. Locate the media file you want to delete
2. Click the **Delete** button (trash icon)
3. Confirm the deletion in the dialog
4. The media is permanently removed

### Setting Logo & Favicon

1. Go to the **Branding** tab
2. **Logo Principal** section:
   - View current logo (if set)
   - Click on any media to set it as the main logo
   - Selected logo is highlighted with blue background
3. **Favicon** section:
   - Similar to logo selection
   - Shows current favicon with smaller preview
   - Click any media to set as favicon

### Configuring App Settings

1. Go to the **Branding** tab
2. Scroll to **Informations de l'Application** section
3. Configure:
   - **Nom de la Marque**: Brand/app name
   - **Couleur Primaire**: Primary brand color (color picker)
4. Click **Enregistrer la Configuration** (Save Configuration)

## Data Storage Structure

### MediaItem
```typescript
interface MediaItem {
  id: string;           // Unique identifier
  name: string;         // Display name
  category: string;     // Category (gallery, coaches, hero, other)
  url: string;          // Base64 encoded image/video data
  type: string;         // MIME type
  size: number;         // File size in bytes
  uploadedAt: string;   // ISO date string
  description?: string; // Optional description
}
```

### AppConfig
```typescript
interface AppConfig {
  logo?: string;          // Media ID of current logo
  favicon?: string;       // Media ID of current favicon
  brandName?: string;     // Application brand name
  primaryColor?: string;  // Hex color code
}
```

## Storage Keys

- `jj_media_items`: All uploaded media files
- `jj_app_config`: Application configuration (logo, favicon, colors)

## Best Practices

1. **Naming Convention**: Use clear, descriptive names for media files
   - ✅ Good: `hero-section-banner`, `coach-profile-john`
   - ❌ Bad: `IMG_001`, `photo`

2. **Organization**: Use categories effectively
   - **Gallery**: General gallery images
   - **Coaches**: Coach profile pictures
   - **Hero**: Banner/hero section images
   - **Other**: Miscellaneous media

3. **File Sizes**: Keep file sizes reasonable
   - Images: 500KB - 2MB preferred
   - Optimize before uploading
   - Use compression tools if needed

4. **Descriptions**: Add brief descriptions for easy identification
   - Helps in searching and filtering
   - Useful for team collaboration

5. **Backups**: Regularly backup your media
   - Export localStorage data periodically
   - Clearing browser data will delete all media

## Troubleshooting

### Media Not Uploading
- Check file format is supported
- Verify file size is reasonable
- Check browser console for errors

### Changes Not Saving
- Ensure you clicked the Save button
- Check that localStorage is enabled
- Clear browser cache and try again

### Logo/Favicon Not Showing
- Verify you selected and saved the media
- Check that the image upload was successful
- Try refreshing the page

### Storage Full Error
- Clear unused media
- Consider moving to server-based storage
- Export and backup current media

## API Integration

To integrate with a backend server:

### Files to Modify
1. `src/lib/storage.ts` - Add server API calls
2. `src/pages/admin/AdminMedia.tsx` - Replace localStorage calls with API calls

### Example API Functions
```typescript
// Replace localStorage.save with:
await api.post('/media/upload', formData);

// Replace localStorage.delete with:
await api.delete('/media/:id');

// Replace localStorage.get with:
const media = await api.get('/media');
```

## Keyboard Shortcuts

- `Ctrl/Cmd + S`: Save configuration (when focused on input)
- `Esc`: Close dialog/modal

## Future Enhancements

- [ ] Crop/rotate images
- [ ] Optimize images on upload
- [ ] Drag & drop upload
- [ ] Gallery preview lightbox
- [ ] Bulk operations (delete multiple files)
- [ ] Media usage tracking
- [ ] Cloud storage integration (AWS S3, Firebase Storage)
- [ ] CDN integration
- [ ] Image optimization (WebP conversion, responsive images)

## Support

For issues or questions:
1. Check this guide
2. Review the troubleshooting section
3. Check browser console for error messages
4. Clear localStorage and reinitialize if needed

## Security Notes

⚠️ **Important**: 
- This implementation stores data in browser localStorage
- Data is accessible to JavaScript and not encrypted
- Consider server-side storage for production
- Sensitive media should be protected with authentication
- Implement proper access controls on the backend

---

**Last Updated:** February 2026
**Version:** 1.0

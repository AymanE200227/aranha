# 📸 ABOUT PAGE - INLINE IMAGE EDITOR

## How It Works

The About page now has **direct inline editing**. No separate admin panel needed!

### For Admins Only

When you're logged in as an **admin**, images on the About page show edit/delete buttons **on hover**.

---

## Timeline Section (Story)

Located at the top of the About page with the timeline and year badges.

### To Edit an Image:
1. **Hover** over any timeline image
2. Click the **✏️ Edit button** 
3. In the dialog:
   - Change the year
   - Update the title
   - Modify the description
   - **Upload a new image** (optional)
4. Click **Sauvegarder** (Save)

### To Delete an Image:
1. **Hover** over the timeline image
2. Click the **🗑️ Delete button**
3. Confirm in the dialog
4. Image is removed from the timeline

---

## Gallery Section (Moments Capturés)

Located at the bottom with the masonry grid layout.

### To Replace a Gallery Image:
1. **Hover** over any gallery image
2. Click the **⬆️ Upload button**
3. Select a new image from your device
4. Image updates instantly

### To Delete a Gallery Image:
1. **Hover** over the gallery image
2. Click the **🗑️ Delete button**
3. Confirm deletion
4. Image is removed from the gallery

---

## Data Persistence

All changes are **saved to browser storage** (localStorage):
- `about_timeline` - Timeline images and details
- `about_gallery` - Gallery images and layout

### Important:
- Changes persist across browser sessions
- Clearing browser cache will reset to defaults
- Changes are per-browser (not synced across devices yet)

---

## What You Can Edit

### Timeline Section:
✅ Year  
✅ Title  
✅ Description  
✅ Image  

### Gallery Section:
✅ Image only  
(Layout stays the same)

---

## Tips

- **Hover to reveal** buttons - they stay hidden until you hover
- **Upload formats**: JPG, PNG, GIF, WebP
- **Image size**: Keep images under 5MB for best performance
- **Timeline order**: Can't reorder yet, but can edit each row
- **Gallery layout**: Masonry grid layout is fixed

---

## Troubleshooting

**I don't see edit buttons:**
- ✅ Make sure you're logged in as admin
- ✅ Check user role is set to "admin"
- ✅ Refresh the page

**Image upload not working:**
- ✅ Check file size (< 5MB)
- ✅ Verify image format (JPG, PNG, GIF, WebP)
- ✅ Try a different image

**Changes not saving:**
- ✅ Check browser console for errors
- ✅ Make sure localStorage is enabled
- ✅ Try refreshing the page

**Changes disappeared:**
- ✅ Browser cache was cleared
- ✅ Private/Incognito mode doesn't persist
- ✅ Use regular browsing mode

---

## Next Steps

- Edit images directly on the page
- Changes save immediately to localStorage
- Share updated About page with your team
- Plan: Backend database integration coming soon

---

**Happy editing! 🎉**

# Implementation Plan - Remaining Features

## ✅ COMPLETED

### 1. Document Linking Fix
- **Status:** FIXED
- **Change:** Added `linked_asset_id` to `DocumentCreate` model
- **File:** `/app/backend/server.py` line 226
- **Testing:** Upload a document with asset link - should now save correctly

### 2. Stripe Subscription Dates Fix
- **Status:** FIXED
- **Problem:** Showed January 1, 1970 (epoch 0) for all dates
- **Root Cause:** Used non-existent fields `current_period_start`/`current_period_end`
- **Solution:** Calculate periods from `billing_cycle_anchor` and use `cancel_at` field
- **File:** `/app/backend/server.py` lines 1275-1310
- **Testing:** Subscription page should show correct dates now

### 3. Reactivate Subscription
- **Status:** IMPLEMENTED
- **Backend:** Endpoint `/subscription/reactivate` already exists (line 1575)
- **Frontend:** Added reactivate button and handler
- **File:** `/app/frontend/src/pages/Subscription.js`
- **Testing:** Cancel subscription, then click "Reactivate Subscription" button

### 4. Storage Display
- **Status:** FIXED
- **Shows:** GB for Pro/Family plans, MB for Free plan
- **Files:** Documents.js and Subscription.js

---

## 📋 TODO (Large Tasks)

### 5. Enhanced Home Page
**Requirements:**
- Better branding and design
- Compelling content about life uncertainty (positive tone)
- Better backgrounds
- FAQ section for guest users
- Hook users emotionally

**Implementation Approach:**
- Create new landing page component
- Add hero section with emotional messaging
- Add features showcase
- Add testimonials section
- Add FAQ accordion
- Add better gradients/backgrounds
- Use illustrations/images

**Estimated Effort:** 2-3 hours
**Files to Create:** 
- `/app/frontend/src/pages/Home.js` (enhanced)
- `/app/frontend/src/components/FAQ.js`

---

### 6. Settings Page with Subscription Section
**Requirements:**
- Create Settings page
- Include subscription info in Settings > Subscription & Billing
- Show same details as Subscription page

**Implementation Approach:**
- Create new Settings page with tabs/sections
- Copy subscription details component
- Add to routing

**Estimated Effort:** 1 hour
**Files to Create:**
- `/app/frontend/src/pages/Settings.js`

---

### 7. Admin Theme Settings (Festival Effects)
**Requirements:**
- Admin can select theme (Christmas, Diwali, Black Friday, etc.)
- Theme applies to all customer UIs
- Christmas theme: Snow effect + Santa sleigh animation
- Users can toggle off theme
- Theme stored in database

**Implementation Approach:**

#### Backend:
1. Add theme settings collection to MongoDB
2. Add admin endpoint to set/get theme
3. Add user preference to disable theme

#### Frontend:
1. Create theme components:
   - `SnowEffect.js` - Falling snow animation
   - `SantaSleigh.js` - Santa animation
   - Other festival effects
2. Create admin theme settings page
3. Add theme context/state management
4. Add toggle button for users to disable
5. Apply theme conditionally across all pages

**Technical Details:**
- Use CSS animations for snow
- Use SVG/Lottie for Santa animation
- Store theme preference in localStorage + backend
- Check theme on app load
- Provide theme toggle in header/settings

**Estimated Effort:** 3-4 hours
**Files to Create:**
- `/app/backend/server.py` - Add theme endpoints
- `/app/frontend/src/components/themes/SnowEffect.js`
- `/app/frontend/src/components/themes/SantaSleigh.js`
- `/app/frontend/src/components/themes/ThemeProvider.js`
- `/app/frontend/src/pages/AdminTheme.js`

---

## Implementation Priority

Given the scope, I recommend:

**Phase 1 (Current Session):**
1. ✅ Fix document linking
2. ✅ Fix subscription dates  
3. ✅ Add reactivate subscription
4. 🔄 Create basic Settings page with subscription info (Quick - 30 mins)
5. 🔄 Enhanced Home page (2-3 hours)

**Phase 2 (Next Session or Later):**
6. Admin Theme Settings with festival effects (3-4 hours)
   - This is complex and deserves dedicated focus
   - Requires careful UI/UX design
   - Multiple animation components
   - Theme management system

---

## Current Status

- Backend: Running ✅
- Document linking: Fixed ✅
- Subscription dates: Fixed ✅
- Reactivation: Implemented ✅
- Storage display: Fixed ✅

**Ready to proceed with:**
1. Settings page (quick)
2. Enhanced Home page (substantial work)

**Recommend separate session for:**
- Admin theme system (complex feature)

---

## Next Steps

Please confirm:
1. Should I proceed with Settings page + Enhanced Home page now?
2. Should Admin Theme Settings be saved for a separate focused session?
3. Any specific content/messaging you want for the Home page?
4. Any specific themes besides Christmas you want to plan for?

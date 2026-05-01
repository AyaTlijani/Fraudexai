# Quick Start: Auth Component Testing

## 🚀 How to Access the Auth Component

### Method 1: Direct URL Navigation
Open your browser and navigate to:
```
http://localhost:4200/auth
```

### Method 2: From Application Code
Add a link in any component:
```html
<a routerLink="/auth" class="auth-link">Go to Auth</a>
```

Or navigate programmatically:
```typescript
import { Router } from '@angular/router';

constructor(private router: Router) {}

navigateToAuth() {
  this.router.navigate(['/auth']);
}
```

---

## 🧪 Quick Test Cases

### Test 1: View Login Form
1. Navigate to `/auth`
2. **Expected:** See "Fraudexia" title, "Welcome back" subtitle
3. **Verify:** Login form with email and password fields visible

### Test 2: Toggle to Signup
1. Click "Sign up" link at bottom
2. **Expected:** Form switches to signup
3. **Verify:** See full name, email, password, confirm password fields

### Test 3: Back to Login
1. Click "Sign in" link on signup form
2. **Expected:** Form returns to login
3. **Verify:** Social login buttons reappear

### Test 4: Password Visibility
1. On login form, click the eye icon next to password
2. **Expected:** Password becomes visible
3. **Verify:** Click again to hide

### Test 5: Email Validation
1. Enter "notanemail" in email field
2. Click "Sign in"
3. **Expected:** Error shows "Please enter a valid email address"

### Test 6: Successful Login (Simulated)
1. Enter:
   - Email: `test@example.com`
   - Password: `password123`
2. Click "Sign in"
3. **Expected:** Button shows loading spinner (1.5 seconds)
4. **Result:** Navigates to `/select` page

### Test 7: Social Login
1. On login form, click any social button (Google, GitHub, Microsoft, Apple)
2. **Expected:** Button shows loading state
3. **Result:** Navigates to `/select` after 1.5 seconds

### Test 8: Signup with Weak Password
1. Click "Sign up"
2. Enter:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Password: `password` (no uppercase or numbers)
   - Confirm: `password`
3. Click "Create account"
4. **Expected:** Error shows "Include uppercase, lowercase, and numbers"

### Test 9: Signup with Mismatched Passwords
1. On signup form, enter:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Password: `Password123`
   - Confirm: `Password456`
2. Click "Create account"
3. **Expected:** Error shows "Passwords do not match"

### Test 10: Successful Signup (Simulated)
1. On signup form, enter:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Password: `Password123`
   - Confirm: `Password123`
   - Check "I agree to Terms..."
2. Click "Create account"
3. **Expected:** Button shows loading spinner
4. **Result:** Navigates to `/select`

---

## 📱 Responsive Testing

### Mobile View (376px - 480px)
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Select "iPhone 12" or similar
4. **Verify:**
   - Card takes full width minus padding
   - All text is readable
   - Buttons are full width
   - Form fields are touch-friendly
   - Social buttons in responsive grid

### Tablet View (768px)
1. Select "iPad" in DevTools
2. **Verify:**
   - Card has max-width
   - Balanced spacing
   - All elements properly sized

### Desktop View (1024px+)
1. Resize DevTools to hide mobile view
2. **Verify:**
   - Card is centered
   - Proper spacing all around
   - Hover effects work on buttons

---

## 🎨 Visual QA Checklist

- [ ] **Gradient Background:** Smooth lavender to purple gradient
- [ ] **Card Styling:** White card with 24px rounded corners, shadow effect
- [ ] **Gradient Title:** "Fraudexia" text has purple gradient
- [ ] **Input Fields:** Light lavender background with 12px rounded corners
- [ ] **Focus State:** Clicking inputs shows purple border + light shadow
- [ ] **Buttons:** Purple gradient buttons with hover elevation
- [ ] **Hover Effects:** Buttons lift up on hover, social buttons scale
- [ ] **Loading Spinner:** Animated spinner appears during submission
- [ ] **Error Messages:** Red text with error icon
- [ ] **Social Icons:** Can see Google, GitHub, Microsoft, Apple logos

---

## ⌨️ Keyboard Navigation

1. Open the page
2. Press `Tab` repeatedly
3. **Verify:**
   - Focus moves through email field
   - Focus moves through password field
   - Focus moves through toggle password button
   - Focus moves through submit button
   - Focus shows clear outline (2px purple)
4. Press `Shift+Tab` to go backwards
5. Use `Space` or `Enter` to activate buttons/checkboxes

---

## 🔍 Browser DevTools Checks

### Angular Component Check
```javascript
// In browser console, check if component is standalone
ng.getComponent(document.body.querySelector('app-auth'))
// Should show AuthComponent with inputs/outputs
```

### Form Validity Check
```javascript
// Check form state (if accessible)
// Open DevTools console and try entering invalid data
// Watch for validation errors
```

### Network/Performance
1. Open DevTools → Network tab
2. Reload page
3. Click "Sign in" or social button
4. **Verify:** Loading spinner shows for ~1.5 seconds (simulated delay)

---

## 🐛 Common Issues & Solutions

### Component Not Loading
**Issue:** Route leads to blank page
**Solution:** 
- Check that AuthComponent is imported in app.routes.ts ✅
- Verify file path: `src/app/components/auth/auth.component.ts`
- Clear browser cache

### Styling Not Applied
**Issue:** Component looks unstyled
**Solution:**
- Check browser DevTools → Elements → Styles tab
- Verify SCSS file is being loaded
- Clear browser cache
- Check for CSS conflicts

### Form Not Validating
**Issue:** No validation errors appear
**Solution:**
- Check that form is invalid: `loginForm.valid` in console
- Verify validation rules in component
- Check form control names match template

### Not Navigating After Submit
**Issue:** Button clicks but doesn't navigate
**Solution:**
- Check Router is injected in component ✅
- Verify `/select` route exists ✅
- Check browser console for errors

---

## 📊 What Should Work

### ✅ Fully Functional
- Login form with validation
- Signup form with validation
- Form state toggling
- Password visibility toggle
- Error message display
- Loading states
- Simulated navigation
- Social login buttons
- Responsive design (all breakpoints)
- Keyboard navigation
- Focus visible states

### ⚠️ Simulated (Ready for Backend)
- Actual API calls (replace setTimeout)
- Authentication token storage
- OAuth provider integration
- Server-side validation

---

## 🎯 Success Criteria

✅ **Component loads successfully** - page displays without errors
✅ **Forms validate correctly** - errors show for invalid input
✅ **Form switching works** - can toggle between login/signup
✅ **Password visibility toggles** - eye icon shows/hides password
✅ **Social buttons visible** - 4 social buttons on login form
✅ **Responsive on all sizes** - works on mobile, tablet, desktop
✅ **Accessible** - can navigate with keyboard
✅ **Visual design matches spec** - purple/lavender gradients, rounded corners, minimalist style
✅ **Loading state works** - spinner appears on button click
✅ **Navigation works** - simulated nav after submit

---

## 💾 What to Do Next

1. **Test the component** - Use the test cases above
2. **Verify responsive design** - Test on different screen sizes
3. **Check accessibility** - Keyboard and screen reader testing
4. **Integrate with backend** - Replace simulated API calls with real endpoints
5. **Add auth guards** - Protect dashboard routes with authentication
6. **Implement token storage** - Handle JWT tokens or session cookies

---

## 📞 Support

If you encounter issues not listed above:
1. Check browser console for errors (F12)
2. Verify file paths in app.routes.ts
3. Check that all dependencies are imported
4. Review AUTH_COMPONENT_GUIDE.md troubleshooting section
5. Check IMPLEMENTATION_SUMMARY.md for architecture details

---

**Ready to test?** Navigate to `http://localhost:4200/auth` and start testing!

Version: 1.0.0 | Date: April 2026

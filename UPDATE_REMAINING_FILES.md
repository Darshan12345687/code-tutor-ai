# Update Remaining Frontend Files

Some frontend components still have hardcoded API URLs. Follow this guide to update them.

## Quick Update Pattern

For each file that has `http://localhost:8000`, follow these steps:

### 1. Add Import
Add this import at the top of the file:
```typescript
import { getApiUrl, API_ENDPOINTS } from '../../utils/apiConfig';
```
(Adjust the relative path based on the file location)

### 2. Replace Hardcoded URLs

Replace patterns like:
```typescript
// Before
axios.get('http://localhost:8000/api/quizzes')
axios.post('http://localhost:8000/api/flashcards/user/progress')
fetch('http://localhost:8000/api/data-structures')
```

With:
```typescript
// After
axios.get(getApiUrl(API_ENDPOINTS.QUIZZES.LIST))
axios.post(getApiUrl(API_ENDPOINTS.FLASHCARDS.USER_PROGRESS))
fetch(getApiUrl(API_ENDPOINTS.DATA_STRUCTURES.LIST))
```

### 3. For Dynamic Endpoints

If the endpoint has a dynamic ID:
```typescript
// Before
axios.post(`http://localhost:8000/api/quizzes/${quizId}/submit`)

// After
axios.post(getApiUrl(API_ENDPOINTS.QUIZZES.SUBMIT(quizId)))
```

## Files That Need Updates

Run this command to find all files with hardcoded URLs:
```bash
grep -r "http://localhost:8000" frontend/src/
```

### Priority Files:
1. `components/Quiz/QuizPanel.tsx` - Multiple API calls
2. `components/Voice/VoiceAssistant.tsx` - Voice API calls
3. `components/Tutor/TutorDashboard.tsx` - Tutor dashboard API
4. `components/Student/AppointmentBooking.tsx` - Appointment API
5. `components/DataStructuresPanel.tsx` - Data structures API
6. `components/Auth/TutorLogin.tsx` - Tutor login API

## Example: Updating QuizPanel.tsx

```typescript
// 1. Add import
import { getApiUrl, API_ENDPOINTS } from '../../utils/apiConfig';

// 2. Replace URLs
// Before:
const response = await axios.get('http://localhost:8000/api/quizzes', {
  headers: { Authorization: `Bearer ${token}` }
});

// After:
const response = await axios.get(getApiUrl(API_ENDPOINTS.QUIZZES.LIST), {
  headers: { Authorization: `Bearer ${token}` }
});

// For dynamic endpoints:
// Before:
await axios.post(`http://localhost:8000/api/quizzes/${selectedQuiz._id}/submit`, {

// After:
await axios.post(getApiUrl(API_ENDPOINTS.QUIZZES.SUBMIT(selectedQuiz._id)), {
```

## Verify Changes

After updating, test locally:
1. Set `REACT_APP_API_URL` in `.env.local` (or use default localhost)
2. Run `npm start` in the frontend directory
3. Test all features that make API calls
4. Check browser console for any errors

## Need Help?

If you encounter issues:
- Check the `apiConfig.ts` file for available endpoints
- Ensure import paths are correct (relative to file location)
- Verify the endpoint exists in `API_ENDPOINTS` object


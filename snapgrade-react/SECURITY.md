# SnapGrade Security Implementation

## Executive Summary
This document outlines the security controls implemented in SnapGrade to protect user data and ensure secure authentication.

---

## 1. Secure Authentication

### Password Hashing
- **Technology**: Supabase Auth (uses bcrypt algorithm)
- **Implementation**: All passwords are hashed using bcrypt with salt rounds before storage
- **Verification**: Never stored in plaintext; only hash stored in database
- **Consequence**: Even if database is compromised, passwords cannot be recovered

### Password Requirements
- Minimum 12 characters, maximum 15 characters
- At least one uppercase letter (A–Z)
- At least one lowercase letter (a–z)
- At least one number (0–9)
- At least one special symbol (!@#$%^&*)
- **Result**: Enforces strong passwords resistant to brute-force attacks

### Role-Based Access Control (RBAC)
- **Admin Role**: Full access to dashboard, user management, and quiz management
- **Student Role**: Access only to personal quizzes, profile, and study materials
- **Implementation**: 
  - `ProtectedRoute` component validates user role before rendering
  - Routes enforce role via `requiredRole` prop
  - Unauthorized access redirects to appropriate dashboard
- **Example**: Students cannot access `/admin/users` route

### Session Management
- JWT tokens managed by Supabase
- Tokens validated on every request
- Automatic logout on token expiration
- Session state persisted via context API (not localStorage for sensitive data)

---

## 2. Input Validation & Prevention of Common Attacks

### A. SQL Injection Prevention
- **Method**: Parameterized queries via Supabase SDK
- **Implementation**: 
  ```javascript
  // Safe: Using parameterized queries
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId);  // Parameter automatically escaped
  ```
- **Protection**: Even if user inputs `'; DROP TABLE users; --`, it's treated as literal string value
- **Verification**: Supabase uses PostgreSQL prepared statements

### B. XSS (Cross-Site Scripting) Prevention
- **React JSX**: Automatically escapes all text content
- **Implementation**: Variables in JSX are escaped by default
  ```javascript
  // Safe: User input automatically escaped
  <div>{userProvidedText}</div>
  ```
- **Additional Control**: No `dangerouslySetInnerHTML` used anywhere in codebase
- **Content Security**: Email and name inputs validated before insertion

### C. Input Validation
- **Email**: Validated using HTML5 type="email" + backend validation
- **Names**: Trimmed and validated for length (1-100 chars)
- **Passwords**: Client-side validation + server-side Supabase auth validation
- **Data Type Enforcement**: All user inputs typed in React state

### D. CSRF Prevention
- **Technology**: Supabase handles CSRF protection automatically
- **Implementation**: SameSite cookie flag enforced
- **Verification**: Requests require valid JWT token

---

## 3. Data Protection

### Confidentiality
**How Sensitive Data is Protected:**
- API keys stored in `.env` (environment variables, never committed to git)
- HTTPS only: All Supabase communications encrypted in transit
- JWT tokens: User sessions validated on every request
- Row-Level Security (RLS): Database policies ensure users see only their data
  ```sql
  CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);
  ```
- Password Reset: Email-based reset links expire after short time window

### Integrity
**Ensuring Data Accuracy and Consistency:**
- Database constraints: 
  - Primary keys prevent duplicate records
  - Foreign keys maintain referential integrity
  - Check constraints enforce valid role values
- Input validation: Strong password rules prevent weak credentials
- Audit trail: `created_at` timestamps on all records
- Role verification: Server validates role on every protected route

### Availability
**Ensuring System is Always Accessible:**
- Supabase infrastructure: Redundant servers across regions
- Database backups: Automatic daily backups
- Error handling: Graceful error messages (no system details leaked)
- Load balancing: Supabase handles automatic scaling
- No single points of failure: Managed service reliability

---

## 4. CIA Triad Application

### Confidentiality ✅
- Passwords hashed with bcrypt (can't be reversed)
- HTTPS encryption for all data in transit
- Environment variables protect API keys
- Row-Level Security policies restrict database access
- Error messages don't leak sensitive information

### Integrity ✅
- Input validation prevents malicious data
- Database constraints prevent invalid states
- Strong password requirements prevent weak credentials
- Role-based access prevents unauthorized changes
- Timestamps and audit trails track changes

### Availability ✅
- Supabase managed infrastructure with uptime SLA
- Automatic failover and redundancy
- Error handling prevents system crashes
- Graceful degradation if services temporarily unavailable
- Database backups ensure data recovery

---

## 5. Error Handling & Security

### Error Message Strategy
**Safe Error Messages:**
- ❌ "User with email already@example.com exists" (Information leakage)
- ✅ "Email is already registered." (Generic, no data leakage)

**Implementation:**
- Specific errors logged server-side for debugging
- Generic messages shown to users
- Sensitive details never exposed to client

---

## 6. Best Practices Implemented

1. **Principle of Least Privilege**
   - Users only access what they need
   - Admin routes require admin role

2. **Defense in Depth**
   - Multiple layers: Client validation + Server validation + Database validation

3. **Fail Securely**
   - Errors default to denying access
   - Unauthorized access redirects safely

4. **Never Trust Client Input**
   - All user inputs validated server-side in Supabase
   - Client validation is UX improvement only

5. **Secure by Default**
   - Strong password requirements enforced
   - RLS enabled on all tables
   - Environment variables for secrets

---

## 7. Remaining Recommendations (Future Improvements)

1. **Two-Factor Authentication (2FA)**
   - SMS or authenticator app for admin accounts

2. **Rate Limiting**
   - Limit failed login attempts
   - Prevent brute-force attacks

3. **Audit Logging**
   - Log all admin actions
   - Track data access

4. **Encryption at Rest**
   - Enable Supabase encryption for sensitive columns

5. **Security Headers**
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options

---

## Conclusion

SnapGrade implements industry-standard security controls following:
- OWASP Top 10 (addressing SQL Injection, XSS, etc.)
- NIST Cybersecurity Framework (Identify, Protect, Detect, Respond, Recover)
- CIA Triad principles (Confidentiality, Integrity, Availability)

The application is suitable for educational environments with student data protection in mind.

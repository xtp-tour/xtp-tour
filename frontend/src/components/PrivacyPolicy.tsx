import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <Link to="/" className="btn btn-outline-secondary btn-sm mb-4">
          &larr; Back
        </Link>

        <h2 className="mb-4">Privacy Policy</h2>
        <p className="text-muted mb-4"><strong>Effective Date:</strong> March 15, 2026</p>

        <p>
          XTP Tour ("we", "us", or "our") operates the XTP Tour web application (the "Service"),
          a scheduling platform for racket sports. This Privacy Policy explains how we collect,
          use, and protect your personal information when you use the Service.
        </p>

        <h4 className="mt-4">1. Information We Collect</h4>

        <h5 className="mt-3">Account Information</h5>
        <p>When you create an account, we collect:</p>
        <ul>
          <li>First name and last name</li>
          <li>Email address</li>
          <li>Phone number (optional, for SMS notifications)</li>
        </ul>

        <h5 className="mt-3">Profile Information</h5>
        <p>To personalize your experience, we collect:</p>
        <ul>
          <li>NTRP skill level rating</li>
          <li>Preferred city and country</li>
          <li>Language preference</li>
          <li>Notification preferences</li>
        </ul>

        <h5 className="mt-3">Usage Information</h5>
        <p>When you use the Service, we collect information about:</p>
        <ul>
          <li>Events you create, join, or interact with</li>
          <li>Chat messages you send within events</li>
          <li>Calendar data (if you connect Google Calendar)</li>
        </ul>

        <h4 className="mt-4">2. How We Use Your Information</h4>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and operate the Service</li>
          <li>Match you with compatible playing partners based on skill level and location</li>
          <li>Send notifications about events you create or join (via email or SMS)</li>
          <li>Display your name and skill level to other users in event contexts</li>
          <li>Improve and develop the Service</li>
        </ul>

        <h4 className="mt-4">3. Third-Party Services</h4>

        <h5 className="mt-3">Authentication</h5>
        <p>
          We use <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer">Clerk</a> for
          user authentication. When you sign in, Clerk processes your authentication credentials
          according to their privacy policy. We receive your user identifier and basic profile
          information from Clerk.
        </p>

        <h5 className="mt-3">Google Calendar</h5>
        <p>
          If you choose to connect Google Calendar, we access your calendar data solely to
          display busy times and help avoid scheduling conflicts. We do not store your calendar
          events beyond what is needed for the current session.
        </p>

        <h4 className="mt-4">4. Cookies and Local Storage</h4>
        <p>
          We use cookies and browser local storage for authentication session management and
          to remember your preferences (such as language selection). These are essential for
          the Service to function and are not used for tracking or advertising.
        </p>

        <h4 className="mt-4">5. Data Sharing</h4>
        <p>
          We do not sell your personal information. We share your information only in the
          following circumstances:
        </p>
        <ul>
          <li><strong>With other users:</strong> Your name, NTRP level, and event-related information
            are visible to other participants in events you create or join.</li>
          <li><strong>With service providers:</strong> We use third-party services (Clerk for
            authentication, email/SMS providers for notifications) that process data on our behalf.</li>
          <li><strong>As required by law:</strong> We may disclose information if required by
            applicable law or legal process.</li>
        </ul>

        <h4 className="mt-4">6. Data Retention and Deletion</h4>
        <p>
          We retain your personal data for as long as your account is active. You can delete
          your account at any time through the User Profile page, which will permanently remove
          your personal data and associated records from our system.
        </p>

        <h4 className="mt-4">7. Data Security</h4>
        <p>
          We implement appropriate technical and organizational measures to protect your
          personal information, including encrypted data transmission (HTTPS) and secure
          authentication through Clerk.
        </p>

        <h4 className="mt-4">8. Your Rights</h4>
        <p>You have the right to:</p>
        <ul>
          <li>Access and update your personal information through your profile settings</li>
          <li>Delete your account and all associated data</li>
          <li>Configure your notification preferences (email, SMS)</li>
          <li>Disconnect third-party integrations (Google Calendar)</li>
        </ul>

        <h4 className="mt-4">9. Children's Privacy</h4>
        <p>
          The Service is not intended for children under the age of 16. We do not knowingly
          collect personal information from children under 16.
        </p>

        <h4 className="mt-4">10. Changes to This Policy</h4>
        <p>
          We may update this Privacy Policy from time to time. We will notify users of
          significant changes through the Service. Your continued use of the Service after
          changes are posted constitutes acceptance of the updated policy.
        </p>

        <h4 className="mt-4">11. Contact</h4>
        <p>
          If you have questions about this Privacy Policy, please contact us
          at <a href="mailto:privacy@xtptour.com">privacy@xtptour.com</a>.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

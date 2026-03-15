import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <Link to="/" className="btn btn-outline-secondary btn-sm mb-4">
          &larr; Back
        </Link>

        <h2 className="mb-4">Terms of Service</h2>
        <p className="text-muted mb-4"><strong>Effective Date:</strong> March 15, 2026</p>

        <p>
          Welcome to XTP Tour. By accessing or using the XTP Tour web application (the "Service"),
          you agree to be bound by these Terms of Service ("Terms"). If you do not agree to
          these Terms, please do not use the Service.
        </p>

        <h4 className="mt-4">1. Description of Service</h4>
        <p>
          XTP Tour is a scheduling platform for racket sports that allows users to create events,
          share them with other players, and coordinate game sessions. The Service facilitates
          connections between players but does not provide court reservations, coaching, or
          equipment.
        </p>

        <h4 className="mt-4">2. Account Registration</h4>
        <p>
          To use certain features of the Service, you must create an account. You agree to:
        </p>
        <ul>
          <li>Provide accurate and complete information during registration</li>
          <li>Maintain the security of your account credentials</li>
          <li>Notify us promptly of any unauthorized use of your account</li>
          <li>Accept responsibility for all activities that occur under your account</li>
        </ul>

        <h4 className="mt-4">3. User Conduct</h4>
        <p>When using the Service, you agree to:</p>
        <ul>
          <li>Treat other users with respect and courtesy</li>
          <li>Provide accurate availability and skill level information</li>
          <li>Honor event commitments you have accepted</li>
          <li>Not use the Service for any unlawful or unauthorized purpose</li>
          <li>Not harass, abuse, or harm other users</li>
          <li>Not create fake accounts or misrepresent your identity</li>
          <li>Not interfere with or disrupt the Service or its infrastructure</li>
        </ul>

        <h4 className="mt-4">4. Events and Scheduling</h4>
        <p>
          The Service allows you to create and join events. You understand that:
        </p>
        <ul>
          <li>Event creators are responsible for making court reservations at the agreed location and time</li>
          <li>The Service does not guarantee the availability of courts or venues</li>
          <li>Other users may cancel their participation at any time before an event is confirmed</li>
          <li>Event creators may accept or reject join requests at their discretion</li>
        </ul>

        <h4 className="mt-4">5. Privacy</h4>
        <p>
          Your use of the Service is also governed by our <Link to="/privacy">Privacy Policy</Link>,
          which describes how we collect, use, and protect your personal information.
        </p>

        <h4 className="mt-4">6. Intellectual Property</h4>
        <p>
          The Service and its original content, features, and functionality are owned by
          XTP Tour and are protected by applicable intellectual property laws. You may not
          copy, modify, distribute, or create derivative works based on the Service without
          our prior written consent.
        </p>

        <h4 className="mt-4">7. User Content</h4>
        <p>
          You retain ownership of content you submit through the Service (such as event
          descriptions and chat messages). By posting content, you grant us a non-exclusive,
          worldwide license to use, display, and distribute that content within the Service
          for the purpose of operating and providing the Service.
        </p>

        <h4 className="mt-4">8. Disclaimers</h4>
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind,
          whether express or implied. We do not warrant that:
        </p>
        <ul>
          <li>The Service will be uninterrupted, secure, or error-free</li>
          <li>Other users will fulfill their event commitments</li>
          <li>The information provided by other users is accurate or reliable</li>
        </ul>

        <h4 className="mt-4">9. Limitation of Liability</h4>
        <p>
          To the maximum extent permitted by law, XTP Tour and its operators shall not be
          liable for any indirect, incidental, special, consequential, or punitive damages
          arising from your use of the Service, including but not limited to injuries during
          sporting activities, disputes between users, or lost court reservation fees.
        </p>

        <h4 className="mt-4">10. Account Termination</h4>
        <p>
          You may delete your account at any time through the User Profile page. We reserve
          the right to suspend or terminate accounts that violate these Terms or engage in
          behavior that is harmful to other users or the Service.
        </p>

        <h4 className="mt-4">11. Changes to Terms</h4>
        <p>
          We may update these Terms from time to time. We will notify users of significant
          changes through the Service. Your continued use of the Service after changes are
          posted constitutes acceptance of the updated Terms.
        </p>

        <h4 className="mt-4">12. Governing Law</h4>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the
          jurisdiction in which XTP Tour operates, without regard to conflict of law principles.
        </p>

        <h4 className="mt-4">13. Contact</h4>
        <p>
          If you have questions about these Terms, please contact us
          at <a href="mailto:legal@xtptour.com">legal@xtptour.com</a>.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;

import Link from 'next/link';
import styles from './Privacy.module.css';

export default function PrivacyPage() {
  return (
    <main className={styles["default-container"]}>
      {/* Title Section */}
      <section className={styles["hero-section"]}>
        <h1 className={styles["hero-title"]}>Privacy Policy</h1>
        <p className={styles["hero-description"]}>
          We are committed to respecting user privacy while maintaining the integrity and security of our service. <br></br>This policy outlines what data we collect, why we collect it, and how it is used.
        </p>
        <Link href="/" className={styles["hero-cta"]}>
          Back to Home
        </Link>
      </section>

      {/* Privacy Content */}
      <section className={styles.content}>
        <div className={styles['policy-text-container']}>
          <h2 className={styles['policy-section-title']}>Information We Collect</h2>
          <div className={styles['policy-text']}>
            <p>When you use our URL shortening service, we may collect:</p>
            <ul>
              <li>IP address</li>
              <li>Browser and device information</li>
              <li>Operating system</li>
              <li>Referring websites</li>
              <li>ISP information</li>
              <li>Geographic location based on IP address</li>
            </ul>
            <p>We also use cookies to store your account session and preferences for your convenience.</p>
          </div>
          
          <h2 className={styles['policy-section-title']}>How We Use Your Information</h2>
          <div className={styles['policy-text']}>
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide and maintain our service</li>
              <li>Generate anonymized statistics</li>
              <li>Improve user experience</li>
              <li>Detect and prevent abusive usage</li>
              <li>Provide analytics to link creators</li>
            </ul>
            <p>We do <strong>not</strong> sell or share your personal data with third parties, except where required by law.</p>
          </div>

          <h2 className={styles['policy-section-title']}>Third-Party Services</h2>
          <div className={styles['policy-text']}>
            <p>We use Cloudflare as a content delivery network (CDN) and security provider. Cloudflare may process technical data such as IP addresses, request headers, and browser metadata to deliver and protect the service. This data is handled in accordance with <Link href="https://www.cloudflare.com/privacypolicy/" className={styles.link}>Cloudflare&apos;s Privacy Policy</Link>.</p>
            <p>We do not share user data with any other third-party services.</p>
          </div>
          
          <h2 className={styles['policy-section-title']}>Data Retention</h2>
          <div className={styles['policy-text']}>
            <ul>
              <li><strong>Analytics and usage data</strong> are retained until explicitly deleted by the link creator.</li>
              <li><strong>User accounts and associated data</strong> are retained until a deletion request is received.</li>
              <li>Shortened URLs remain active until deleted by their creator or by us in accordance with our Terms of Service.</li>
            </ul>
          </div>

          <h2 className={styles['policy-section-title']}>Your Rights</h2>
          <div className={styles['policy-text']}>
            <p>You may request deletion of your account and associated data at any time by contacting us. Deletion is permanent and cannot be reversed.</p>
          </div>
          
          <h2 className={styles['policy-section-title']}>Contact Us</h2>
          <div className={styles['policy-text']}>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <Link href="mailto:privacy.uLink@kizuren.dev" className={styles.link}>privacy.uLink@kizuren.dev</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
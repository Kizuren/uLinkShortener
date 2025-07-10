import Link from 'next/link';
import styles from './ToS.module.css';

export default function TermsOfServicePage() {
  return (
    <main className={styles["default-container"]}>
      {/* Title Section */}
      <section className={styles["hero-section"]}>
        <h1 className={styles["hero-title"]}>Terms of Service</h1>
        <p className={styles["hero-description"]}>
          By using our URL shortening service, you agree to comply with these Terms of Service. Please read them carefully before using the platform.
        </p>
        <Link href="/" className={styles["hero-cta"]}>
          Back to Home
        </Link>
      </section>

      {/* Terms Content */}
      <section className={styles.content}>
        <div className={styles['policy-text-container']}>
          <h2 className={styles['policy-section-title']}>Acceptance of Terms</h2>
          <div className={styles['policy-text']}>
            <p>By accessing or using our URL shortening service, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the service.</p>
          </div>
          
          <h2 className={styles['policy-section-title']}>Description of Service</h2>
          <div className={styles['policy-text']}>
            <p>We provide a URL shortening service with analytics and tracking functionality. The service is provided “as is,” without guarantees or warranties of any kind.</p>
          </div>
          
          <h2 className={styles['policy-section-title']}>User Responsibilities</h2>
          <div className={styles['policy-text']}>
            <p>By using this service, you agree that you will <strong>not</strong>:</p>
            <ul>
              <li>Use the service for any unlawful or unauthorized purpose</li>
              <li>Distribute malware, phishing links, or any malicious code</li>
              <li>Infringe on any third party&apos;s intellectual property or proprietary rights</li>
              <li>Harass, spam, or abuse individuals or systems</li>
              <li>Attempt to probe, scan, or compromise our infrastructure or interfere with service operation</li>
            </ul>
          </div>
          
          <h2 className={styles['policy-section-title']}>Content Restrictions</h2>
          <div className={styles['policy-text']}>
            <p>You may <strong>not</strong> use the service to create or distribute links that direct to content which:</p>
            <ul>
              <li>Contains malware, viruses, or other harmful code</li>
              <li>Facilitates or promotes illegal activity</li>
              <li>Contains hate speech, discriminatory, or violent material</li>
              <li>Infringes on intellectual property rights</li>
              <li>Includes adult or explicit content without compliant age verification</li>
              <li>Encourages self-harm, suicide, or criminal activity</li>
            </ul>
            <p>We reserve the right to remove or disable any links at any time without explanation.</p>
          </div>
          
          <h2 className={styles['policy-section-title']}>Service Modifications</h2>
          <div className={styles['policy-text']}>
            <p>We may modify, suspend, or discontinue any part of the service at any time, with or without notice. We are not liable for any loss, data deletion, or disruption caused by such changes.</p>
          </div>
          
          <h2 className={styles['policy-section-title']}>Termination</h2>
          <div className={styles['policy-text']}>
            <p>We may suspend or terminate your access to the service at any time, with or without notice, for any reason we deem appropriate. This includes, but is not limited to, violations of these Terms, behavior we consider abusive, disruptive, unlawful, or harmful to the service, to us, to other users, or to third parties. Termination is at our sole discretion and may be irreversible. We are under no obligation to preserve, return, or provide access to any data following termination.</p>
            <p>Attempts to bypass suspension or re-register after termination may result in permanent blocking.</p>
          </div>
          
          <h2 className={styles['policy-section-title']}>Contact Us</h2>
          <div className={styles['policy-text']}>
            <p>If you have any questions about these Terms of Service, please contact us at:</p>
            <Link href="mailto:terms.uLink@kizuren.dev" className={styles.link}>terms.uLink@kizuren.dev</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
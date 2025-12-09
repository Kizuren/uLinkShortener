import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.copyright}>© {new Date().getFullYear()} µLinkShortener</div>
        <div className={styles.links}>
          <Link href='/privacy'>Privacy Policy</Link>
          <Link href='/tos'>Terms of Service</Link>
          <Link href='https://github.com/Kizuren/uLinkShortener'>GitHub</Link>
        </div>
      </div>
    </footer>
  );
}

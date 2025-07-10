import Link from 'next/link';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <main className={styles["default-container"]}>
      <section className={styles["hero-section"]}>
        <h1 className={styles["hero-title"]}>Link Not Found</h1>
        <p className={styles["hero-description"]}>
          The shortened link you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/" className={styles["hero-cta"]}>
          Go Home
        </Link>
      </section>
    </main>
  );
}
import "./globals.css";
import { Rubik } from "next/font/google";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n";

// Rubik (variable): rounded terminals for the warm family voice, full
// Hebrew + Latin coverage. Exposed as --font-rubik for Tailwind's font-sans.
const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-rubik",
});

export const metadata = {
  title: "Walker — תורנות טיפול בחיות",
  description: "מעקב הוגן לטיולים, האכלות וכל משימות הטיפול — לכל המשפחה",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Walker",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#1B1917" },
  ],
};

export default function RootLayout({ children }) {
  // Hebrew RTL is the SSR default; I18nProvider re-stamps lang/dir on the
  // client when the stored preference differs.
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body className="bg-bg font-sans text-ink antialiased">
        <I18nProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton={false}
            toastOptions={{
              style: { fontFamily: "var(--font-rubik), Rubik, sans-serif", borderRadius: "18px" },
            }}
          />
        </I18nProvider>
      </body>
    </html>
  );
}

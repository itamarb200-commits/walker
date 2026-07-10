import "./globals.css";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n";

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
  themeColor: "#F7F9FC",
};

export default function RootLayout({ children }) {
  // Hebrew RTL is the SSR default; I18nProvider re-stamps lang/dir on the
  // client when the stored preference differs.
  return (
    <html lang="he" dir="rtl">
      <body className="bg-bg font-sans text-ink antialiased">
        <I18nProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton={false}
            toastOptions={{
              style: { fontFamily: "Assistant, sans-serif", borderRadius: "16px" },
            }}
          />
        </I18nProvider>
      </body>
    </html>
  );
}

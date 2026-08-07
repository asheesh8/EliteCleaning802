import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ChatWidget } from "@/components/site/ChatWidget";
import { getSiteSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSiteSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <Header phone={s.phone} />
      <main className="flex-1">{children}</main>
      <Footer
        phone={s.phone}
        email={s.email}
        serviceArea={s.serviceArea}
        hours={s.hours}
        facebook={s.facebook}
      />
      <ChatWidget phone={s.phone} />
    </div>
  );
}

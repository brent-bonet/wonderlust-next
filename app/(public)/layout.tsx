import ChatWidget from "@/components/ChatWidget";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Nav />
      {children}
      <SiteFooter />
      <ChatWidget />
    </>
  );
}

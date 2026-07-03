import { Footer } from "@/components/layout/footer";
import { FrapButton } from "@/components/layout/frap-button";
import { Header } from "@/components/layout/header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-16 md:pt-[83px] lg:pt-[99px]">{children}</main>
      <Footer />
      <FrapButton />
    </>
  );
}

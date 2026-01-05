import Footer from "@/components/shared/Footer";
import { LandingHeader } from "./LandingHeader";

type LandingLayoutProps = {
  children: React.ReactNode;
};

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <>
      <LandingHeader />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">{children}</main>
      <Footer />
    </>
  );
}

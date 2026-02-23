import Footer from "@/components/shared/Footer";
import { LandingHeader } from "./LandingHeader";

type LandingLayoutProps = {
  children: React.ReactNode;
};

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <>
      <LandingHeader />
      <main className="dashboard-bg min-h-screen">{children}</main>
      <Footer />
    </>
  );
}

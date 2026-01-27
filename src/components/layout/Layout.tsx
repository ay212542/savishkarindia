import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { AiChatWidget } from "@/components/ui/AiChatWidget";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function Layout({ children, hideFooter }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background grid-background">
      <Navbar />
      <main className="pt-16 md:pt-20">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <AiChatWidget />
    </div>
  );
}

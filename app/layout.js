import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ChatWidget from "../components/chat/ChatWidget";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata = {
  title: "Clínica Clin+Saúde",
  description: "Clínica médica em Aracaju com diversas especialidades e agendamento online.",
  keywords: ["Clínica", "Saúde", "Aracaju", "Agendamento Médico", "Clin+Saúde"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}

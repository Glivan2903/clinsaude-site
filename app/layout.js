import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Serifa suave com curvas macias — troca a grotesca (propositalmente robusta,
// é literalmente o que "grotesque" significa em tipografia) por um traço
// mais refinado, sem perder personalidade.
const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: "Clínica Clin+Saúde",
  description: "Clínica médica em Aracaju com diversas especialidades e agendamento online.",
  keywords: ["Clínica", "Saúde", "Aracaju", "Agendamento Médico", "Clin+Saúde"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${figtree.variable} ${fraunces.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}

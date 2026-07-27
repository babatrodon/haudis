import type { NextConfig } from "next";
import { alsNextRedirects } from "./lib/inhalte/redirects";

/**
 * Die Weiterleitungen vom alten haudi.ch stehen nicht hier, sondern in
 * lib/inhalte/redirects.ts. Der Grund ist der Ablauf beim Go-Live: die Liste
 * entsteht aus einem Crawl der alten Seite und wird danach womoeglich mehrfach
 * ergaenzt. Eine Datenliste laesst sich ohne Blick in die Konfiguration
 * pflegen und mit einem Skript pruefen.
 */
const nextConfig: NextConfig = {
  async redirects() {
    return alsNextRedirects();
  },
};

export default nextConfig;

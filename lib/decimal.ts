/**
 * Decimal fuer Geldbetraege, ohne Datenbankverbindung.
 *
 * Bewusst getrennt von lib/db.ts: dort wird beim Import der Prisma-Client
 * erzeugt und damit eine DATABASE_URL verlangt. Die Preisberechnung in
 * lib/preis.ts ist reine Rechnerei und darf keine Verbindung brauchen, sonst
 * laesst sie sich weder isoliert testen noch ausserhalb einer Anfrage nutzen.
 *
 * Wer rechnet, nimmt Decimal. Wer anzeigt, nimmt chf() aus lib/format.ts.
 */
export { Decimal } from "@/lib/generated/prisma/internal/prismaNamespace";

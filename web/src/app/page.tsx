import { Room } from "@/components/desk/room";
import { AppShell } from "@/components/shell/app-shell";
import { SessionProvider } from "@/components/shell/session";

export default function Home() {
  return (
    <Room>
      <SessionProvider>
        <AppShell />
      </SessionProvider>
    </Room>
  );
}

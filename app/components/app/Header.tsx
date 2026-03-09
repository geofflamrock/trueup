import { Coins, DownloadIcon, Moon, Sun } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useTheme } from "next-themes";
import { useState } from "react";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="fixed top-0 left-0 right-0 bg-background/30 backdrop-blur-xs">
      <div className="container mx-auto p-4 max-w-4xl flex justify-between items-center">
        <Link to="/" prefetch="viewport">
          <div className="flex gap-2 items-center">
            <Coins className="text-primary" size={24} />
            <h1 className="text-2xl text-primary font-title">True Up</h1>
          </div>
        </Link>
        <div className="flex gap-2 items-center">
          <InstallAppButton />
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {resolvedTheme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setDeferredPrompt(e);
  });

  if (!deferredPrompt) {
    return null;
  }

  return (
    <Button
      size="lg"
      variant="ghost"
      className="cursor-pointer"
      onClick={() => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === "accepted") {
            console.log("User accepted the install prompt");
          } else {
            console.log("User dismissed the install prompt");
          }
          setDeferredPrompt(null);
        });
      }}
    >
      <DownloadIcon size={16} />
      Install App
    </Button>
  );
}

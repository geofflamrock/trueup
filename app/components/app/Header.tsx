import {
  MoonIcon,
  Download,
  SaveMoneyDollarIcon,
  SunIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useTheme } from "next-themes";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="fixed top-0 left-0 right-0 bg-background/30 backdrop-blur-xs">
      <div className="container mx-auto p-4 max-w-4xl flex justify-between items-center">
        <Link to="/" prefetch="viewport">
          <div className="flex gap-2 items-center">
            <HugeiconsIcon
              icon={SaveMoneyDollarIcon}
              className="text-primary"
              size={24}
            />
            <h1 className="text-2xl text-primary font-title">True Up</h1>
          </div>
        </Link>
        <InstallAppButton />
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <HugeiconsIcon
            icon={resolvedTheme === "dark" ? SunIcon : MoonIcon}
            size={24}
          />
        </Button>
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
      size="sm"
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
      <HugeiconsIcon icon={Download} size={16} />
      Install App
    </Button>
  );
}

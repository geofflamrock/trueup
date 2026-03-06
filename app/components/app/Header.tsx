import { ComputerIcon, MoonIcon, SaveMoneyDollarIcon, SunIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useColorScheme, type ColorScheme } from "~/hooks/useColorScheme";

export function Header() {
  const { colorScheme, setColorScheme } = useColorScheme();

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
        <Select
          value={colorScheme}
          onValueChange={(value) => setColorScheme(value as ColorScheme)}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">
              <HugeiconsIcon icon={SunIcon} size={14} />
              Light
            </SelectItem>
            <SelectItem value="dark">
              <HugeiconsIcon icon={MoonIcon} size={14} />
              Dark
            </SelectItem>
            <SelectItem value="system">
              <HugeiconsIcon icon={ComputerIcon} size={14} />
              System
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

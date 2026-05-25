import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { ArrowLeft, RefreshCwIcon } from "lucide-react";
import { useSyncContext } from "~/contexts/SyncContext";

interface PageHeaderProps {
  /** If provided, shows a back button linking to this path. */
  backTo?: string;
  /** Page title — either a plain string or a custom React element. */
  title: React.ReactNode;
  /** Optional right-aligned actions (buttons, menus, etc.). */
  actions?: React.ReactNode;
}

export function PageHeader({ backTo, title, actions }: PageHeaderProps) {
  const { isSyncing } = useSyncContext();

  return (
    <div className="flex justify-between items-center p-4">
      <div className="flex gap-4 items-center">
        {backTo && (
          <Button
            variant="muted"
            size="icon-lg"
            render={
              <Link to={backTo} prefetch="viewport" className="cursor-pointer">
                <ArrowLeft className="size-6" />
              </Link>
            }
          />
        )}
        {typeof title === "string" ? (
          <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
            {title}
          </h1>
        ) : (
          title
        )}
      </div>
      <div className="flex items-center gap-1">
        {isSyncing && (
          <RefreshCwIcon className="size-4 text-muted-foreground animate-spin" />
        )}
        {actions}
      </div>
    </div>
  );
}

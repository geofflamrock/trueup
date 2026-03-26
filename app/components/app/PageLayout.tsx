import { cn } from "~/lib/utils";

type PageLayoutProps = {
  header: React.ReactNode;
  footer?: React.ReactNode;
};

export function PageLayout({
  header,
  footer,
  children,
}: React.PropsWithChildren<PageLayoutProps>) {
  return (
    <div className="h-dvh">
      <div className="fixed top-0 left-0 right-0 bg-linear-to-t from-background/0 to-background/90 to-50% min-h-16 container mx-auto max-w-4xl">
        {header}
      </div>
      <div
        className={cn("pt-16 container mx-auto max-w-4xl", { "pb-16": footer })}
      >
        {children}
      </div>
      {footer && (
        <div className="fixed bottom-0 left-0 right-0 bg-linear-to-b from-background/0 to-background/90 to-50% min-h-16 container mx-auto max-w-4xl">
          {footer}
        </div>
      )}
    </div>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { useIsDesktop } from "~/hooks/useIsDesktop";

type DialogOrDrawerProps = React.PropsWithChildren<{
  title: string;
  description?: string | React.ReactNode;
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
}>;

export function DialogOrDrawer({
  title,
  description,
  open,
  onClose,
  children,
  footer,
}: DialogOrDrawerProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="flex-1 no-scrollbar overflow-y-auto p-2">
            {children}
          </div>
          {footer && <DialogFooter>{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onClose={onClose} repositionInputs={false}>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="flex-1 no-scrollbar overflow-y-auto p-2">
          {children}
        </div>
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
}

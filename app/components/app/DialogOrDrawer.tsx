import { useMediaQuery } from "usehooks-ts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";

type DialogOrDrawerProps = React.PropsWithChildren<{
  title: string;
  open: boolean;
  onClose: () => void;
}>;

export function DialogOrDrawer({
  title,
  open,
  onClose,
  children,
}: DialogOrDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 40rem)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
}

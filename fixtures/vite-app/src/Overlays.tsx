// The overlays of phase 2: Dialog, Drawer, Popover and Tooltip (plan A), and a toast shown from
// inside a Dialog (plan E1). The Next.js fixture renders the same markup from a Server Component.
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Field,
  IconButton,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from 'fl-glass-ui';

export function Overlays() {
  return (
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Dialog>
        <DialogTrigger variant="secondary">Edit profile</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Shown to everyone in the workspace.</DialogDescription>
          </DialogHeader>
          <Field label="Name">
            <Input name="name" defaultValue="Minh An" />
          </Field>
          <DialogFooter>
            {/* Plan E1: a toast shown while the Dialog is open. */}
            <Button variant="secondary" onClick={() => toast.success('Profile saved')}>
              Notify
            </Button>
            <DialogClose>Save</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Drawer>
        <DrawerTrigger variant="secondary">Invoice</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Invoice details</DrawerTitle>
          </DrawerHeader>
          <DrawerClose variant="ghost">Close</DrawerClose>
        </DrawerContent>
      </Drawer>
      <Popover>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        <PopoverContent aria-label="Filters">
          <Switch defaultChecked>Only mine</Switch>
        </PopoverContent>
      </Popover>
      <Tooltip>
        <TooltipTrigger>
          <IconButton aria-label="Help" variant="ghost">
            ?
          </IconButton>
        </TooltipTrigger>
        <TooltipContent>Opens the help center</TooltipContent>
      </Tooltip>
    </section>
  );
}

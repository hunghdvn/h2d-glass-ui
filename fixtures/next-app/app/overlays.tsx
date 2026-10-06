// A Server Component: the overlays of phase 2, plan A, composed from client components the way an
// App Router page would. The Vite fixture renders the same markup on the client.
import {
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

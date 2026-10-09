// A Server Component: the navigation of phase 2, plan D. Breadcrumb is server-safe and renders
// here; Tabs and Accordion are client components with their content written on the server. The
// Vite fixture renders the same markup on the client.
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'fl-glass-ui';
import { Pages } from './pages';

export function Navigation() {
  return (
    <section aria-label="Navigation" style={{ display: 'grid', gap: 12 }}>
      <Breadcrumb>
        <BreadcrumbLink href="#home">Home</BreadcrumbLink>
        <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
        <BreadcrumbPage>Attachments</BreadcrumbPage>
      </Breadcrumb>
      <Tabs defaultValue="overview">
        <TabsList aria-label="Project">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">The overview panel.</TabsContent>
        <TabsContent value="members">The members panel.</TabsContent>
      </Tabs>
      <Accordion defaultValue="trial">
        <AccordionItem value="trial">
          <AccordionTrigger>Is there a free trial?</AccordionTrigger>
          <AccordionContent>Yes, 14 days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="plans">
          <AccordionTrigger>Can I change plans?</AccordionTrigger>
          <AccordionContent>At any time.</AccordionContent>
        </AccordionItem>
      </Accordion>
      <Pages />
    </section>
  );
}

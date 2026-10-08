// The navigation of phase 2, plan D. The Next.js fixture renders the same markup, with the
// Breadcrumb, Tabs and Accordion written in a Server Component.
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
  Pagination,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'fl-glass-ui';
import { useState } from 'react';

export function Navigation() {
  const [page, setPage] = useState(5);
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
      <Pagination count={12} page={page} onPageChange={setPage} />
    </section>
  );
}

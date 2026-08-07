import Link from "next/link";
import { PageHeader } from "@/components/crm/ui";
import { ClientForm } from "@/components/crm/ClientForm";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <>
      <PageHeader
        title="Add a client"
        description="The property profile feeds every future time estimate — fill in what you know."
        action={
          <Link
            href="/crew/clients"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
          >
            <Icon name="arrow" className="size-4 rotate-180" />
            Back
          </Link>
        }
      />
      <ClientForm />
    </>
  );
}

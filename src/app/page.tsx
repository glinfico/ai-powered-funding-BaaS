import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// The APP is the GLINFICO Control Center. The load-test engine lives at /lab.
export default function RootPage() {
  redirect("/crm");
}

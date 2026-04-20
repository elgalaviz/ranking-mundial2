import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/god/Sidebar";

const GOD_EMAIL = process.env.ADMIN_EMAIL || "rene.galaviz@gmail.com";

export default async function GodLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  if (user.email !== GOD_EMAIL) {
    redirect("/dashboard"); 
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
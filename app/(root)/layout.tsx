import {headers} from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";


const Layout = async ({ children }: { children: React.ReactNode }) => {
  //@ts-ignore
  const session = await auth.api.getSession({ headers: await headers()});

  if(!session?.user) redirect('/sign-in');
  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  }
  return (
    <main className="min-h-screen text-gray-400">
        <Header user={user} />
      <div className="container py-10">{children}</div>
    </main>
  );
};

export default Layout;
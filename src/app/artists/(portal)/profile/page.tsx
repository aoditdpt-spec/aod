import type { Metadata } from "next";
import { ProfileEditor } from "@/components/artists/ProfileEditor";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-medium sm:text-4xl">Work profile</h1>
      <p className="mt-2 max-w-2xl text-body">What you do, where you work and how you work. This is what AOD uses to match you with customers.</p>
      <ProfileEditor />
    </div>
  );
}

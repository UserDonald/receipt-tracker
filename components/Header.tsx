"use client";

import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function Header() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  return (
    <div
      className={cn(
        "p-4 flex justify-between items-center",
        isHomepage ? "bg-blue-50" : "bg-white border-b border-blue-50",
      )}
    >
      <Link href="/" className="flex items-center">
        <Shield className="w-6 h-6 text-blue-600 mr-2" />
        <h1 className="text-xl font-semibold">Expensio</h1>
      </Link>
      <div className="flex items-center space-x-4">
        <SignedIn>
          <Link href="/receipts">
            <Button variant="outline">My Receipts</Button>
          </Link>
          <Link href="/manage-plan">
            <Button variant="default">Manage Plan</Button>
          </Link>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal" />
        </SignedOut>
      </div>
    </div>
  );
}

export default Header;

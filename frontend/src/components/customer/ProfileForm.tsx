"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, User as UserIcon, Phone, ShieldCheck, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
}

export function ProfileForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/proxy/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <Card className="rounded-[24px] border border-slate-200/70 bg-white shadow-md shadow-slate-200/50 overflow-hidden">
      <CardHeader className="bg-slate-50/60 border-b border-slate-100 px-6 py-4">
        <CardTitle className="text-base font-extrabold text-[#292526] flex items-center gap-2">
          <ShieldCheck className="size-5 text-[#6B1E2E]" />
          Account Details & Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field (Read-only) */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-[#746B66] uppercase tracking-wider">
              Email Address
            </Label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 size-4 text-slate-400 pointer-events-none" />
              <Input
                id="email"
                value={user.email}
                disabled
                className="pl-10 h-11 rounded-2xl bg-[#F1E9DD] border-slate-200/80 text-[#292526] font-medium text-sm disabled:opacity-90"
              />
              <span className="absolute right-3 text-[11px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                Primary
              </span>
            </div>
          </div>

          {/* Full Name field */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-bold text-[#746B66] uppercase tracking-wider">
              Full Name
            </Label>
            <div className="relative flex items-center">
              <UserIcon className="absolute left-3.5 size-4 text-[#6B1E2E] pointer-events-none" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="pl-10 h-11 rounded-2xl bg-white border-slate-200 text-[#292526] font-semibold text-sm focus:border-[#B08D57] focus:ring-[#B08D57]"
              />
            </div>
          </div>

          {/* Phone Number field */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-bold text-[#746B66] uppercase tracking-wider">
              Phone Number
            </Label>
            <div className="relative flex items-center">
              <Phone className="absolute left-3.5 size-4 text-[#6B1E2E] pointer-events-none" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 000 0000"
                className="pl-10 h-11 rounded-2xl bg-white border-slate-200 text-[#292526] font-semibold text-sm focus:border-[#B08D57] focus:ring-[#B08D57]"
              />
            </div>
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium border border-rose-200">
              <AlertCircle className="size-4 shrink-0" />
              <span>Failed to save changes. Please check your inputs and try again.</span>
            </div>
          )}

          {/* Action button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={status === "saving"}
              className="w-full h-11 rounded-2xl bg-[#6B1E2E] hover:bg-[#521725] text-white font-bold text-sm shadow-md shadow-[#6B1E2E]/20 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {status === "saving" ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="size-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Saving profile…</span>
                </>
              ) : status === "saved" ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>Profile Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

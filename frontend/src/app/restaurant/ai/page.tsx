// UI-only redesign: Restyled AI assistant page container
import { PortalAIChat } from "@/components/restaurant-portal/PortalAIChat";

export default function PortalAIPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      <PortalAIChat />
    </div>
  );
}

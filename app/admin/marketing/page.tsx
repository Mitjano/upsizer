import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllCampaigns } from "@/lib/db";
import MarketingClient from "./MarketingClient";

export default async function MarketingPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

  const campaigns = getAllCampaigns();

  // Calculate stats from real campaigns
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';
  const avgConversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0';
  const avgCPC = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0';

  const stats = {
    totalSpend,
    totalBudget,
    totalImpressions,
    totalClicks,
    totalConversions,
    avgCTR,
    avgConversionRate,
    avgCPC,
  };

  return <MarketingClient campaigns={campaigns} stats={stats} />;
}

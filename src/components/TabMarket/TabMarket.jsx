import { useState } from "react";
import MarketPlace from "../MarketPlace/MarketPlace";
import { ActiveTable } from "../../components/ActiveTable/ActiveTable";
import { TabContainer } from "../TabContainer";

export const TabMarket = () => {
  const tabs = [
    { id: "Active", label: "Active Listings" },
    { id: "Complete", label: "Completed" },
    { id: "Bid", label: "My Bids" },
  ];  const [activeTab, setActiveTab] = useState("Active");
  return (
    <TabContainer 
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      gridColumns={3}
    >
      {activeTab === "Active" && <MarketPlace />}
      {/* <LoanMarketplacePage /> */}
      {activeTab == "Bid" && <ActiveTable />}
    </TabContainer>
  );
};

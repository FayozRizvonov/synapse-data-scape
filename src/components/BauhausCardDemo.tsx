import React from "react";
import { BauhausCard } from "./ui/bauhaus-card";

const BauhausCardDemo: React.FC = () => {
  const handleFilledButtonClick = (id: string) => {
    console.log(`Filled button clicked for ID: ${id}`);
    // Add your pharmaceutical action logic here
  };

  const handleOutlinedButtonClick = (id: string) => {
    console.log(`Outlined button clicked for ID: ${id}`);
    // Add your pharmaceutical action logic here
  };

  const handleMoreOptionsClick = (id: string) => {
    console.log(`More options dots clicked for ID: ${id}`);
    // Add your pharmaceutical action logic here
  };

  return (
    <div className="w-full p-8 rounded-lg min-h-[300px] flex flex-wrap gap-6 items-center justify-center relative bg-gradient-main">
      {/* Card 1 - Sales Performance */}
      <BauhausCard
        id="1"
        accentColor="#156ef6"
        backgroundColor="#f0f4fb"
        separatorColor="#d3dce8"
        borderRadius="2em"
        borderWidth="2px"
        topInscription="Q4 2024 Sales"
        mainText="Revenue Target"
        subMainText="Pharmaceutical Division"
        progressBarInscription="Progress:"
        progress={75.98}
        progressValue="75.98%"
        filledButtonInscription="View Details"
        outlinedButtonInscription="Export Data"
        onFilledButtonClick={handleFilledButtonClick}
        onOutlinedButtonClick={handleOutlinedButtonClick}
        onMoreOptionsClick={handleMoreOptionsClick}
        mirrored={false}
        swapButtons={false}
        textColorTop="#3b4252"
        textColorMain="#111014"
        textColorSub="#5e6473"
        textColorProgressLabel="#454f55"
        textColorProgressValue="#1c2541"
        progressBarBackground="#e5e7eb"
        chronicleButtonBg="#151419"
        chronicleButtonFg="#fff"
        chronicleButtonHoverFg="#fff"
      />

      {/* Card 2 - Marketing Campaign */}
      <BauhausCard
        id="2"
        accentColor="#24d200"
        backgroundColor="#f0f4fb"
        separatorColor="#d3dce8"
        borderRadius="2em"
        borderWidth="2px"
        topInscription="Campaign ROI"
        mainText="Digital Marketing"
        subMainText="Social Media Campaign"
        progressBarInscription="Engagement Rate:"
        progress={85.5}
        progressValue="85.5%"
        filledButtonInscription="Launch Campaign"
        outlinedButtonInscription="Analytics"
        onFilledButtonClick={handleFilledButtonClick}
        onOutlinedButtonClick={handleOutlinedButtonClick}
        onMoreOptionsClick={handleMoreOptionsClick}
        mirrored={false}
        swapButtons={false}
        textColorTop="#3b4252"
        textColorMain="#111014"
        textColorSub="#5e6473"
        textColorProgressLabel="#454f55"
        textColorProgressValue="#1c2541"
        progressBarBackground="#e5e7eb"
        chronicleButtonBg="#151419"
        chronicleButtonFg="#fff"
        chronicleButtonHoverFg="#151419"
      />

      {/* Card 3 - Product Launch */}
      <BauhausCard
        id="3"
        accentColor="#fc6800"
        backgroundColor="#f0f4fb"
        separatorColor="#d3dce8"
        borderRadius="2.25em"
        borderWidth="3px"
        topInscription="Product Launch"
        mainText="New Drug Release"
        subMainText="FDA Approved - Ready for Market"
        progressBarInscription="Market Readiness:"
        progress={92.3}
        progressValue="92.3%"
        filledButtonInscription="Launch Now"
        outlinedButtonInscription="Review Plan"
        onFilledButtonClick={handleFilledButtonClick}
        onOutlinedButtonClick={handleOutlinedButtonClick}
        onMoreOptionsClick={handleMoreOptionsClick}
        mirrored={false}
        swapButtons={false}
        textColorTop="#3b4252"
        textColorMain="#111014"
        textColorSub="#5e6473"
        textColorProgressLabel="#454f55"
        textColorProgressValue="#1c2541"
        progressBarBackground="#e5e7eb"
        chronicleButtonBg="#151419"
        chronicleButtonFg="#fff"
        chronicleButtonHoverFg="#fff"
      />

      {/* Card 4 - Clinical Trials */}
      <BauhausCard
        id="4"
        accentColor="#8f10f6"
        backgroundColor="#f0f4fb"
        separatorColor="#d3dce8"
        borderRadius="1em"
        borderWidth="4px"
        topInscription="Phase III Trials"
        mainText="Clinical Research"
        subMainText="Patient Recruitment Status"
        progressBarInscription="Completion:"
        progress={67.8}
        progressValue="67.8%"
        filledButtonInscription="View Results"
        outlinedButtonInscription="Patient Data"
        onFilledButtonClick={handleFilledButtonClick}
        onOutlinedButtonClick={handleOutlinedButtonClick}
        onMoreOptionsClick={handleMoreOptionsClick}
        mirrored={true}
        swapButtons={true}
        textColorTop="#3b4252"
        textColorMain="#111014"
        textColorSub="#5e6473"
        textColorProgressLabel="#454f55"
        textColorProgressValue="#1c2541"
        progressBarBackground="#e5e7eb"
        chronicleButtonBg="#151419"
        chronicleButtonFg="#fff"
        chronicleButtonHoverFg="#fff"
      />

      {/* Card 5 - Inventory Management */}
      <BauhausCard
        id="5"
        accentColor="#00d4ff"
        backgroundColor="#f0f4fb"
        separatorColor="#d3dce8"
        borderRadius="1.5em"
        borderWidth="2px"
        topInscription="Inventory Status"
        mainText="Stock Levels"
        subMainText="Critical Medications"
        progressBarInscription="Available Stock:"
        progress={45.2}
        progressValue="45.2%"
        filledButtonInscription="Reorder"
        outlinedButtonInscription="Track Supply"
        onFilledButtonClick={handleFilledButtonClick}
        onOutlinedButtonClick={handleOutlinedButtonClick}
        onMoreOptionsClick={handleMoreOptionsClick}
        mirrored={false}
        swapButtons={false}
        textColorTop="#3b4252"
        textColorMain="#111014"
        textColorSub="#5e6473"
        textColorProgressLabel="#454f55"
        textColorProgressValue="#1c2541"
        progressBarBackground="#e5e7eb"
        chronicleButtonBg="#151419"
        chronicleButtonFg="#fff"
        chronicleButtonHoverFg="#fff"
      />

      {/* Card 6 - Compliance Monitoring */}
      <BauhausCard
        id="6"
        accentColor="#ff6b35"
        backgroundColor="#f0f4fb"
        separatorColor="#d3dce8"
        borderRadius="2em"
        borderWidth="3px"
        topInscription="Regulatory Compliance"
        mainText="FDA Standards"
        subMainText="Quality Assurance Check"
        progressBarInscription="Compliance Score:"
        progress={98.7}
        progressValue="98.7%"
        filledButtonInscription="Generate Report"
        outlinedButtonInscription="Audit Trail"
        onFilledButtonClick={handleFilledButtonClick}
        onOutlinedButtonClick={handleOutlinedButtonClick}
        onMoreOptionsClick={handleMoreOptionsClick}
        mirrored={false}
        swapButtons={true}
        textColorTop="#3b4252"
        textColorMain="#111014"
        textColorSub="#5e6473"
        textColorProgressLabel="#454f55"
        textColorProgressValue="#1c2541"
        progressBarBackground="#e5e7eb"
        chronicleButtonBg="#151419"
        chronicleButtonFg="#fff"
        chronicleButtonHoverFg="#fff"
      />
    </div>
  );
};

export default BauhausCardDemo; 
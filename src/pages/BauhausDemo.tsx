import React from "react";
import BauhausCardDemo from "../components/BauhausCardDemo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const BauhausDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-main p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Bauhaus Card Components
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Modern, interactive cards with dynamic borders and smooth animations. 
            Perfect for pharmaceutical sales and marketing dashboards.
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="secondary">Interactive</Badge>
            <Badge variant="secondary">Responsive</Badge>
            <Badge variant="secondary">Customizable</Badge>
            <Badge variant="secondary">Pharma Ready</Badge>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-card border-0 shadow-blue-lg hover:shadow-blue-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-primary">Dynamic Borders</CardTitle>
              <CardDescription>
                Interactive gradient borders that respond to mouse movement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The cards feature animated gradient borders that create a modern, 
                engaging user experience perfect for pharmaceutical dashboards.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-blue-lg hover:shadow-blue-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-primary">Progress Tracking</CardTitle>
              <CardDescription>
                Built-in progress bars for KPI visualization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Each card includes customizable progress indicators ideal for 
                tracking sales targets, clinical trial progress, and compliance metrics.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-blue-lg hover:shadow-blue-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-primary">Action Buttons</CardTitle>
              <CardDescription>
                Animated buttons with hover effects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Chronicle-style buttons with smooth animations and customizable 
                actions for pharmaceutical workflow integration.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4 text-center">
            Pharmaceutical Use Cases
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            Examples of how Bauhaus cards can be used in pharmaceutical sales and marketing
          </p>
        </div>

        {/* Bauhaus Cards Demo */}
        <BauhausCardDemo />

        {/* Usage Instructions */}
        <div className="mt-12">
          <Card className="bg-gradient-card border-0 shadow-blue-lg hover:shadow-blue-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-primary">Implementation Guide</CardTitle>
              <CardDescription>
                How to integrate Bauhaus cards into your pharmaceutical dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Import the Component</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import { Component as BauhausCard } from "./components/ui/bauhaus-card";`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">2. Basic Usage</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`<BauhausCard
  id="unique-id"
  accentColor="#156ef6"
  topInscription="Q4 2024 Sales"
  mainText="Revenue Target"
  subMainText="Pharmaceutical Division"
  progressBarInscription="Progress:"
  progress={75.98}
  progressValue="75.98%"
  filledButtonInscription="View Details"
  outlinedButtonInscription="Export Data"
  onFilledButtonClick={(id) => handleAction(id)}
  onOutlinedButtonClick={(id) => handleAction(id)}
  onMoreOptionsClick={(id) => handleAction(id)}
/>`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Customization Options</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Colors:</strong> accentColor, backgroundColor, separatorColor</li>
                  <li><strong>Layout:</strong> borderRadius, borderWidth, mirrored, swapButtons</li>
                  <li><strong>Content:</strong> All text fields are customizable</li>
                  <li><strong>Actions:</strong> Custom click handlers for all buttons</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BauhausDemo; 
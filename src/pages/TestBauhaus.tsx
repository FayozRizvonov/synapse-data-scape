import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Sun, Moon, Zap, BarChart3, Activity, TrendingUp, Users, DollarSign } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const TestBauhaus: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-main p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Enhanced Light Mode Test
              </h1>
              <p className="text-lg text-muted-foreground">
                Testing improved colors and shadows for light mode
              </p>
            </div>
            <ThemeToggle />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
              <Zap className="w-3 h-3 mr-1" />
              Enhanced Colors
            </Badge>
            <Badge variant="secondary">Improved Shadows</Badge>
            <Badge variant="secondary">Better Contrast</Badge>
            <Badge variant="secondary">Modern Design</Badge>
          </div>
        </div>

        {/* Shadow Test Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Shadow Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-primary text-sm">Shadow SM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Small shadow for subtle depth</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-primary text-sm">Shadow MD</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Medium shadow for cards</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-primary text-sm">Shadow LG</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Large shadow for emphasis</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-primary text-sm">Shadow XL</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Extra large for modals</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Blue Shadow Test Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Blue Shadow Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-card border-0 shadow-blue-sm hover:shadow-blue-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-primary text-sm">Blue Shadow SM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Blue tinted small shadow</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-blue-md hover:shadow-blue-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-primary text-sm">Blue Shadow MD</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Blue tinted medium shadow</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-blue-lg hover:shadow-blue-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-primary text-sm">Blue Shadow LG</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Blue tinted large shadow</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-blue-xl hover:shadow-blue-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-primary text-sm">Blue Shadow XL</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Blue tinted extra large shadow</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Color Test Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Color Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-card border-0 shadow-blue-lg hover:shadow-blue-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-primary">Sales Performance</CardTitle>
                </div>
                <CardDescription>Enhanced primary color (#2563EB)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-2">$2.4M</div>
                <p className="text-sm text-muted-foreground">+12.5% from last month</p>
                <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Positive
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-blue-lg hover:shadow-blue-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-600" />
                  <CardTitle className="text-primary">Customer Engagement</CardTitle>
                </div>
                <CardDescription>Enhanced secondary color (#0891B2)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-2">89.2%</div>
                <p className="text-sm text-muted-foreground">+5.3% from last month</p>
                <Badge className="mt-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
                  <Activity className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-blue-lg hover:shadow-blue-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-primary">Revenue Growth</CardTitle>
                </div>
                <CardDescription>Enhanced success color (#059669)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-2">+18.7%</div>
                <p className="text-sm text-muted-foreground">+2.1% from last month</p>
                <Badge className="mt-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Growing
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Button Test Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Button Testing</h2>
          <div className="flex flex-wrap gap-4">
            <Button className="shadow-blue-sm hover:shadow-blue-md transition-shadow duration-300">
              <Zap className="w-4 h-4 mr-2" />
              Primary Button
            </Button>
            <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <BarChart3 className="w-4 h-4 mr-2" />
              Outline Button
            </Button>
            <Button variant="secondary" className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <Activity className="w-4 h-4 mr-2" />
              Secondary Button
            </Button>
          </div>
        </div>

        {/* Text Color Test */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Text Color Testing</h2>
          <Card className="bg-gradient-card border-0 shadow-blue-lg">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Text Hierarchy</h3>
                  <p className="text-foreground mb-2">Primary text color (#0F172A) - Main content</p>
                  <p className="text-muted-foreground mb-2">Secondary text color (#475569) - Supporting content</p>
                  <p className="text-muted-foreground/70 mb-2">Muted text color (#64748B) - Less important content</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Accent Colors</h3>
                  <p className="text-blue-600 mb-2">Primary accent (#2563EB) - Links and highlights</p>
                  <p className="text-cyan-600 mb-2">Secondary accent (#0891B2) - Secondary actions</p>
                  <p className="text-emerald-600 mb-2">Success color (#059669) - Positive states</p>
                  <p className="text-amber-600 mb-2">Warning color (#D97706) - Caution states</p>
                  <p className="text-red-600 mb-2">Error color (#DC2626) - Error states</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestBauhaus; 